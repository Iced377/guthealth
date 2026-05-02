'use client';

import React, { useEffect, useState } from 'react';
import LiquidWizardCard from '@/components/setup/LiquidWizardCard';
import { cn } from '@/lib/utils';
import { db } from '@/config/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Loader2, ShieldCheck, Eye, Footprints, Utensils, UserCircle, Weight, Target, FileBarChart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ExpertProfile, ExpertConsentVersion, ConsentDataCategory } from '@/types';

interface ConsentStepProps {
    expert: ExpertProfile;
    onConsent: (categories: ConsentDataCategory[], consentVersion: string, consentTextHash: string) => void;
    onBack: () => void;
}

const DATA_CATEGORIES: { id: ConsentDataCategory; label: string; icon: React.ComponentType<{ className?: string }>; desc: string; required?: boolean }[] = [
    { id: 'profile', label: 'Profile', icon: UserCircle, desc: 'Name, age, avatar', required: true },
    { id: 'goal', label: 'Goal', icon: Target, desc: 'Active nutrition goal' },
    { id: 'foodJournal', label: 'Food Journal', icon: Utensils, desc: 'Meal logs & macros', required: true },
    { id: 'weight', label: 'Weight', icon: Weight, desc: 'Weight history' },
    { id: 'steps', label: 'Steps', icon: Footprints, desc: 'Daily step count' },
    { id: 'foodRealityCapture', label: 'Food Reality Capture', icon: Eye, desc: '3-day food snapshot' },
    { id: 'foodRealityReport', label: 'Food Reality Report', icon: FileBarChart, desc: 'Generated insight report' },
];

export default function ConsentStep({ expert, onConsent, onBack }: ConsentStepProps) {
    const [selectedCategories, setSelectedCategories] = useState<Set<ConsentDataCategory>>(
        new Set(['profile', 'foodJournal'])
    );
    const [consentText, setConsentText] = useState('');
    const [consentVersion, setConsentVersion] = useState('');
    const [consentHash, setConsentHash] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchConsentVersion = async () => {
            try {
                const snap = await getDocs(
                    query(collection(db, 'expertConsentVersions'), where('active', '==', true), orderBy('createdAt', 'desc'), limit(1))
                );
                if (!snap.empty) {
                    const doc = snap.docs[0].data() as ExpertConsentVersion;
                    setConsentText(doc.text);
                    setConsentVersion(doc.version);
                    setConsentHash(doc.hash);
                } else {
                    setConsentText('By proceeding, you agree to share the selected data categories with your chosen expert. You can revoke access at any time from your profile settings. Your data remains yours and the expert cannot modify it.');
                    setConsentVersion('1.0.0');
                    setConsentHash('default-v1');
                }
            } catch (e) {
                console.error('Failed to fetch consent version:', e);
                setConsentText('By proceeding, you agree to share the selected data categories with your chosen expert. You can revoke access at any time.');
                setConsentVersion('1.0.0');
                setConsentHash('default-v1');
            } finally {
                setLoading(false);
            }
        };
        fetchConsentVersion();
    }, []);

    const toggleCategory = (id: ConsentDataCategory) => {
        const cat = DATA_CATEGORIES.find(c => c.id === id);
        if (cat?.required) return; // Can't deselect required categories

        setSelectedCategories(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleConsent = () => {
        setSubmitting(true);
        onConsent(Array.from(selectedCategories), consentVersion, consentHash);
    };

    if (loading) {
        return (
            <LiquidWizardCard title="Data Consent" showSwipeHint={false}>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            </LiquidWizardCard>
        );
    }

    return (
        <LiquidWizardCard
            title="Data Sharing"
            description={`Choose what ${expert.displayName} can see.`}
            showSwipeHint={false}
        >
            <div className="flex flex-col gap-2 w-full overflow-y-auto max-h-[340px] pr-1 -mr-1">
                {DATA_CATEGORIES.map((cat, i) => {
                    const isSelected = selectedCategories.has(cat.id);
                    const Icon = cat.icon;
                    return (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * i, duration: 0.3 }}
                            onClick={() => toggleCategory(cat.id)}
                            className={cn(
                                "cursor-pointer rounded-2xl px-3 py-2.5 transition-all duration-200 border flex items-center gap-3",
                                isSelected
                                    ? "border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-500/10"
                                    : "border-transparent bg-white/5 dark:bg-white/5",
                                cat.required ? "opacity-90" : ""
                            )}
                        >
                            {/* Checkbox */}
                            <div className={cn(
                                "w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors duration-200",
                                isSelected
                                    ? "bg-emerald-500 border-emerald-500"
                                    : "border-zinc-500/40 bg-transparent"
                            )}>
                                {isSelected && (
                                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>

                            <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />

                            <div className="text-left min-w-0 flex-1">
                                <div className="text-sm font-semibold leading-tight flex items-center gap-1.5">
                                    {cat.label}
                                    {cat.required && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">Required</span>}
                                </div>
                                <div className="text-[11px] text-muted-foreground/70 leading-tight">{cat.desc}</div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Consent Text */}
            <div className="mt-3 p-3 rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10">
                <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground/70 leading-snug">{consentText}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex flex-col gap-2 w-full">
                <button
                    onClick={handleConsent}
                    disabled={submitting || selectedCategories.size === 0}
                    className={cn(
                        "w-full py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all",
                        submitting
                            ? "bg-emerald-500/50 text-white/70"
                            : "bg-emerald-500 text-white active:scale-[0.97]"
                    )}
                >
                    {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                        `Share with ${expert.displayName}`
                    )}
                </button>
                <button
                    onClick={onBack}
                    className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                    Choose a different expert
                </button>
            </div>
        </LiquidWizardCard>
    );
}
