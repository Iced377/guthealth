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

    // Animation for macro bars
    const barVariants = {
        hidden: { width: 0 },
        visible: (custom: number) => ({
            width: `${custom}%`,
            transition: { duration: 1, delay: 0.2 }
        })
    };

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
            <div className="w-full flex flex-col items-start px-4 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-10 h-10 text-green-500 drop-shadow-sm" />
                    <h2 className="text-[3.2rem] font-black font-headline tracking-tighter leading-none drop-shadow-sm">Your Plan</h2>
                </div>
                <p className="text-base text-muted-foreground leading-snug opacity-80 font-medium pl-1 mt-1">
                    Your personalized daily roadmap.
                </p>
            </div>

            <div className="w-full flex-1 flex flex-col justify-between h-full space-y-2 pt-0 relative z-10">

                {/* Engraved 3D Highlight Card - Fully Transparent */}
                <div className={cn(
                    "mx-2 text-center py-6 rounded-[2.5rem] shrink-0 relative overflow-hidden transition-all duration-300",
                    isDarkMode
                        ? "bg-transparent shadow-[inset_0_4px_8px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.05)] border-b border-white/5"
                        : "bg-transparent shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_1px_0_rgba(255,255,255,0.5)] border-b border-white/20"
                )}>
                    {/* Inner Glow */}
                    <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.01)] rounded-[2.5rem] pointer-events-none" />

                    <h3 className="text-muted-foreground uppercase tracking-widest text-[11px] font-bold mb-1 relative z-10 opacity-70">Daily Target</h3>
                    <div className="text-[3.5rem] font-black flex items-baseline justify-center gap-1 text-foreground relative z-10 tracking-tighter leading-none filter drop-shadow-sm">
                        {results.tdee}
                        <span className="text-sm text-muted-foreground font-bold mb-2">kcal</span>
                    </div>
                </div>

                {/* Triangular Macro Chart Area */}
                <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center relative py-2">
                    {/* The Triangle */}
                    <div className="relative w-40 h-40 filter drop-shadow-lg z-10">
                        {/* Conic Gradient for Percents, masked to Triangle */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                            className="w-full h-full"
                            style={{
                                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                                background: `conic-gradient(from ${rotation}deg at 50% 67%, 
                                    #3b82f6 0% ${pPct}%, 
                                    #f59e0b ${pPct}% ${pPct + cPct}%, 
                                    #f43f5e ${pPct + cPct}% 100%
                                )`
                            }}
                        />
                    </div>

                    {/* Legend / Values - Pushed out to avoid overlap */}
                    {/* Left Bottom (Fat - Red) */}
                    <div className="absolute bottom-8 left-2 text-left z-20">
                        <div className="flex items-center gap-1 text-rose-500 font-bold text-xs uppercase tracking-wider mb-0.5"><Droplet className="w-3 h-3" /> Fat</div>
                        <div className="text-2xl font-black leading-none">{results.macros.fats}g</div>
                        <div className="text-[10px] text-muted-foreground">{fPct}%</div>
                    </div>

                    {/* Right Bottom (Carbs - Amber) */}
                    <div className="absolute bottom-8 right-2 text-right z-20">
                        <div className="flex items-center justify-end gap-1 text-amber-500 font-bold text-xs uppercase tracking-wider mb-0.5">Carbs <Wheat className="w-3 h-3" /></div>
                        <div className="text-2xl font-black leading-none">{results.macros.carbs}g</div>
                        <div className="text-[10px] text-muted-foreground">{cPct}%</div>
                    </div>

                    {/* Top Center (Protein - Blue) */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-center z-20">
                        <div className="flex items-center justify-center gap-1 text-blue-500 font-bold text-xs uppercase tracking-wider mb-0.5"><Dumbbell className="w-3 h-3" /> Protein</div>
                        <div className="text-3xl font-black leading-none">{results.macros.protein}g</div>
                        <div className="text-[10px] text-muted-foreground">{pPct}%</div>
                    </div>
                </div>

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
            </div>
        </LiquidWizardCard>
    );
}
