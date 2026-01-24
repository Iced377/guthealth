'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { WALKTHROUGH_TOPICS, WalkthroughTopic, WalkthroughStep } from '@/components/walkthrough/WalkthroughTopics';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/config/firebase'; // Adjust path if necessary
import { useRouter, usePathname } from 'next/navigation';

interface WalkthroughContextType {
    activeTopic: WalkthroughTopic | null;
    currentStepIndex: number;
    currentStep: WalkthroughStep | null;
    isWalkthroughActive: boolean;
    startTopic: (topicId: string) => void;
    startWalkthrough: (topicId: string) => void;
    nextStep: () => void;
    prevStep: () => void;
    endWalkthrough: () => void;
    dismissWalkthrough: () => void; // Permanently dismiss
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
    const { user, userProfile } = useAuth();
    const [activeTopic, setActiveTopic] = useState<WalkthroughTopic | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [pendingTopicId, setPendingTopicId] = useState<string | null>(null);

    const [localHasSeenIntro, setLocalHasSeenIntro] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    const startTopic = (topicId: string) => {
        const topic = WALKTHROUGH_TOPICS[topicId];
        if (topic) {
            if (pathname !== '/') {
                setPendingTopicId(topicId);
                router.push('/');
            } else {
                // Already on dashboard, start immediately
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setActiveTopic(topic);
                setCurrentStepIndex(0);
            }
        }
    };

    // Handle Pending Topic (after redirect)
    useEffect(() => {
        if (pendingTopicId && pathname === '/') {
            const topic = WALKTHROUGH_TOPICS[pendingTopicId];
            if (topic) {
                // Slight delay to ensure layout is ready
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setActiveTopic(topic);
                    setCurrentStepIndex(0);
                    setPendingTopicId(null);
                }, 500);
            }
        }
    }, [pathname, pendingTopicId]);

    const startWalkthrough = startTopic;

    const nextStep = () => {
        if (activeTopic && currentStepIndex < activeTopic.steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        } else {
            endWalkthrough();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    const endWalkthrough = async () => {
        if (!activeTopic || !user) {
            setActiveTopic(null);
            setPendingTopicId(null);
            return;
        }

        // Optimistic update to prevent re-trigger loop
        setLocalHasSeenIntro(true);

        // Save progress to Firebase
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                'profile.walkthroughStatus.completedTopics': arrayUnion(activeTopic.id),
                'profile.walkthroughStatus.hasSeenIntro': true, // Assume if they finish any topic (or specifically welcome)
            });
            // OPTIONAL: Update local userProfile if useAuth doesn't auto-update (it usually listens to snapshots)
        } catch (error) {
            console.error("Failed to save walkthrough progress:", error);
        }

        setActiveTopic(null);
        setCurrentStepIndex(0);
    };

    const dismissWalkthrough = async () => {
        // Optimistic update
        setLocalHasSeenIntro(true);
        if (user) {
            try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    'profile.walkthroughStatus.isDismissed': true,
                });
            } catch (error) {
                console.error("Failed to dismiss walkthrough:", error);
            }
        }
        setActiveTopic(null);
    };

    // Initial Check (e.g., automatically start welcome)
    useEffect(() => {
        // Prevent auto-start if tour is already active or pending
        if (activeTopic || pendingTopicId) return;

        // Combine remote profile state with local optimistic state
        const hasSeenIntro = (userProfile?.profile?.walkthroughStatus?.hasSeenIntro) || localHasSeenIntro;
        const isDismissed = (userProfile?.profile?.walkthroughStatus?.isDismissed) || localHasSeenIntro;

        if (userProfile && !hasSeenIntro && !isDismissed) {
            // Only trigger if they have completed setup
            if (userProfile.profile?.hasCompletedSetup) {
                // Ensure we are on dashboard before auto-starting
                if (pathname === '/') {
                    // Delay slightly to ensure UI is ready
                    const timer = setTimeout(() => {
                        // Double check inside timeout to be safe
                        if (!localHasSeenIntro) {
                            startTopic('welcome');
                        }
                    }, 1000);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [userProfile, pathname, activeTopic, pendingTopicId, localHasSeenIntro]);


    const currentStep = activeTopic ? activeTopic.steps[currentStepIndex] : null;

    return (
        <WalkthroughContext.Provider value={{
            activeTopic,
            currentStepIndex,
            currentStep,
            isWalkthroughActive: !!activeTopic,
            startTopic,
            startWalkthrough,
            nextStep,
            prevStep,
            endWalkthrough,
            dismissWalkthrough
        }}>
            {children}
        </WalkthroughContext.Provider>
    );
}

export const useWalkthrough = () => {
    const context = useContext(WalkthroughContext);
    if (context === undefined) {
        throw new Error('useWalkthrough must be used within a WalkthroughProvider');
    }
    return context;
};
