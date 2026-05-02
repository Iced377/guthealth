'use client';

import LiquidWizardCard from '@/components/setup/LiquidWizardCard';
import { cn } from '@/lib/utils';
import { Dumbbell, ShieldCheck, FileBarChart } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExpertIntroStepProps {
    onNext: () => void;
}

export default function ExpertIntroStep({ onNext }: ExpertIntroStepProps) {
    const features = [
        {
            icon: Dumbbell,
            label: 'Expert Review',
            desc: 'A certified expert reviews your real food habits.',
            gradient: 'from-emerald-400 to-teal-300',
        },
        {
            icon: FileBarChart,
            label: 'Food Reality Report',
            desc: 'A 3-day snapshot of what you actually eat.',
            gradient: 'from-amber-400 to-orange-300',
        },
        {
            icon: ShieldCheck,
            label: 'Your Data, Your Control',
            desc: 'You decide exactly what to share.',
            gradient: 'from-emerald-400 to-teal-300',
        },
    ];

    return (
        <LiquidWizardCard
            title="Expert Support"
            description="Get personalised guidance from a certified expert."
            showSwipeHint={false}
        >
            <div className="flex flex-col gap-3 w-full">
                {features.map((f, i) => {
                    const Icon = f.icon;
                    return (
                        <motion.div
                            key={f.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 * i, duration: 0.4 }}
                            className={cn(
                                "rounded-3xl p-4 border border-transparent bg-white/5 dark:bg-white/5 relative overflow-hidden h-24 flex items-center"
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 opacity-[0.07] bg-gradient-to-r",
                                f.gradient
                            )} />
                            <div className="flex items-center gap-5 relative z-10 w-full">
                                <div className={cn(
                                    "w-12 h-12 rounded-full shrink-0 bg-gradient-to-br shadow-inner flex items-center justify-center",
                                    f.gradient
                                )}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-lg leading-none mb-1">{f.label}</div>
                                    <div className="text-xs text-muted-foreground leading-tight opacity-80 pr-2">{f.desc}</div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* CTA */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={onNext}
                    className="mt-4 w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-base shadow-lg active:scale-[0.97] transition-transform"
                >
                    Get Started
                </motion.button>

                <p className="text-[10px] text-muted-foreground/50 text-center mt-1">
                    Designed by an ISSA Elite Trainer. This is not medical advice.
                </p>
            </div>
        </LiquidWizardCard>
    );
}
