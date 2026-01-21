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
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

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
                            "shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)]",
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
                                        className="flex items-center gap-4 px-6 py-4 w-full text-left transition-transform active:scale-[0.98]"
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                                            item.bg
                                        )}>
                                            <Icon className={cn("w-6 h-6", item.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-base">{item.title}</h4>
                                        </div>
                                        <ChevronRight className="w-5 h-5 opacity-30" />
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
