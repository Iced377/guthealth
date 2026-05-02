'use client';

import React from 'react';
import LiquidWizardCard from '@/components/setup/LiquidWizardCard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CheckCircle2, Dumbbell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ExpertProfile } from '@/types';

interface ExpertConfirmationStepProps {
    expert: ExpertProfile;
    source: 'recent_logs' | 'fresh_capture';
}

export default function ExpertConfirmationStep({ expert, source }: ExpertConfirmationStepProps) {
    const router = useRouter();

    return (
        <LiquidWizardCard
            showSwipeHint={false}
        >
            <div className="flex flex-col items-center justify-center gap-6 w-full text-center">
                {/* Success animation */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg"
                >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <h2 className="text-2xl font-black mb-2">You're All Set</h2>
                    <p className="text-sm text-muted-foreground leading-snug max-w-[280px] mx-auto">
                        {source === 'recent_logs'
                            ? `Your recent meal logs are being prepared for ${expert.displayName} to review.`
                            : `Start logging your meals over the next 3 days. ${expert.displayName} will be notified when your capture is ready.`
                        }
                    </p>
                </motion.div>

                {/* Expert chip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10"
                >
                    {expert.profilePictureUrl ? (
                        <img src={expert.profilePictureUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                            {expert.displayName.charAt(0)}
                        </div>
                    )}
                    <div className="text-left">
                        <p className="text-sm font-bold">{expert.displayName}</p>
                        <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" /> Connected
                        </p>
                    </div>
                </motion.div>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={() => router.push('/')}
                    className="mt-2 w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-base shadow-lg active:scale-[0.97] transition-transform"
                >
                    Back to Home
                </motion.button>
            </div>
        </LiquidWizardCard>
    );
}
