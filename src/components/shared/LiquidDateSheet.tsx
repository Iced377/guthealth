'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';

interface LiquidDateSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (date: Date) => void;
    initialDate?: Date;
    title?: string;
}

export default function LiquidDateSheet({
    isOpen,
    onClose,
    onSave,
    initialDate,
    title = "Select Date"
}: LiquidDateSheetProps) {
    const [mounted, setMounted] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);

    // Initial mount check for Portal
    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync state
    useEffect(() => {
        if (isOpen) {
            setSelectedDate(initialDate || new Date());
        }
    }, [isOpen, initialDate]);

    // Determine Theme (Simple check or context)
    // For now assuming we want to match the app's hybrid look. 
    // We can use the 'dark' class check if available, or just use generic styles that work on both.
    // The previous component used `useTheme`. Let's assume we can grab it or default to dark-glass if unclear.
    // Ideally we should import useTheme.

    // Quick Scroll Lock
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);


    if (!mounted) return null;

    const handleSave = () => {
        if (selectedDate) {
            onSave(selectedDate);
            onClose();
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000]" style={{ touchAction: 'none' }}>

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 cursor-default"
                        style={{ backdropFilter: "blur(4px)" }}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className={cn(
                            "absolute bottom-0 left-0 right-0 rounded-t-[32px] overflow-hidden flex flex-col pointer-events-auto",
                            "bg-[#1a1a1a]/90 border-t border-white/10 shadow-2xl backdrop-blur-2xl"
                        )}
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        {/* Handle */}
                        <div className="w-full h-6 flex items-center justify-center pt-2">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-2">
                            <h3 className="text-[17px] font-medium text-white opacity-90">{title}</h3>
                            <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5 text-white opacity-60" />
                            </button>
                        </div>

                        {/* Calendar Container */}
                        <div className="px-6 pt-2 pb-8 flex flex-col gap-6">
                            <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden p-2">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                    initialFocus
                                    className="w-full"
                                    classNames={{
                                        head_cell: "text-muted-foreground font-normal text-[0.8rem]",
                                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-full transition-colors text-white",
                                        day_selected: "bg-emerald-500 text-white hover:bg-emerald-600 focus:bg-emerald-500 rounded-full",
                                        day_today: "bg-white/10 text-white",
                                        day_outside: "text-muted-foreground opacity-50",
                                        day_disabled: "text-muted-foreground opacity-50",
                                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                        day_hidden: "invisible",
                                    }}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3.5 rounded-full font-semibold text-[15px] bg-white/10 text-white hover:bg-white/15 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-[2] py-3.5 rounded-full font-semibold text-[15px] text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform"
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
