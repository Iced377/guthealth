'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, Flame, Droplet, Wheat, Dumbbell, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

import LiquidWizardCard from '../LiquidWizardCard';

interface ResultsStepProps {
    results: {
        bmr: number;
        tdee: number;
        macros: {
            protein: number;
            carbs: number;
            fats: number;
        };
    };
    onBack?: () => void;
    onFinish: () => void;
    isSaving: boolean;
}

export default function ResultsStep({ results, onFinish, isSaving }: ResultsStepProps) {
    const { isDarkMode } = useTheme();

    const totalMacros = results.macros.protein + results.macros.carbs + results.macros.fats;
    const pCal = results.macros.protein * 4;
    const cCal = results.macros.carbs * 4;
    const fCal = results.macros.fats * 9;
    const totalCal = pCal + cCal + fCal;

    const pPct = totalCal > 0 ? Math.round((pCal / totalCal) * 100) : 0;
    const cPct = totalCal > 0 ? Math.round((cCal / totalCal) * 100) : 0;
    const fPct = totalCal > 0 ? Math.round((fCal / totalCal) * 100) : 0;

    // Calculate rotation to center Protein (Blue) at the top (0deg is 12 o'clock)
    // Blue spans 0 to pPct. Center is pPct/2.
    // We want that center to be at 0deg. So rotate back by pPct/2.
    // 1% = 3.6deg.
    const rotation = -((pPct / 2) * 3.6);

    return (
        <LiquidWizardCard
            // Custom header manually implemented below for layout control
            title={undefined}
            description={undefined}
            icon={undefined}
            showSwipeHint={false}
            className="bg-white/30 dark:bg-black/30 backdrop-blur-xl border-white/20"
        >
            {/* Custom Inline Header */}
            <div className="w-full flex flex-col items-start px-4 mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-10 h-10 text-green-500 drop-shadow-sm" />
                    <h2 className="text-[3.2rem] font-black font-headline tracking-tighter leading-none drop-shadow-sm">Your Plan</h2>
                </div>
                <p className="text-base text-muted-foreground leading-snug opacity-80 font-medium pl-1 mt-1">
                    Your personalized daily roadmap.
                </p>
            </div>

            <div className="w-full flex-1 flex flex-col justify-center items-center relative z-10 py-4">

                {/* Liquid Glass Ring Chart Area */}
                <div className="relative w-full flex items-center justify-center">

                    {/* The Ring Container - Slightly larger for impact */}
                    <div className="relative w-72 h-72 z-10 flex items-center justify-center">
                        {/* 1. Underlying Glow */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 0.6, scale: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl"
                        />

                        {/* 2. The Conic Gradient Ring */}
                        <motion.div
                            initial={{ rotate: -180, scale: 0, opacity: 0 }}
                            animate={{ rotate: 0, scale: 1, opacity: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 60,
                                damping: 15,
                                mass: 1,
                                delay: 0.1
                            }}
                            className="w-full h-full rounded-full relative"
                            style={{
                                background: `conic-gradient(
                                    #ef4444 0% ${pPct}%, 
                                    #3b82f6 ${pPct}% ${pPct + fPct}%,
                                    #f59e0b ${pPct + fPct}% 100%
                                )`,
                                maskImage: 'radial-gradient(transparent 62%, black 64%)',
                                WebkitMaskImage: 'radial-gradient(transparent 62%, black 64%)'
                            }}
                        />

                        {/* 3. Glass Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="absolute inset-0 rounded-full border border-white/20 shadow-[inset_0_4px_30px_rgba(255,255,255,0.4),0_10px_40px_rgba(0,0,0,0.3)] pointer-events-none ring-1 ring-white/5"
                        />

                        {/* 4. Center Content: DAILY TARGET */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                            className="absolute inset-[20%] rounded-full bg-white/5 backdrop-blur-xl shadow-inner border border-white/10 flex flex-col items-center justify-center"
                        >
                            <h3 className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold mb-1 opacity-80">Daily Target</h3>
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-[3.5rem] font-black tracking-tighter text-foreground drop-shadow-md">{results.tdee}</span>
                                <span className="text-sm font-bold text-muted-foreground mt-1">kcal</span>
                            </div>
                        </motion.div>

                        {/* Floating Labels (Exaggerated pop-in) */}
                        {/* Protein (Red) - Top */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.6, type: "spring", stiffness: 120 }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center w-32 z-20"
                        >
                            <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 px-4 py-1.5 rounded-full flex items-center gap-2 mb-2 shadow-lg shadow-red-500/10 hover:scale-105 transition-transform">
                                <Dumbbell className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Protein</span>
                            </div>
                            <div className="flex flex-col items-center -space-y-1">
                                <span className="text-2xl font-black text-foreground">{results.macros.protein}g</span>
                                <span className="text-xs text-muted-foreground font-bold">{pPct}%</span>
                            </div>
                        </motion.div>

                        {/* Fat (Blue) - Bottom Left */}
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: 0.7, type: "spring", stiffness: 120 }}
                            className="absolute -bottom-8 -left-8 flex flex-col items-center w-28 z-20"
                        >
                            <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 px-4 py-1.5 rounded-full flex items-center gap-2 mb-2 shadow-lg shadow-blue-500/10 hover:scale-105 transition-transform">
                                <Droplet className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Fat</span>
                            </div>
                            <div className="flex flex-col items-center -space-y-1">
                                <span className="text-xl font-black text-foreground">{results.macros.fats}g</span>
                                <span className="text-xs text-muted-foreground font-bold">{fPct}%</span>
                            </div>
                        </motion.div>

                        {/* Carbs (Amber) - Bottom Right */}
                        <motion.div
                            initial={{ opacity: 0, x: -20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: 0.8, type: "spring", stiffness: 120 }}
                            className="absolute -bottom-8 -right-8 flex flex-col items-center w-28 z-20"
                        >
                            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 px-4 py-1.5 rounded-full flex items-center gap-2 mb-2 shadow-lg shadow-amber-500/10 hover:scale-105 transition-transform">
                                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Carbs</span>
                                <Wheat className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <div className="flex flex-col items-center -space-y-1">
                                <span className="text-xl font-black text-foreground">{results.macros.carbs}g</span>
                                <span className="text-xs text-muted-foreground font-bold">{cPct}%</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

            </div>

            {/* Footer Button - Fixed at bottom */}
            <div className="pt-2 shrink-0 w-full px-2 mt-4 relative z-30">
                <Button
                    className="w-full h-14 rounded-full text-lg font-bold shadow-xl bg-foreground text-background hover:bg-foreground/90 transition-transform active:scale-95"
                    onClick={onFinish}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>Saving...</>
                    ) : (
                        <>Start My Journey <ArrowRight className="ml-2 w-5 h-5" /></>
                    )}
                </Button>
            </div>
        </LiquidWizardCard>
    );
}
