'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export type InteractionMode = 'BROWSE' | 'SCRUB' | 'FOCUS' | 'TRANSITION';

interface ActiveTooltip {
    chartId: string;
    datum: any;
}

interface TrendsMotionContextType {
    // State
    interactionMode: InteractionMode;
    focusedSceneId: string | null;
    activeTooltip: ActiveTooltip | null;
    isTimePillCollapsed: boolean;

    // Actions
    setInteractionMode: (mode: InteractionMode) => void;
    setFocusedSceneId: (id: string | null) => void;
    setActiveTooltip: (tooltip: ActiveTooltip | null) => void;
    requestFocus: (sceneId: string) => Promise<void>;
    requestBrowse: () => Promise<void>;
    startScrub: (chartId: string) => void;
    endScrub: () => void;

    // Helpers
    isChartInteractionEnabled: boolean;
    globalInputDisabled: boolean;
}

const TrendsMotionControllerContext = createContext<TrendsMotionContextType | undefined>(undefined);

export function TrendsMotionControllerProvider({ children }: { children: ReactNode }) {
    const [interactionMode, _setInteractionMode] = useState<InteractionMode>('BROWSE');
    const [focusedSceneId, setFocusedSceneId] = useState<string | null>(null);
    const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);

    // Helper to safely set mode
    const setInteractionMode = useCallback((mode: InteractionMode) => {
        // Basic guards could go here
        _setInteractionMode(mode);
    }, []);

    const globalInputDisabled = interactionMode === 'TRANSITION';
    // STRICT RULE: Interaction only enabled in FOCUS or SCRUB. BROWSE is read-only.
    const isChartInteractionEnabled = interactionMode === 'FOCUS' || interactionMode === 'SCRUB';
    const isTransitioning = interactionMode === 'TRANSITION';
    const isTimePillCollapsed = interactionMode !== 'BROWSE'; // Collapse on Scrub or Focus

    // TRANSITION PIPELINE 
    // In a real implementation, the calling component (LiquidGraphScene) 
    // drives the timing because it owns the layout animation end callbacks.
    // The controller just provides the state change request methods.

    const requestFocus = useCallback(async (sceneId: string) => {
        if (interactionMode === 'TRANSITION') return;

        // 1. Cancel any scrub
        if (interactionMode === 'SCRUB') {
            setActiveTooltip(null);
        }

        // 2. Set Transition
        setInteractionMode('TRANSITION');

        // 3. Set Target ID (Scene will react to this and start animation)
        setFocusedSceneId(sceneId);

        // Note: The Scene component itself is responsible for calling
        // setInteractionMode('FOCUS') when the animation completes.
    }, [interactionMode]);

    const requestBrowse = useCallback(async () => {
        if (interactionMode === 'TRANSITION') return;

        // 1. Cancel any scrub
        if (interactionMode === 'SCRUB') {
            setActiveTooltip(null);
        }

        // 2. Set Transition
        setInteractionMode('TRANSITION');

        // 3. Clear Target
        setFocusedSceneId(null);

        // Note: The Scene component calls setInteractionMode('BROWSE') on complete.
    }, [interactionMode]);

    const startScrub = useCallback((chartId: string) => {
        // Scrub must yield to transition
        if (interactionMode === 'TRANSITION') return;

        // Only allow starting scrub if we are stable
        if (interactionMode === 'BROWSE' || interactionMode === 'FOCUS') {
            setInteractionMode('SCRUB');
        }
    }, [interactionMode]);

    const endScrub = useCallback(() => {
        if (interactionMode === 'SCRUB') {
            // Return to previous state effectively
            // If we have a focused scene, we go back to FOCUS, else BROWSE
            setInteractionMode(focusedSceneId ? 'FOCUS' : 'BROWSE');
            setActiveTooltip(null);
        }
    }, [interactionMode, focusedSceneId]);


    const value = useMemo(() => ({
        interactionMode,
        focusedSceneId,
        activeTooltip,
        isTimePillCollapsed,
        setInteractionMode,
        setFocusedSceneId,
        setActiveTooltip,
        requestFocus,
        requestBrowse,
        startScrub,
        endScrub,
        isChartInteractionEnabled,
        globalInputDisabled
    }), [interactionMode, focusedSceneId, activeTooltip, isTimePillCollapsed, requestFocus, requestBrowse, startScrub, endScrub]);

    return (
        <TrendsMotionControllerContext.Provider value={value} >
            {children}
        </TrendsMotionControllerContext.Provider>
    );
}

export function useTrendsMotionController() {
    const context = useContext(TrendsMotionControllerContext);
    if (!context) {
        throw new Error('useTrendsMotionController must be used within a TrendsMotionControllerProvider');
    }
    return context;
}
