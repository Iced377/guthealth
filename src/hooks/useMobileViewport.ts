'use client';

import { useState, useEffect } from 'react';

/**
 * Tracks the visual viewport height and keyboard state.
 * Useful for keeping floating elements visible when the mobile keyboard opens.
 */
export function useMobileViewport() {
    const [metrics, setMetrics] = useState({
        vvHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
        vvOffsetTop: 0,
        keyboardHeight: 0,
        isKeyboardOpen: false,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateMetrics = () => {
            const vv = window.visualViewport;
            const vvHeight = vv?.height ?? window.innerHeight;
            const vvOffsetTop = vv?.offsetTop ?? 0;
            const keyboardHeight = Math.max(0, window.innerHeight - vvHeight - vvOffsetTop);
            const isKeyboardOpen = keyboardHeight > 40; // Threshold for keyboard detection

            setMetrics({
                vvHeight,
                vvOffsetTop,
                keyboardHeight,
                isKeyboardOpen,
            });
        };

        let rafId: number;
        const handleResize = () => {
            rafId = requestAnimationFrame(updateMetrics);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }
        window.addEventListener('resize', handleResize);

        // Initial check
        updateMetrics();

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return metrics;
}
