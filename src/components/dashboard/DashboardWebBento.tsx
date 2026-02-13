'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Flame, Footprints, Scale, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NutritionOverview from './NutritionOverview';
import LiquidCrystalCard from './LiquidCrystalCard';
import TimelineSymptomCard from '@/components/food-logging/TimelineSymptomCard';
import type { DailyNutritionSummary, LoggedFoodItem, PedometerLog, TimelineEntry, FitbitLog, UserProfile } from '@/types';
import { calculateFastingTime } from '@/lib/dietaryMetrics';
const RamadanDashboardDecor = dynamic(() => import('@/features/ramadan/components/RamadanDashboardDecor'), { ssr: false });

interface DashboardWebBentoProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    summary: DailyNutritionSummary;
    timelineEntries: TimelineEntry[];
    stepsData?: PedometerLog | null;
    weightData?: FitbitLog | null;
    isToday: boolean;
    isLoadingAi: Record<string, boolean>;
    onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
    onRemoveTimelineEntry: (entryId: string) => void;
    onLogSymptomsForFood: (foodItemId?: string) => void;
    onEditIngredients?: (item: LoggedFoodItem) => void;
    onRepeatMeal?: (item: LoggedFoodItem) => void;
    onToggleFavorite: (itemId: string, currentIsFavorite: boolean) => void;
    userProfile?: UserProfile;
    isAdmin?: boolean;
}

const BentoCard = ({
    title,
    subtitle,
    className,
    children,
    headerRight,
}: {
    title?: string;
    subtitle?: string;
    className?: string;
    children: React.ReactNode;
    headerRight?: React.ReactNode;
}) => (
    <section
        className={cn(
            "relative overflow-hidden rounded-[28px] border border-white/12 bg-white/5 backdrop-blur-3xl md:bg-white/[0.03] md:backdrop-blur-md",
            className
        )}
    >
        {(title || subtitle || headerRight) && (
            <div className="relative z-10 flex items-start justify-between gap-4 px-6 pt-5">
                <div>
                    {title && <p className="text-xs uppercase tracking-[0.24em] text-white/50">{title}</p>}
                    {subtitle && <h3 className="text-lg font-semibold text-white/90">{subtitle}</h3>}
                </div>
                {headerRight}
            </div>
        )}
        <div className={cn("relative z-10 px-6 pb-6", (title || subtitle || headerRight) && "pt-4")}>
            {children}
        </div>
    </section>
);

const StatPill = ({
    icon: Icon,
    label,
    value,
    accentClass,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    accentClass: string;
}) => (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl h-14 md:bg-white/[0.03] md:backdrop-blur-sm">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border border-white/10", accentClass)}>
            <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">{label}</span>
            <span className="text-sm font-semibold text-white/90">{value}</span>
        </div>
    </div>
);

const getEntriesForDate = (allEntries: TimelineEntry[], date: Date) => {
    return allEntries
        .filter(entry => isSameDay(new Date(entry.timestamp), date))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .filter(e => ['food', 'manual_macro', 'symptom'].includes(e.entryType));
};

export default function DashboardWebBento({
    currentDate,
    onDateChange,
    summary,
    timelineEntries,
    stepsData,
    weightData,
    isToday,
    isLoadingAi,
    onSetFeedback,
    onRemoveTimelineEntry,
    onLogSymptomsForFood,
    onEditIngredients,
    onRepeatMeal,
    onToggleFavorite,
    userProfile,
    isAdmin = false,
}: DashboardWebBentoProps) {
    const currentEntries = useMemo(() => getEntriesForDate(timelineEntries, currentDate), [timelineEntries, currentDate]);
    const mealsLogged = currentEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro').length;
    const steps = stepsData?.steps ?? 0;
    const weight = weightData?.weight;
    const fastingTime = calculateFastingTime(timelineEntries);
    const displayDate = format(currentDate, 'EEEE, MMM d');

    return (
        <div className="relative w-full">
            <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-12 pt-10">
                <RamadanDashboardDecor />
                <div className="grid grid-cols-12 gap-6">
                    <BentoCard
                        className="col-span-12"
                        title={displayDate}
                        subtitle={isToday ? "Today’s Snapshot" : "Daily Snapshot"}
                        headerRight={(
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                                    onClick={() => onDateChange(new Date(currentDate.getTime() - 86400000))}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                                    onClick={() => onDateChange(new Date(currentDate.getTime() + 86400000))}
                                    disabled={isToday}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            <StatPill
                                icon={Utensils}
                                label="Meals Logged"
                                value={`${mealsLogged} Today`}
                                accentClass="text-orange-300 bg-orange-500/10"
                            />
                            <StatPill
                                icon={Flame}
                                label="Calories"
                                value={`${Math.round(summary.calories)} kcal`}
                                accentClass="text-yellow-300 bg-yellow-500/10"
                            />
                            <StatPill
                                icon={Footprints}
                                label="Steps"
                                value={steps > 999 ? `${(steps / 1000).toFixed(1)}k` : `${steps}`}
                                accentClass="text-emerald-300 bg-emerald-500/10"
                            />
                            <StatPill
                                icon={Scale}
                                label="Weight"
                                value={weight ? `${weight.toFixed(1)} lb` : "—"}
                                accentClass="text-cyan-300 bg-cyan-500/10"
                            />
                            <div className="flex flex-col justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl h-14 md:bg-white/[0.03] md:backdrop-blur-sm">
                                <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">Fasting</span>
                                <span className="text-sm font-semibold text-white/90">{fastingTime}</span>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard className="col-span-12 lg:col-span-8" title="Macros" subtitle="Nutrition Balance">
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
                    </BentoCard>

                    <BentoCard className="col-span-12 lg:col-span-4" title="Vitals" subtitle="Today’s Body Signals">
                        <div className="grid gap-4">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:bg-white/[0.03]">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Steps</p>
                                <p className="mt-2 text-2xl font-semibold text-white/90">
                                    {steps > 999 ? `${(steps / 1000).toFixed(1)}k` : steps}
                                </p>
                                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                                        style={{ width: `${Math.min(100, (steps / 10000) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:bg-white/[0.03]">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Weight</p>
                                <p className="mt-2 text-2xl font-semibold text-white/90">
                                    {weight ? `${weight.toFixed(1)} lb` : "No data"}
                                </p>
                                <p className="mt-1 text-xs text-white/40">Latest synced measurement</p>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard className="col-span-12 lg:col-span-8" title="Timeline" subtitle="Recent Meals & Logs">
                        <div className="max-h-[560px] space-y-6 overflow-y-auto pr-1">
                            {currentEntries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center md:bg-white/[0.03]">
                                    <p className="text-sm text-white/60">No meals logged for this day yet.</p>
                                </div>
                            ) : (
                                currentEntries.map((entry, index) => (
                                    <div
                                        key={entry.id}
                                        id={`timeline-card-${entry.id}`}
                                        className="transform transition-all duration-500"
                                        style={{ animationDelay: `${index * 40}ms` }}
                                    >
                                        {entry.entryType === 'symptom' ? (
                                            <div className="glass-crystal rounded-3xl overflow-hidden p-0 border-0">
                                                <TimelineSymptomCard item={entry} onRemoveItem={() => onRemoveTimelineEntry(entry.id)} />
                                            </div>
                                        ) : (
                                            <LiquidCrystalCard
                                                item={entry as LoggedFoodItem}
                                                onSetFeedback={onSetFeedback}
                                                onRemoveItem={() => onRemoveTimelineEntry(entry.id)}
                                                onLogSymptoms={() => onLogSymptomsForFood(entry.id)}
                                                isLoadingAi={!!isLoadingAi[entry.id]}
                                                onEditIngredients={onEditIngredients}
                                                onRepeatMeal={onRepeatMeal}
                                                onToggleFavorite={onToggleFavorite}
                                                isAdminView={isAdmin}
                                            />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </BentoCard>

                    <BentoCard className="col-span-12 lg:col-span-4" title="Signals" subtitle="Daily Insights">
                        <div className="grid gap-4">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:bg-white/[0.03]">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Protein Focus</p>
                                <p className="mt-2 text-lg font-semibold text-white/90">
                                    {Math.round(summary.protein)}g logged
                                </p>
                                <p className="mt-1 text-xs text-white/40">Aim to spread protein evenly across meals.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:bg-white/[0.03]">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Carb Balance</p>
                                <p className="mt-2 text-lg font-semibold text-white/90">
                                    {Math.round(summary.carbs)}g today
                                </p>
                                <p className="mt-1 text-xs text-white/40">Pair carbs with fiber for steadier energy.</p>
                            </div>
                        </div>
                    </BentoCard>
                </div>
            </div>
        </div>
    );
}
