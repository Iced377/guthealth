'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, MessageSquare, ArrowRight, ShieldCheck, BarChart3 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
    const { user, loading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkLoading, setCheckLoading] = useState(true);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            setCheckLoading(false);
            return;
        }

        const checkKey = async () => {
            try {
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (snap.exists() && snap.data().isAdmin) {
                    setIsAdmin(true);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setCheckLoading(false);
            }
        };
        checkKey();
    }, [user, loading]);

    if (loading || checkLoading) return null;

    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                    <ShieldCheck className="w-16 h-16 text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
                    <p className="text-muted-foreground mb-4">Please log in with an administrator account.</p>
                    <Button asChild><Link href="/login">Login</Link></Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="container mx-auto py-12 px-4 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage your app, users, and feedback.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Acquisition Card (Refactored from CRM) */}
                    <Link href="/admin/acquisition" className="block group">
                        <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                            <CardHeader>
                                <div className="mb-2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <CardTitle>Acquisition</CardTitle>
                                <CardDescription>View user growth and onboarding trends.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <span className="text-sm font-medium text-primary flex items-center">
                                    View Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Feedback Card */}
                    <Link href="/admin/feedback" className="block group">
                        <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                            <CardHeader>
                                <div className="mb-2 w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <CardTitle>Feedback</CardTitle>
                                <CardDescription>Review bug reports, feature requests, and user ratings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <span className="text-sm font-medium text-orange-600 flex items-center">
                                    View Submissions <ArrowRight className="ml-2 w-4 h-4" />
                                </span>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}
