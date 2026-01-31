'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PedometerLog, UserProfile, DailyNutritionSummary, FitbitLog } from '@/types';
import { Footprints, Sprout, Scale, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import NutritionOverview from './NutritionOverview';
import { useActionContext } from '@/contexts/ActionContext';
import { getDietaryMetrics } from '@/lib/dietaryMetrics';



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

    const { timelineEntries } = useActionContext();
    const metrics = getDietaryMetrics(userProfile, summary, timelineEntries, stepsData, weightData);
    const activeMetric = metrics[activeStatIndex] || metrics[0];

    // Helper: Determine Swipe Direction Logic
    const handleStatDragEnd = (event: any, info: any) => {
        const SWIPE_THRESHOLD = 20;
        if (info.offset.x < -SWIPE_THRESHOLD) {
            // Swipe Left (Next)
            if (activeStatIndex < metrics.length - 1) setActiveStatIndex(prev => prev + 1);
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
        openAddVitalsDialog(
            currentDate,
            weightData?.weight,
            stepsData?.steps,
            weightData?.fatPercent
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
                        dietaryPreferences={userProfile?.profile?.dietaryPreferences}
                    />
                </div>

                {/* SECTION 2: Swiper Card (Dynamic Metrics) - MIDDLE */}
                <motion.div
                    className="w-full h-16 cursor-grab active:cursor-grabbing relative"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handleStatDragEnd}
                    onClick={handleCardClick}
                >
                    <GlassCard className="h-full flex flex-col justify-center items-center px-4 py-0 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] bg-white/20 dark:bg-black/30 backdrop-blur-xl rounded-2xl cursor-pointer hover:bg-white/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)] group relative overflow-hidden">

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] translate-x-[-100%] group-hover:animate-shimmer pointer-events-none" />

                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={activeMetric.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="w-full h-full flex items-center justify-between relative z-10"
                            >
                                {/* Left: Liquid Bubble Icon + Label */}
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center relative overflow-hidden shadow-inner",
                                        "bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-transparent border border-white/20",
                                        activeMetric.color === 'red' && "shadow-[0_0_15px_rgba(239,68,68,0.3)]",
                                        activeMetric.color === 'green' && "shadow-[0_0_15px_rgba(34,197,94,0.3)]",
                                        activeMetric.color === 'blue' && "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
                                        activeMetric.color === 'orange' && "shadow-[0_0_15px_rgba(249,115,22,0.3)]",
                                        activeMetric.color === 'yellow' && "shadow-[0_0_15px_rgba(234,179,8,0.3)]",
                                        activeMetric.color === 'purple' && "shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                    )}>
                                        {/* Icon Glow */}
                                        <div className={cn("absolute inset-0 opacity-20",
                                            activeMetric.color === 'red' && "bg-red-500",
                                            activeMetric.color === 'green' && "bg-green-500",
                                            activeMetric.color === 'blue' && "bg-blue-500",
                                            activeMetric.color === 'orange' && "bg-orange-500",
                                            activeMetric.color === 'yellow' && "bg-yellow-500",
                                            activeMetric.color === 'purple' && "bg-purple-500"
                                        )} />

                                        <activeMetric.icon className={cn("w-5 h-5 relative z-10 drop-shadow-sm",
                                            activeMetric.color === 'red' && "text-red-500 dark:text-red-400",
                                            activeMetric.color === 'green' && "text-green-500 dark:text-green-400",
                                            activeMetric.color === 'blue' && "text-blue-500 dark:text-blue-400",
                                            activeMetric.color === 'orange' && "text-orange-500 dark:text-orange-400",
                                            activeMetric.color === 'yellow' && "text-yellow-500 dark:text-yellow-400",
                                            activeMetric.color === 'purple' && "text-purple-500 dark:text-purple-400"
                                        )} />
                                    </div>

                                    <div className="flex flex-row items-baseline gap-2">
                                        <span className="text-2xl font-black font-headline text-foreground leading-none tracking-tight drop-shadow-sm">
                                            {activeMetric.value}
                                        </span>
                                        <div className="flex flex-col items-start leading-none gap-0.5">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 opacity-80">
                                                {activeMetric.label}
                                                {(activeMetric.id === 'weight' || activeMetric.id === 'steps') && (
                                                    <Edit2 className="w-2.5 h-2.5 opacity-40 hover:opacity-100 transition-opacity" />
                                                )}
                                            </span>
                                            {activeMetric.subtext && (
                                                <span className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wide">
                                                    {activeMetric.subtext}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Glass Dots Indicator */}
                                <div className="flex gap-1.5 p-1 rounded-full bg-black/5 dark:bg-white/5 backdrop-blur-sm border border-white/5">
                                    {metrics.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                                idx === activeStatIndex
                                                    ? "bg-foreground shadow-[0_0_8px_rgba(0,0,0,0.2)] scale-110"
                                                    : "bg-foreground/20 hover:bg-foreground/40"
                                            )}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </GlassCard>
                </motion.div>

            </div>
        </div>
    );
}
