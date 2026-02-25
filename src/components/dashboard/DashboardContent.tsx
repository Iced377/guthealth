'use client';

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import DashboardWebBento from './DashboardWebBento';


// Lazy load heavy interactive components
const ParallaxVitalsHeader = dynamic(() => import('./ParallaxVitalsHeader'), {
    loading: () => <div className="w-full h-32 rounded-2xl bg-white/5 animate-pulse webview-skeleton" />,
    ssr: false // Optimization: No need to SSR the complex motion header
});
const LiquidCardCarousel = dynamic(() => import('./LiquidCardCarousel'), {
    ssr: false // Carousel is heavily client-side interactive
});
import { useActionContext } from '@/contexts/ActionContext';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { format, isSameDay, addDays } from 'date-fns';
import {
    LoggedFoodItem,
    PedometerLog,
    TimelineEntry,
    DailyNutritionSummary,
    FitbitLog
} from '@/types';
import {
    calculateDaySummary,
    calculateDailyPedometerStats
} from '@/lib/utils';
import { useHealthKit } from '@/lib/apple-health/hooks';

// Define props to make it a controlled component for date
interface DashboardContentProps {
    userProfile: any;
    timelineEntries: TimelineEntry[];
    dailyNutritionSummary: DailyNutritionSummary;
    isLoadingAi: Record<string, boolean>;
    onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
    onRemoveTimelineEntry: (id: string) => void;
    onLogSymptomsForFood: (foodItemId?: string) => void;
    onEditIngredients: (item: LoggedFoodItem) => void;
    onRepeatMeal: (item: LoggedFoodItem) => void;
    onToggleFavorite: (itemId: string, isFavorite: boolean) => void;
    onLogFoodAIClick: () => void;
    onIdentifyByPhotoClick: () => void;
    onLogSymptomsClick: () => void;
    onLogPreviousMealClick: () => void;
    groupedTimelineEntries: Record<string, TimelineEntry[]>;
    currentDate: Date;
    onDateChange: (date: Date) => void;
    isLoading?: boolean;
}

export default function DashboardContent({
    timelineEntries, // Used for calculations
    isLoadingAi,
    currentDate,
    onDateChange,
    isLoading = false
}: DashboardContentProps) {
    const { userProfile } = useAuth();

    // Replace useFoodLogStore with useActionContext logic
    const {
        handleRemoveTimelineEntry,
        handleRepeatMeal,
        handleToggleFavoriteFoodItem,
        handleSetFoodFeedback,
        handleEditTimelineEntry,
        openSymptomLogDialog,
        lastAddedItem,
        setLastAddedItem,
    } = useActionContext();

    const { startWalkthrough } = useWalkthrough();
    const { healthData } = useHealthKit(!!userProfile?.profile?.appleHealthEnabled);
    const isIOS = typeof window !== 'undefined' && Capacitor.getPlatform() === 'ios';
    const [isWideLayout, setIsWideLayout] = useState(false);

    React.useEffect(() => {
        const updateLayout = () => {
            setIsWideLayout(window.innerWidth >= 1024);
        };
        updateLayout();
        window.addEventListener('resize', updateLayout);
        return () => window.removeEventListener('resize', updateLayout);
    }, []);

    const enableWebBento = !isIOS && isWideLayout;

    // Scroll to New Item Logic
    React.useEffect(() => {
        if (lastAddedItem) {
            // 1. Switch Date if needed
            if (!isSameDay(lastAddedItem.date, currentDate)) {
                onDateChange(lastAddedItem.date);
            }

            // 2. Scroll to Item (Wait for render/animation)
            const timer = setTimeout(() => {
                const element = document.getElementById(`timeline-card-${lastAddedItem.id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                setLastAddedItem(null); // Reset trigger
            }, 600); // Slightly longer delay for tab switching + animation

            return () => clearTimeout(timer);
        }
    }, [lastAddedItem, currentDate, onDateChange, setLastAddedItem]);

    // State
    const [scrollY, setScrollY] = useState(0);

    // Handlers mapped to ActionContext
    const onRemoveTimelineEntry = (id: string) => {
        handleRemoveTimelineEntry(id);
    };

    const onLogSymptomsForFood = (foodItemId?: string) => {
        if (foodItemId) {
            const foodItem = timelineEntries.find(e => e.id === foodItemId);
            if (foodItem && foodItem.entryType === 'food') {
                openSymptomLogDialog({
                    type: 'meal',
                    mealId: foodItem.id,
                    mealName: (foodItem as LoggedFoodItem).name || "Meal",
                    mealTimestamp: new Date(foodItem.timestamp)
                });
                return;
            }
        }
        openSymptomLogDialog({ type: 'checkin' });
    };

    const onEditIngredients = (item: LoggedFoodItem) => {
        handleEditTimelineEntry(item);
    };

    const onRepeatMeal = (item: LoggedFoodItem) => {
        handleRepeatMeal(item);
    };

    const onToggleFavorite = (itemId: string, isFavorite: boolean) => {
        handleToggleFavoriteFoodItem(itemId, isFavorite);
    };

    const onSetFeedback = (itemId: string, feedback: 'safe' | 'unsafe' | null) => {
        handleSetFoodFeedback(itemId, feedback);
    };


    // Combined Timeline Entries for Carousel (ALL dates)
    const sortedEntries = useMemo(() => {
        return [...timelineEntries].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [timelineEntries]);


    // Helper to get data for ANY date (efficiently enough for small lists)
    const getSummaryForDate = useCallback((date: Date) => {
        const daysLogs = sortedEntries.filter(log =>
            isSameDay(new Date(log.timestamp), date) && log.entryType === 'food'
        ) as LoggedFoodItem[];
        return calculateDaySummary(daysLogs);
    }, [sortedEntries]);



    const getStepsForDate = useCallback((date: Date) => {
        // If HealthKit hook returns total for today, use it if currentDate is Today.
        if (isSameDay(date, new Date()) && healthData) {
            return {
                id: 'today-steps',
                timestamp: new Date(),
                entryType: 'pedometer_data',
                steps: healthData.steps,
                distance: healthData.distance,
                source: 'apple_health'
            } as PedometerLog;
        }
        const dayPedometerLogs = sortedEntries.filter(log =>
            isSameDay(new Date(log.timestamp), date) && log.entryType === 'pedometer_data'
        ) as PedometerLog[];

        if (dayPedometerLogs.length > 0) {
            return calculateDailyPedometerStats(dayPedometerLogs);
        }
        return null;
    }, [sortedEntries, healthData]);


    const getWeightForDate = useCallback((date: Date) => {
        // If HealthKit or Fitbit hook had real-time data we could merge it here.
        // For now, we rely on timelineEntries (which includes synced Fitbit data).
        const dayWeightLogs = sortedEntries.filter(log =>
            isSameDay(new Date(log.timestamp), date) && log.entryType === 'fitbit_data' && log.weight
        ) as FitbitLog[];

        if (dayWeightLogs.length > 0) {
            // Return the latest weight entry for the day
            return dayWeightLogs[0];
        }
        return null;
    }, [sortedEntries]);

    const skeletonBlock = enableWebBento ? "webview-skeleton" : "animate-pulse";

    if (!userProfile || isLoading) {
        return (
            <div className="w-full flex flex-col gap-6 px-4 md:px-8">
                {/* Header Skeleton */}
                <div className={cn("w-full h-24 rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/5", skeletonBlock)} />

                {/* Vitals Skeleton (Steps) */}
                <div className={cn("w-full h-16 rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/5 flex items-center justify-center", skeletonBlock)}>
                    <div className={cn("h-2 w-32 bg-white/10 rounded-full", enableWebBento && "webview-skeleton-line")} />
                </div>

                {/* Feed Skeleton */}
                <div className="flex-1 flex flex-col gap-4">
                    {[1, 2].map((i) => (
                        <div key={i} className={cn("w-full h-40 rounded-3xl bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/5 p-4 space-y-4 relative overflow-hidden", skeletonBlock)}>
                            <div className={cn("absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-shimmer", enableWebBento && "webview-shimmer")} style={{ animationDelay: `${i * 100}ms` }} />
                            <div className="flex justify-between items-start">
                                <div className={cn("h-6 w-48 bg-white/10 rounded-lg", enableWebBento && "webview-skeleton-line")} />
                                <div className={cn("h-8 w-8 rounded-full bg-white/10", enableWebBento && "webview-skeleton-line")} />
                            </div>
                            <div className="flex gap-2">
                                <div className={cn("h-4 w-12 bg-white/10 rounded-full", enableWebBento && "webview-skeleton-line")} />
                                <div className={cn("h-4 w-12 bg-white/10 rounded-full", enableWebBento && "webview-skeleton-line")} />
                                <div className={cn("h-4 w-12 bg-white/10 rounded-full", enableWebBento && "webview-skeleton-line")} />
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-center py-4">
                        <p className={cn("text-xs font-medium text-muted-foreground animate-pulse", enableWebBento && "webview-loading-text")}>
                            {(isIOS && userProfile?.profile?.appleHealthEnabled) ? 'Syncing your health data...' : 'Loading your dashboard...'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            id="dashboard-container"
            className={cn(
                "flex flex-col w-full relative",
                enableWebBento ? "min-h-screen overflow-visible bg-transparent" : "h-full overflow-hidden bg-background"
            )}
        >


            {/* Background Gradient Mesh (skip on web bento; global background handles it) */}
            {!enableWebBento && (
                <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[100px] animate-pulse-slow" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
                </div>
            )}

            {isLoading ? (
                <div className={cn("flex flex-col h-full w-full p-4 gap-6 mt-4 relative z-10", enableWebBento && "max-w-6xl mx-auto px-8")}>
                    {/* Header Skeleton (Macros) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={cn("h-24 rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/5 relative overflow-hidden", skeletonBlock)}>
                                <div className={cn("absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-shimmer", enableWebBento && "webview-shimmer")} />
                            </div>
                        ))}
                    </div>

                    {/* Vitals Skeleton (Steps) */}
                    <div className={cn("w-full h-16 rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/5 flex items-center justify-center", skeletonBlock)}>
                        <div className={cn("h-2 w-32 bg-white/10 rounded-full", enableWebBento && "webview-skeleton-line")} />
                    </div>

                    {/* Feed Skeleton */}
                    <div className="flex-1 flex flex-col gap-4">
                        {[1, 2].map((i) => (
                            <div key={i} className={cn("w-full h-40 rounded-3xl bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/5 p-4 space-y-4 relative overflow-hidden", skeletonBlock)}>
                                <div className={cn("absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-shimmer", enableWebBento && "webview-shimmer")} style={{ animationDelay: `${i * 100}ms` }} />
                                <div className="flex justify-between items-start">
                                    <div className={cn("h-6 w-48 bg-white/10 rounded-lg", enableWebBento && "webview-skeleton-line")} />
                                    <div className={cn("h-8 w-8 rounded-full bg-white/10", enableWebBento && "webview-skeleton-line")} />
                                </div>
                                <div className="flex gap-2">
                                    <div className={cn("h-4 w-12 bg-white/10 rounded-full", enableWebBento && "webview-skeleton-line")} />
                                    <div className={cn("h-4 w-12 bg-white/10 rounded-full", enableWebBento && "webview-skeleton-line")} />
                                    <div className={cn("h-4 w-12 bg-white/10 rounded-full", enableWebBento && "webview-skeleton-line")} />
                                </div>
                            </div>
                        ))}

                        <div className="flex items-center justify-center py-4">
                            <p className={cn("text-xs font-medium text-muted-foreground animate-pulse", enableWebBento && "webview-loading-text")}>
                                {(isIOS && userProfile?.profile?.appleHealthEnabled) ? 'Syncing your health data...' : 'Loading your dashboard...'}
                            </p>
                        </div>
                    </div>
                </div>
            ) : enableWebBento ? (
                <DashboardWebBento
                    currentDate={currentDate}
                    onDateChange={onDateChange}
                    summary={getSummaryForDate(currentDate)}
                    timelineEntries={sortedEntries}
                    stepsData={getStepsForDate(currentDate)}
                    weightData={getWeightForDate(currentDate)}
                    isToday={isSameDay(currentDate, new Date())}
                    isLoadingAi={isLoadingAi}
                    onSetFeedback={onSetFeedback}
                    onRemoveTimelineEntry={onRemoveTimelineEntry}
                    onLogSymptomsForFood={onLogSymptomsForFood}
                    onEditIngredients={onEditIngredients}
                    onRepeatMeal={onRepeatMeal}
                    onToggleFavorite={onToggleFavorite}
                    userProfile={userProfile}
                    isAdmin={userProfile?.isAdmin}
                />
            ) : (
                /* 3-Panel Carousel with Fluid Header */
                <LiquidCardCarousel
                    currentDate={currentDate}
                    entries={sortedEntries}
                    isLoadingAi={isLoadingAi}
                    onSetFeedback={onSetFeedback}
                    onRemoveTimelineEntry={onRemoveTimelineEntry}
                    onLogSymptomsForFood={onLogSymptomsForFood}
                    onEditIngredients={onEditIngredients}
                    onRepeatMeal={onRepeatMeal}
                    onToggleFavorite={onToggleFavorite}
                    onDateChange={onDateChange}
                    isToday={isSameDay(currentDate, new Date())}
                    onScroll={setScrollY}
                    renderHeader={(date) => (
                        <ParallaxVitalsHeader
                            summary={getSummaryForDate(date)}
                            currentDate={date}
                            onPrevDate={() => onDateChange(addDays(date, -1))}
                            onNextDate={() => onDateChange(addDays(date, 1))}
                            userProfile={userProfile}
                            stepsData={getStepsForDate(date)}
                            weightData={getWeightForDate(date)}
                            scrollY={scrollY}
                            className="pt-2" // Reduced padding as there's no sticky date anymore
                        />
                    )}
                    isAdmin={userProfile?.isAdmin}
                />
            )}
        </div>
    );
}
