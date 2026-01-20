'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

type MotionState = 'BROWSE' | 'FOCUS' | 'SHEET' | 'TRANSITION';

interface FeedbackMotionContextType {
    motionState: MotionState;
    setMotionState: (state: MotionState) => void;

    // Gating helpers
    canScroll: boolean;
    canInteract: boolean; // For orb dragging
    isOverlayOpen: boolean;

    // Actions
    enterFocus: () => void;
    exitFocus: () => void;
    openSheet: () => void;
    closeSheet: () => void;
}

const FeedbackMotionContext = createContext<FeedbackMotionContextType | undefined>(undefined);

export const FeedbackMotionControllerProvider = ({ children }: { children: React.ReactNode }) => {
    const [motionState, setMotionState] = useState<MotionState>('SHEET'); // Start with Sheet open usually

    // Gating Logic
    const canScroll = motionState === 'BROWSE';
    const canInteract = motionState === 'FOCUS';
    const isOverlayOpen = motionState === 'SHEET' || motionState === 'TRANSITION';

    const enterFocus = useCallback(() => setMotionState('FOCUS'), []);
    const exitFocus = useCallback(() => setMotionState('BROWSE'), []);
    const openSheet = useCallback(() => setMotionState('SHEET'), []);
    const closeSheet = useCallback(() => setMotionState('BROWSE'), []);

    const value = useMemo(() => ({
        motionState,
        setMotionState,
        canScroll,
        canInteract,
        isOverlayOpen,
        enterFocus,
        exitFocus,
        openSheet,
        closeSheet
    }), [motionState, canScroll, canInteract, isOverlayOpen, enterFocus, exitFocus, openSheet, closeSheet]);

    return (
        <FeedbackMotionContext.Provider value={value}>
            {children}
        </FeedbackMotionContext.Provider>
    );
};

export const useFeedbackMotion = () => {
    const context = useContext(FeedbackMotionContext);
    if (!context) {
        throw new Error('useFeedbackMotion must be used within a FeedbackMotionControllerProvider');
    }
    return context;
};
