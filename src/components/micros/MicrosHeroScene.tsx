'use client';

import React, { useCallback } from 'react';
import { useMicrosMotionController } from './useMicrosMotionController';
import { useMicronutrients } from '@/hooks/useMicronutrients';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import NutrientConstellation from './NutrientConstellation';
import MicrosClusterStrip from './MicrosClusterStrip';
import NutrientFocusScene from './NutrientFocusScene';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export default function MicrosHeroScene() {
    const { user } = useAuth();
    const { data, loading, setTimeRange, timeRange } = useMicronutrients(user?.uid);
    const {
        interactionMode,
        focusedNutrientId,
        requestNutrientFocus,
        requestBrowse,
    } = useMicrosMotionController();
    const { isDarkMode } = useTheme();

    // STRICT RENDERING LOGIC
    // Purpose: Guarantee explicit scene authority
    const isBrowse = interactionMode === 'BROWSE';
    const isFocus = interactionMode === 'FOCUS';
    const isTransition = interactionMode === 'TRANSITION';

    // RENDER: Constellation is visible only in BROWSE and TRANSITION
    // It remains mounted in TRANSITION to allow morph source existence.
    // It is unmounted in FOCUS to prevent fighting.
    const showConstellation = isBrowse || isTransition;

    // RENDER: Focus Scene is visible in FOCUS and TRANSITION (if specific ID targeted)
    const showFocusScene = (isFocus || isTransition) && !!focusedNutrientId;

    // HEADER: Visible only in BROWSE (and TRANSITION out logic if needed, but simplest is !FOCUS)
    // Actually, header should probably stay during transition to BROWSE?
    // If we want it to 'fade in' when returning.
    const showHeader = !isFocus;

    // Time Range Handlers
    const handleFocusBack = useCallback(() => {
        requestBrowse();
    }, [requestBrowse]);

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden bg-black/90">

            {/* BACKGROUND ATMOSPHERE - Pointer Events None */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className={cn(
                    "absolute top-[-10%] left-[-10%] w-[120%] h-[60%] blur-[100px] opacity-20 transition-colors duration-1000",
                    isDarkMode ? "bg-indigo-900" : "bg-blue-200"
                )} />
            </div>

            {/* HEADER AREA - SAFE TOP */}
            <AnimatePresence>
                {showHeader && (
                    <motion.div
                        className="pt-safe-top px-6 pb-2 relative z-20 flex-shrink-0"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }} // Animate out
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex justify-between items-end mb-6 mt-4">
                            <div>
                                <h1 className={cn("text-3xl font-light tracking-tight", isDarkMode ? "text-white/90" : "text-black/90")}>
                                    Nutrients
                                </h1>
                                <p className={cn("text-sm font-medium", isDarkMode ? "text-white/50" : "text-black/50")}>
                                    Daily Observatory
                                </p>
                            </div>

                            {/* Liquid Segmented Control */}
                            <div className={cn(
                                "flex p-1 rounded-full relative glass-ultra-thin",
                            )}>
                                {(['TODAY', '7D', '30D'] as const).map(range => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={cn(
                                            "px-3 py-1 text-xs rounded-full transition-all font-medium relative z-10",
                                            timeRange === range
                                                ? (isDarkMode ? "text-black" : "text-white")
                                                : (isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black")
                                        )}
                                    >
                                        {range}
                                        {timeRange === range && (
                                            <motion.div
                                                className={cn(
                                                    "absolute inset-0 rounded-full -z-10 shadow-sm",
                                                    isDarkMode ? "bg-white" : "bg-black"
                                                )}
                                                layoutId="timeRangeActive"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <MicrosClusterStrip />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ORB STAGE */}
            {/* Strict Gating: Unmounts in FOCUS */}
            {showConstellation && (
                <motion.div
                    className="flex-grow relative z-10 flex items-center justify-center w-full pb-safe-bottom"
                    // Dim/Disable during TRANSITION
                    animate={{
                        opacity: isTransition ? 0.3 : 1,
                        filter: isTransition ? 'blur(4px)' : 'blur(0px)',
                        scale: isTransition ? 0.95 : 1,
                    }}
                    transition={{ duration: 0.5 }}
                    // Strict Pointer Check: No interactions during morph
                    style={{ pointerEvents: isTransition ? 'none' : 'auto' }}
                >
                    <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] flex-shrink-0 pointer-events-none">
                        {/* Nodes handle their own pointer-events-auto */}
                        <NutrientConstellation
                            data={data}
                            onSelect={requestNutrientFocus}
                        />
                    </div>
                </motion.div>
            )}

            {/* FOCUS SCENE OVERLAY */}
            <AnimatePresence initial={false}>
                {showFocusScene && (
                    <NutrientFocusScene
                        id={focusedNutrientId!}
                        data={data}
                        onBack={handleFocusBack}
                        active={!isTransition}
                    />
                )}
            </AnimatePresence>

            {/* TRANSITION BLOCKER */}
            {/* Ensures global pointer lock during state change to prevent double-taps/ghosts */}
            {isTransition && (
                <div className="absolute inset-0 z-[100] cursor-wait" />
            )}
        </div>
    );
}
