'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PedometerLog, UserProfile, DailyNutritionSummary } from '@/types';
import { Footprints, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';
import NutritionOverview from './NutritionOverview';


interface ParallaxVitalsHeaderProps {
    summary: DailyNutritionSummary;
    currentDate: Date;
    onPrevDate?: () => void;
    onNextDate?: () => void;
    userProfile?: UserProfile;
    stepsData?: PedometerLog | null;

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

    scrollY = 0,
    className,
}: ParallaxVitalsHeaderProps) {

    const parallaxOffset = scrollY * 0.4;
    const [activeStatIndex, setActiveStatIndex] = useState(0);

    const handleStatDragEnd = (event: any, info: any) => {
        const SWIPE_THRESHOLD = 20;
        if (info.offset.x < -SWIPE_THRESHOLD) {
            if (activeStatIndex === 0) setActiveStatIndex(1);
        } else if (info.offset.x > SWIPE_THRESHOLD) {
            if (activeStatIndex === 1) setActiveStatIndex(0);
        }
    };

    const stepsTarget = 10000;
    const fiberTarget = 30;

    const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
        <div className={cn("glass-panel relative overflow-hidden", className)}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            {children}
        </div>
    );

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

                {/* SECTION 2: Swiper Card (Steps / Fiber) - MIDDLE (Compact Height) */}
                <motion.div
                    className="w-full h-16 cursor-grab active:cursor-grabbing relative" // Reduced height to h-16 (~64px)
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handleStatDragEnd}
                >
                    <GlassCard className="h-full flex flex-col justify-center items-center px-4 py-0 border border-white/10 shadow-sm bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl">
                        <AnimatePresence mode="wait">
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

                                    {/* Right: Dots */}
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/80" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="fiber"
                                    initial={{ opacity: 0, x: 10 }}
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

                                    {/* Right: Dots */}
                                    <div className="flex gap-1.5">
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
