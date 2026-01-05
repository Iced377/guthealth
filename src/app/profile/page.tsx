
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
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/shared/Navbar';
import { Calendar, Save, ArrowLeft, Activity, User, LogOut } from 'lucide-react';

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [dob, setDob] = useState('');
    const [isSavingDob, setIsSavingDob] = useState(false);

    const [isFitbitConnected, setIsFitbitConnected] = useState(false);
    const [isLoadingFitbit, setIsLoadingFitbit] = useState(true);
    const [isTogglingFitbit, setIsTogglingFitbit] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/'); // Redirect to landing if not logged in
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Fetch Profile Data (DOB)
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setDob(userDoc.data().dateOfBirth || '');
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
            // Revert state if failed (though switch usually handles this slightly differently, manual reversion is safer)
            // But since we didn't update state eagerly for 'checked', we are fine.
        } finally {
            setIsTogglingFitbit(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 py-8 pt-24 space-y-8">
                <div className="flex items-center space-x-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">User Center</h1>
                </div>

                {/* Personal Information */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                            <User className="mr-2 h-5 w-5 text-indigo-600" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>Manage your personal details for better health insights.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type="date"
                                        id="dob"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        className="pl-10"
                                    />
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                </div>
                                <Button
                                    onClick={handleSaveDob}
                                    disabled={isSavingDob}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {isSavingDob ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">Used to calculate age-related health metrics.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Connected Apps */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                            <Activity className="mr-2 h-5 w-5 text-indigo-600" />
                            Connected Apps
                        </CardTitle>
                        <CardDescription>Manage your integrations with other health platforms.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Fitbit Item */}
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                            <div className="flex items-center space-x-4">
                                {/* Fitbit Logo/Icon placeholder using just text or generic icon */}
                                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                                    fit
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Fitbit</h3>
                                    <p className="text-sm text-gray-500">Syncs steps, weight, and activity.</p>
                                </div>
                            </div>

                            {isLoadingFitbit ? (
                                <div className="h-6 w-10 bg-gray-200 animate-pulse rounded-full" />
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

            </main>
        </div>
    );
}
