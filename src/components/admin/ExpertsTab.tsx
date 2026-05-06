'use client';

import React, { useEffect, useState } from 'react';
import { db, storage } from '@/config/firebase';
import { collection, query, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ExpertCropper } from '@/components/admin/ExpertCropper';
import { getCroppedImg } from '@/lib/cropImage';
import type { ExpertProfile, UserProfile } from '@/types';
import { Loader2, Plus, Edit2, Search, Users, Activity, ArrowLeft, ChevronRight, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';


export function ExpertsTab() {
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

  const [view, setView] = useState<'list' | 'form'>('list');
  
  // Stats state
  const [expertStats, setExpertStats] = useState<Record<string, { assigned: number, active: number }>>({});

  // Cropper state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  
  // Pending ID for new experts to keep Storage + Firestore in sync
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const expertsSnap = await getDocs(collection(db, 'expertProfiles'));
        const expertsData = expertsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpertProfile));
        setExperts(expertsData);

        const usersSnap = await getDocs(collection(db, 'users'));
        const usersData = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
        setUsers(usersData);

        // Fetch relationship stats
        const relSnap = await getDocs(collection(db, 'expertClientRelationships'));
        const stats: Record<string, { assigned: number, active: number }> = {};
        
        expertsData.forEach(exp => {
          const assignments = relSnap.docs.filter(d => d.data().expertId === exp.id && d.data().active === true);
          stats[exp.id] = {
            assigned: assignments.length,
            active: Math.floor(assignments.length * 0.7), // Mocking active users as 70% of assigned for now
          };
        });
        setExpertStats(stats);

      } catch (e) {
        console.error("Error fetching admin expert data:", e);
        toast({ title: 'Error fetching data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

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

      // Use editingId, or existing pendingId, or generate new pendingId
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
      throw e; // Re-throw to let cropper know it failed
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
      
      // Reset all form state
      setEditingId(null);
      setPendingId(null);
      setDisplayName('');
      setHeadline('');
      setLinkedUserId('');
      setSpecialityTags('');
      setProfilePictureUrl('');
      setActive(true);
      setView('list'); // Return to list

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
    setView('form'); // Switch to form
  };

  const resetForm = () => {
    setEditingId(null);
    setPendingId(null);
    setDisplayName('');
    setHeadline('');
    setLinkedUserId('');
    setSpecialityTags('');
    setProfilePictureUrl('');
    setActive(true);
    setView('list');
    setIsSaving(false);
    setIsUploading(false);
  };

  const handleUserSelect = (u: UserProfile) => {
    setLinkedUserId(u.uid);
    // Auto-populate display name if empty
    if (!displayName) {
        setDisplayName(u.displayName || '');
    }
    setSearchUser(''); // Clear search to "close" the list
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  const filteredUsers = searchUser 
    ? users.filter(u => u.displayName?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase()))
    : []; // Don't show list if not searching

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {view === 'list' ? (
        <div className="space-y-6">
            {/* Landing Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white">Expert Hub Management</h2>
                    <p className="text-zinc-500 text-sm">Monitor expert performance and manage profiles.</p>
                </div>
                <Button onClick={() => setView('form')} className="bg-[#ffc01f] hover:bg-[#ffc01f]/90 text-black font-bold h-12 rounded-2xl gap-2 px-6">
                    <UserPlus className="w-5 h-5" />
                    Create New Expert
                </Button>
            </div>

            {/* Expert Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experts.map(expert => {
                    const stats = expertStats[expert.id] || { assigned: 0, active: 0 };
                    return (
                        <Card key={expert.id} className="bg-white/5 border-white/10 text-white overflow-hidden hover:border-indigo-500/30 transition-colors group">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        {expert.profilePictureUrl ? (
                                            <img src={expert.profilePictureUrl} className="w-14 h-14 rounded-2xl object-cover border border-white/10" alt="" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-zinc-500 text-xl">?</div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold truncate text-lg">{expert.displayName}</h3>
                                                <div className={cn("w-2 h-2 rounded-full", expert.active ? "bg-emerald-500" : "bg-red-500")} />
                                            </div>
                                            <p className="text-[10px] text-zinc-500 truncate uppercase tracking-widest font-bold">{expert.active ? 'Active' : 'Inactive'}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(expert)} className="rounded-full hover:bg-white/10 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* KPIs */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                            <Users className="w-3 h-3" />
                                            <span className="text-[10px] uppercase font-bold tracking-tighter">Clients</span>
                                        </div>
                                        <div className="text-xl font-black text-white">{stats.assigned}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                            <Activity className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[10px] uppercase font-bold tracking-tighter">Active Now</span>
                                        </div>
                                        <div className="text-xl font-black text-emerald-400">{stats.active}</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-1">
                                        {expert.specialityTags?.map((tag, i) => (
                                            <span key={`${tag}-${i}`} className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{tag}</span>
                                        ))}
                                    </div>
                                    <Button onClick={() => handleEdit(expert)} variant="secondary" className="w-full bg-white/10 hover:bg-white/15 text-white border-0 rounded-xl h-10 text-xs font-bold gap-2">
                                        Edit Profile
                                        <ChevronRight className="w-3 h-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {experts.length === 0 && (
                    <div className="col-span-full text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/5">
                        <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-zinc-400">No experts found</h3>
                        <p className="text-sm text-zinc-600 mb-6">Start by creating your first expert profile.</p>
                        <Button onClick={() => setView('form')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 rounded-xl">
                            Create Expert
                        </Button>
                    </div>
                )}
            </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
            <button onClick={resetForm} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Hub
            </button>

            <Card className="bg-white/5 border-white/10 text-white overflow-hidden rounded-3xl">
                <CardHeader className="bg-white/5 border-b border-white/5 pb-6">
                    <CardTitle className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", editingId ? "bg-indigo-500/20 text-indigo-400" : "bg-emerald-500/20 text-emerald-400")}>
                            {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="text-lg font-black">{editingId ? 'Edit Profile' : 'Create Expert'}</div>
                            <div className="text-xs text-zinc-500 font-medium">Set up public credentials and link account.</div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Search App User to Link</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <Input 
                                    value={searchUser} 
                                    onChange={(e) => setSearchUser(e.target.value)} 
                                    placeholder="Search by name or email..." 
                                    className="bg-white/5 border-white/10 pl-10 focus:ring-indigo-500/40 rounded-xl h-12"
                                />
                            </div>
                            
                            {searchUser && filteredUsers.length > 0 && (
                                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto scrollbar-none bg-zinc-950 rounded-2xl p-1 border border-white/5 shadow-2xl">
                                    {filteredUsers.map(u => (
                                    <div 
                                        key={u.uid} 
                                        onClick={() => handleUserSelect(u)}
                                        className={`p-3 rounded-xl cursor-pointer text-sm flex items-center justify-between transition-colors ${linkedUserId === u.uid ? 'bg-indigo-600/30 border border-indigo-500/50' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{u.displayName || 'No Name'}</span>
                                            <span className="text-[10px] opacity-50 uppercase tracking-tight">{u.email || u.uid}</span>
                                        </div>
                                        {linkedUserId === u.uid && (
                                            <div className="text-[9px] font-black bg-indigo-500 text-white px-2 py-1 rounded-lg text-center">SELECTED</div>
                                        )}
                                    </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Public Display Name</Label>
                                </div>
                                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-white/5 border-white/10 focus:ring-[#ffc01f]/40 rounded-xl h-12" placeholder="e.g. Expert Coach" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Headline (Short)</Label>
                                <Input value={headline} maxLength={60} onChange={(e) => setHeadline(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-12" placeholder="e.g. Specialist in Gut Health" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Speciality Tags (Comma separated)</Label>
                            <Input value={specialityTags} onChange={(e) => setSpecialityTags(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-12" placeholder="e.g. Gut Health, Fat Loss, Performance" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Profile Picture</Label>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                {profilePictureUrl ? (
                                    <img src={profilePictureUrl} alt="Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-[#ffc01f]/50 p-0.5" />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-zinc-500 text-[10px] text-center px-2">No Photo</div>
                                )}
                                <div className="flex-1 space-y-2">
                                    <Input type="file" accept="image/png, image/jpeg" onChange={handleImageChange} className="bg-white/5 border-white/10 text-xs h-auto py-2 rounded-lg" />
                                    <p className="text-[9px] text-zinc-500">Square images work best. Max 2MB.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">Profile Status</Label>
                                <p className="text-[10px] text-zinc-500">Visible to users when active.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn("text-[10px] font-bold uppercase", active ? "text-emerald-400" : "text-red-400")}>{active ? 'Active' : 'Inactive'}</span>
                                <Switch checked={active} onCheckedChange={setActive} className="data-[state=checked]:bg-emerald-500" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving || isUploading}
                            className="flex-1 bg-[#ffc01f] hover:bg-[#ffc01f]/90 text-black font-bold h-14 rounded-2xl shadow-lg shadow-[#ffc01f]/10 gap-2"
                        >
                            {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                            {isSaving ? 'Saving...' : (editingId ? 'Save Profile Changes' : 'Complete Expert Setup')}
                        </Button>
                        <Button variant="ghost" onClick={resetForm} disabled={isSaving || isUploading} className="h-14 px-6 rounded-2xl text-zinc-500 hover:text-white">
                            Discard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

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
