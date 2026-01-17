'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { TimeRange } from '@/types';
import { cn } from '@/lib/utils';
import { HapticsService, ImpactStyle, NotificationType } from '@/lib/haptics';
import { Calendar, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import TrendsDateRangeSheet from './TrendsDateRangeSheet';
import LiquidSegmentedControl from '../ui/LiquidSegmentedControl';

interface GlobalTimeControlProps {
    selectedRange: TimeRange;
    onRangeChange: (range: TimeRange) => void;
    customRange?: { start: Date | undefined; end: Date | undefined };
    onCustomRangeChange?: (range: { start: Date | undefined; end: Date | undefined }) => void;
}

const RANGES: { id: TimeRange; label: string }[] = [
    { id: '7D', label: '7D' },
    { id: '30D', label: '30D' },
    { id: '6M', label: '6M' }, // Added per spec
    { id: '1Y', label: '1Y' },
];

export default function GlobalTimeControl({
    selectedRange,
    onRangeChange,
    customRange,
    onCustomRangeChange
}: GlobalTimeControlProps) {
    const { scrollY } = useScroll();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // State Machine: 'expanded' | 'compact'
    // 'expanded-on-idle' is handled via logic
    const [viewState, setViewState] = useState<'expanded' | 'compact'>('expanded');
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Scroll Logic
    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest < 10) {
            // At top, always expanded
            if (viewState !== 'expanded') setViewState('expanded');
            return;
        }

        // If sheet is open, keep it "compact" visually (locked)
        if (isSheetOpen) return;

        // Velocity check roughly (diff)
        const diff = latest - (scrollY.getPrevious() || 0);

        if (Math.abs(diff) > 5) {
            // Scrolling active -> Collapse
            if (viewState !== 'compact') setViewState('compact');

            // Clear existing expansion timer
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

            // Set new expansion timer (Idle detection)
            scrollTimeoutRef.current = setTimeout(() => {
                setViewState('expanded'); // Auto-expand after idle
            }, 600); // 600ms idle
        }
    });

    // Cleanup timeout
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    const handleSelect = (range: TimeRange) => {
        HapticsService.impact(ImpactStyle.Light);
        onRangeChange(range);
        // Do not auto-collapse on selection per spec (keep it stable)
    };

    const handleOpenCustom = () => {
        HapticsService.impact(ImpactStyle.Light);
        setIsSheetOpen(true);
        // Upon opening sheet, we visually lock effectively.
    };

    const handleApplyCustom = (start: Date, end: Date) => {
        if (onCustomRangeChange) {
            onCustomRangeChange({ start, end });
        }
        onRangeChange('CUSTOM');
        setIsSheetOpen(false);
        setViewState('compact'); // Collapse to show range label result
        HapticsService.notification(NotificationType.Success);
    };

    // Derived Label for Compact Mode
    const compactLabel = selectedRange === 'CUSTOM' && customRange?.start && customRange?.end
        ? `${format(customRange.start, 'MMM d')} – ${format(customRange.end, 'MMM d')}`
        : selectedRange === 'CUSTOM'
            ? 'Custom Range'
            : `${RANGES.find(r => r.id === selectedRange)?.label || selectedRange} Trend`;


    return (
        <>
            <motion.div
                className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none pt-[calc(env(safe-area-inset-top)+1rem)]"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* The Pill */}
                <motion.div
                    layoutId="time-control-pill"
                    className={cn(
                        "pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 shadow-lg rounded-full overflow-hidden transition-all duration-500 ease-[0.23,1,0.32,1] relative",
                        viewState === 'expanded' ? "p-1.5" : "px-4 py-2" // Padding shift
                    )}
                    onClick={() => {
                        if (viewState === 'compact' && !isSheetOpen) {
                            HapticsService.selection();
                            setViewState('expanded');
                        }
                    }}
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {viewState === 'expanded' ? (
                            <motion.div
                                key="expanded-content"
                                initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                                className="flex items-center gap-1"
                            >
                                <LiquidSegmentedControl
                                    options={RANGES}
                                    selected={selectedRange === 'CUSTOM' ? '' : selectedRange} // Don't show range selection if Custom is active (Custom has its own button)
                                    onChange={(id) => handleSelect(id as TimeRange)}
                                    layoutIdPrefix="global-time"
                                />

                                {/* Divider */}
                                <div className="w-px h-4 bg-white/10 mx-1" />

                                {/* Custom Button (Visual Match to Liquid Control but independent trigger) */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenCustom();
                                    }}
                                    className={cn(
                                        "relative px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 select-none flex items-center gap-1.5",
                                        selectedRange === 'CUSTOM'
                                            ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                                            : "text-white/40 hover:text-white/70"
                                    )}
                                >
                                    {selectedRange === 'CUSTOM' && (
                                        <motion.div
                                            layoutId="global-time-bubble-custom" // Distinct layout ID to avoid jumping from the range segment
                                            className="absolute inset-0 rounded-full -z-10 overflow-hidden"
                                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                        >
                                            {/* 1. Base Liquid Body */}
                                            <div className="absolute inset-0 bg-white/15 backdrop-blur-sm" />
                                            {/* 2. Radial Liquid Highlight */}
                                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_0%,transparent_50%)] opacity-50" />
                                            {/* 3. Specular Streak */}
                                            <div className="absolute top-0 right-0 w-[150%] h-full bg-gradient-to-l from-white/10 to-transparent skew-x-[-20deg] opacity-40 translate-x-[20%]" />
                                            {/* 4. Inset Thickness */}
                                            <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.1)]" />
                                            {/* 5. Drop Shadow */}
                                            <div className="absolute inset-0 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
                                        </motion.div>
                                    )}
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Custom</span>
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="compact-content"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2"
                            >
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full animate-pulse",
                                    selectedRange === 'CUSTOM' ? "bg-blue-500" : "bg-green-500"
                                )} />
                                <span className="text-sm font-semibold text-white tracking-wide">
                                    {compactLabel}
                                </span>
                                <ChevronDown className="w-3 h-3 text-white/50 ml-1" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>

            {/* Custom Sheet */}
            <AnimatePresence>
                {isSheetOpen && (
                    <TrendsDateRangeSheet
                        isOpen={isSheetOpen}
                        onClose={() => setIsSheetOpen(false)}
                        startDate={customRange?.start}
                        endDate={customRange?.end}
                        onApply={handleApplyCustom}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
