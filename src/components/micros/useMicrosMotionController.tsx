'use client';

import React, {
    createContext, useContext, useState, useCallback, useMemo, ReactNode, useRef
} from 'react';

export type InteractionMode = 'BROWSE' | 'FOCUS' | 'TRANSITION';
export type MicrosCluster = 'all' | 'vitamins' | 'minerals' | 'other';
type TransitionIntent = 'OPEN' | 'CLOSE' | null;

interface MicrosMotionContextType {
    interactionMode: InteractionMode;
    focusedNutrientId: string | null;
    selectedCluster: MicrosCluster;

    // Authority actions
    requestNutrientFocus: (id: string) => void;
    requestBrowse: () => void;

    // Handshake (must be called by the morphing component)
    notifyTransitionComplete: () => void;

    // Non-authority setters (avoid using these directly in UI)
    setSelectedCluster: (cluster: MicrosCluster) => void;

    // Derived flags
    isBrowseActive: boolean;
    isFocusActive: boolean;
    isTransitioning: boolean;

    // Debug/telemetry (optional)
    transitionIntent: TransitionIntent;
}

const MicrosMotionControllerContext = createContext<MicrosMotionContextType | undefined>(undefined);

export function MicrosMotionControllerProvider({ children }: { children: ReactNode }) {
    const [interactionMode, setInteractionMode] = useState<InteractionMode>('BROWSE');
    const [focusedNutrientId, setFocusedNutrientId] = useState<string | null>(null);
    const [selectedCluster, setSelectedCluster] = useState<MicrosCluster>('all');

    // Transition intent + pending target (this is the missing piece)
    const [transitionIntent, setTransitionIntent] = useState<TransitionIntent>(null);
    const pendingFocusIdRef = useRef<string | null>(null);
    const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearFailsafe = () => {
        if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
        }
    };

    const armFailsafe = () => {
        clearFailsafe();
        transitionTimerRef.current = setTimeout(() => {
            // If anything goes wrong, unlock to a safe state.
            // We choose the state implied by intent.
            if (transitionIntent === 'OPEN') {
                setInteractionMode('FOCUS');
            } else {
                setFocusedNutrientId(null);
                setInteractionMode('BROWSE');
            }
            setTransitionIntent(null);
            pendingFocusIdRef.current = null;
        }, 1200);
    };

    // BROWSE -> FOCUS (begin OPEN)
    const requestNutrientFocus = useCallback((id: string) => {
        if (interactionMode === 'TRANSITION') return;
        if (interactionMode === 'FOCUS' && focusedNutrientId === id) return;

        pendingFocusIdRef.current = id;
        setTransitionIntent('OPEN');
        setInteractionMode('TRANSITION');

        // IMPORTANT: set the focused id immediately so layoutId morph has a target.
        setFocusedNutrientId(id);

        armFailsafe();
    }, [interactionMode, focusedNutrientId, transitionIntent]);

    // FOCUS -> BROWSE (begin CLOSE)
    const requestBrowse = useCallback(() => {
        if (interactionMode === 'TRANSITION') return;
        if (!focusedNutrientId) return;

        setTransitionIntent('CLOSE');
        setInteractionMode('TRANSITION');

        // IMPORTANT: DO NOT clear focusedNutrientId here.
        // We keep it until the collapse morph completes, then clear in notifyTransitionComplete().
        armFailsafe();
    }, [interactionMode, focusedNutrientId, transitionIntent]);

    // Called by the morphing component when Framer finishes the layoutId morph
    const notifyTransitionComplete = useCallback(() => {
        clearFailsafe();

        if (transitionIntent === 'OPEN') {
            setInteractionMode('FOCUS');
        }

        if (transitionIntent === 'CLOSE') {
            // Now it is safe to clear the focused id (node exists again underneath)
            setFocusedNutrientId(null);
            setInteractionMode('BROWSE');
        }

        setTransitionIntent(null);
        pendingFocusIdRef.current = null;
    }, [transitionIntent]);

    const isBrowseActive = interactionMode === 'BROWSE';
    const isFocusActive = interactionMode === 'FOCUS';
    const isTransitioning = interactionMode === 'TRANSITION';

    const value = useMemo(() => ({
        interactionMode,
        focusedNutrientId,
        selectedCluster,
        setSelectedCluster,
        requestNutrientFocus,
        requestBrowse,
        notifyTransitionComplete,
        isBrowseActive,
        isFocusActive,
        isTransitioning,
        transitionIntent
    }), [
        interactionMode,
        focusedNutrientId,
        selectedCluster,
        requestNutrientFocus,
        requestBrowse,
        notifyTransitionComplete,
        isBrowseActive,
        isFocusActive,
        isTransitioning,
        transitionIntent
    ]);

    return (
        <MicrosMotionControllerContext.Provider value={value}>
            {children}
        </MicrosMotionControllerContext.Provider>
    );
}

export function useMicrosMotionController() {
    const context = useContext(MicrosMotionControllerContext);
    if (!context) throw new Error('useMicrosMotionController must be used within a MicrosMotionControllerProvider');
    return context;
}
