'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronRight, Sparkles, Bug, Lightbulb, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface FeedbackEntrySheetProps {
    isOpen: boolean;
    onClose: () => void;
    onOptionSelect: (option: 'improve' | 'bug' | 'feature') => void;
}

export default function FeedbackEntrySheet({
    isOpen,
    onClose,
    onOptionSelect,
}: FeedbackEntrySheetProps) {
    const { isDarkMode } = useTheme();
    const { userProfile } = useAuth();
    const menuRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on click outside
    // Close on click outside - Handled by Backdrop onClick now to prevent double-fire
    // useEffect for mousedown removed to fix "jumps to random page" bug.

    if (!mounted) return null;

    const options = [
        {
            id: 'improve',
            title: 'Rate Your Experience',
            icon: Sparkles,
            color: 'text-amber-500',
            bg: 'bg-gradient-to-br from-amber-400/20 to-orange-500/20'
        },
        {
            id: 'bug',
            title: 'Report a Bug',
            icon: Bug,
            color: 'text-rose-500',
            bg: 'bg-gradient-to-br from-rose-400/20 to-red-500/20'
        },
        {
            id: 'feature',
            title: 'Suggest a Feature',
            icon: Lightbulb,
            color: 'text-blue-500',
            bg: 'bg-gradient-to-br from-blue-400/20 to-indigo-500/20'
        }
    ];

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
                    />

                    {/* Menu Popup */}
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.8, y: 20, x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.8, y: 20, x: "-50%" }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                        }}
                        className={cn(
                            "fixed z-[61] left-1/2 bottom-[15vh]",
                            "w-[90vw] max-w-sm mx-auto",
                            "rounded-[32px] overflow-hidden",
                            // Removed shadow
                            isDarkMode
                                ? "bg-black/40 text-white"
                                : "bg-white/60 text-black",
                            "backdrop-blur-[32px]",
                            "border-0"
                        )}
                        style={{
                            transformOrigin: "bottom center"
                        }}
                    >
                        <div className="flex flex-col py-2">
                            {options.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onOptionSelect(item.id as 'improve' | 'bug' | 'feature')}
                                        className={cn(
                                            "group flex items-center justify-between px-6 py-5 w-full text-left transition-colors duration-200 active:bg-white/5",
                                            "border-b border-white/10 last:border-0", // Separators
                                            // No background on items themselves, purely transparent on the blurred popup
                                            "hover:bg-white/5"
                                        )}
                                    >
                                        <span className="font-headline font-bold text-lg text-foreground">{item.title}</span>
                                        <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
