'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

type NavLockReason = 'NONE' | 'CHART_EXPANDED' | 'SHEET_OPEN' | 'PANEL_OPEN' | string;

interface NavVisibilityContextType {
    isNavVisible: boolean;
    navLockReason: NavLockReason;
    setNavVisible: (visible: boolean) => void;
    lockNav: (reason: NavLockReason) => void;
    unlockNav: (reason: NavLockReason) => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextType | undefined>(undefined);

export const NavVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isNavVisible, setIsNavVisibleState] = useState(true);
    const [navLockReason, setNavLockReason] = useState<NavLockReason>('NONE');

    // We keep a set of active locks if we want multiple things to lock it? 
    // The user spec implies a single reason string, but "lockNav('CHART_EXPANDED')" suggests we might need to handle concurrency.
    // "If navLockReason !== 'NONE', ignore all hide/show requests."
    // Let's use a Set or just specific priority. 
    // Simplified: If the user calls lockNav, we set the reason. If they call unlockNav with THAT reason, we clear it (if it matches).
    // Actually, a Set of reasons is safer so multiple locks don't race.
    // But strictly following user spec: "navLockReason: 'NONE' | 'CHART_EXPANDED'..."
    // I will implement a Set internally but expose the "primary" reason or just check if Set.size > 0.

    const [locks, setLocks] = useState<Set<string>>(new Set());

    const currentReason = useMemo(() => {
        if (locks.size === 0) return 'NONE';
        return Array.from(locks)[0]; // Return the first one as the "reason"
    }, [locks]);

    const setNavVisible = useCallback((visible: boolean) => {
        if (locks.size > 0) return; // Locked, ignore
        setIsNavVisibleState(visible);
    }, [locks]);

    const lockNav = useCallback((reason: string) => {
        // When locking, we usually want to ensure it is visible (or keep current state).
        // range: "Prefer visible unless explicitly hidden before lock".
        // I will just lock it. The caller can ensure visibility if they want.
        setLocks(prev => {
            const newLocks = new Set(prev);
            newLocks.add(reason);
            return newLocks;
        });
    }, []);

    const unlockNav = useCallback((reason: string) => {
        setLocks(prev => {
            const newLocks = new Set(prev);
            newLocks.delete(reason);
            return newLocks;
        });
    }, []);

    const value = useMemo(() => ({
        isNavVisible,
        navLockReason: currentReason,
        setNavVisible,
        lockNav,
        unlockNav
    }), [isNavVisible, currentReason, setNavVisible, lockNav, unlockNav]);

    return (
        <NavVisibilityContext.Provider value={value}>
            {children}
        </NavVisibilityContext.Provider>
    );
};

export const useNavVisibility = () => {
    const context = useContext(NavVisibilityContext);
    if (!context) {
        throw new Error('useNavVisibility must be used within a NavVisibilityProvider');
    }
    return context;
};
