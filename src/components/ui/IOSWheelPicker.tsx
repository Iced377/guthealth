'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { EmblaCarouselType } from 'embla-carousel';
import { cn } from '@/lib/utils';
import { HapticsService } from '@/lib/haptics';

interface IOSWheelPickerProps {
    items: { label: string; value: any }[];
    selectedValue: any;
    onValueChange: (value: any) => void;
    label?: string;
    className?: string;
    loop?: boolean;
}

export default function IOSWheelPicker({
    items,
    selectedValue,
    onValueChange,
    label,
    className,
    loop = false,
}: IOSWheelPickerProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop,
        axis: 'y',
        dragFree: false,
        containScroll: false,
        skipSnaps: true, // Enable momentum scrolling (roll on flick)
        watchDrag: true, // Ensure drag is watched
        align: 'center', // Robust centering
    });

    const [isInternalUpdate, setIsInternalUpdate] = useState(false);

    useEffect(() => {
        if (!emblaApi || isInternalUpdate) return;
        const index = items.findIndex(item => item.value === selectedValue);
        if (index !== -1 && index !== emblaApi.selectedScrollSnap()) {
            emblaApi.scrollTo(index);
        }
    }, [emblaApi, items, selectedValue, isInternalUpdate]);

    const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
        const index = emblaApi.selectedScrollSnap();
        const value = items[index]?.value;
        if (value !== undefined) {
            setIsInternalUpdate(true);
            onValueChange(value);
            HapticsService.selection();
            setTimeout(() => setIsInternalUpdate(false), 50);
        }
    }, [items, onValueChange]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi, onSelect]);

    return (
        <div
            className={cn("relative font-sans h-48 w-full touch-pan-y", className)}
            onPointerDown={(e) => e.stopPropagation()} // Stop pointer events from bubbling to Framer Motion drag
            onTouchStart={(e) => e.stopPropagation()} // Stop touch events from bubbling
        >
            {/* Center Indication - Minimal lines instead of block */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-[20px] bg-gradient-to-r from-transparent via-foreground/20 to-transparent z-0" />
            <div className="absolute top-1/2 left-0 right-0 h-[1px] translate-y-[20px] bg-gradient-to-r from-transparent via-foreground/20 to-transparent z-0" />

            {/* Viewport with Heavy Mask for Fade Out */}
            <div
                className="h-full w-full overflow-hidden"
                ref={emblaRef}
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent, black 35%, black 65%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 35%, black 65%, transparent)'
                }}
            >
                <div className="flex flex-col h-full will-change-transform preserve-3d">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 flex items-center justify-center h-9 w-full select-none"
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            <span
                                className={cn(
                                    "text-xl transition-all duration-300",
                                    item.value === selectedValue
                                        ? "font-bold text-foreground scale-110"
                                        : "font-normal text-muted-foreground opacity-30 scale-90 blur-[0.5px]"
                                )}
                            >
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Label Overlay */}
            {label && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold uppercase text-muted-foreground z-20 opacity-40">
                    {label}
                </div>
            )}
        </div>
    );
}
