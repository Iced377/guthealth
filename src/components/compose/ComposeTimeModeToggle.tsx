'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface ComposeTimeModeToggleProps {
    mode: 'NOW' | 'EARLIER';
    onChange: (mode: 'NOW' | 'EARLIER') => void;
    className?: string;
    displayTime?: string;
}

export default function ComposeTimeModeToggle({
    mode,
    onChange,
    className,
    displayTime
}: ComposeTimeModeToggleProps) {
    const { isDarkMode } = useTheme();

    return (
        <div className={cn("relative flex h-[32px] rounded-full p-0.5 pointer-events-auto",
            isDarkMode ? "bg-white/10" : "bg-black/5",
            className
        )}>
            {/* Sliding Indicator */}
            <motion.div
                className={cn(
                    "absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full shadow-sm z-0",
                    isDarkMode ? "bg-white/20" : "bg-white"
                )}
                animate={{
                    x: mode === 'NOW' ? 0 : '100%',
                    left: mode === 'NOW' ? '2px' : '0px' // offset adjustment
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />

            {/* Now Option */}
            <button
                type="button"
                onClick={() => onChange('NOW')}
                className={cn(
                    "relative z-10 flex-1 flex items-center justify-center px-3 text-[13px] font-medium transition-colors",
                    mode === 'NOW'
                        ? (isDarkMode ? "text-white" : "text-black")
                        : (isDarkMode ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60")
                )}
            >
                Now
            </button>

            {/* Earlier / Set Time Option */}
            <button
                type="button"
                onClick={() => onChange('EARLIER')}
                className={cn(
                    "relative z-10 flex-1 flex items-center justify-center px-3 text-[13px] font-medium transition-colors truncate max-w-[140px]",
                    mode === 'EARLIER'
                        ? (isDarkMode ? "text-white" : "text-black")
                        : (isDarkMode ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60")
                )}
            >
                {mode === 'EARLIER' && displayTime ? displayTime : 'Set Time'}
            </button>
        </div>
    );
}
