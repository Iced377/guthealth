'use client';

import React, { useEffect, useState } from 'react';
import LiquidWizardCard from '@/components/setup/LiquidWizardCard';
import { cn } from '@/lib/utils';
import { db } from '@/config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ExpertProfile } from '@/types';

interface ExpertSelectionStepProps {
    onSelect: (expert: ExpertProfile) => void;
}

export default function ExpertSelectionStep({ onSelect }: ExpertSelectionStepProps) {
    const [experts, setExperts] = useState<ExpertProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchExperts = async () => {
            try {
                const snap = await getDocs(
                    query(collection(db, 'expertProfiles'), where('active', '==', true))
                );
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ExpertProfile));
                setExperts(data);
            } catch (e) {
                console.error('Failed to fetch experts:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchExperts();
    }, []);

    const handleSelect = (expert: ExpertProfile) => {
        setSelectedId(expert.id);
        setTimeout(() => onSelect(expert), 350);
    };

    if (loading) {
        return (
            <LiquidWizardCard title="Choose Expert" showSwipeHint={false}>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            </LiquidWizardCard>
        );
    }

    if (experts.length === 0) {
        return (
            <LiquidWizardCard title="Choose Expert" showSwipeHint={false}>
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                    <p className="text-muted-foreground">No experts are available right now.</p>
                    <p className="text-xs text-muted-foreground/60">Check back later or contact support.</p>
                </div>
            </LiquidWizardCard>
        );
    }

    return (
        <LiquidWizardCard
            title="Choose Expert"
            description="Select an expert to work with."
            showSwipeHint={false}
        >
            <div className="flex flex-col gap-3 w-full">
                {experts.map((expert, i) => {
                    const isSelected = selectedId === expert.id;
                    return (
                        <motion.div
                            key={expert.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.35 }}
                            onClick={() => handleSelect(expert)}
                            className={cn(
                                "cursor-pointer rounded-3xl p-4 transition-all duration-300 border relative overflow-hidden group flex items-center gap-4",
                                isSelected
                                    ? "border-emerald-500/30 bg-white/10 dark:bg-white/5 shadow-lg scale-[1.02]"
                                    : "border-transparent bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10"
                            )}
                        >
                            {/* Gradient accent */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 transition-opacity duration-500 bg-gradient-to-r from-emerald-400 to-teal-300",
                                isSelected ? "opacity-10" : "group-hover:opacity-5"
                            )} />

                            {/* Avatar */}
                            <div className="relative z-10 shrink-0">
                                {expert.profilePictureUrl ? (
                                    <img
                                        src={expert.profilePictureUrl}
                                        alt={expert.displayName}
                                        className={cn(
                                            "w-14 h-14 rounded-full object-cover transition-transform duration-300",
                                            isSelected ? "ring-2 ring-emerald-400/50 scale-105" : ""
                                        )}
                                    />
                                ) : (
                                    <div className={cn(
                                        "w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl transition-transform duration-300",
                                        isSelected ? "ring-2 ring-emerald-400/50 scale-105" : ""
                                    )}>
                                        {expert.displayName.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="relative z-10 text-left min-w-0 flex-1">
                                <div className="font-bold text-base leading-tight truncate">{expert.displayName}</div>
                                <div className="text-xs text-muted-foreground leading-tight opacity-80 mt-0.5 line-clamp-2">{expert.headline}</div>
                                {expert.specialityTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {expert.specialityTags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </LiquidWizardCard>
    );
}
