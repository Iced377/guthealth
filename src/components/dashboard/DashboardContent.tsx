'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import ParallaxVitalsHeader from './ParallaxVitalsHeader';
import LiquidCardCarousel from './LiquidCardCarousel';
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
    userProfile: any; // Using explicit type locally vs import for brevity in replacement? No, let's just use existing usage.
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
    const { healthData } = useHealthKit();

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

    if (!userProfile) return null;

    return (
        <div className="flex flex-col h-full w-full relative overflow-hidden bg-background">

            {/* Background Gradient Mesh */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            {isLoading ? (
                <div className="flex flex-col h-full w-full animate-pulse p-4 gap-4 mt-20">
                    {/* Header Skeleton */}
                    <div className="w-full h-32 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/5" />

                    {/* Cards Skeleton */}
                    <div className="flex-1 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/5" />
                </div>
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
                />
            )}

        </div>
    );
}
