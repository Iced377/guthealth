'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PedometerLog, UserProfile, DailyNutritionSummary, FitbitLog } from '@/types';
import { Footprints, Sprout, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import NutritionOverview from './NutritionOverview';
import { useActionContext } from '@/contexts/ActionContext';


interface ParallaxVitalsHeaderProps {
    summary: DailyNutritionSummary;
    currentDate: Date;
    onPrevDate?: () => void;
    onNextDate?: () => void;
    userProfile?: UserProfile;
    stepsData?: PedometerLog | null;
    weightData?: FitbitLog | null;

    scrollY?: number;
    className?: string;
}

export default function ParallaxVitalsHeader({
    summary,
    currentDate,
    onPrevDate,
    onNextDate,
    userProfile,
    stepsData,
    weightData,

    scrollY = 0,
    className,
}: ParallaxVitalsHeaderProps) {

    const parallaxOffset = scrollY * 0.4;
    const [activeStatIndex, setActiveStatIndex] = useState(0);

    const handleStatDragEnd = (event: any, info: any) => {
        const SWIPE_THRESHOLD = 20;
        if (info.offset.x < -SWIPE_THRESHOLD) {
            // Swipe Left (Next)
            if (activeStatIndex < 2) setActiveStatIndex(prev => prev + 1);
        } else if (info.offset.x > SWIPE_THRESHOLD) {
            // Swipe Right (Prev)
            if (activeStatIndex > 0) setActiveStatIndex(prev => prev - 1);
        }
    };

    const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
        <div className={cn("glass-panel relative overflow-hidden", className)}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            {children}
        </div>
    );

    const { openAddVitalsDialog } = useActionContext();

    const handleCardClick = () => {
        // Open dialog with current values
        // Note: stepsData might be null, defaults to 0 if so? Or just pass undefined.
        // We pass what we see on screen approximately
        openAddVitalsDialog(
            currentDate,
            weightData?.weight,
            stepsData?.steps
        );
    };

    return (
        <div
            className={cn("relative z-30 w-full flex flex-col items-center perspective-1000", className)}
            style={{ transform: `translateY(${parallaxOffset}px)` }}
        >
            <div className="w-full max-w-4xl px-4 space-y-4">

                {/* SECTION 1: Nutrition Overview (Macros) - TOP */}
                <div className="w-full">
                    <NutritionOverview
                        summary={summary}
                        goals={userProfile?.profile?.macros ? {
                            calories: userProfile.profile.tdee,
                            protein: userProfile.profile.macros.protein,
                            carbs: userProfile.profile.macros.carbs,
                            fat: userProfile.profile.macros.fats,
                        } : undefined}
                    />
                </div>

                {/* SECTION 2: Swiper Card (Steps / Fiber / Weight) - MIDDLE */}
                <motion.div
                    className="w-full h-16 cursor-grab active:cursor-grabbing relative"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handleStatDragEnd}
                    onClick={handleCardClick}
                >
                    <GlassCard className="h-full flex flex-col justify-center items-center px-4 py-0 border-0 shadow-sm bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl cursor-pointer hover:bg-white/10 transition-colors">
                        <AnimatePresence mode="wait" initial={false}>
                            {activeStatIndex === 0 ? (
                                <motion.div
                                    key="steps"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full h-full flex items-center justify-between"
                                >
                                    {/* Left: Icon + Label */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
                                            <Footprints className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div className="flex flex-row items-baseline gap-2">
                                            <span className="text-xl font-bold font-headline text-foreground leading-none">
                                                {stepsData?.steps ? stepsData.steps.toLocaleString() : '0'}
                                            </span>
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Steps</span>
                                        </div>
                                    </div>

                                    {/* Right: Dots (0 active) */}
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/80" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                                    </div>
                                </motion.div>
                            ) : activeStatIndex === 1 ? (
                                <motion.div
                                    key="fiber"
                                    initial={{ opacity: 0, x: 10 }} // Direction depends on prev, simplifies to slide in
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full h-full flex items-center justify-between"
                                >
                                    {/* Left: Icon + Label */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <Sprout className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="flex flex-row items-baseline gap-2">
                                            <span className="text-xl font-bold font-headline text-foreground leading-none">
                                                {Math.round(summary.fiber || 0)}g
                                            </span>
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fiber</span>
                                        </div>
                                    </div>

                                    {/* Right: Dots (1 active) */}
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/80" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="weight"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full h-full flex items-center justify-between"
                                >
                                    {/* Left: Icon + Label */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <Scale className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div className="flex flex-row items-baseline gap-2">
                                            <span className="text-xl font-bold font-headline text-foreground leading-none">
                                                {weightData?.weight ? weightData.weight : '--'}
                                            </span>
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">kg</span>
                                        </div>
                                    </div>

                                    {/* Right: Dots (2 active) */}
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/80" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </GlassCard>
                </motion.div>

            </div>
        </div>
    );
}
