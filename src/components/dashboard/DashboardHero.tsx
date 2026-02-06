'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Timer, Footprints, Trophy, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isSameDay, subDays } from 'date-fns';
import { TimelineEntry, DailyNutritionSummary, PedometerLog, UserProfile } from '@/types';
import { calculateFastingTime } from '@/lib/dietaryMetrics';

interface DashboardHeroProps {
    userProfile: UserProfile;
    timelineEntries: TimelineEntry[];
    summary: DailyNutritionSummary;
    stepsData?: PedometerLog | null;
}

export default function DashboardHero({
    userProfile,
    timelineEntries,
    summary,
    stepsData
}: DashboardHeroProps) {

    // 1. Time of Day Greeting
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    }, []);

    const firstName = userProfile?.displayName?.split(' ')[0] || "GutChecker";

    // 2. Meals Logged Today
    const todayMeals = useMemo(() => {
        const today = new Date();
        return timelineEntries.filter(e =>
            (e.entryType === 'food' || e.entryType === 'manual_macro') &&
            isSameDay(new Date(e.timestamp), today)
        ).length;
    }, [timelineEntries]);

    // 3. Streak Calculation (Consecutive Days with at least 1 food log)
    const streak = useMemo(() => {
        let currentStreak = 0;
        const today = new Date();
        // Check past 365 days
        for (let i = 0; i < 365; i++) {
            const dateToCheck = subDays(today, i);
            const hasLog = timelineEntries.some(e =>
                (e.entryType === 'food' || e.entryType === 'manual_macro') &&
                isSameDay(new Date(e.timestamp), dateToCheck)
            );

            if (hasLog) {
                currentStreak++;
            } else if (i === 0 && !hasLog) {
                // Allow today to be missing if we just started the day, look at yesterday
                continue;
            } else {
                break; // Streak broken
            }
        }
        return currentStreak || 0; // Default to 0 if none
    }, [timelineEntries]);

    // 4. Stats Data
    const fastingTime = calculateFastingTime(timelineEntries);
    const steps = stepsData?.steps || 0;

    // Quick Stat Pill Component
    const StatPill = ({ icon: Icon, value, label, colorClass }: any) => (
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md shadow-sm">
            <Icon className={cn("w-3.5 h-3.5", colorClass)} />
            <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold font-mono">{value}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-4 mb-2">

            {/* Greeting & Context */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold font-headline tracking-tight">
                    {greeting}, <span className="text-primary">{firstName}</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                    You're on track. <span className="font-semibold text-foreground">{todayMeals} meals</span> logged today. Keep consistent!
                </p>
            </div>

            {/* Gamification & Stats Row */}
            <div className="w-full overflow-x-auto no-scrollbar pb-1">
                <div className="flex items-center gap-3">

                    {/* Streak Badge (Gamified) */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.1)] mr-1"
                    >
                        <Flame className="w-3.5 h-3.5 fill-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">{streak} Day Streak</span>
                    </motion.div>

                    {/* Quick Stats Pills */}
                    <div className="h-4 w-px bg-border/50 mx-1" /> {/* Divider */}

                    <StatPill icon={Timer} value={fastingTime} label="Fast" colorClass="text-purple-400" />
                    <StatPill icon={Flame} value={Math.round(summary.calories)} label="Kcal" colorClass="text-orange-400" />
                    <StatPill icon={Utensils} value={`${Math.round(summary.protein)}g`} label="Prot" colorClass="text-red-400" />
                    <StatPill icon={Footprints} value={steps > 999 ? `${(steps / 1000).toFixed(1)}k` : steps} label="Step" colorClass="text-emerald-400" />

                </div>
            </div>

        </div>
    );
}
