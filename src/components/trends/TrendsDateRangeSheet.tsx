'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, subMonths, isSameDay } from 'date-fns';
import { X } from 'lucide-react';
import { HapticsService, ImpactStyle, NotificationType } from '@/lib/haptics';
import { DateRange } from 'react-day-picker';

interface TrendsDateRangeSheetProps {
    isOpen: boolean;
    onClose: () => void;
    startDate: Date | undefined;
    endDate: Date | undefined;
    onApply: (start: Date, end: Date) => void;
}

const PRESETS = [
    { label: 'Last 7 Days', getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: 'Last 30 Days', getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
    { label: 'This Month', getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
    { label: 'Last Month', getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: subDays(startOfMonth(new Date()), 1) }) },
];



export default function TrendsDateRangeSheet({
    isOpen,
    onClose,
    startDate: initialStart,
    endDate: initialEnd,
    onApply
}: TrendsDateRangeSheetProps) {
    const [range, setRange] = useState<DateRange | undefined>({
        from: initialStart,
        to: initialEnd,
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSelect = (newRange: DateRange | undefined) => {
        HapticsService.impact(ImpactStyle.Light);
        setRange(newRange);
    };

    const handleApply = () => {
        if (range?.from && range?.to) {
            HapticsService.notification(NotificationType.Success);
            onApply(range.from, range.to);
        }
    };

    const handlePreset = (preset: typeof PRESETS[0]) => {
        HapticsService.selection();
        const newRange = preset.getRange();
        setRange(newRange);
    };

    const previewText = range?.from && range?.to
        ? `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d')}`
        : range?.from
            ? `${format(range.from, 'MMM d')} – Select End`
            : "Select Range";

    if (!isOpen || !mounted) return null;

    return createPortal(
        <motion.div
            layoutId="date-sheet-container"
            className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center px-2 pt-4 pb-32 pointer-events-none select-none"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-auto"
                onClick={onClose}
                onTouchStart={(e) => e.stopPropagation()} // Stop touch propagation
                onTouchMove={(e) => e.stopPropagation()}
            />

            <motion.div
                className="pointer-events-auto w-full max-w-sm bg-[#080808]/90 backdrop-blur-3xl border border-white/5 shadow-2xl rounded-[32px] overflow-hidden relative flex flex-col items-stretch"
                initial={{ y: "100%", scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: "100%", scale: 0.95 }}
                transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center pt-8 pb-4 space-y-1 relative">
                    <button
                        onClick={() => {
                            HapticsService.selection();
                            onClose();
                        }}
                        className="absolute top-5 right-5 p-2 rounded-full text-white/20 hover:text-white/50 hover:bg-white/5 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                        Custom Range
                    </span>
                    <h2 className="text-2xl font-light text-white tracking-tight">
                        {previewText}
                    </h2>
                </div>

                <div className="px-6 mb-2 flex flex-wrap justify-center gap-2 py-2">
                    {PRESETS.map((p) => {
                        const isActive = range?.from && range?.to &&
                            isSameDay(range.from, p.getRange().from) &&
                            isSameDay(range.to, p.getRange().to);

                        return (
                            <button
                                key={p.label}
                                onClick={() => handlePreset(p)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 relative overflow-hidden flex-1 min-w-[100px] text-center",
                                    isActive
                                        ? "text-black font-semibold shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                        : "text-white/60 hover:text-white hover:bg-white/5 bg-white/5 border border-white/5"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-white" />
                                )}
                                <span className="relative z-10">{p.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Calendar Layer - Visual Fixes Applied */}
                <div
                    className="px-4 pb-2 flex justify-center select-none touch-none"
                    style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <Calendar
                        mode="range"
                        selected={range}
                        onSelect={handleSelect}
                        initialFocus
                        numberOfMonths={1}
                        className="p-0 select-none"
                        classNames={{
                            month: "space-y-4 select-none",
                            caption: "flex justify-center pt-2 relative items-center text-white/80 select-none",
                            caption_label: "text-sm font-medium",
                            nav: "space-x-1 flex items-center opacity-50 hover:opacity-100 transition-opacity",
                            nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-colors",
                            nav_button_previous: "absolute left-2",
                            nav_button_next: "absolute right-2",
                            table: "w-full border-collapse space-y-1 select-none",
                            head_row: "flex w-full mt-2 mb-2",
                            head_cell: "text-white/30 rounded-md w-9 font-normal text-[0.7rem] uppercase select-none",
                            row: "flex w-full mt-1",
                            cell: cn(
                                "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent select-none",
                                // Ensure no gaps
                                "[&:has([aria-selected].day-range-middle)]:bg-white/0"
                            ),
                            day: cn(
                                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full text-white/70 hover:bg-white/10 transition-all duration-200 select-none"
                            ),
                            day_selected: cn(
                                "bg-white text-black hover:bg-white hover:text-black focus:bg-white focus:text-black shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                            ),
                            day_today: "bg-white/5 text-white ring-1 ring-white/20",
                            day_outside: "text-white/20 opacity-50",
                            day_disabled: "text-white/10 opacity-30",

                            // Clean Range Implementation (No negative margins)
                            day_range_middle: "aria-selected:bg-white/10 aria-selected:text-white rounded-none w-9 select-none",
                            day_range_start: "aria-selected:bg-white aria-selected:text-black rounded-l-full rounded-r-none",
                            day_range_end: "aria-selected:bg-white aria-selected:text-black rounded-r-full rounded-l-none",
                            day_hidden: "invisible",
                        }}
                    />
                </div>

                <div className="p-6 pt-2">
                    <button
                        disabled={!range?.from || !range?.to}
                        onClick={handleApply}
                        className={cn(
                            "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-95",
                            (range?.from && range?.to)
                                ? "bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(255,255,255,0.3)]"
                                : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                        )}
                    >
                        Apply Range
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}
