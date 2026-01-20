'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, animate, PanInfo, useSpring, DragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HapticsService } from '@/lib/haptics';

interface LiquidChartCarouselProps {
    children: React.ReactNode[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
    className?: string; // Container class
}

// Standalone Dots Component
export function CarouselDots({ count, currentIndex, className }: { count: number; currentIndex: number; className?: string }) {
    return (
        <div className={cn("flex justify-center gap-2 pointer-events-none z-10", className)}>
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm",
                        idx === currentIndex
                            ? "bg-foreground w-4" // Active
                            : "bg-muted-foreground/40" // Inactive
                    )}
                />
            ))}
        </div>
    );
}

export default function LiquidChartCarousel({
    children,
    currentIndex,
    onIndexChange,
    className,
    showDots = true,
    dragControls
}: LiquidChartCarouselProps & { showDots?: boolean; dragControls?: DragControls }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    // X Motion Value
    // We bind this to the layout. The "target" x position is always -currentIndex * width
    const x = useMotionValue(0);

    // Update width availability
    useEffect(() => {
        if (containerRef.current) {
            setWidth(containerRef.current.offsetWidth);
        }
    }, []);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setWidth(containerRef.current.offsetWidth);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync X to current index when it changes externally or initially
    useEffect(() => {
        if (width > 0) {
            const targetX = -currentIndex * width;
            animate(x, targetX, {
                type: "spring",
                stiffness: 300,
                damping: 30
            });
        }
    }, [currentIndex, width, x]);

    // Drag Logic
    const handleDragEnd = (_: any, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;
        const DRAG_THRESHOLD = width * 0.15; // Increased sensitivity (was 0.25)

        // Determine direction
        // Swiping RIGHT (Positive offset) -> Want PREV index
        // Swiping LEFT (Negative offset) -> Want NEXT index

        let newIndex = currentIndex;

        if (offset > DRAG_THRESHOLD || velocity > 300) {
            // User swiped RIGHT -> Go Prev
            if (currentIndex > 0) {
                newIndex = currentIndex - 1;
            }
        } else if (offset < -DRAG_THRESHOLD || velocity < -300) {
            // User swiped LEFT -> Go Next
            if (currentIndex < children.length - 1) {
                newIndex = currentIndex + 1;
            }
        }

        // Trigger change
        if (newIndex !== currentIndex) {
            HapticsService.selection();
            onIndexChange(newIndex);
        } else {
            // Snap back if no change
            animate(x, -currentIndex * width, {
                type: "spring",
                stiffness: 400,
                damping: 40
            });
        }
    };

    return (
        <div ref={containerRef} className={cn("w-full h-full relative overflow-hidden", className)}>
            {/* Carousel Track */}
            {width > 0 && (
                <motion.div
                    className="flex h-full"
                    style={{
                        x,
                        width: width * children.length,
                    }}
                    drag="x"
                    dragListener={!dragControls}
                    dragControls={dragControls}
                    // Constraints based on current index? No, constraints are total width
                    // Left constraint: can't go further left than index 0 (x=0)
                    // Right constraint: can't go further right than last index (x = -(n-1)*width)
                    // Wait, x is negative...
                    // Leftmost edge visual: x = 0
                    // Rightmost edge visual: x = -totalWidth + viewWidth
                    dragConstraints={{
                        left: -((children.length - 1) * width),
                        right: 0
                    }}
                    dragElastic={0.2} // Looser feel
                    onDragEnd={handleDragEnd}
                >
                    {children.map((child, idx) => (
                        <div
                            key={idx}
                            style={{ width: width }}
                            className="h-full shrink-0"
                        >
                            {child}
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Pagination Dots */}
            {showDots && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none z-50">
                    {children.map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm",
                                idx === currentIndex
                                    ? "bg-foreground w-4" // Active: wider pill, higher contrast
                                    : "bg-muted-foreground/40" // Inactive: slightly more visible
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
