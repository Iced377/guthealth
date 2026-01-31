'use client';
// Force build refresh
import { useRef, useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useInsightsMotionController } from './useInsightsMotionController';
import { LiquidGlassPanel } from './LiquidPrimitive'; // Handles theme for panel bg
import { LiquidPressable } from '@/components/ui/LiquidPressable'; // Handles theme for buttons
import { Minimize2, Maximize2, X } from 'lucide-react';
import { HapticsService, ImpactStyle } from '@/lib/haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens, LiquidMode } from '@/lib/liquid-tokens';

interface InsightSceneProps {
    id: string;
    category: string;
    title: string;
    timeAgo?: string;
    children: React.ReactNode; // The "Detail" content
    preview?: React.ReactNode; // The "Browse" preview content
}

export function InsightScene({
    id,
    category,
    title,
    timeAgo = 'Today',
    children,
    preview
}: InsightSceneProps) {
    const {
        interactionMode,
        activeInsightId,
        requestExpand,
        requestCollapse,
        notifyExpandComplete,
        notifyCollapseComplete
    } = useInsightsMotionController();

    // Theme Tokens
    const { isDarkMode } = useTheme();
    const mode: LiquidMode = isDarkMode ? 'dark' : 'light';
    const tokens = getLiquidTokens(mode);

    const isFocused = activeInsightId === id;
    const isTransitioning = interactionMode === 'TRANSITION';
    const containerRef = useRef<HTMLDivElement>(null);

    // Dimension Locking (omitted for brevity, handled by motion)
    // ...

    const handleTap = () => {
        if (interactionMode !== 'BROWSE') return;
        HapticsService.impact(ImpactStyle.Light);
        requestExpand(id);
    };

    const handleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        HapticsService.impact(ImpactStyle.Light);
        requestCollapse();
    };

    const prevMode = useRef(interactionMode);
    useEffect(() => { prevMode.current = interactionMode; }, [interactionMode]);

    const shouldBeFullscreen = activeInsightId === id && (
        interactionMode === 'FOCUS' ||
        (interactionMode === 'TRANSITION' && prevMode.current === 'BROWSE')
    );

    const onLayoutComplete = () => {
        if (!isTransitioning) return;
        if (shouldBeFullscreen) {
            notifyExpandComplete();
        } else {
            notifyCollapseComplete();
        }
    };

    return (
        <motion.div
            ref={containerRef}
            layout
            layoutId={id}
            onClick={!shouldBeFullscreen ? handleTap : undefined}
            onLayoutAnimationComplete={onLayoutComplete}
            className={cn(
                "relative rounded-3xl overflow-hidden shadow-sm origin-center",
                !shouldBeFullscreen
                    ? "bg-card/40 backdrop-blur-md border border-white/5 my-4 mx-2 w-[calc(100%-1rem)] h-auto active:scale-[0.98] cursor-pointer"
                    : "fixed inset-0 z-[60] bg-background h-[100dvh] w-screen m-0 rounded-none border-none isolate"
            )}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
        >
            {/* STABILITY LAYER: Solid opacity guard (Backplate) */}
            {shouldBeFullscreen && (
                <div className="absolute inset-0 bg-background z-0" />
            )}

            {/* Background Mesh (Only when collapsed to avoid interfering with backplate) */}
            {!shouldBeFullscreen && (
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-white/5 to-transparent" />
            )}

            <motion.div
                className="flex flex-col h-full relative z-10"
                layout="preserve-aspect"
            >
                {/* Header Row */}
                <motion.div layout="position" className={cn("flex items-center justify-between pointer-events-none", shouldBeFullscreen ? "p-8 pt-24 pb-4" : "p-5")}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors",
                            mode === 'dark' ? "bg-white/10" : "bg-black/5"
                        )}>
                            {/* Icon placeholder - Dynamic per category if possible, currently generic dot */}
                            <div className={cn("h-2.5 w-2.5 rounded-full", mode === 'dark' ? "bg-primary/80" : "bg-black/40")} />
                        </div>
                        <div className="flex flex-col">
                            <span className={cn("text-[10px] uppercase tracking-widest font-bold transition-colors mb-0.5", tokens.text.tertiary)}>
                                {category} &bull; {timeAgo}
                            </span>
                            <h3 className={cn("font-bold leading-tight transition-colors", shouldBeFullscreen ? "text-3xl" : "text-lg", tokens.text.primary)}>
                                {title}
                            </h3>
                        </div>
                    </div>
                </motion.div>

                {/* Preview Content (Browse Mode) */}
                {!shouldBeFullscreen && preview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn("text-sm line-clamp-2 px-5 pb-5 pl-[4.25rem] -mt-2 transition-colors", tokens.text.secondary)}
                    >
                        {preview}
                    </motion.div>
                )}

                {/* Detailed Content (Focus Mode) */}
                <AnimatePresence mode="wait">
                    {shouldBeFullscreen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="flex-1 overflow-y-auto px-8 pb-32 touch-pan-y"
                        >
                            <div className={cn("pt-4 transition-colors leading-relaxed text-lg", tokens.text.secondary)}>
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Minimize Button (Floating) */}
            <AnimatePresence>
                {shouldBeFullscreen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute bottom-12 right-6 z-[100]"
                    >
                        <LiquidPressable
                            onClick={handleMinimize}
                            size="md"
                            variant="fab"
                            className={mode === 'dark' ? "bg-white/10 border-white/20" : "bg-white/80 border-black/10 shadow-lg"}
                        >
                            <Minimize2 className={cn("h-5 w-5", tokens.text.primary)} />
                        </LiquidPressable>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
