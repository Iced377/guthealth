'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';
import { Utensils } from 'lucide-react';
import LiquidCrystalCard from './LiquidCrystalCard';
import type { TimelineEntry, LoggedFoodItem } from '@/types';
import TimelineSymptomCard from '@/components/food-logging/TimelineSymptomCard';
import { format, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

// Helper to filter entries for a specific date
const getEntriesForDate = (allEntries: TimelineEntry[], date: Date) => {
    return allEntries.filter(entry =>
        isSameDay(new Date(entry.timestamp), date)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .filter(e => ['food', 'manual_macro', 'symptom'].includes(e.entryType));
};

interface LiquidCardCarouselProps {
    currentDate: Date;
    entries: TimelineEntry[]; // ALL entries
    isLoadingAi: Record<string, boolean>;
    onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
    onRemoveTimelineEntry: (entryId: string) => void;
    onLogSymptomsForFood: (foodItemId?: string) => void;
    onEditIngredients?: (item: LoggedFoodItem) => void;
    onRepeatMeal?: (item: LoggedFoodItem) => void;
    onToggleFavorite: (itemId: string, currentIsFavorite: boolean) => void;
    onDateChange: (newDate: Date) => void;
    isToday: boolean;
    onScroll?: (scrollY: number) => void;
    renderHeader?: (date: Date) => React.ReactNode; // Function to render header for ANY date
    className?: string; // Support extra styling
}

export default function LiquidCardCarousel({
    currentDate,
    entries,
    isLoadingAi,
    onSetFeedback,
    onRemoveTimelineEntry,
    onLogSymptomsForFood,
    onEditIngredients,
    onRepeatMeal,
    onToggleFavorite,
    onDateChange,
    isToday,
    onScroll,
    renderHeader,
    className
}: LiquidCardCarouselProps) {

    const containerRef = useRef<HTMLDivElement>(null);
    const centerPanelRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const [width, setWidth] = useState(0);

    // Track width for infinite scroll positioning
    useEffect(() => {
        if (containerRef.current) {
            const measuredWidth = containerRef.current.offsetWidth;
            setWidth(measuredWidth);
            x.set(-measuredWidth); // Start at Center Panel
        }
    }, [x]);

    // Reset scroll when Date changes (Window Scroll)
    useEffect(() => {
        // Immediate reset for native feel
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Backup timeout for any layout shifts
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }, 10);
        return () => clearTimeout(timer);
    }, [currentDate]);

    // Handle Window Resize
    useEffect(() => {
        const handleResize = () => {
            // Use window width if container is undetermined in full-page mode
            if (containerRef.current) {
                const newWidth = containerRef.current.offsetWidth || window.innerWidth;
                setWidth(newWidth);
                x.set(-newWidth);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [x]);

    // Derived Dates
    const prevDate = addDays(currentDate, -1);
    const nextDate = addDays(currentDate, 1);

    // Filter Entries
    const currentEntries = getEntriesForDate(entries, currentDate);
    const prevEntries = getEntriesForDate(entries, prevDate);
    const nextEntries = getEntriesForDate(entries, nextDate);

    // Drag Logic
    const DRAG_THRESHOLD = width * 0.15;

    const handleDragEnd = (_: any, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset > DRAG_THRESHOLD || velocity > 300) {
            // Swiped Right -> Go to Prev
            animate(x, 0, {
                type: "spring", stiffness: 300, damping: 30,
                onComplete: () => {
                    onDateChange(prevDate);
                    x.set(-width);
                    // Explicitly scroll new center to top immediately after state change concept
                    // But key prop handled this better
                }
            });
        } else if ((offset < -DRAG_THRESHOLD || velocity < -300) && !isToday) {
            // Swiped Left -> Go to Next
            animate(x, -2 * width, {
                type: "spring", stiffness: 300, damping: 30,
                onComplete: () => {
                    onDateChange(nextDate);
                    x.set(-width);
                }
            });
        } else {
            // Snap back to Center
            animate(x, -width, { type: "spring", stiffness: 400, damping: 40 });
        }
    };

    // Card Renderer Helper
    const renderCards = (dayEntries: TimelineEntry[]) => {
        if (dayEntries.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">No meals logged</p>
                </div>
            );
        }
        return (
            <div className="space-y-6 pb-32">
                {dayEntries.map((entry, index) => (
                    <div
                        key={entry.id}
                        id={`timeline-card-${entry.id}`}
                        className="transform transition-all duration-500"
                        style={{ animationDelay: `${index * 50}ms` }}
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
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Scroll Handler for Parallax
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (onScroll) {
            onScroll(e.currentTarget.scrollTop);
        }
    };

    return (
        <div ref={containerRef} className={cn("flex-1 w-full relative overflow-hidden bg-transparent", className)}>

            {/* Draggable Track */}
            {width > 0 && (
                <motion.div
                    className="flex h-full"
                    style={{ x, width: width * 3 }}
                    drag="x"
                    dragConstraints={{ left: isToday ? -width : -2 * width, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                >
                    {/* PREVIOUS DAY PANEL */}
                    <div
                        key={prevDate.toISOString()}
                        style={{ width: width }}
                        className="h-full px-4 overflow-y-auto no-scrollbar touch-pan-y"
                    >
                        {/* Render Header for Prev Day */}
                        <div className="pt-2 pb-4">
                            {renderHeader?.(prevDate)}
                        </div>
                        <div className="h-4" />
                        {renderCards(prevEntries)}
                    </div>

                    {/* CURRENT DAY PANEL (Center) */}
                    <div
                        key={currentDate.toISOString()} // Force remount on date change to reset scroll
                        ref={centerPanelRef}
                        style={{ width: width }}
                        // NOTE: IDK why but overflow-y-hidden helps lock vertical on horizontal swipe sometimes,
                        // but we need scroll. touch-pan-y is the CSS solution.
                        className="h-full px-4 overflow-y-auto no-scrollbar touch-pan-y"
                        onScroll={handleScroll}
                    >
                        {/* Render Header for Current Day */}
                        <div className="pt-2 pb-4">
                            {renderHeader?.(currentDate)}
                        </div>

                        <div className="h-4" />

                        {renderCards(currentEntries)}
                    </div>

                    {/* NEXT DAY PANEL */}
                    <div
                        key={nextDate.toISOString()}
                        style={{ width: width }}
                        className="h-full px-4 overflow-y-auto no-scrollbar touch-pan-y"
                    >
                        {/* Render Header for Next Day - Only if allowed to navigate there (future allowed?) */}
                        {/* Logic says "if !isToday" usually for next, but swiping logic handles constraint. Rendering logic should just render. */}
                        <div className="pt-2 pb-4 opacity-50">
                            {/* Opacity hint that it's future or just 'next' */}
                            {!isToday && renderHeader?.(nextDate)}
                        </div>
                        <div className="h-4" />
                        {!isToday && renderCards(nextEntries)}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
