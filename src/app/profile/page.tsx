
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import Navbar from '@/components/shared/Navbar';
import { Calendar, Save, ArrowLeft, Activity, User, Ruler, Scale, Zap, Target, Flame, TrendingUp, TrendingDown, Utensils, LogOut, Pencil, Download, ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/types';
import { calculateBMR, calculateTDEE, calculateNutritionTargets, ACTIVITY_MULTIPLIERS, GOAL_ADJUSTMENTS } from '@/lib/calculations';
import { generateUserDataExport } from '@/utils/data-export';

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

    const [dob, setDob] = useState('');
    const [isSavingDob, setIsSavingDob] = useState(false);

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

    // Initial Data Fetch
    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/'); // Redirect to landing if not logged in
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


    // Handle DOB Save
    const handleSaveDob = async () => {
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


    // Handle Fitbit Toggle
    const handleFitbitToggle = async (checked: boolean) => {
        if (!user) return;
        setIsTogglingFitbit(true);

        try {
            if (checked) {
                // Connect: Initiate OAuth
                const token = await user.getIdToken();
                const response = await fetch('/api/fitbit/initiate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: token }),
                });

                if (response.ok) {
                    const { url } = await response.json();
                    window.location.href = url; // Redirect to Fitbit
                } else {
                    throw new Error("Failed to initiate connection");
                }
            } else {
                // Disconnect
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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 py-8 pt-24 space-y-8">
                {/* Header with Edit Button */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground">User Center</h1>
                    </div>

                    {/* Edit Profile Dialog */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-[#2aac6b] hover:bg-[#25965e] text-white shadow-sm">
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Profile
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Profile Data</DialogTitle>
                                <DialogDescription>
                                    Updating these values will recalculate your daily calorie and macro targets.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="edit-dob">Date of Birth</Label>
                                        <Input
                                            id="edit-dob"
                                            type="date"
                                            value={dob} // Using state 'dob' directly for now as it's synced on open
                                            onChange={(e) => setDob(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="height">Height (cm)</Label>
                                        <Input
                                            id="height"
                                            type="number"
                                            value={editForm.height}
                                            onChange={(e) => setEditForm({ ...editForm, height: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="weight">Weight (kg)</Label>
                                        <Input
                                            id="weight"
                                            type="number"
                                            value={editForm.weight}
                                            onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        value={editForm.gender}
                                        onValueChange={(val: 'male' | 'female') => setEditForm({ ...editForm, gender: val })}
                                    >
                                        <SelectTrigger id="gender">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="male">Male</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="activity">Activity Level</Label>
                                    <Select
                                        value={editForm.activityLevel}
                                        onValueChange={(val: keyof typeof ACTIVITY_MULTIPLIERS) => setEditForm({ ...editForm, activityLevel: val })}
                                    >
                                        <SelectTrigger id="activity">
                                            <SelectValue placeholder="Select activity level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sedentary">Sedentary (Little/no exercise)</SelectItem>
                                            <SelectItem value="lightly_active">Lightly Active (1-3 days/week)</SelectItem>
                                            <SelectItem value="moderately_active">Moderately Active (3-5 days/week)</SelectItem>
                                            <SelectItem value="very_active">Very Active (6-7 days/week)</SelectItem>
                                            <SelectItem value="super_active">Super Active (Physical job/training)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="goal">Primary Goal</Label>
                                    <Select
                                        value={editForm.goal}
                                        onValueChange={(val: keyof typeof GOAL_ADJUSTMENTS) => setEditForm({ ...editForm, goal: val })}
                                    >
                                        <SelectTrigger id="goal">
                                            <SelectValue placeholder="Select goal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="maintain">Maintain Weight</SelectItem>
                                            <SelectItem value="lose_fat">Lose Fat</SelectItem>
                                            <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="col-span-2 space-y-3">
                                    <Label>Dietary Preferences</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {DIET_OPTIONS.map((diet) => {
                                            const isSelected = editForm.dietaryPreferences.includes(diet.id);
                                            return (
                                                <div
                                                    key={diet.id}
                                                    className="flex items-start space-x-2"
                                                >
                                                    <Checkbox
                                                        id={`edit-${diet.id}`}
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => {
                                                            const current = editForm.dietaryPreferences;
                                                            if (checked) {
                                                                setEditForm({ ...editForm, dietaryPreferences: [...current, diet.id] });
                                                            } else {
                                                                setEditForm({ ...editForm, dietaryPreferences: current.filter(id => id !== diet.id) });
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`edit-${diet.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {diet.name}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                                    {isSavingProfile ? "Recalculating..." : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Personal Information */}
                <Card className="border-border shadow-sm bg-card text-card-foreground">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                            Personal Information
                        </CardTitle>
                        <CardDescription>Manage your personal details for better health insights.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <div className="flex gap-2">
                                {/* DOB Input moved to Edit Dialog, display only here or just remove save button? 
                                       User said: "remove the save button and make the birthday update follow the same edit button as the rest"
                                       So we should just display it here read-only or remove this card if it only has DOB?
                                       The card is "Personal Information". Detailed req: "remove the save button and make the birthday update follow the same edit button".
                                       I will make this input read-only/disabled and remove the save button. The editing will happen in the main 'Edit' dialog.
                                    */}
                                <div className="relative flex-1">
                                    <Input
                                        type="date"
                                        id="dob"
                                        value={dob}
                                        disabled
                                        className="pl-10 bg-muted/20"
                                    />
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                                {/* Save Button Removed */}
                            </div>
                            <p className="text-xs text-muted-foreground">To update, click the "Edit" button above.</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Used to calculate age-related health metrics.</p>
                    </CardContent>
                </Card>

                {/* Biometrics & Setup Data */}
                {profileData && (
                    <>
                        <Card className="border-border shadow-sm bg-card text-card-foreground">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center text-xl">
                                        Your Profile
                                    </CardTitle>
                                    <CardDescription>Measured and calculated from your setup data.</CardDescription>
                                </div>
                                {/* Edit Button Moved to Top */}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Biometrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center justify-center text-center">
                                        <Ruler className="h-5 w-5 text-[#2aac6b] mb-2" />
                                        <span className="text-sm text-muted-foreground">Height</span>
                                        <span className="font-semibold text-foreground">{profileData.height} cm</span>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center justify-center text-center">
                                        <Scale className="h-5 w-5 text-[#2aac6b] mb-2" />
                                        <span className="text-sm text-muted-foreground">Weight</span>
                                        <span className="font-semibold text-foreground">{profileData.weight} kg</span>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center justify-center text-center capitalize">
                                        <User className="h-5 w-5 text-[#2aac6b] mb-2" />
                                        <span className="text-sm text-muted-foreground">Gender</span>
                                        <span className="font-semibold text-foreground">{profileData.gender}</span>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center justify-center text-center">
                                        <Zap className="h-5 w-5 text-[#2aac6b] mb-2" />
                                        <span className="text-sm text-muted-foreground">Activity</span>
                                        <span className="font-semibold capitalize text-foreground">{profileData.activityLevel.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border shadow-sm bg-card text-card-foreground">
                            <CardHeader>
                                <CardTitle className="flex items-center text-xl">
                                    Nutrition Targets
                                </CardTitle>
                                <CardDescription>Personalized goals based on your profile.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Main Goals */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 border border-border rounded-xl flex items-center space-x-4 bg-card">
                                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                                            <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Daily Calories (TDEE)</p>
                                            <p className="text-2xl font-bold text-foreground">{profileData.tdee} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
                                        </div>
                                    </div>
                                    <div className="p-4 border border-border rounded-xl flex items-center space-x-4 bg-card">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Basal Metabolic Rate</p>
                                            <p className="text-xl font-bold text-foreground">{profileData.bmr} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
                                        </div>
                                    </div>
                                    <div className="p-4 border border-border rounded-xl flex items-center space-x-4 bg-card">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                            {profileData.goal === 'lose_fat' ? <TrendingDown className="h-6 w-6 text-purple-600 dark:text-purple-400" /> :
                                                profileData.goal === 'gain_muscle' ? <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" /> :
                                                    <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Primary Goal</p>
                                            <p className="text-xl font-bold text-foreground capitalize">{profileData.goal.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Macro Breakdown */}
                                <div>
                                    <h3 className="text-sm font-medium text-foreground mb-4 flex items-center">
                                        <Utensils className="h-4 w-4 mr-2" /> Daily Macro Targets
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-red-50 dark:bg-red-950/40 p-3 rounded-lg text-center">
                                            <span className="block text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider">Protein</span>
                                            <span className="block text-xl font-bold text-red-900 dark:text-red-100">{profileData.macros.protein}g</span>
                                        </div>
                                        <div className="bg-yellow-50 dark:bg-yellow-950/40 p-3 rounded-lg text-center">
                                            <span className="block text-xs text-yellow-600 dark:text-yellow-400 font-semibold uppercase tracking-wider">Carbs</span>
                                            <span className="block text-xl font-bold text-yellow-900 dark:text-yellow-100">{profileData.macros.carbs}g</span>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg text-center">
                                            <span className="block text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">Fats</span>
                                            <span className="block text-xl font-bold text-blue-900 dark:text-blue-100">{profileData.macros.fats}g</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Baseline Symptoms */}
                        {profileData.symptoms.length > 0 && (
                            <Card className="border-border shadow-sm bg-card text-card-foreground">
                                <CardHeader>
                                    <CardTitle className=" text-xl flex items-center">
                                        Baseline Symptoms
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.symptoms.map(s => (
                                            <Badge key={s} variant="secondary" className="px-3 py-1 capitalize">
                                                {s}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Nutrition Preferences Card */}
                        <Card className="border-border shadow-sm bg-card text-card-foreground">
                            <CardHeader>
                                <CardTitle className="flex items-center text-xl">
                                    Nutrition Preferences
                                </CardTitle>
                                <CardDescription>Your specific dietary choices.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {profileData.dietaryPreferences && profileData.dietaryPreferences.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.dietaryPreferences.map(prefId => {
                                            const dietName = DIET_OPTIONS.find(d => d.id === prefId)?.name || prefId;
                                            return (
                                                <Badge key={prefId} variant="outline" className="px-3 py-1 bg-[#2aac6b]/10 text-[#2aac6b] border-[#2aac6b]/20">
                                                    {dietName}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No specific dietary preferences set.</p>
                                )}
                            </CardContent>
                        </Card>

                    </>
                )
                }

                {/* Connected Apps */}
                <Card className="border-border shadow-sm bg-card text-card-foreground">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                            Connected Apps
                        </CardTitle>
                        <CardDescription>Manage your integrations with other health platforms.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Fitbit Item */}
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                            <div className="flex items-center space-x-4">
                                {/* Fitbit Logo/Icon placeholder using just text or generic icon */}
                                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold text-sm">
                                    fit
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Fitbit</h3>
                                    <p className="text-sm text-muted-foreground">Syncs steps, weight, and activity.</p>
                                </div>
                            </div>

                            {isLoadingFitbit ? (
                                <div className="h-6 w-10 bg-muted animate-pulse rounded-full" />
                            ) : (
                                <Switch
                                    checked={isFitbitConnected}
                                    onCheckedChange={handleFitbitToggle}
                                    disabled={isTogglingFitbit}
                                    className={isFitbitConnected ? "data-[state=checked]:bg-teal-600" : ""}
                                />
                            )}
                        </div>

                    </CardContent>
                </Card>

                {/* Data & Privacy */}
                <Card className="border-border shadow-sm bg-card text-card-foreground">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                            Data & Privacy
                        </CardTitle>
                        <CardDescription>Manage your personal data and privacy settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                    <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Download My Data</h3>
                                    <p className="text-sm text-muted-foreground">Get a copy of all your stored data (GDPR compliant).</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDataExport}
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <span className="flex items-center">Generating...</span>
                                ) : (
                                    <span className="flex items-center"><Download className="mr-2 h-4 w-4" /> Download JSON</span>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <div className="flex flex-col gap-4 text-center w-full pb-8">
                    <Button variant="outline" className="w-full max-w-xs mx-auto" onClick={() => router.push('/setup')}>
                        Redo Setup Wizard
                    </Button>
                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => router.push('/api/auth/signout')}>
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                </div>
            </main >
        </div >
    );
}
