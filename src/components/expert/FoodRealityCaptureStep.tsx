'use client';

import React from 'react';
import LiquidWizardCard from '@/components/setup/LiquidWizardCard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CalendarDays, Utensils, RotateCcw } from 'lucide-react';
import type { ExpertProfile } from '@/types';

interface FoodRealityCaptureStepProps {
    expert: ExpertProfile;
    onSourceSelect: (source: 'recent_logs' | 'fresh_capture') => void;
}

export default function FoodRealityCaptureStep({ expert, onSourceSelect }: FoodRealityCaptureStepProps) {
    const options = [
        {
            id: 'recent_logs' as const,
            icon: RotateCcw,
            label: 'Use Recent Logs',
            desc: 'Automatically use your last 3 days of logged meals. Fastest option.',
            gradient: 'from-emerald-400 to-teal-300',
        },
        {
            id: 'fresh_capture' as const,
            icon: CalendarDays,
            label: 'Start Fresh',
            desc: 'Log your meals over the next 3 days for a clean snapshot.',
            gradient: 'from-emerald-400 to-teal-300',
        },
    ];

    return (
        <LiquidWizardCard
            title="Food Reality Capture"
            description="How would you like to build your 3-day food snapshot?"
            showSwipeHint={false}
        >
            <div className="flex flex-col gap-3 w-full">
                {options.map((opt, i) => {
                    const Icon = opt.icon;
                    return (
                        <motion.div
                            key={opt.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 * i, duration: 0.35 }}
                            onClick={() => onSourceSelect(opt.id)}
                            className={cn(
                                "cursor-pointer rounded-3xl p-5 transition-all duration-300 border border-transparent bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 relative overflow-hidden group active:scale-[0.97]"
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 opacity-0 transition-opacity duration-500 bg-gradient-to-r group-hover:opacity-[0.07]",
                                opt.gradient
                            )} />
                            <div className="flex items-center gap-5 relative z-10 w-full">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl shrink-0 bg-gradient-to-br shadow-inner flex items-center justify-center",
                                    opt.gradient
                                )}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-bold text-lg leading-tight mb-1">{opt.label}</div>
                                    <div className="text-xs text-muted-foreground leading-snug opacity-80">{opt.desc}</div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Expert card */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-2 flex items-center gap-3 p-3 rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10"
                >
                    {expert.profilePictureUrl ? (
                        <img src={expert.profilePictureUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                            {expert.displayName.charAt(0)}
                        </div>
                    )}
                    <div className="text-left min-w-0">
                        <p className="text-xs font-semibold truncate">{expert.displayName}</p>
                        <p className="text-[10px] text-muted-foreground/60">Will review your food reality report</p>
                    </div>
                </motion.div>
            </div>
        </LiquidWizardCard>
    );
}
