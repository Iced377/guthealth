import React from 'react';

export default function Loading() {
    return (
        <div className="flex h-[50vh] w-full items-center justify-center">
            {/* 
              Delayed fade-in wrapper:
              - opacity-0 initially
              - animates to opacity-100
              - "delay-200" is key: content remains invisible for first 200ms
              - If route loads faster than 200ms, user sees nothing (no flicker).
              - If slower, spinner fades in gracefully.
            */}
            <div className="animate-in fade-in duration-700 fill-mode-forwards opacity-0" style={{ animationDelay: '200ms' }}>
                <div className="relative flex h-16 w-16 items-center justify-center">
                    {/* Liquid Outer Ring */}
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary/50 border-r-primary/30 blur-[1px]" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-1 animate-spin rounded-full border-4 border-transparent border-l-primary/40 border-b-primary/20 blur-[2px]" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />

                    {/* Core Pulse */}
                    <div className="h-4 w-4 rounded-full bg-primary/80 blur-[4px] animate-pulse" />
                </div>
                <p className="mt-4 text-center text-xs font-medium text-muted-foreground animate-pulse">
                    Loading...
                </p>
            </div>
        </div>
    );
}
