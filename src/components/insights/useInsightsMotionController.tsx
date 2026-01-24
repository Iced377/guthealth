'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

// STRICT MODES
export type InteractionMode = 'IDLE' | 'BROWSE' | 'FOCUS' | 'TRANSITION';

interface InsightsMotionContextType {
    // State
    interactionMode: InteractionMode;
    activeInsightId: string | null;
    activeSheet: 'coachSession' | null;
    selectedCategory: string;

    // Derived Locks
    scrollLocked: boolean;
    pointerLocked: boolean; // True during TRANSITION
    chromeHidden: boolean;  // True during FOCUS or TRANSITION

    // Actions
    // Actions
    requestExpand: (id: string) => void;
    requestCollapse: () => void;
    setCategory: (category: string) => void;
    openCoach: (options?: { intent?: string }) => void;
    closeCoach: () => void;

    // Lifecycle methods for animation callbacks
    notifyTransitionComplete: () => void;
    notifyExpandComplete: () => void;
    notifyCollapseComplete: () => void;
}

const InsightsMotionContext = createContext<InsightsMotionContextType | null>(null);

export function InsightsMotionControllerProvider({ children }: { children: ReactNode }) {
    const [interactionMode, setInteractionMode] = useState<InteractionMode>('BROWSE');
    const [activeInsightId, setActiveInsightId] = useState<string | null>(null);
    const [activeSheet, setActiveSheet] = useState<'coachSession' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('Today');

    // Derived State
    // BROWSE is the only mode where scroll is allowed.
    // However, if a sheet is open (like Coach), we might want to lock main scroll too, 
    // but typically the sheet overlays it. For now, strict adherence to user rule:
    // scrollLocked = mode !== BROWSE
    const scrollLocked = interactionMode !== 'BROWSE';
    const pointerLocked = interactionMode === 'TRANSITION';
    const chromeHidden = interactionMode === 'FOCUS' || interactionMode === 'TRANSITION';

    // Helpers
    const requestExpand = useCallback((id: string) => {
        if (interactionMode === 'TRANSITION') return; // Ignore taps during transition
        setActiveInsightId(id);
        setInteractionMode('TRANSITION');
        // The component (InsightScene) will handle the dimension locking and layout morph.
        // It must call notifyTransitionComplete() when done.
    }, [interactionMode]);

    const requestCollapse = useCallback(() => {
        if (interactionMode === 'TRANSITION') return;
        setInteractionMode('TRANSITION');
        // The focused component will animate back.
    }, [interactionMode]);

    const notifyTransitionComplete = useCallback(() => {
        setInteractionMode(prev => {
            if (prev === 'TRANSITION') {
                // If we have an active ID, we just finished Expanding -> go FOCUS
                // If we have NO active ID (or we are clearing it?), actually we shouldn't clear ID yet.
                // We likely clear ID *after* collapse animation? 
                // Wait, "Collapse: ... morph back -> onComplete -> setMode(BROWSE)".
                // We need to know which direction we are going.

                // Let's rely on `activeInsightId` presence? 
                // Problem: If we keep ID to animate back, we still have ID.

                // We can check the intended target state.
                // Or better: The *Caller* of this function should probably know?
                // Actually, for simplicity/safety, let's keep it based on current expectations.
                // If we are transitioning AND have an ID, typically we are going to FOCUS.
                // BUT if we requested collapse, we still have the ID until we finish.

                // Refinement: requestCollapse should probably NOT clear ID immediately if we want to layout-morph?
                // Correct. "Measure & Lock Focused Dimensions -> Morph back". 
                // So ID must remain set so the component is still rendered as "Subject".

                // So how do we distinguish Expand-finish vs Collapse-finish?
                // We can accept an argument `nextMode`.
                return prev;
            }
            return prev;
        });
    }, []);

    // We need a more robust `notifyTransitionComplete` that takes the target mode.
    // Or simpler: The component does `setInteractionMode('FOCUS')` or `setInteractionMode('BROWSE')` directly?
    // User said: "onComplete -> setMode(FOCUS)" and "onComplete -> setMode(BROWSE)".
    // So we should expose `setInteractionMode` or specific setters restricted to these transitions.

    // Let's expose specific completion handlers to be safe.
    const completeExpansion = useCallback(() => {
        setInteractionMode('FOCUS');
    }, []);

    const completeCollapse = useCallback(() => {
        setInteractionMode('BROWSE');
        setActiveInsightId(null); // Clear ID *after* we are back in BROWSE (effectively un-focusing visually)
    }, []);

    const openCoach = useCallback((options?: { intent?: string }) => {
        // In a real app, we might store the intent in state to pass to the sheet
        // e.g. setCoachIntent(options?.intent);
        setActiveSheet('coachSession');
    }, []);

    const closeCoach = useCallback(() => {
        setActiveSheet(null);
    }, []);

    const value = useMemo(() => ({
        interactionMode,
        activeInsightId,
        activeSheet,
        selectedCategory,
        scrollLocked,
        pointerLocked,
        chromeHidden,
        requestExpand,
        requestCollapse,
        setCategory: setSelectedCategory,
        openCoach,
        closeCoach,
        // Expose strict completion handlers instead of generic setMode
        notifyExpandComplete: completeExpansion,
        notifyCollapseComplete: completeCollapse,
        // Allow direct transition notification access for flexibility if needed, but preferred above.
        notifyTransitionComplete
    }), [
        interactionMode, activeInsightId, activeSheet, selectedCategory,
        scrollLocked, pointerLocked, chromeHidden,
        requestExpand, requestCollapse, openCoach, closeCoach, completeExpansion, completeCollapse, notifyTransitionComplete
    ]);

    return (
        <InsightsMotionContext.Provider value={value}>
            {children}
            {/* Global Scroll Lock Style */}
            {scrollLocked && (
                <style>{`
                    body { overflow: hidden; touch-action: none; -webkit-overflow-scrolling: auto; }
                `}</style>
            )}
            {/* Global Pointer Lock Layer */}
            {pointerLocked && (
                <div className="fixed inset-0 z-[99999] bg-transparent cursor-wait" style={{ pointerEvents: 'auto' }} />
            )}
        </InsightsMotionContext.Provider>
    );
}

export function useInsightsMotionController() {
    const context = useContext(InsightsMotionContext);
    if (!context) {
        throw new Error('useInsightsMotionController must be used within an InsightsMotionControllerProvider');
    }
    return context;
}
