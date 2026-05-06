'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/config/firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { ExpertCropper } from '@/components/admin/ExpertCropper';
import { getCroppedImg } from '@/lib/cropImage';
import type { ExpertProfile, UserProfile } from '@/types';
import { Loader2 } from 'lucide-react';

export default function AdminExpertsPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchUser, setSearchUser] = useState('');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [linkedUserId, setLinkedUserId] = useState('');
  const [specialityTags, setSpecialityTags] = useState('');
  const [active, setActive] = useState(true);

  // Cropper state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  // Pending ID for new experts
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userProfile?.isAdmin) {
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const expertsSnap = await getDocs(collection(db, 'expertProfiles'));
        const expertsData = expertsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpertProfile));
        setExperts(expertsData);

        const usersSnap = await getDocs(collection(db, 'users'));
        const usersData = usersSnap.docs.map((d) => d.data() as UserProfile);
        setUsers(usersData);
      } catch (e) {
        console.error("Error fetching admin expert data:", e);
        toast({ title: 'Error fetching data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userProfile, authLoading, router, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropComplete = async (croppedAreaPixels: any) => {
    if (!imageSrc) return;
    setIsUploading(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 500);
      if (!croppedImage) throw new Error("Failed to crop image");

      const id = editingId || pendingId || uuidv4();
      if (!editingId && !pendingId) {
        setPendingId(id);
      }

      const storageRef = ref(storage, `expertProfiles/${id}/profile.jpg`);
      await uploadBytes(storageRef, croppedImage);
      const url = await getDownloadURL(storageRef);
      setProfilePictureUrl(url);
      setImageSrc(null); // Close cropper
      toast({ title: 'Photo uploaded' });
    } catch (e) {
      console.error("Upload error:", e);
      toast({ title: 'Failed to upload image', variant: 'destructive' });
      throw e;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!linkedUserId || !displayName || !headline) {
      toast({ title: 'Please fill out all required fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const id = editingId || pendingId || uuidv4();
      const now = Timestamp.now();
      
      const expertData: Partial<ExpertProfile> = {
        id,
        linkedUserId,
        displayName,
        headline,
        profilePictureUrl,
        specialityTags: specialityTags.split(',').map(t => t.trim()).filter(Boolean),
        active,
        updatedAt: now,
      };

      if (!editingId) {
        expertData.createdAt = now;
      }

      await setDoc(doc(db, 'expertProfiles', id), expertData, { merge: true });

      // Also create the expertUserLink to make querying fast
      await setDoc(doc(db, 'expertUserLinks', linkedUserId), { expertId: id });

      toast({ title: editingId ? 'Expert updated' : 'Expert created' });
      setEditingId(null);
      setPendingId(null);
      setDisplayName('');
      setHeadline('');
      setLinkedUserId('');
      setSpecialityTags('');
      setProfilePictureUrl('');
      setActive(true);

      // Refresh
      const expertsSnap = await getDocs(collection(db, 'expertProfiles'));
      setExperts(expertsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpertProfile)));

    } catch (e) {
      console.error("Save error:", e);
      toast({ title: 'Error saving expert', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (expert: ExpertProfile) => {
    setEditingId(expert.id);
    setDisplayName(expert.displayName);
    setHeadline(expert.headline);
    setLinkedUserId(expert.linkedUserId);
    setSpecialityTags(expert.specialityTags.join(', '));
    setProfilePictureUrl(expert.profilePictureUrl || '');
    setActive(expert.active);
  };

  if (loading || authLoading) return <div className="p-8 text-white flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>;

  const filteredUsers = searchUser 
    ? users.filter(u => u.displayName?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase()))
    : users.slice(0, 10);

  return (
    <div className="p-8 space-y-8 text-white">
      <h1 className="text-3xl font-black">Expert Management</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Expert' : 'Create Expert'}</CardTitle>
            <CardDescription>Link a user and set up their expert profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Search App User to Link</Label>
              <Input 
                value={searchUser} 
                onChange={(e) => setSearchUser(e.target.value)} 
                placeholder="Search by name or email..." 
                className="bg-zinc-800 border-zinc-700"
              />
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {filteredUsers.map(u => (
                  <div 
                    key={u.uid} 
                    onClick={() => setLinkedUserId(u.uid)}
                    className={`p-2 rounded cursor-pointer text-sm flex flex-col ${linkedUserId === u.uid ? 'bg-indigo-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                  >
                    <span className="font-semibold">{u.displayName || 'No Name'}</span>
                    <span className="text-xs opacity-70">{u.email || u.uid}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-zinc-800 border-zinc-700" />
            </div>

            <div>
              <Label>Headline (Short)</Label>
              <Input value={headline} maxLength={60} onChange={(e) => setHeadline(e.target.value)} className="bg-zinc-800 border-zinc-700" />
            </div>

            <div>
              <Label>Speciality Tags (Comma separated)</Label>
              <Input value={specialityTags} onChange={(e) => setSpecialityTags(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="e.g. Gut Health, Fat Loss" />
            </div>

            <div>
              <Label>Profile Picture</Label>
              {profilePictureUrl && <img src={profilePictureUrl} alt="Preview" className="w-20 h-20 rounded-full object-cover mb-2 border-2 border-indigo-500" />}
              <Input type="file" accept="image/png, image/jpeg" onChange={handleImageChange} className="bg-zinc-800 border-zinc-700" />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label>Active</Label>
            </div>

            <div className="pt-4 flex gap-2">
              <Button onClick={handleSave} disabled={isSaving || isUploading} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                {isSaving ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Expert')}
              </Button>
              {(editingId || pendingId || displayName || linkedUserId) && (
                <Button variant="outline" disabled={isSaving || isUploading} onClick={() => { setEditingId(null); setPendingId(null); setDisplayName(''); setHeadline(''); setLinkedUserId(''); setProfilePictureUrl(''); }}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Current Experts</h2>
          {experts.map(expert => (
            <Card key={expert.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {expert.profilePictureUrl ? (
                    <img src={expert.profilePictureUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">?</div>
                  )}
                  <div>
                    <h3 className="font-bold">{expert.displayName}</h3>
                    <p className="text-xs text-zinc-400">{expert.headline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${expert.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {expert.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => handleEdit(expert)}>Edit</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {imageSrc && (
        <ExpertCropper 
          imageSrc={imageSrc} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setImageSrc(null)} 
        />
      )}
    </div>
  );
}
