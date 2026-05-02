'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { doc, setDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { format, subDays } from 'date-fns';

import ExpertIntroStep from './ExpertIntroStep';
import ExpertSelectionStep from './ExpertSelectionStep';
import ConsentStep from './ConsentStep';
import FoodRealityCaptureStep from './FoodRealityCaptureStep';
import ExpertConfirmationStep from './ExpertConfirmationStep';

import type { ExpertProfile, ConsentDataCategory, ExpertClientRelationship, ExpertConsentAuditEvent, FoodRealityCapture } from '@/types';

type WizardStep = 'intro' | 'select' | 'consent' | 'capture' | 'confirmation';

interface ExpertWizardProps {
    initialStep?: WizardStep;
    initialExpert?: ExpertProfile | null;
}

export default function ExpertWizard({ initialStep = 'intro', initialExpert = null }: ExpertWizardProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { isDarkMode } = useTheme();

    const [step, setStep] = useState<WizardStep>(initialStep);
    const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(initialExpert);
    const [captureSource, setCaptureSource] = useState<'recent_logs' | 'fresh_capture'>('recent_logs');

    // --- Handlers ---

    const handleExpertSelected = (expert: ExpertProfile) => {
        setSelectedExpert(expert);
        setStep('consent');
    };

    const handleConsent = async (categories: ConsentDataCategory[], consentVersion: string, consentTextHash: string) => {
        if (!user || !selectedExpert) return;

        try {
            const relId = `${selectedExpert.id}_${user.uid}`;
            const now = Timestamp.now();

            // 1. Create or update the relationship document
            const relationship: Omit<ExpertClientRelationship, 'id'> = {
                expertId: selectedExpert.id,
                clientUserId: user.uid,
                status: 'active',
                consentStatus: 'granted',
                consentedDataCategories: categories,
                consentVersion,
                consentTextHash,
                consentedAt: now,
                createdAt: now,
                updatedAt: now,
            };
            await setDoc(doc(db, 'expertClientRelationships', relId), { id: relId, ...relationship }, { merge: true });

            // 2. Create audit event (append-only)
            const auditEvent: Omit<ExpertConsentAuditEvent, 'id'> = {
                relationshipId: relId,
                clientUserId: user.uid,
                expertId: selectedExpert.id,
                eventType: 'granted',
                dataCategories: categories,
                consentVersion,
                timestamp: now,
            };
            await addDoc(collection(db, 'expertConsentAuditEvents'), auditEvent);

            setStep('capture');
        } catch (e) {
            console.error('Failed to save consent:', e);
            toast({ title: 'Something went wrong', description: 'Could not save consent. Please try again.', variant: 'destructive' });
        }
    };

    const handleCaptureSource = async (source: 'recent_logs' | 'fresh_capture') => {
        if (!user || !selectedExpert) return;
        setCaptureSource(source);

        try {
            const now = Timestamp.now();
            const today = format(new Date(), 'yyyy-MM-dd');
            const startDate = source === 'recent_logs'
                ? format(subDays(new Date(), 2), 'yyyy-MM-dd')
                : today;
            const endDate = source === 'recent_logs'
                ? today
                : format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

            const selectedDates = [];
            const start = new Date(startDate);
            for (let i = 0; i < 3; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                selectedDates.push(format(d, 'yyyy-MM-dd'));
            }

            const capture: Omit<FoodRealityCapture, 'id'> = {
                userId: user.uid,
                expertId: selectedExpert.id,
                relationshipId: `${selectedExpert.id}_${user.uid}`,
                status: source === 'recent_logs' ? 'completed' : 'active',
                source,
                startDate,
                endDate,
                selectedDates,
                focusAreas: [],
                createdAt: now,
                updatedAt: now,
                sharedWithExpert: true,
            };

            if (source === 'recent_logs') {
                capture.completedAt = now;
            }

            await addDoc(collection(db, 'foodRealityCaptures'), capture);
            setStep('confirmation');
        } catch (e) {
            console.error('Failed to create capture:', e);
            toast({ title: 'Something went wrong', description: 'Could not start capture. Please try again.', variant: 'destructive' });
        }
    };

    return (
        <div className="fixed inset-0 min-h-screen flex flex-col items-center justify-center overflow-hidden">
            {/* Background */}
            <div className={cn(
                "absolute inset-0 transition-colors duration-700",
                isDarkMode
                    ? "bg-[#0a0a0a]"
                    : "bg-gradient-to-br from-emerald-50/80 to-teal-50/80"
            )} />

            {/* Content */}
            <div className="relative z-30 w-full h-full flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {step === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.35 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <ExpertIntroStep onNext={() => setStep(selectedExpert ? 'consent' : 'select')} />
                        </motion.div>
                    )}

                    {step === 'select' && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.35 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <ExpertSelectionStep onSelect={handleExpertSelected} />
                        </motion.div>
                    )}

                    {step === 'consent' && selectedExpert && (
                        <motion.div
                            key="consent"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.35 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <ConsentStep
                                expert={selectedExpert}
                                onConsent={handleConsent}
                                onBack={() => setStep('select')}
                            />
                        </motion.div>
                    )}

                    {step === 'capture' && selectedExpert && (
                        <motion.div
                            key="capture"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.35 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <FoodRealityCaptureStep
                                expert={selectedExpert}
                                onSourceSelect={handleCaptureSource}
                            />
                        </motion.div>
                    )}

                    {step === 'confirmation' && selectedExpert && (
                        <motion.div
                            key="confirmation"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <ExpertConfirmationStep
                                expert={selectedExpert}
                                source={captureSource}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
