
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { useAuth } from '@/components/auth/AuthProvider';
import { db, auth } from '@/config/firebase'; // Added auth
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth'; // Added signOut
import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // REMOVED: Using glass panels instead
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

import {
    Calendar as CalendarIcon, Save, ArrowLeft, Activity, User, Ruler, Scale, Zap, Target,
    Flame, TrendingUp, TrendingDown, Utensils, LogOut, Pencil, Download,
    ShieldCheck, ChevronRight, Settings, FileText
} from 'lucide-react';
import { UserProfile } from '@/types';
import { calculateBMR, calculateTDEE, calculateNutritionTargets, ACTIVITY_MULTIPLIERS, GOAL_ADJUSTMENTS } from '@/lib/calculations';
import { generateUserDataExport } from '@/utils/data-export';
import { AppleHealthService } from '@/lib/apple-health';
import { AppleHealthIcon, FitbitIcon } from '@/components/shared/BrandIcons';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Removed
// import { Calendar } from '@/components/ui/calendar'; // Removed local usage
import LiquidDateSheet from '@/components/shared/LiquidDateSheet'; // Added
import { format } from 'date-fns';
import { releaseNotesData, releaseNotesData as allNotes, APP_VERSION } from '@/config/releaseNotes'; // Imports

// Helper to calculate age from DOB
function getAge(dob: string) {
    if (!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

const DIET_OPTIONS = [
    { id: 'keto', name: 'Keto' },
    { id: 'vegan', name: 'Vegan' },
    { id: 'vegetarian', name: 'Vegetarian' },
    { id: 'intermittent_fasting', name: 'Intermittent Fasting' },
    { id: 'paleo', name: 'Paleo' },
    { id: 'gluten_free', name: 'Gluten Free' },
    { id: 'dairy_free', name: 'Dairy Free' },
    { id: 'pescatarian', name: 'Pescatarian' },
];

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    // DOB state is YYYY-MM-DD string
    const [dob, setDob] = useState('');
    const [isSavingDob, setIsSavingDob] = useState(false);

    // Date Sheet State
    const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);

    const [profileData, setProfileData] = useState<UserProfile['profile'] | undefined>(undefined);

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [editForm, setEditForm] = useState({
        height: 0,
        weight: 0,
        gender: 'female' as 'male' | 'female',
        activityLevel: 'sedentary' as keyof typeof ACTIVITY_MULTIPLIERS,
        goal: 'maintain' as keyof typeof GOAL_ADJUSTMENTS,
        dietaryPreferences: [] as string[],
    });

    const [isFitbitConnected, setIsFitbitConnected] = useState(false);
    const [isLoadingFitbit, setIsLoadingFitbit] = useState(true);
    const [isTogglingFitbit, setIsTogglingFitbit] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    // const [versionTaps, setVersionTaps] = useState(0); // REMOVED: God Mode not wanted
    const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false); // Added for Release Notes

    const [isAppleHealthConnected, setIsAppleHealthConnected] = useState(false);
    const [isTogglingAppleHealth, setIsTogglingAppleHealth] = useState(false);

    // Account Deletion State
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

    const handleDeleteAccount = async () => {
        if (!user) return;
        setIsSavingProfile(true);
        try {
            const { deleteUserAccount } = await import('@/lib/firebase/auth');
            await deleteUserAccount(user.uid);
            toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
            router.push('/');
        } catch (error: any) {
            console.error("Delete account error:", error);
            if (error.code === 'auth/requires-recent-login') {
                toast({
                    title: "Security Check",
                    description: "Please sign out and sign back in to verify your identity before deleting your account.",
                    variant: "destructive"
                });
            } else {
                toast({ title: "Error", description: "Could not delete account. Please try again.", variant: "destructive" });
            }
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Initial Data Fetch
    useEffect(() => {
        if (profileData) {
            setIsAppleHealthConnected(!!profileData.appleHealthEnabled);
        }
    }, [profileData]);

    const handleAppleHealthToggle = async (checked: boolean) => {
        if (!user || !profileData) return;
        setIsTogglingAppleHealth(true);
        try {
            if (checked) {
                const available = await AppleHealthService.isAvailable();
                if (!available) {
                    toast({ title: "Not Available", description: "Apple Health is not available on this device." });
                    return;
                }

                await AppleHealthService.requestPermissions();

                await updateDoc(doc(db, 'users', user.uid), {
                    'profile.appleHealthEnabled': true
                });

                setIsAppleHealthConnected(true);
                toast({ title: "Connected", description: "Apple Health sync enabled." });

                if (window.location.protocol !== 'https:') {
                    // Simple check to avoid running on server/static build if needed
                    const steps = await AppleHealthService.getTodaySteps();
                    console.log('Initial sync steps:', steps);
                }

            } else {
                await updateDoc(doc(db, 'users', user.uid), {
                    'profile.appleHealthEnabled': false
                });
                setIsAppleHealthConnected(false);
                toast({ title: "Disconnected", description: "Apple Health sync disabled." });
            }
        } catch (error) {
            console.error("Apple Health toggle error:", error);
            toast({ title: "Error", description: "Could not update Apple Health settings.", variant: "destructive" });
        } finally {
            setIsTogglingAppleHealth(false);
        }
    };

    // Initial Data Fetch
    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/');
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Fetch Profile Data
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data() as UserProfile;
                    setDob(data.dateOfBirth || '');
                    setProfileData(data.profile);
                }

                // 2. Fetch Fitbit Status
                const token = await user.getIdToken();
                const res = await fetch('/api/fitbit/status', {
                    method: 'POST',
                    body: JSON.stringify({ idToken: token }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setIsFitbitConnected(!!data.isConnected);
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
                toast({ title: "Error", description: "Failed to load profile data.", variant: "destructive" });
            } finally {
                setIsLoadingFitbit(false);
            }
        };

        fetchData();

        // Listen for App Resume (Foreground) to refresh status
        const listener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                console.log('App resumed, refreshing Fitbit status...');
                fetchData();
            }
        });

        return () => {
            listener.then(l => l.remove());
        };
    }, [user, loading, router, toast]);

    // Initialize edit form when profileData changes or dialog opens
    useEffect(() => {
        if (profileData && isEditOpen) {
            setEditForm({
                height: profileData.height,
                weight: profileData.weight,
                gender: profileData.gender,
                activityLevel: profileData.activityLevel,
                goal: profileData.goal,
                dietaryPreferences: profileData.dietaryPreferences || [],
            });
        }
    }, [profileData, isEditOpen]);


    const handleSaveDob = async () => { // Kept for reference, logic merged into edit profile
        if (!user) return;
        setIsSavingDob(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                dateOfBirth: dob
            });
            toast({ title: "Saved", description: "Date of birth updated successfully." });
        } catch (error) {
            console.error("Error saving DOB:", error);
            toast({ title: "Error", description: "Could not save date of birth.", variant: "destructive" });
        } finally {
            setIsSavingDob(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user || !profileData) return;
        setIsSavingProfile(true);

        try {
            const age = getAge(dob);
            if (age === 0 && !dob) {
                toast({ title: "Date of Birth Required", description: "Please set your Date of Birth first to calculate targets accurately.", variant: "destructive" });
                setIsSavingProfile(false);
                return;
            }

            // Sync DOB as well if changed in dialog
            await updateDoc(doc(db, 'users', user.uid), {
                dateOfBirth: dob
            });

            // Recalculate
            const newBmr = calculateBMR(editForm.weight, editForm.height, age, editForm.gender);
            const newTdee = calculateTDEE(newBmr, editForm.activityLevel);
            const newNutrition = calculateNutritionTargets(
                newBmr,
                newTdee,
                editForm.weight,
                editForm.goal,
                profileData.symptoms // Keep existing symptoms
            );

            const updatedProfile: UserProfile['profile'] = {
                ...profileData,
                ...editForm,
                bmr: newBmr,
                tdee: newTdee,
                macros: newNutrition.macros,
                dietaryPreferences: editForm.dietaryPreferences
            };

            await updateDoc(doc(db, 'users', user.uid), {
                profile: updatedProfile
            });

            setProfileData(updatedProfile);
            setIsEditOpen(false);
            toast({ title: "Profile Updated", description: "Your biometric data and nutrition targets have been recalculated." });

        } catch (error) {
            console.error("Error updating profile:", error);
            toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleFitbitToggle = async (checked: boolean) => {
        if (!user) return;
        setIsTogglingFitbit(true);

        try {
            if (checked) {
                const token = await user.getIdToken();
                const isNative = Capacitor.isNativePlatform();

                const response = await fetch('/api/fitbit/initiate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idToken: token,
                        platform: isNative ? 'ios' : 'web'
                    }),
                });

                if (response.ok) {
                    const { url } = await response.json();

                    if (isNative) {
                        // Native: Use In-App Browser (System Modal)
                        await Browser.open({ url, windowName: '_self' });
                    } else {
                        // Web: Standard Redirect
                        window.location.href = url;
                    }
                } else {
                    throw new Error("Failed to initiate connection");
                }
            } else {
                const token = await user.getIdToken();
                const response = await fetch('/api/fitbit/disconnect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: token }),
                });

                if (response.ok) {
                    setIsFitbitConnected(false);
                    toast({ title: "Disconnected", description: "Fitbit has been disconnected." });
                } else {
                    throw new Error("Failed to disconnect");
                }
            }
        } catch (error) {
            console.error("Fitbit toggle error:", error);
            toast({
                title: "Error",
                description: checked ? "Could not initiate Fitbit connection." : "Could not disconnect Fitbit.",
                variant: "destructive"
            });
        } finally {
            setIsTogglingFitbit(false);
        }
    };

    const handleDataExport = async () => {
        if (!user) return;
        setIsExporting(true);
        try {
            await generateUserDataExport(user.uid);
            toast({ title: "Export Complete", description: "Your data has been downloaded." });
        } catch (error) {
            console.error("Export failed:", error);
            toast({ title: "Export Failed", description: "Could not generate data export.", variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Sign out error", error);
        }
    };



    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading Profile...</div>;

    // --- RENDER HELPERS ---
    const GlassPanel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
        <div className={cn(
            "glass-crystal rounded-3xl p-5 border border-white/10 relative overflow-hidden",
            className
        )}>
            {/* Inner Glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
            {children}
        </div>
    );

    const formatActivity = (level: string) => level.replace(/_/g, ' ');

    return (
        <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
            {/* Background Gradient Mesh (Strict Parity with Dashboard) */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-32 pt-16 px-4 space-y-6 relative z-10 w-full max-w-lg mx-auto">

                {/* A. Identity Header */}
                <div className="glass-crystal rounded-full p-3 pr-5 flex items-center justify-between border border-white/10 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/10 shadow-sm">
                            <AvatarImage src={user?.photoURL || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {user?.displayName?.slice(0, 2).toUpperCase() || "ME"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-foreground leading-none">
                                {user?.displayName || "Your Profile"}
                            </h1>
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">
                                Beta Member
                            </p>
                        </div>
                    </div>

                    {/* Edit Profile Dialog Trigger */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs hover:bg-white/10 transition-colors text-foreground/80 font-medium px-3">
                                Edit Profile
                            </Button>
                        </DialogTrigger>
                        {/* --- EDIT DIALOG CONTENT START --- */}
                        <DialogContent className="glass-crystal border-white/10 max-w-sm max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Edit Profile</DialogTitle>
                                <DialogDescription>Updates recalculate your daily targets.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-dob">Date of Birth</Label>

                                    <Button
                                        variant={"outline"}
                                        onClick={() => setIsDateSheetOpen(true)}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-white/5 border-white/10 hover:bg-white/10",
                                            !dob && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dob ? format(new Date(dob), "PPP") : <span>Pick a date</span>}
                                    </Button>

                                    <LiquidDateSheet
                                        isOpen={isDateSheetOpen}
                                        onClose={() => setIsDateSheetOpen(false)}
                                        onSave={(date) => {
                                            setDob(format(date, 'yyyy-MM-dd'));
                                            setIsDateSheetOpen(false);
                                        }}
                                        initialDate={dob ? new Date(dob) : undefined}
                                        title="Date of Birth"
                                    />

                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Height (cm)</Label>
                                        <Input type="number" value={editForm.height} onChange={(e) => setEditForm({ ...editForm, height: Number(e.target.value) })} className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Weight (kg)</Label>
                                        <Input type="number" value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })} className="bg-white/5 border-white/10" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Activity Level</Label>
                                    <Select value={editForm.activityLevel} onValueChange={(val: any) => setEditForm({ ...editForm, activityLevel: val })}>
                                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sedentary">Sedentary</SelectItem>
                                            <SelectItem value="lightly_active">Lightly Active</SelectItem>
                                            <SelectItem value="moderately_active">Moderately Active</SelectItem>
                                            <SelectItem value="very_active">Very Active</SelectItem>
                                            <SelectItem value="super_active">Super Active</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Goal</Label>
                                    <Select value={editForm.goal} onValueChange={(val: any) => setEditForm({ ...editForm, goal: val })}>
                                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="maintain">Maintain</SelectItem>
                                            <SelectItem value="lose_fat">Lose Fat</SelectItem>
                                            <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsEditOpen(false)}
                                    className="flex-1 py-3.5 rounded-full font-semibold text-[15px] bg-white/10 text-white hover:bg-white/15 transition-colors active:scale-[0.98]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile}
                                    className={cn(
                                        "flex-[2] py-3.5 rounded-full font-semibold text-[15px] text-white transition-all active:scale-[0.98]",
                                        isSavingProfile
                                            ? "bg-white/10 text-white/50 cursor-not-allowed"
                                            : "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20"
                                    )}
                                >
                                    {isSavingProfile ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </DialogContent>
                        {/* --- EDIT DIALOG CONTENT END --- */}
                    </Dialog>
                </div>

                {/* B. Body Snapshot */}
                {profileData && (
                    <GlassPanel>
                        <div className="grid grid-cols-2 gap-y-8 gap-x-4 p-2">
                            <div className="flex flex-col space-y-1">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Height</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-foreground">{profileData.height}</span>
                                    <span className="text-xs text-muted-foreground font-medium">cm</span>
                                </div>
                            </div>
                            <div className="flex flex-col space-y-1">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Weight</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-foreground">{profileData.weight}</span>
                                    <span className="text-xs text-muted-foreground font-medium">kg</span>
                                </div>
                            </div>
                            <div className="flex flex-col space-y-1">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sex</span>
                                <span className="text-lg font-medium text-foreground capitalize">{profileData.gender}</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Activity</span>
                                <span className="text-lg font-medium text-foreground capitalize truncate">{formatActivity(profileData.activityLevel)}</span>
                            </div>
                        </div>
                    </GlassPanel>
                )}

                {/* C. Health Intent */}
                {profileData && (
                    <GlassPanel className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Primary Goal</span>
                                <h3 className="text-xl font-bold text-foreground capitalize flex items-center gap-2">
                                    {formatActivity(profileData.goal)}
                                    {profileData.goal === 'lose_fat' && <TrendingDown className="h-4 w-4 text-emerald-400" />}
                                    {profileData.goal === 'gain_muscle' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                                </h3>
                            </div>
                            <Target className="h-8 w-8 text-primary/20" />
                        </div>

                        <div className="space-y-3">
                            {profileData.symptoms.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Baseline Symptoms</span>
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.symptoms.map(s => (
                                            <Badge key={s} variant="secondary" className="px-2.5 py-0.5 text-xs font-normal bg-white/5 hover:bg-white/10 text-foreground border-white/5 capitalize">
                                                {s}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Preferences</span>
                                <div className="flex flex-wrap gap-2">
                                    {profileData.dietaryPreferences && profileData.dietaryPreferences.length > 0 ? profileData.dietaryPreferences.map(pref => (
                                        <Badge key={pref} variant="secondary" className="px-2.5 py-0.5 text-xs font-normal bg-emerald-500/10 text-emerald-500 border-emerald-500/20 capitalize">
                                            {formatActivity(pref)}
                                        </Badge>
                                    )) : (
                                        <span className="text-xs text-muted-foreground/50 italic">None set</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </GlassPanel>
                )}

                {/* D. Daily Energy & Balance */}
                {profileData && (
                    <GlassPanel className="space-y-0 p-0">
                        <div className="grid grid-cols-2 divide-x divide-white/5">
                            <div className="p-5 space-y-1">
                                <div className="flex items-center gap-2 text-orange-400 mb-1">
                                    <Flame className="h-3.5 w-3.5" />
                                    <span className="text-[10px] uppercase tracking-wider font-bold">Daily TDEE</span>
                                </div>
                                <span className="text-2xl font-bold text-foreground block">{profileData.tdee}</span>
                                <span className="text-[10px] text-muted-foreground">Calories / Day</span>
                            </div>
                            <div className="p-5 space-y-1">
                                <div className="flex items-center gap-2 text-blue-400 mb-1">
                                    <Activity className="h-3.5 w-3.5" />
                                    <span className="text-[10px] uppercase tracking-wider font-bold">BMR</span>
                                </div>
                                <span className="text-2xl font-bold text-foreground block">{profileData.bmr}</span>
                                <span className="text-[10px] text-muted-foreground">Base Metabolic Rate</span>
                            </div>
                        </div>
                        <div className="border-t border-white/5 p-5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-4">Macro Targets</span>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-red-400 font-bold text-lg">{profileData.macros.protein}g</span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase">Protein</span>
                                </div>
                                <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-yellow-400 font-bold text-lg">{profileData.macros.carbs}g</span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase">Carbs</span>
                                </div>
                                <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-blue-400 font-bold text-lg">{profileData.macros.fats}g</span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase">Fats</span>
                                </div>
                            </div>
                        </div>
                    </GlassPanel>
                )}

                {/* E. Data & Integrations */}
                <div className="space-y-3">
                    <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest opacity-70">Integrations & Data</h3>
                    <GlassPanel className="p-0 overflow-hidden">
                        {/* Apple Health */}
                        {Capacitor.getPlatform() === 'ios' && (
                            <div className="flex items-center justify-between p-4 border-b border-white/5 active:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center text-white">
                                        <AppleHealthIcon className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">Apple Health</span>
                                        <span className="text-xs text-muted-foreground">Sync steps via HealthKit</span>
                                    </div>
                                </div>
                                <Switch checked={isAppleHealthConnected} onCheckedChange={handleAppleHealthToggle} disabled={isTogglingAppleHealth} />
                            </div>
                        )}

                        {Capacitor.getPlatform() === 'ios' && (
                            <div className="px-4 pb-3 -mt-2">
                                <span className="text-[10px] text-muted-foreground/80 leading-relaxed block">
                                    Apple Health integration uses HealthKit to access your steps data when enabled.
                                </span>
                            </div>
                        )}

                        {/* Fitbit */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 active:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-[#00B0B9] flex items-center justify-center text-white">
                                    <FitbitIcon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">Fitbit</span>
                                    <span className="text-xs text-muted-foreground">Syncs weight & steps</span>
                                </div>
                            </div>
                            {isLoadingFitbit ? <div className="h-5 w-8 bg-white/10 rounded animate-pulse" /> :
                                <Switch checked={isFitbitConnected} onCheckedChange={handleFitbitToggle} disabled={isTogglingFitbit} />}
                        </div>

                        {/* Data Export */}
                        <button onClick={handleDataExport} disabled={isExporting} className="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors text-left">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Download className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">Download My Data</span>
                                    <span className="text-xs text-muted-foreground">JSON Export</span>
                                </div>
                            </div>
                            {isExporting ? <span className="text-xs text-muted-foreground animate-pulse">Saving...</span> : <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
                        </button>

                        {/* Terms of Use */}
                        <button onClick={() => router.push('/terms')} className="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors text-left border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">Terms of Use</span>
                                    <span className="text-xs text-muted-foreground">Read terms</span>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                        </button>

                        {/* Privacy */}
                        <button onClick={() => router.push('/privacy')} className="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors text-left">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">Privacy Notice</span>
                                    <span className="text-xs text-muted-foreground">Read policy</span>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                        </button>
                    </GlassPanel>
                </div>

                {/* F. Account Actions */}
                <div className="pt-8 space-y-3">
                    <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest opacity-70">App Settings</h3>
                    <GlassPanel className="p-0 overflow-hidden">
                        {/* Redo Setup */}
                        <button onClick={() => router.push('/setup')} className="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors text-left border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Settings className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">Redo Setup Wizard</span>
                                    <span className="text-xs text-muted-foreground">Recalculate targets</span>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                        </button>

                        {/* Sign Out */}
                        <button onClick={handleSignOut} className="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors text-left group">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-red-500/10 flex items-center justify-center text-muted-foreground group-hover:text-red-500 transition-colors">
                                    <LogOut className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground group-hover:text-red-500 transition-colors">Sign Out</span>
                                </div>
                            </div>
                        </button>
                    </GlassPanel>
                </div>

                {/* G. Danger Zone */}
                <div className="pt-12 pb-8 space-y-3 flex flex-col items-center">
                    <h3 className="w-full px-4 text-xs font-bold text-red-500/50 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <span className="h-px flex-1 bg-red-500/10"></span>
                        Danger Zone
                        <span className="h-px flex-1 bg-red-500/10"></span>
                    </h3>

                    {/* Delete Account */}
                    <Dialog open={isDeleteConfirmOpen} onOpenChange={(open) => {
                        setIsDeleteConfirmOpen(open);
                        if (!open) setDeleteConfirmationInput(''); // Reset input on close
                    }}>
                        <DialogTrigger asChild>
                            <button className="w-full p-4 rounded-3xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-red-500 text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-900/10">
                                <LogOut className="h-4 w-4 rotate-180" />
                                Delete My Account
                            </button>
                        </DialogTrigger>
                        <DialogContent className="glass-crystal border-red-500/20 max-w-sm max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-red-500">Delete Account?</DialogTitle>
                                <DialogDescription className="text-white/70">
                                    This action is <span className="font-bold text-white">permanent</span> and cannot be undone.
                                    All your data (logs, profile, preferences) will be erased immediately.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 space-y-3 mb-[env(safe-area-inset-bottom,0px)]">
                                <Label htmlFor="delete-confirm" className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                                    Type <span className="text-red-400 font-bold select-all">delete</span> to confirm
                                </Label>
                                <Input
                                    id="delete-confirm"
                                    value={deleteConfirmationInput}
                                    onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                                    placeholder="Type delete"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-red-500/50 focus:ring-red-500/20"
                                    autoComplete="off"
                                    onFocus={(e) => {
                                        // Scroll input into view when keyboard appears
                                        setTimeout(() => {
                                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }, 300);
                                    }}
                                />
                            </div>

                            <DialogFooter className="flex-col gap-2 mt-2 sm:flex-col pb-4">
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteAccount}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSavingProfile || deleteConfirmationInput.toLowerCase() !== 'delete'}
                                >
                                    {isSavingProfile ? "Deleting..." : "Yes, Delete My Account"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    className="w-full hover:bg-white/5"
                                >
                                    Cancel
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>



                    <p
                        onClick={() => setIsReleaseNotesOpen(true)}
                        className="text-[10px] text-muted-foreground/30 font-mono pt-4 select-none cursor-pointer active:scale-95 transition-transform hover:text-white/40"
                    >
                        {APP_VERSION}
                    </p>

                    {/* ... Release Notes Dialog ... */}


                    {/* Release Notes Dialog */}
                    <Dialog open={isReleaseNotesOpen} onOpenChange={setIsReleaseNotesOpen}>
                        <DialogContent className="glass-crystal border-white/10 max-w-md max-h-[85vh] overflow-y-auto flex flex-col p-0 gap-0">
                            <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-white/5 backdrop-blur-xl sticky top-0 z-10">
                                <DialogTitle className="text-xl">Release Notes</DialogTitle>
                                <DialogDescription>What's new in GutCheck</DialogDescription>
                            </DialogHeader>
                            <div className="p-6 space-y-8">
                                {releaseNotesData.map((note, idx) => (
                                    <div key={idx} className="relative pl-6 border-l border-white/10">
                                        <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                                        <div className="flex flex-col gap-1 mb-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-foreground">{note.version}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{note.date}</span>
                                            </div>
                                            {note.title && <span className="text-xs font-medium text-emerald-400">{note.title}</span>}
                                        </div>
                                        <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                                            {Array.isArray(note.description) ? (
                                                note.description.map((desc, i) => <p key={i}>• {desc}</p>)
                                            ) : (
                                                <p>{note.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <DialogFooter className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-xl sticky bottom-0 z-10">
                                <Button variant="ghost" onClick={() => setIsReleaseNotesOpen(false)} className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-foreground">
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </main>

        </div>
    );
}
