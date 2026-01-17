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

export default function LiquidSegmentedControl({
    options,
    selected,
    onChange,
    layoutIdPrefix,
    className
}: LiquidSegmentedControlProps) {
    return (
        <div className={cn(
            "relative flex items-center p-1 rounded-full",
            // Container Material: Deep Glass Channel
            // Top-to-bottom subtle gradient + Backdrop Blur being handled by parent context usually, 
            // but we enforce our own here for self-containment if needed.
            // However, based on usage, this sits inside other glass bars.
            // Let's make it a 'channel' inside the bar.
            "bg-black/20 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.2)]",
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
                                HapticsService.selection(); // Use standard selection haptic or impactLight? User said "impactLight" or "impactMedium" in Plan. But existing used HapticsService.selection(). Plan says "Create src/lib/haptics.ts... use only one haptic per tap". 
                                // I should probably use `impactLight()` for consistency with LiquidPressable.
                                // But `LiquidSegmentedControl` existing code imports `HapticsService`.
                                // I'll switch to impactLight() if I can import it, or just use HapticsService.impact(ImpactStyle.Light).
                                // Let's use HapticsService.impact(ImpactStyle.Light) as I didn't add the new imports to this file yet.
                                // Wait, HapticsService.selection() is distinct.
                                // User said: "Use only one haptic per tap".
                                // Segmented controls often use "Selection" haptic.
                                // I'll stick to consistency with the "Liquid" feel which usually implies light impact.
                                // I'll update to use `impactLight` if I import it, or just call `HapticsService.impact(ImpactStyle.Light)`.
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
                            // Text "Inked" effect on Active
                            isActive
                                ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                                : "text-white/40 hover:text-white/70"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={`${layoutIdPrefix}-bubble`}
                                className="absolute inset-0 rounded-full -z-10 overflow-hidden"
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            >
                                {/* 1. Base Liquid Body */}
                                <div className="absolute inset-0 bg-white/15 backdrop-blur-sm" />

                                {/* 2. Radial Liquid Highlight (Moves subtly) */}
                                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_0%,transparent_50%)] opacity-50" />

                                {/* 3. Specular Streak (Diagonal Sheen) */}
                                <div className="absolute top-0 right-0 w-[150%] h-full bg-gradient-to-l from-white/10 to-transparent skew-x-[-20deg] opacity-40 translate-x-[20%]" />

                                {/* 4. Inset Thickness Highlight (Top) */}
                                <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.1)]" />

                                {/* 5. Subtle Drop Shadow to Lift */}
                                <div className="absolute inset-0 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
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
