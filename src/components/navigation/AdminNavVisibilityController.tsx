'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useNavVisibility } from '@/components/navigation/useNavVisibilityController';

const HIDE_THRESHOLD = 12;
const SHOW_THRESHOLD = -12;

const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest('button, a, input, textarea, select, label, [role="button"], [data-nav-toggle-ignore]');
};

const isWithinNavShell = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const navShell = document.querySelector('[data-liquid-nav-shell]');
    return !!(navShell && navShell.contains(target));
};

export default function AdminNavVisibilityController() {
    const pathname = usePathname();
    const { isNavVisible, setNavVisible, navLockReason } = useNavVisibility();
    const lastScrollY = useRef(0);
    const navVisibleRef = useRef(isNavVisible);

    useEffect(() => {
        navVisibleRef.current = isNavVisible;
    }, [isNavVisible]);

    useEffect(() => {
        if (!pathname?.startsWith('/admin')) return;
        lastScrollY.current = window.scrollY || 0;
    }, [pathname]);

    useEffect(() => {
        if (!pathname?.startsWith('/admin')) return;

        const handleScroll = () => {
            if (navLockReason !== 'NONE') return;

            const currentY = window.scrollY || 0;
            const diff = currentY - lastScrollY.current;

            if (diff > HIDE_THRESHOLD) {
                setNavVisible(false);
            } else if (diff < SHOW_THRESHOLD) {
                setNavVisible(true);
            }

            lastScrollY.current = currentY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathname, navLockReason, setNavVisible]);

    useEffect(() => {
        if (!pathname?.startsWith('/admin')) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (navLockReason !== 'NONE') return;
            if (isWithinNavShell(event.target)) return;

            if (navVisibleRef.current) {
                if (isInteractiveTarget(event.target)) return;
                setNavVisible(false);
                return;
            }

            setNavVisible(true);
        };

        window.addEventListener('pointerdown', handlePointerDown);
        return () => window.removeEventListener('pointerdown', handlePointerDown);
    }, [pathname, navLockReason, setNavVisible]);

    return null;
}
