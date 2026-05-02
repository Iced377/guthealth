'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';

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

    const [locks, setLocks] = useState<Set<string>>(new Set());
    const pathname = usePathname();

    const currentReason = useMemo(() => {
        if (locks.size === 0) return 'NONE';
        return Array.from(locks)[0]; // Return the first one as the "reason"
    }, [locks]);

    const setNavVisible = useCallback((visible: boolean) => {
        setIsNavVisibleState(visible);
    }, []);

    const lockNav = useCallback((reason: string) => {
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

    // Reset visibility to true when the route changes
    useEffect(() => {
        setNavVisible(true);
    }, [pathname, setNavVisible]);

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
