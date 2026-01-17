'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ChartInteractivityGateProps {
    isEnabled: boolean;
    children: React.ReactNode;
    className?: string;
}

/**
 * PHASE 14: STRICT INTERACTION GATE
 * 
 * Responsibilities:
 * 1. Physically blocks pointer events when disabled (BROWSE/TRANSITION modes).
 * 2. Visual pass-through (renders children).
 * 3. Enforces "Instrument-Grade" stability by preventing accidental hovers.
 */
export function ChartInteractivityGate({ isEnabled, children, className }: ChartInteractivityGateProps) {
    return (
        <div
            className={cn(
                "w-full h-full relative",
                // Hard Rule: pointer-events-none unless strictly enabled
                !isEnabled && "pointer-events-none touch-none",
                className
            )}
            // Double-check: Stop propagation if disabled (though pointer-events handles most)
            onClickCapture={!isEnabled ? (e) => e.stopPropagation() : undefined}
        >
            {children}

            {/* Optional: Debug Visualizer for Gate State (Commented out for prod) */}
            {/* {!isEnabled && <div className="absolute inset-0 z-50 bg-red-500/10 pointer-events-none" />} */}
        </div>
    );
}
