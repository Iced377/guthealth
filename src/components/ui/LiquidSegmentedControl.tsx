'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HapticsService, ImpactStyle } from '@/lib/haptics';

interface LiquidSegmentedControlProps {
    options: {
        id: string;
        label: string | React.ReactNode;
        disabled?: boolean;
    }[];
    selected: string;
    onChange: (id: string) => void;
    layoutIdPrefix: string;
    className?: string; // For positioning
}

import { useTheme } from '@/contexts/ThemeContext';

export default function LiquidSegmentedControl({
    options,
    selected,
    onChange,
    layoutIdPrefix,
    className
}: LiquidSegmentedControlProps) {
    const { isDarkMode } = useTheme();

    return (
        <div className={cn(
            "relative flex items-center p-1 rounded-full",
            // Container Material
            isDarkMode
                ? "bg-black/20 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.2)]"
                : "bg-black/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(0,0,0,0.05),inset_0_-1px_1px_rgba(255,255,255,0.5)]",
            className
        )}>
            {options.map((opt) => {
                const isActive = selected === opt.id;

                return (
                    <motion.button
                        key={opt.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!opt.disabled) {
                                HapticsService.impact(ImpactStyle.Light);
                                onChange(opt.id);
                            }
                        }}
                        // Press Physics
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className={cn(
                            "relative px-4 py-2 rounded-full text-xs font-semibold z-10 min-w-[3rem] transition-colors duration-200 select-none",
                            opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                            // Text Colors
                            isActive
                                ? (isDarkMode ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" : "text-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)]")
                                : (isDarkMode ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70")
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={`${layoutIdPrefix}-bubble`}
                                className="absolute inset-0 rounded-full -z-10 overflow-hidden"
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            >
                                {/* 1. Base Liquid Body */}
                                <div className={cn("absolute inset-0 backdrop-blur-sm", isDarkMode ? "bg-white/15" : "bg-white/60")} />

                                {/* 2. Radial Liquid Highlight */}
                                <div className={cn("absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-50",
                                    isDarkMode
                                        ? "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_0%,transparent_50%)]"
                                        : "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_50%)]")}
                                />

                                {/* 3. Specular Streak */}
                                <div className="absolute top-0 right-0 w-[150%] h-full bg-gradient-to-l from-white/10 to-transparent skew-x-[-20deg] opacity-40 translate-x-[20%]" />

                                {/* 4. Inset Thickness Highlight */}
                                <div className={cn("absolute inset-0 rounded-full",
                                    isDarkMode
                                        ? "shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.1)]"
                                        : "shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(0,0,0,0.05)]"
                                )} />

                                {/* 5. Drop Shadow */}
                                <div className="absolute inset-0 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)]" />
                            </motion.div>
                        )}
                        <span className="relative z-20 flex items-center justify-center gap-1.5">
                            {opt.label}
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
}
