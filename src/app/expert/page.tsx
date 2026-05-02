'use client';

import React, { useEffect, useState } from 'react';
import ExpertWizard from '@/components/expert/ExpertWizard';
import ExpertDashboard from '@/components/expert/ExpertDashboard';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ExpertClientRelationship, ExpertProfile } from '@/types';

type WizardOverride = {
    active: boolean;
    step: 'intro' | 'select' | 'consent' | 'capture' | 'confirmation';
    expert: ExpertProfile | null;
};

export default function ExpertPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    const [checking, setChecking] = useState(true);
    const [assignedExpert, setAssignedExpert] = useState<ExpertProfile | null>(null);
    const [relationship, setRelationship] = useState<ExpertClientRelationship | null>(null);
    
    // Override to show wizard even if expert is assigned (for "Switch" or "Rerun")
    const [wizardOverride, setWizardOverride] = useState<WizardOverride>({
        active: false,
        step: 'intro',
        expert: null
    });

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const checkExpert = async () => {
            try {
                // Query active relationships for this user
                const q = query(
                    collection(db, 'expertClientRelationships'),
                    where('clientUserId', '==', user.uid),
                    where('status', '==', 'active'),
                    limit(1)
                );
                const snap = await getDocs(q);
                
                if (!snap.empty) {
                    const relData = snap.docs[0].data() as ExpertClientRelationship;
                    // Convert Firestore Timestamps to Dates for the dashboard UI
                    const formattedRel = {
                        ...relData,
                        createdAt: (relData.createdAt as any).toDate ? (relData.createdAt as any).toDate() : relData.createdAt
                    } as ExpertClientRelationship;
                    
                    setRelationship(formattedRel);
                    
                    // Fetch expert profile
                    const expertSnap = await getDocs(
                        query(collection(db, 'expertProfiles'), where('id', '==', relData.expertId), limit(1))
                    );
                    if (!expertSnap.empty) {
                        setAssignedExpert(expertSnap.docs[0].data() as ExpertProfile);
                    }
                }
            } catch (e) {
                console.error("Error checking expert:", e);
            } finally {
                setChecking(false);
            }
        };

        checkExpert();
    }, [user, loading, router]);

    if (loading || checking || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    // If we have an override (user clicked Switch/Rerun), show the wizard
    if (wizardOverride.active) {
        return (
            <ExpertWizard 
                initialStep={wizardOverride.step} 
                initialExpert={wizardOverride.expert} 
            />
        );
    }

    // If assigned, show dashboard
    if (assignedExpert && relationship) {
        return (
            <ExpertDashboard 
                expert={assignedExpert} 
                relationship={relationship} 
                onSwitchExpert={() => setWizardOverride({ active: true, step: 'select', expert: null })}
                onRerunQuestionnaire={() => setWizardOverride({ active: true, step: 'intro', expert: assignedExpert })}
            />
        );
    }

    // Default: Show onboarding wizard
    return <ExpertWizard />;
}
