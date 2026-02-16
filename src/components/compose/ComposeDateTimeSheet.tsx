'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import LiquidSegmentedControl from '@/components/ui/LiquidSegmentedControl';
import { HapticsService, ImpactStyle } from '@/lib/haptics';

interface ComposeDateTimeSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (date: Date, time: string) => void;
    initialDate: Date;
    initialTime: string; // HH:mm
    keyboardHeight: number;
}

type DateMode = 'TODAY' | 'YESTERDAY' | 'EARLIER';

export default function ComposeDateTimeSheet({
    isOpen,
    onClose,
    onSave,
    initialDate,
    initialTime,
    keyboardHeight
}: ComposeDateTimeSheetProps) {
    const { isDarkMode } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Internal state
    const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
    const [selectedTime, setSelectedTime] = useState<string>(initialTime);
    const [dateMode, setDateMode] = useState<DateMode>('TODAY');
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync state on open
    useEffect(() => {
        if (isOpen) {
            setSelectedTime(initialTime);

            // Determine initial mode
            if (isToday(initialDate)) {
                setDateMode('TODAY');
                setSelectedDate(initialDate);
            } else if (isYesterday(initialDate)) {
                setDateMode('YESTERDAY');
                setSelectedDate(initialDate);
            } else {
                setDateMode('EARLIER');
                setSelectedDate(initialDate);
            }
            setShowCalendar(false);
        }
    }, [isOpen, initialDate, initialTime]);

    // Scroll Locking Logic (Duplicate from ComposeOverlay for safety)
    useEffect(() => {
        if (!isOpen) return;
        const scrollY = window.scrollY;
        const body = document.body;
        const html = document.documentElement;

        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.width = '100%';
        body.style.overflow = 'hidden';
        body.style.touchAction = 'none';
        body.style.overscrollBehavior = 'none';
        html.style.overflow = 'hidden';

        return () => {
            const top = body.style.top;
            body.style.position = '';
            body.style.top = '';
            body.style.left = '';
            body.style.right = '';
            body.style.width = '';
            body.style.overflow = '';
            body.style.touchAction = '';
            body.style.overscrollBehavior = '';
            html.style.overflow = '';

            const y = top ? parseInt(top.replace('-', '').replace('px', ''), 10) : 0;
            window.scrollTo(0, y);
        };
    }, [isOpen]);


    if (!mounted) return null;

    const handleSave = () => {
        // Validation for EARLIER mode
        if (dateMode === 'EARLIER' && !selectedDate) {
            HapticsService.impact(ImpactStyle.Heavy); // Error feedback
            return;
        }

        // Ensure we always have a date
        const finalDate = selectedDate || new Date();
        onSave(finalDate, selectedTime);
        onClose();
    };

    const handleModeChange = (id: string) => {
        const mode = id as DateMode;
        setDateMode(mode);
        setShowCalendar(false); // Reset calendar view

        const today = new Date();
        if (mode === 'TODAY') {
            setSelectedDate(today);
        } else if (mode === 'YESTERDAY') {
            setSelectedDate(subDays(today, 1));
        } else {
            // For EARLIER, we clear it if it was today/yesterday to force explicit selection?
            // Spec says: "Earlier => selectedDate = null until user picks"
            // However, nice UX might be keeping the last picked date if it was earlier.
            // Requirement E says: "Only block Done when: Segment = Earlier AND date is not selected."
            // So let's clear it to enable that validation flow properly.
            setSelectedDate(null);
        }
    };

    const segmentOptions = [
        { id: 'TODAY', label: 'Today' },
        { id: 'YESTERDAY', label: 'Yesterday' },
        { id: 'EARLIER', label: 'Earlier or Future Date' },
    ];

    const canSubmit = !(dateMode === 'EARLIER' && !selectedDate);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[10000]"
                    style={{ touchAction: 'none' }}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className={cn(
                            "absolute inset-0 cursor-default pointer-events-auto",
                            isDarkMode ? "bg-black/60" : "bg-black/20"
                        )}
                        style={{
                            backdropFilter: "blur(4px)"
                        }}
                    />

                    {/* Sheet Container */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className={cn(
                            "absolute bottom-0 left-0 right-0 rounded-t-[32px] overflow-hidden pointer-events-auto",
                            "flex flex-col border-t",
                            // Liquid Glass Styling
                            isDarkMode
                                ? "bg-black/80 border-white/10 shadow-[0_-8px_40px_rgba(0,0,0,0.6)]"
                                : "bg-white/80 border-white/40 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]"
                        )}
                        style={{
                            backdropFilter: "blur(30px)",
                            WebkitBackdropFilter: "blur(30px)",
                            paddingBottom: `calc(env(safe-area-inset-bottom) + ${keyboardHeight}px + 12px)`,
                            maxHeight: '90vh'
                        }}
                    >
                        {/* Drag Handle */}
                        <div className="w-full h-6 flex items-center justify-center pt-2">
                            <div className={cn("w-10 h-1 rounded-full", isDarkMode ? "bg-white/20" : "bg-black/10")} />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-2">
                            <h3 className={cn("text-[17px] font-medium opacity-90", isDarkMode ? "text-white" : "text-black")}>
                                When did you eat?
                            </h3>
                            <button
                                onClick={onClose}
                                className={cn(
                                    "p-2 -mr-2 rounded-full transition-colors",
                                    isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"
                                )}
                            >
                                <X className="w-5 h-5 opacity-60" />
                            </button>
                        </div>

                        <div className="px-6 pt-4 flex flex-col gap-6">
                            {/* 1. Date Segmented Control */}
                            <div>
                                <LiquidSegmentedControl
                                    options={segmentOptions}
                                    selected={dateMode}
                                    onChange={handleModeChange}
                                    layoutIdPrefix="date-sheet-segment"
                                    className="w-full"
                                />
                            </div>

                            {/* 2. Earlier: Date Picker Trigger */}
                            <AnimatePresence mode="wait">
                                {dateMode === 'EARLIER' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex flex-col gap-2 pt-1">
                                            {!showCalendar ? (
                                                <>
                                                    <button
                                                        onClick={() => setShowCalendar(true)}
                                                        className={cn(
                                                            "flex items-center justify-between w-full p-4 rounded-xl border transition-all active:scale-[0.98]",
                                                            isDarkMode
                                                                ? "bg-white/5 border-white/10 hover:bg-white/10"
                                                                : "bg-white/40 border-black/5 hover:bg-white/60",
                                                            !selectedDate && "border-red-500/30 bg-red-500/5"
                                                        )}
                                                    >
                                                        <span className={cn("text-sm font-medium", !selectedDate && "text-red-400")}>
                                                            {selectedDate ? format(selectedDate, 'MMM do, yyyy') : 'Select Date'}
                                                        </span>
                                                        <CalendarIcon className="w-4 h-4 opacity-50" />
                                                    </button>
                                                    {!selectedDate && (
                                                        <span className="text-[11px] text-red-400 pl-1 font-medium">Please pick a date</span>
                                                    )}
                                                </>
                                            ) : (
                                                <div className={cn(
                                                    "rounded-2xl border overflow-hidden p-2",
                                                    isDarkMode ? "bg-black/20 border-white/10" : "bg-white/40 border-gray-200"
                                                )}>
                                                    <Calendar
                                                        mode="single"
                                                        selected={selectedDate || undefined}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                setSelectedDate(date);
                                                                setShowCalendar(false);
                                                            }
                                                        }}
                                                        disabled={(date) => date < new Date("1900-01-01")}
                                                        initialFocus
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 3. Time Input */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-medium opacity-60 ml-1 uppercase tracking-wider">Time</label>
                                <div className={cn(
                                    "relative w-full h-[52px] rounded-xl overflow-hidden flex items-center px-4 border transition-colors",
                                    isDarkMode ? "bg-white/5 border-white/10" : "bg-white/50 border-gray-200"
                                )}>
                                    <input
                                        type="time"
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className={cn(
                                            "w-full h-full bg-transparent border-0 outline-none text-lg font-mono tracking-wider",
                                            "focus:ring-0",
                                            isDarkMode ? "text-white color-scheme-dark" : "text-black color-scheme-light"
                                        )}
                                        style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                                    />
                                </div>
                            </div>

                            {/* 4. Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className={cn(
                                        "flex-1 py-3.5 rounded-full font-semibold text-[15px] transition-transform active:scale-[0.97]",
                                        isDarkMode ? "bg-white/10 text-white hover:bg-white/15" : "bg-black/5 text-black hover:bg-black/10"
                                    )}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!canSubmit}
                                    className={cn(
                                        "flex-[2] py-3.5 rounded-full font-semibold text-[15px] text-white transition-all active:scale-[0.97]",
                                        canSubmit
                                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20"
                                            : "bg-gray-500/20 text-white/20 cursor-not-allowed"
                                    )}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
