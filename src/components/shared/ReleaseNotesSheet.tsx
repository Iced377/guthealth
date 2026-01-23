'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Tag, Calendar, X } from 'lucide-react';
import { releaseNotesData } from '@/config/releaseNotes';
import { Badge } from "@/components/ui/badge";

interface ReleaseNotesSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReleaseNotesSheet({ isOpen, onClose }: ReleaseNotesSheetProps) {
    const { isDarkMode } = useTheme();
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
                            "shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)]",
                            isDarkMode
                                ? "bg-black/60 text-white"
                                : "bg-white/80 text-black",
                            "backdrop-blur-[32px] backdrop-saturate-[180%]",
                            "flex flex-col max-h-[60vh]"
                        )}
                        style={{
                            transformOrigin: "bottom center"
                        }}
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-2 flex-shrink-0 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-emerald-500" /> Version History
                                </h2>
                                <p className="text-xs opacity-60 mt-1">See what's new in GutCheck.</p>
                            </div>

                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto px-6 pb-6 pt-4 scrollbar-hide">
                            <div className="space-y-8 pl-2">
                                {releaseNotesData.map((note, index) => (
                                    <div key={note.version} className={cn("relative pl-6 border-l", index === 0 ? "border-emerald-500" : "border-gray-200 dark:border-white/10")}>
                                        {/* Timeline Dot */}
                                        <div className={cn(
                                            "absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ring-4 shadow-sm",
                                            isDarkMode ? "ring-black/50" : "ring-white",
                                            index === 0 ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                                        )} />

                                        <div className="flex flex-col gap-1 mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className={cn(
                                                    "text-[10px] px-1.5 py-0 h-5 rounded-md font-bold",
                                                    index === 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/10"
                                                )}>
                                                    {note.version}
                                                </Badge>
                                                <span className="text-[10px] opacity-50 flex items-center gap-1 font-medium uppercase tracking-wide">
                                                    {note.date}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold leading-tight">{note.title || "Update"}</h3>
                                        </div>

                                        <div className="text-sm opacity-80 leading-relaxed space-y-2">
                                            {Array.isArray(note.description) ? (
                                                <ul className="list-disc pl-4 space-y-1 marker:opacity-50">
                                                    {note.description.map((desc, i) => (
                                                        <li key={i}>{desc}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>{note.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
