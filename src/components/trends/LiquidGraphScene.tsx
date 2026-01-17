'use client';

import { ReactNode, useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2 } from 'lucide-react';
import { HapticsService, ImpactStyle } from '@/lib/haptics';
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import { useTrendsMotionController } from './useTrendsMotionController';

interface LiquidGraphSceneProps {
    id: string; // Unique ID for controller
    insightTitle: string;
    contextLabel: string;
    children: ReactNode;
    className?: string;
    description?: string;
}

export default function LiquidGraphScene({
    id,
    insightTitle,
    contextLabel,
    children,
    className,
    description
}: LiquidGraphSceneProps) {
    const {
        focusedSceneId,
        interactionMode,
        requestFocus,
        requestBrowse,
        setInteractionMode,
        globalInputDisabled
    } = useTrendsMotionController();

    const containerRef = useRef<HTMLDivElement>(null);
    const [frozenStyle, setFrozenStyle] = useState<React.CSSProperties>({});

    // Derived State
    const isFocused = focusedSceneId === id;
    // We are the "active subject" if we are focused OR if we are transitioning to/from focus
    // But strictly, visual focus state depends on the ID match.

    const handleExpand = () => {
        HapticsService.impact(ImpactStyle.Medium);
        requestFocus(id);
    };

    const handleCollapse = () => {
        HapticsService.impact(ImpactStyle.Light);
        requestBrowse();
    };

    // Dimension Locking Logic
    const onLayoutStart = () => {
        if (interactionMode === 'TRANSITION' && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Lock dimensions to prevent internal content thrashing during morph
            setFrozenStyle({
                width: rect.width,
                height: rect.height,
                // Lock padding/radius if they change dynamically, 
                // but usually maintaining W/H is enough if children are responsive.
            });
        }
    };

    const onLayoutComplete = () => {
        // Unlock
        setFrozenStyle({});

        // Determine next state
        if (interactionMode === 'TRANSITION') {
            // Only the relevant scene should trigger the state advance
            // If we are focused, we just finished Expanding -> set FOCUS
            // If we are NOT focused (and nobody is?), we finished Collapsing -> set BROWSE
            // NOTE: This logic needs to be careful not to race if multiple scenes animate.
            // But usually only one scene strictly morphs its layoutId "expansion".

            if (isFocused) {
                setInteractionMode('FOCUS');
            } else if (focusedSceneId === null) {
                // Verify we are the one who finished? 
                // For collapse, all scenes might layout-animate back to list.
                // It's safer if the controller handles the timeout fallback, 
                // OR we just assume the first one to finish triggers it. 
                // setting 'BROWSE' multiple times is idempotent and fine.
                setInteractionMode('BROWSE');
            }
        }
    };

    return (
        <motion.div
            ref={containerRef}
            layout
            layoutId={`scene-${id}`} // Shared layoutId for smooth morph if we had a separate view, but here we just layout-animate the list item.
            // Actually, without a separate "overlay" component, `layout` prop handles the morph in place.
            onLayoutAnimationStart={onLayoutStart}
            onLayoutAnimationComplete={onLayoutComplete}
            style={frozenStyle}
            className={cn(
                "relative rounded-3xl overflow-hidden shadow-sm origin-center",
                // Transition settings handled by Framer default or we can override transition prop
                // Conditional Styling
                !isFocused
                    ? "bg-card/40 backdrop-blur-md border border-white/5 my-4 mx-2 w-[calc(100%-1rem)] snap-center h-[60vh]"
                    : "fixed inset-0 z-50 bg-background h-[100dvh] w-screen m-0 rounded-none border-none",
                className
            )}
            onClick={() => !isFocused && !globalInputDisabled && handleExpand()}
        >
            {/* Background Mesh */}
            {!isFocused && (
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-white/5 to-transparent" />
            )}

            {/* Content Container */}
            <div className={cn(
                "relative flex flex-col h-full p-6 transition-all duration-300",
                isFocused ? "pt-24 px-8 pb-32" : "justify-center"
            )}>

                {/* Header */}
                <motion.div layout="position" className="mb-6 z-10 pointer-events-none">
                    <motion.p
                        layout="position"
                        className="text-xs font-semibold tracking-widest text-[#2aac6b] uppercase mb-1 opacity-80"
                    >
                        {contextLabel}
                    </motion.p>
                    <motion.h2
                        layout="position"
                        className={cn(
                            "font-bold text-foreground leading-tight",
                            isFocused ? "text-4xl" : "text-2xl"
                        )}
                    >
                        {insightTitle}
                    </motion.h2>
                    <AnimatePresence>
                        {(isFocused && description) && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.2 }} // Delay text until morph settles
                                className="mt-4 text-muted-foreground text-lg max-w-xl"
                            >
                                {description}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Ink Layer (Chart) */}
                <div className="flex-grow w-full h-full min-h-0 relative pointer-events-auto isolate">
                    {/* The Chart children must handle their own non-intrusiveness during transition */}
                    {children}
                </div>

                {/* Controls */}
                <LiquidPressable
                    variant="icon"
                    size="md"
                    haptic="light"
                    disabled={globalInputDisabled}
                    onClick={(e) => {
                        e?.stopPropagation();
                        isFocused ? handleCollapse() : handleExpand();
                    }}
                    className={cn(
                        "absolute z-[100] transition-all duration-500",
                        isFocused ? "bottom-28 right-6" : "top-6 right-6"
                    )}
                >
                    {isFocused ? (
                        <Minimize2 className="h-5 w-5 opacity-90" />
                    ) : (
                        <Maximize2 className="h-5 w-5 opacity-90" />
                    )}
                </LiquidPressable>
            </div>
        </motion.div>
    );
}
