'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
    const containerRef = useRef<HTMLDivElement>(null);
    const nowRef = useRef<HTMLButtonElement>(null);
    const earlierRef = useRef<HTMLButtonElement>(null);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    const updateIndicator = () => {
        const container = containerRef.current;
        const target = mode === 'NOW' ? nowRef.current : earlierRef.current;
        if (!container || !target) return;

        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        setIndicator({
            left: Math.max(0, targetRect.left - containerRect.left),
            width: Math.max(0, targetRect.width)
        });
    };

    useLayoutEffect(() => {
        updateIndicator();
    }, [mode, displayTime]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => updateIndicator();
        window.addEventListener('resize', handleResize);

        let observer: ResizeObserver | null = null;
        if ('ResizeObserver' in window) {
            observer = new ResizeObserver(() => updateIndicator());
            if (containerRef.current) observer.observe(containerRef.current);
            if (nowRef.current) observer.observe(nowRef.current);
            if (earlierRef.current) observer.observe(earlierRef.current);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (observer) observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative flex w-full min-h-[32px] rounded-full p-0.5 pointer-events-auto",
            isDarkMode ? "bg-white/10" : "bg-black/5",
            className
            )}
        >
            {/* Sliding Indicator */}
            <motion.div
                className={cn(
                    "absolute left-0 top-0.5 bottom-0.5 rounded-full shadow-sm z-0",
                    isDarkMode ? "bg-white/20" : "bg-white"
                )}
                animate={{
                    x: indicator.left,
                    width: indicator.width
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />

            {/* Now Option */}
            <button
                type="button"
                onClick={() => onChange('NOW')}
                className={cn(
                    "relative z-10 shrink-0 flex items-center justify-center px-3 py-1.5 text-[13px] font-medium transition-colors whitespace-nowrap",
                    mode === 'NOW'
                        ? (isDarkMode ? "text-white" : "text-black")
                        : (isDarkMode ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60")
                )}
                ref={nowRef}
            >
                Now
            </button>

            {/* Earlier / Set Time Option */}
            <button
                type="button"
                onClick={() => onChange('EARLIER')}
                className={cn(
                    "relative z-10 flex-1 min-w-0 flex items-center justify-center px-3 py-1.5 text-[13px] font-medium transition-colors text-center leading-tight",
                    mode === 'EARLIER'
                        ? (isDarkMode ? "text-white" : "text-black")
                        : (isDarkMode ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60")
                )}
                ref={earlierRef}
            >
                {mode === 'EARLIER' && displayTime ? displayTime : 'Set Time'}
            </button>
        </div>
    );
}
