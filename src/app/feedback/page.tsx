'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FEEDBACK_ENABLED } from '@/lib/featureFlags';
import FeedbackEntrySheet from '@/components/feedback/FeedbackEntrySheet';
import FeedbackJourney from '@/components/feedback/FeedbackJourney';
import { FeedbackMotionControllerProvider } from '@/components/feedback/useFeedbackMotionController';
import { useTheme } from '@/contexts/ThemeContext';
import FeedbackComposeOverlay from '@/components/feedback/FeedbackComposeOverlay';
import { useFeedbackSubmission } from '@/hooks/useFeedbackSubmission';
import { useToast } from '@/hooks/use-toast';

type FeedbackView = 'entry' | 'journey' | 'bug' | 'feature';

export default function FeedbackPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [currentView, setCurrentView] = useState<FeedbackView>('entry');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const { isDarkMode } = useTheme(); // can be used for theming if needed

    // Submission Hook
    const { submitBug, submitFeature } = useFeedbackSubmission();

    // Feature Flag Guard
    useEffect(() => {
        if (!FEEDBACK_ENABLED) {
            router.replace('/');
            return;
        }
        // Open sheet on mount if view is entry
        if (currentView === 'entry') {
            setIsSheetOpen(true);
        }
    }, [router, currentView]);

    const handleSheetClose = () => {
        setIsSheetOpen(false);
        // Only navigate back if we are still in entry mode and user dismissed it
        if (currentView === 'entry') {
            setTimeout(() => {
                router.back();
            }, 300);
        }
    };

    const handleOptionSelect = (option: 'improve' | 'bug' | 'feature') => {
        setIsSheetOpen(false);
        setTimeout(() => {
            setCurrentView(option === 'improve' ? 'journey' : option);
        }, 200);
    };

    // Close overlay triggers back navigation (exit feedback mode)
    const handleOverlayClose = () => {
        setCurrentView('entry'); // Reset potentially
        router.back();
    };

    const handleBugSubmit = async (text: string) => {
        const success = await submitBug(text, true);
        if (success) {
            toast({ title: "Bug reported", description: "Thanks for keeping us in the loop." });
        }
    };

    const handleFeatureSubmit = async (text: string) => {
        const success = await submitFeature(text, true);
        if (success) {
            toast({ title: "Feature suggested", description: "We love hearing your ideas." });
        }
    };

    if (!FEEDBACK_ENABLED) return null;

    return (
        <FeedbackMotionControllerProvider>
            <div className="min-h-screen w-full relative overflow-hidden bg-background">
                {/* Background Gradient Mesh (Fixed) */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-30 fixed">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[100px] animate-pulse-slow" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
                </div>

                <div className="absolute inset-0 z-0 pointer-events-none opacity-20 fixed">
                    <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[80px]" />
                </div>

                {/* Content: Journey */}
                {currentView === 'journey' && <FeedbackJourney />}

                {/* Overlays: Bug & Feature */}
                <FeedbackComposeOverlay
                    isOpen={currentView === 'bug'}
                    onClose={handleOverlayClose}
                    onSubmit={handleBugSubmit}
                    title="Report a bug"
                    placeholder="Describe what happened..."
                />

                <FeedbackComposeOverlay
                    isOpen={currentView === 'feature'}
                    onClose={handleOverlayClose}
                    onSubmit={handleFeatureSubmit}
                    title="Suggest a feature"
                    placeholder="I wish GutCheck could..."
                />

                {/* Entry Sheet */}
                <FeedbackEntrySheet
                    isOpen={isSheetOpen}
                    onClose={handleSheetClose}
                    onOptionSelect={handleOptionSelect}
                />
            </div>
        </FeedbackMotionControllerProvider>
    );
}
