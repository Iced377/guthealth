'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NormalizedMicronutrient } from '@/hooks/useMicronutrients';
import { useMicrosMotionController } from './useMicrosMotionController';
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import { X, ArrowRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface NutrientFocusSceneProps {
    id: string;
    data: NormalizedMicronutrient[];
    onBack: () => void;
    active?: boolean;
}

// Stable Completion Ring Component
const StableCompletionRing = React.memo(({ score, status, targetValue, unit, hasTarget }: {
    score: number; status: string; targetValue: number | null; unit: string; hasTarget: boolean
}) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = hasTarget ? circumference - (score * circumference) : circumference;

    let ringColor = "stroke-white/20";
    if (status === 'ok') ringColor = "stroke-green-500";
    if (status === 'low') ringColor = "stroke-amber-500";
    if (status === 'high') ringColor = "stroke-red-500";
    if (!hasTarget) ringColor = "stroke-white/10";

    const didMount = useRef(false);
    useEffect(() => { didMount.current = true; }, []);

    return (
        <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r={radius} className="stroke-white/5" strokeWidth="8" fill="none" />
                {hasTarget && (
                    <motion.circle
                        cx="50%" cy="50%" r={radius}
                        className={ringColor}
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        initial={false}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: didMount.current ? 0.5 : 1, ease: "easeOut" }}
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {!hasTarget ? (
                    <span className="text-xl font-medium text-white/40">N/A</span>
                ) : (
                    <>
                        <span className="text-2xl font-bold text-white">
                            {Math.round((score > 1 ? 1 : score) * 100)}%
                        </span>
                        <span className="text-xs text-white/50">of Daily Target</span>
                    </>
                )}
            </div>
        </div>
    );
});
StableCompletionRing.displayName = "StableCompletionRing";

export default function NutrientFocusScene({ id, data, onBack, active = true }: NutrientFocusSceneProps) {
    const {
        notifyTransitionComplete,
        requestBrowse,
        interactionMode,
    } = useMicrosMotionController();
    const { isDarkMode } = useTheme();

    const nutrient = useMemo(() => data.find(d => d.id === id), [data, id]);

    if (!nutrient) return null;
    const Icon = nutrient.icon;

    let statusText = "On Track";
    if (nutrient.status === 'low') statusText = "Deficit";
    if (nutrient.status === 'high') statusText = "Limit Exceeded";
    if (!nutrient.hasTarget) statusText = "Ref. Unavailable";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
            {/* TAP OUTSIDE - Calls requestBrowse directly */}
            <div
                className="fixed inset-0 z-40"
                onClick={() => requestBrowse()}
            />

            {/* LAYER 0: SOLID BACKPLATE */}
            <motion.div
                className={cn(
                    "absolute inset-0 z-40 backdrop-blur-3xl transition-colors duration-700",
                    isDarkMode ? "bg-black/95" : "bg-gray-100/95"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => requestBrowse()}
            />

            {/* LAYER 1: FOCUS CARD - MORPH TARGET */}
            <motion.div
                layoutId={`nutrient-node-${id}`}
                className={cn(
                    "relative w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl safe-area-inset-bottom flex flex-col z-50",
                    "glass-thick dark:glass-crystal border border-white/20 dark:border-white/10",
                    isDarkMode ? "bg-zinc-900/40" : "bg-white/80",
                    "h-auto max-h-[85vh]"
                )}
                initial={{ borderRadius: 100 }}
                animate={{ borderRadius: 32 }}
                exit={{ borderRadius: 100, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                onLayoutAnimationComplete={() => {
                    // HANDSHAKE: Notify controller when morph ends
                    if (interactionMode === 'TRANSITION') {
                        notifyTransitionComplete();
                    }
                }}
            >
                {/* Close Button - Calls requestBrowse */}
                <div className="absolute top-4 right-4 z-50">
                    <LiquidPressable
                        variant="ghost"
                        size="sm"
                        onClick={() => requestBrowse()}
                        className="bg-black/5 dark:bg-white/10 rounded-full p-2"
                    >
                        <X className="w-5 h-5" />
                    </LiquidPressable>
                </div>

                <div className="flex-grow overflow-y-auto no-scrollbar">
                    <div className="flex flex-col p-6 items-center">

                        <motion.div
                            className="flex flex-col items-center mt-6 mb-8"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className={cn(
                                "p-4 rounded-full mb-4 shadow-inner",
                                nutrient.status === 'ok' ? "bg-green-500/10 dark:bg-green-500/20" :
                                    nutrient.status === 'low' ? "bg-amber-500/10 dark:bg-amber-500/20" :
                                        "bg-gray-500/10 dark:bg-gray-500/20"
                            )}>
                                <Icon className={cn("w-10 h-10",
                                    nutrient.status === 'ok' ? "text-green-600 dark:text-green-400" :
                                        nutrient.status === 'low' ? "text-amber-600 dark:text-amber-400" :
                                            "text-gray-500 dark:text-gray-400"
                                )} />
                            </div>
                            <h2 className={cn("text-3xl font-bold tracking-tight mb-1", isDarkMode ? "text-white" : "text-black")}>
                                {nutrient.name}
                            </h2>
                            <span className={cn("text-base font-medium",
                                nutrient.status === 'ok' ? "text-green-600 dark:text-green-400" :
                                    nutrient.status === 'low' ? "text-amber-600 dark:text-amber-400" :
                                        "text-gray-500"
                            )}>{statusText}</span>
                        </motion.div>

                        <div className="mb-10 scale-110">
                            <StableCompletionRing
                                score={nutrient.score}
                                status={nutrient.status}
                                targetValue={nutrient.targetValue}
                                unit={nutrient.unit}
                                hasTarget={nutrient.hasTarget}
                            />
                        </div>

                        <div className={cn(
                            "w-full rounded-2xl p-5 flex flex-col gap-3 mb-8",
                            isDarkMode ? "bg-white/5" : "bg-gray-5"
                        )}>
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium opacity-60">Consumed</span>
                                <span className="text-2xl font-bold tracking-tight">
                                    {Math.round(nutrient.currentValue)}
                                    <span className="text-base ml-1 font-medium opacity-50">{nutrient.unit}</span>
                                </span>
                            </div>
                            <div className="w-full h-px bg-black/10 dark:bg-white/10" />
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium opacity-60">Goal</span>
                                {nutrient.hasTarget ? (
                                    <span className="text-2xl font-bold tracking-tight">
                                        {Math.round(nutrient.targetValue!)}
                                        <span className="text-base ml-1 font-medium opacity-50">{nutrient.unit}</span>
                                    </span>
                                ) : (
                                    <span className="text-sm italic opacity-50">N/A</span>
                                )}
                            </div>
                        </div>

                        {nutrient.status === 'low' && (
                            <motion.button
                                className={cn(
                                    "w-full rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg",
                                    isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"
                                )}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                Find Food Sources <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        )}

                        {nutrient.status === 'unknown' && (
                            <div className="text-center p-4 bg-gray-500/5 rounded-xl w-full">
                                <p className="text-xs opacity-50">
                                    We don't have a recommended daily target for {nutrient.name} yet.
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </motion.div>
        </div>
    );
}
