'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface LiquidDateSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (date: Date) => void;
    initialDate?: Date;
    title?: string;
}

// Generate arrays for the pickers
const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number): number[] {
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
}

// Haptic feedback helper
const triggerHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) { }
    }
};

// Scroll Wheel Picker Component
function WheelPicker({
    items,
    selectedIndex,
    onSelect,
    renderItem
}: {
    items: (string | number)[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    renderItem?: (item: string | number) => string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemHeight = 44;
    const visibleItems = 5;
    const lastIndex = useRef(selectedIndex);
    const isScrolling = useRef(false);

    const scrollToIndex = useCallback((index: number, smooth = true) => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: index * itemHeight,
                behavior: smooth ? 'smooth' : 'instant'
            });
        }
    }, []);

    useEffect(() => {
        // Force initial scroll position
        requestAnimationFrame(() => {
            scrollToIndex(selectedIndex, false);
        });
    }, []);

    useEffect(() => {
        if (!isScrolling.current) {
            scrollToIndex(selectedIndex, false);
        }
    }, [selectedIndex, scrollToIndex]);

    const handleScroll = () => {
        if (!containerRef.current) return;

        isScrolling.current = true;
        const scrollTop = containerRef.current.scrollTop;
        const currentIndex = Math.round(scrollTop / itemHeight);
        const clampedIndex = Math.max(0, Math.min(items.length - 1, currentIndex));

        if (clampedIndex !== lastIndex.current) {
            lastIndex.current = clampedIndex;
            triggerHaptic();
            onSelect(clampedIndex);
        }
    };

    const handleScrollEnd = () => {
        if (!containerRef.current) return;
        const scrollTop = containerRef.current.scrollTop;
        const index = Math.round(scrollTop / itemHeight);
        const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
        scrollToIndex(clampedIndex, true);
        isScrolling.current = false;
    };

    const scrollEndTimeout = useRef<NodeJS.Timeout>();
    const handleScrollWithEnd = () => {
        handleScroll();
        if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
        scrollEndTimeout.current = setTimeout(handleScrollEnd, 150);
    };

    return (
        <div className="relative h-[220px] flex-1 overflow-hidden pointer-events-auto">
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#1c1c1e] to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1c1c1e] to-transparent z-10 pointer-events-none" />

            <div
                className="absolute left-1 right-1 z-0 border-y border-emerald-500/30 bg-emerald-500/10 rounded-lg"
                style={{
                    top: `${(visibleItems - 1) / 2 * itemHeight}px`,
                    height: `${itemHeight}px`
                }}
            />

            <div
                ref={containerRef}
                onScroll={handleScrollWithEnd}
                className="h-full overflow-y-scroll pointer-events-auto overscroll-contain"
                style={{
                    paddingTop: `${(visibleItems - 1) / 2 * itemHeight}px`,
                    paddingBottom: `${(visibleItems - 1) / 2 * itemHeight}px`,
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            triggerHaptic();
                            onSelect(index);
                            scrollToIndex(index);
                        }}
                        className={cn(
                            "h-[44px] flex items-center justify-center text-center cursor-pointer transition-all duration-150 select-none",
                            index === selectedIndex
                                ? "text-white text-lg font-semibold"
                                : "text-white/40 text-base"
                        )}
                    >
                        {renderItem ? renderItem(item) : item}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function LiquidDateSheet({
    isOpen,
    onClose,
    onSave,
    initialDate,
    title = "Select Date"
}: LiquidDateSheetProps) {
    const [mounted, setMounted] = useState(false);

    const today = new Date();
    const defaultDate = initialDate || new Date(today.getFullYear() - 25, 0, 1);

    const [year, setYear] = useState(defaultDate.getFullYear());
    const [month, setMonth] = useState(defaultDate.getMonth());
    const [day, setDay] = useState(defaultDate.getDate());

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (isOpen) {
            const date = initialDate || new Date(today.getFullYear() - 25, 0, 1);
            setYear(date.getFullYear());
            setMonth(date.getMonth());
            setDay(date.getDate());

            // Disable pointer events on background dialogs
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
            const contents = document.querySelectorAll('[data-radix-dialog-content]');
            overlays.forEach(el => (el as HTMLElement).style.pointerEvents = 'none');
            contents.forEach(el => (el as HTMLElement).style.pointerEvents = 'none');
        }
        return () => {
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
            const contents = document.querySelectorAll('[data-radix-dialog-content]');
            overlays.forEach(el => (el as HTMLElement).style.pointerEvents = '');
            contents.forEach(el => (el as HTMLElement).style.pointerEvents = '');
        };
    }, [isOpen, initialDate]);

    useEffect(() => {
        const maxDays = getDaysInMonth(year, month).length;
        if (day > maxDays) setDay(maxDays);
    }, [year, month, day]);

    if (!mounted) return null;

    const handleSave = () => {
        triggerHaptic();
        onSave(new Date(year, month, day));
        onClose();
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0"
                    style={{ zIndex: 100000, pointerEvents: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 pointer-events-auto"
                        style={{ backdropFilter: "blur(8px)" }}
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className="absolute bottom-0 left-0 right-0 rounded-t-[28px] bg-[#1c1c1e] border-t border-white/10 pointer-events-auto"
                        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full py-3 flex justify-center">
                            <div className="w-9 h-1 rounded-full bg-white/20" />
                        </div>

                        <div className="flex items-center justify-between px-5 pb-4">
                            <h3 className="text-base font-medium text-white">{title}</h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 -mr-2 rounded-full active:bg-white/10"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        <div className="px-2 pb-6 flex gap-1 pointer-events-auto">
                            <WheelPicker
                                items={months}
                                selectedIndex={month}
                                onSelect={(index) => setMonth(index)}
                                renderItem={(item) => String(item).slice(0, 3)}
                            />

                            <WheelPicker
                                items={getDaysInMonth(year, month)}
                                selectedIndex={day - 1}
                                onSelect={(index) => setDay(index + 1)}
                            />

                            <WheelPicker
                                items={years}
                                selectedIndex={years.indexOf(year)}
                                onSelect={(index) => setYear(years[index])}
                            />
                        </div>

                        <div className="px-5 pb-2 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 rounded-full font-semibold text-[15px] bg-white/10 text-white active:bg-white/15"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="flex-[2] py-4 rounded-full font-semibold text-[15px] text-white bg-gradient-to-r from-emerald-500 to-emerald-600 active:scale-[0.98]"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
