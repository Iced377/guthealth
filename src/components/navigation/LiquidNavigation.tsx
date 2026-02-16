'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import {
    LayoutGrid,
    Compass,
    PlusCircle,
    LineChart,
    User,
    PenSquare,
    ScanLine,
    RotateCcw,
    HelpCircle,
    Leaf,
    Heart,
    Users,
    Lightbulb,
    Activity,
    UserCircle,
    MessageSquare,
    Sun,
    Moon,
    Shield,
    FileText,
    Info,
    Tag,
    ChevronRight,
} from 'lucide-react';

const CustomActivityIcon = Activity; // Alias for semantic clarity or future swap

import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavVisibility } from '@/components/navigation/useNavVisibilityController';
import { APP_VERSION } from '@/config/releaseNotes';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { Capacitor } from '@capacitor/core';
import { RAMADAN_ENABLED } from '@/lib/featureFlags';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface NavItem {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path?: string;
    isAction?: boolean;
    accessibilityLabel: string;
}

interface SubMenuItem {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path?: string;
    action?: () => void;
    accessibilityLabel: string;
    adminOnly?: boolean;
    hideIfCompleted?: boolean;
}

// Primary navigation items (5 fixed items per spec)
const PRIMARY_NAV: NavItem[] = [
    { id: 'home', icon: LayoutGrid, label: 'Home', path: '/', accessibilityLabel: 'Home, navigate to dashboard' },
    { id: 'explore', icon: Compass, label: 'Explore', accessibilityLabel: 'Explore, open exploration menu' },
    { id: 'log', icon: PlusCircle, label: 'Log', isAction: true, accessibilityLabel: 'Log, open logging options' },
    { id: 'insights', icon: LineChart, label: 'Insights', accessibilityLabel: 'Insights, view analytics' },
    { id: 'profile', icon: User, label: 'Profile', accessibilityLabel: 'Profile, open settings' },
];

// Log button sub-actions (radial/contextual menu)
const LOG_ACTIONS: SubMenuItem[] = [
    { id: 'write', icon: PenSquare, label: 'Write', accessibilityLabel: 'Write, log food with AI' },
    { id: 'scan', icon: ScanLine, label: 'Scan', accessibilityLabel: 'Scan, capture food photo' },
    { id: 'symptoms', icon: CustomActivityIcon, label: 'Symptoms', accessibilityLabel: 'Symptoms, log how you feel' },
    { id: 'reuse', icon: RotateCcw, label: 'Reuse', accessibilityLabel: 'Reuse, pick from favorites' },
];

// Explore sub-items
const EXPLORE_ITEMS: SubMenuItem[] = [
    { id: 'ramadan', icon: Moon, label: 'Ramadan', path: '/explore/ramadan', accessibilityLabel: 'Ramadan, open Ramadan features' },
    { id: 'app-tour', icon: HelpCircle, label: 'App Tour', accessibilityLabel: 'App Tour, start guided experience' },
    { id: 'about', icon: Info, label: 'About', path: '/about', accessibilityLabel: 'About, app information' },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback', path: '/feedback', accessibilityLabel: 'Give Feedback, send feedback' },
    { id: 'version', icon: Tag, label: APP_VERSION, accessibilityLabel: 'Version, view release notes' },
];

// Insights sub-items
const INSIGHTS_ITEMS: SubMenuItem[] = [
    { id: 'insights-view', icon: Lightbulb, label: 'Insights', path: '/insights', accessibilityLabel: 'Insights, AI analysis' },
    { id: 'trends', icon: Activity, label: 'Trends', path: '/trends', accessibilityLabel: 'Trends, view patterns' },

];

// Profile sub-items
const PROFILE_ITEMS: SubMenuItem[] = [
    { id: 'user-centre', icon: UserCircle, label: 'User Centre', path: '/profile', accessibilityLabel: 'User Centre, account settings' },
    { id: 'favorites', icon: Heart, label: 'Favorites', path: '/favorites', accessibilityLabel: 'Favorites, view saved entries' },
    { id: 'theme', icon: Sun, label: 'Theme', accessibilityLabel: 'Toggle light or dark mode' },
    {
        id: 'admin',
        icon: Users,
        label: 'Admin',
        path: '/admin',
        accessibilityLabel: 'Admin Dashboard, manage app',
        adminOnly: true,
        // Mock indicator for now, or passed via props. 
        // Real implementation would use the new prop: showDot 
    },
];

// iOS 26 "Liquid Glass" Physics - Cartoonish, mass-aware, spring-loaded
const LIQUID_SPRING = {
    type: "spring" as const,
    stiffness: 400, // Higher stiffness for faster snap
    damping: 12,    // Lower damping for more bounce/wobble
    mass: 0.8,      // Lighter feel for quick response
    restDelta: 0.001
};

// Colors for Color Reflection behavior
const NAV_COLORS: Record<string, string> = {
    home: '#3b82f6', // blue-500
    explore: '#8b5cf6', // violet-500
    ramadan: '#10b981', // emerald-500 (Green for Ramadan)
    insights: '#f59e0b', // amber-500
    profile: '#ec4899', // pink-500
    log: '#10b981', // emerald-500
};

// Reusable Bubble Indicator Component
const BubbleIndicator = ({ isPressed, layoutId, className, activeColor }: { isPressed: boolean, layoutId?: string, className?: string, activeColor?: string }) => (
    <motion.div
        layoutId={layoutId} // Enables the fluid morphing travel
        className={cn(
            "absolute inset-0 rounded-[24px] z-0", // Match parent radius
            className
        )}
        animate={{
            scale: isPressed ? 0.95 : 1, // Subtle press
        }}
        transition={LIQUID_SPRING}
    >
        {/* 1. Base Liquid Body */}
        <div className="absolute inset-0 rounded-[24px] backdrop-blur-md bg-white/60 dark:bg-white/15" />

        {/* 4. Inset Thickness Highlight */}
        <div className={cn("absolute inset-0 rounded-[24px]",
            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(0,0,0,0.05)]",
            "dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.1)]"
        )} />

        {/* 5. Drop Shadow */}
        <div className="absolute inset-0 rounded-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.15)]" />
    </motion.div>
);

const SPRING_REVEAL = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20
};

// ============================================================================
// COMPONENT
// ============================================================================

interface LiquidNavigationProps {
    onWriteClick?: () => void;
    onScanClick?: () => void;
    onReuseClick?: () => void;
    onSymptomsClick?: () => void;
    onAppTourClick?: () => void;
    onVersionClick?: () => void;

    // Admin/Debug
    isAdmin?: boolean;
    isReleaseNotesOpen?: boolean;

    // Tour Override
    forceActiveTab?: string;
    hasCompletedTour?: boolean;
}

export default function LiquidNavigation({
    onWriteClick,
    onScanClick,
    onReuseClick,
    onSymptomsClick,
    onAppTourClick,
    onVersionClick,
    isAdmin = false,
    isReleaseNotesOpen = false,
    forceActiveTab,
    hasCompletedTour = false,
}: LiquidNavigationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { isNavVisible } = useNavVisibility();
    const { currentStep, isWalkthroughActive } = useWalkthrough();
    const [isWideLayout, setIsWideLayout] = useState(false);

    // Panel states
    const [activePanel, setActivePanel] = useState<'log' | 'explore' | 'insights' | 'profile' | null>(null);
    const [pressedItem, setPressedItem] = useState<string | null>(null);
    const [showAdminDot, setShowAdminDot] = useState(false);
    const [ramadanWelcomeSeen, setRamadanWelcomeSeen] = useState(true);
    const [ramadanVideoReady, setRamadanVideoReady] = useState(false);
    const [showRamadanWelcome, setShowRamadanWelcome] = useState(false);
    const RAMADAN_WELCOME_KEY = 'ramadan_welcome_seen_v1';

    useEffect(() => {
        const updateLayout = () => setIsWideLayout(window.innerWidth >= 1024);
        updateLayout();
        window.addEventListener('resize', updateLayout);
        return () => window.removeEventListener('resize', updateLayout);
    }, []);

    useEffect(() => {
        if (!RAMADAN_ENABLED) {
            setShowRamadanWelcome(false);
            return;
        }
        if (typeof window === 'undefined') return;
        const seen = window.localStorage.getItem(RAMADAN_WELCOME_KEY) === '1';
        setRamadanWelcomeSeen(seen);
    }, []);

    useEffect(() => {
        if (!RAMADAN_ENABLED) return;
        if (typeof window === 'undefined') return;
        if (ramadanWelcomeSeen) return;

        let cancelled = false;
        const preload = () => {
            const video = document.createElement('video');
            video.preload = 'auto';
            video.muted = true;
            (video as any).playsInline = true;
            video.src = '/ramadan-animation.mp4?v=ramadan';
            const markReady = () => {
                if (!cancelled) setRamadanVideoReady(true);
            };
            video.addEventListener('loadeddata', markReady, { once: true });
            video.addEventListener('canplaythrough', markReady, { once: true });
            video.load();
        };

        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(preload);
        } else {
            setTimeout(preload, 0);
        }

        return () => {
            cancelled = true;
        };
    }, [ramadanWelcomeSeen]);

    const isIOS = typeof window !== 'undefined' && Capacitor.getPlatform() === 'ios';
    const enableWebBento = !isIOS && isWideLayout;

    // Poll for new joiners if admin
    useEffect(() => {
        if (!isAdmin) return;
        const check = async () => {
            // Dynamic import to avoid server action issues during build if incorrectly bundled? 
            // Or just call it. Next.js handles server actions in client components.
            try {
                const { checkNewJoinersSince } = await import('@/actions/admin');
                const hasNew = await checkNewJoinersSince(Date.now());
                setShowAdminDot(hasNew);
            } catch (e) {
                // ignore
            }
        };
        // Check once on mount
        check();
        // Optional: Poll every 5 mins?
        // const interval = setInterval(check, 300000);
        // return () => clearInterval(interval);
    }, [isAdmin]);

    // Auto-open Explore panel during Walkthrough Feedback step
    useEffect(() => {
        if (isWalkthroughActive && currentStep?.id === 'welcome-4') {
            setActivePanel('explore');
            return () => setActivePanel(null);
        }
    }, [isWalkthroughActive, currentStep]);

    // INTELLIGENT PREFETCHING
    // 1. Prefetch All Nav on Mount
    useEffect(() => {
        const prefetchRoutes = () => {
            // Primary
            PRIMARY_NAV.forEach(item => item.path && router.prefetch(item.path));
            // Sub-menus
            INSIGHTS_ITEMS.forEach(item => item.path && router.prefetch(item.path));
            EXPLORE_ITEMS.forEach(item => item.path && router.prefetch(item.path));
            PROFILE_ITEMS.forEach(item => item.path && router.prefetch(item.path));
        };

        // Immediate prefetch for responsiveness
        prefetchRoutes();
    }, [router]);

    // 2. Prefetch Sub-Menus on Interaction (When panel opens)
    useEffect(() => {
        if (activePanel === 'explore') {
            EXPLORE_ITEMS.forEach(item => {
                if (item.path) router.prefetch(item.path);
            });
            if (RAMADAN_ENABLED && !ramadanWelcomeSeen) {
                setShowRamadanWelcome(true);
            }
        } else if (activePanel === 'insights') {
            INSIGHTS_ITEMS.forEach(item => {
                if (item.path) router.prefetch(item.path);
            });
        }
        // No heavy routes for profile/log really, mostly actions or modal triggers, 
        // but if Profile had sub-pages, we'd do it here.
    }, [activePanel, router]);


    // Determine active tab
    const getActiveTab = useCallback(() => {
        if (forceActiveTab) return forceActiveTab;
        if (isReleaseNotesOpen) return 'explore';
        if (pathname === '/') return 'home';
        if (pathname.startsWith('/favorites')) return 'explore';
        if (pathname.startsWith('/insights') || pathname.startsWith('/trends')) return 'insights';
        if (pathname.startsWith('/profile')) return 'profile';
        return 'home';
    }, [pathname, isReleaseNotesOpen, forceActiveTab]);

    const activeTab = getActiveTab();

    // Haptic feedback
    const triggerHaptic = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    // Handle primary nav press (Main Menu - Instant)
    const handleNavPress = (item: NavItem) => {
        triggerHaptic();

        if (item.id === 'log') {
            setActivePanel(activePanel === 'log' ? null : 'log');
        } else if (item.id === 'explore') {
            setActivePanel(activePanel === 'explore' ? null : 'explore');
        } else if (item.id === 'insights') {
            setActivePanel(activePanel === 'insights' ? null : 'insights');
        } else if (item.id === 'profile') {
            setActivePanel(activePanel === 'profile' ? null : 'profile');
        } else if (item.path) {
            setActivePanel(null);
            router.push(item.path);
        }
    };

    // Handle Log action (Instant on Release)
    const handleLogAction = (actionId: string) => {
        // Lock Logic for Log Actions
        // Note: Log actions don't have unique IDs in the same way, but we can target them if needed.
        // Usually the tour won't ask to click a specific secondary log action, but if it does, we can support it.
        // For now, if we are in a tour, generally block extraneous clicks unless specifically targeted?
        // Or if the tour step is about "Log", we might allow opening the menu but lock the items?
        // Let's assume strict locking: if tour is active, block unless targeted.
        // Since we don't have 'nav-item-write' target IDs generated yet, we should probably SKIP locking for Log Action children *unless* we update the map loop to add IDs.
        // Let's add IDs to the map loop first, then lock here.
        /* 
           Actually, the safer bet is: if tour is active, BLOCK ALL log actions unless we identify a specific target.
           The user's issue is likely the menus *opening* or items being clickable when they shouldn't.
        */

        const isTargeted = currentStep?.targetId === `nav-item-${actionId}`;
        if (isWalkthroughActive && !isTargeted) return;

        triggerHaptic();
        setActivePanel(null);

        switch (actionId) {
            case 'write':
                onWriteClick?.();
                break;
            case 'scan':
                onScanClick?.();
                break;
            case 'reuse':
                onReuseClick?.();
                break;
            case 'symptoms':
                onSymptomsClick?.();
                break;
        }
    };

    // Handle sub-menu item (Instant on Release)
    const handleSubMenuItem = (item: SubMenuItem) => {
        // Lock Logic for Sub-Menus
        const isTargeted = currentStep?.targetId === `nav-item-${item.id}`;
        if (isWalkthroughActive && !isTargeted) return;

        triggerHaptic();
        setActivePanel(null);

        if (item.id === 'theme') {
            toggleDarkMode();
            return;
        }

        if (item.id === 'app-tour') {
            onAppTourClick?.();
            return;
        }
        if (item.id === 'version') {
            onVersionClick?.();
            return;
        }
        if (item.path) {
            router.push(item.path);
        }
    };

    // Filter items based on conditions
    const filteredExploreItems = EXPLORE_ITEMS.filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.hideIfCompleted && hasCompletedTour) return false;
        return true;
    });

    // Filter profile items for admin
    const filteredProfileItems = PROFILE_ITEMS.filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        return true;
    });

    // Close panel on backdrop click
    const closePanel = () => setActivePanel(null);

    const closeRamadanWelcome = (navigateToRamadan = false) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(RAMADAN_WELCOME_KEY, '1');
        }
        setRamadanWelcomeSeen(true);
        setShowRamadanWelcome(false);
        if (navigateToRamadan) {
            setActivePanel(null);
            router.push('/explore/ramadan');
        }
    };

    return (
        <>
            {/* Ramadan Welcome Modal */}
            <AnimatePresence>
                {showRamadanWelcome && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 backdrop-blur-sm px-5"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Ramadan welcome"
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 16 }}
                            transition={SPRING_REVEAL}
                            className="w-full max-w-[380px] rounded-[28px] bg-[#0E1C16]/95 border border-white/10 shadow-2xl px-6 pt-6 pb-5 text-white relative"
                        >
                            <button
                                onClick={() => closeRamadanWelcome(false)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white text-xs"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                            <div className="flex items-center justify-center mb-4">
                                <div className="relative w-[150px] h-[150px] rounded-full flex items-center justify-center">
                                    <div className="absolute inset-0 bg-emerald-400/30 blur-[40px] rounded-full" />
                                    <div className="relative z-10 w-[140px] h-[140px] rounded-full overflow-hidden border-4 border-white/10 shadow-2xl ring-1 ring-white/20">
                                        {!ramadanVideoReady && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/15 backdrop-blur-sm">
                                                <Moon className="w-10 h-10 text-emerald-200/80 animate-pulse" />
                                            </div>
                                        )}
                                        <video
                                            src="/ramadan-animation.mp4?v=ramadan"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            preload="auto"
                                            poster="/ramadan-bg.png"
                                            onLoadedData={() => setRamadanVideoReady(true)}
                                            className={cn(
                                                "w-full h-full object-cover object-center scale-[1.75] transition-opacity duration-300",
                                                ramadanVideoReady ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-center mb-2">Ramadan Mode Is Here</h3>
                            <p className="text-sm text-white/80 text-center leading-relaxed mb-4">
                                Wishing you a calm, healthy Ramadan season. We’ve prepared a new Ramadan page with
                                daily wisdom, goals, and a calendar to guide your habits this month. We also updated
                                Insights and the Coach to support fasting if you choose it.
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <motion.button
                                    onClick={() => closeRamadanWelcome(false)}
                                    className="px-5 py-2.5 rounded-full text-sm font-bold text-white/80 border border-white/15 hover:border-white/30"
                                    whileTap={{ scale: 1.25 }}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 8 }}
                                >
                                    Maybe later
                                </motion.button>
                                <motion.button
                                    onClick={() => closeRamadanWelcome(true)}
                                    className="px-5 py-2.5 rounded-full text-sm font-bold bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                    whileTap={{ scale: 1.25 }}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 8 }}
                                >
                                    Open Ramadan
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop */}
            <AnimatePresence>
                {activePanel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={closePanel}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* Log Radial Menu */}
            <AnimatePresence>
                {activePanel === 'log' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 15 }} // Reduced scale & y delta
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 15 }}
                        transition={SPRING_REVEAL}
                        className={cn(
                            "fixed z-[100] flex justify-center gap-3 isolation-isolate",
                            enableWebBento
                                ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-0 right-0 w-[50vw] max-w-[640px] mx-auto"
                                : "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4"
                        )} // Bumped Z & added isolation
                        style={{
                            transform: 'translateZ(0)',
                            willChange: 'opacity, transform',
                            contain: 'layout paint style'
                        }}
                    >
                        {LOG_ACTIONS.map((action, index) => {
                            const isTargeted = currentStep?.targetId === `nav-item-${action.id}`;
                            const isLocked = isWalkthroughActive && !isTargeted;
                            return (
                                <motion.button
                                    key={action.id}
                                    id={`nav-item-${action.id}`}
                                    // Removed layoutId to prevent morphing conflict
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        transition: { delay: index * 0.05 }
                                    }}
                                    exit={{ opacity: 0, y: 20 }}
                                    onPointerDown={() => {
                                        if (isLocked) return;
                                        setPressedItem(action.id);
                                    }}
                                    onPointerUp={() => setPressedItem(null)}
                                    onPointerLeave={() => setPressedItem(null)}
                                    onClick={() => handleLogAction(action.id)}
                                    whileTap={{ scale: 1.15 }}
                                    transition={{ type: 'spring', damping: 8, stiffness: 400 }}
                                    className={cn(
                                        "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl",
                                        "select-none",
                                        isLocked && "opacity-50 grayscale cursor-not-allowed pointer-events-none"
                                    )}
                                    aria-label={action.accessibilityLabel}
                                    style={{
                                        // Make sure it stays above during morph
                                        zIndex: action.id === 'reuse' ? 60 : undefined
                                    }}
                                >
                                    {pressedItem === action.id && (
                                        <BubbleIndicator
                                            isPressed={true}
                                            layoutId="actionIndicator"
                                            className="inset-0 rounded-2xl z-0"
                                            activeColor={NAV_COLORS.log}
                                        />
                                    )}
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center relative z-10 transition-opacity duration-200",
                                        pressedItem === action.id ? "opacity-0" : "opacity-100",
                                        action.id === 'write' && "bg-gradient-to-br from-violet-500 to-purple-600",
                                        action.id === 'scan' && "bg-gradient-to-br from-blue-500 to-cyan-600",
                                        action.id === 'symptoms' && "bg-gradient-to-br from-red-400 to-orange-500", // Warm/Alert/Feelings color
                                        action.id === 'reuse' && "bg-gradient-to-br from-pink-500 to-rose-600",
                                        "shadow-lg"
                                    )}>
                                        <action.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-[10px] font-medium text-foreground/80 relative z-10">{action.label}</span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Explore Panel - styled like Log menu */}
            <AnimatePresence>
                {activePanel === 'explore' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 15 }}
                        transition={SPRING_REVEAL}
                        className={cn(
                            "fixed z-[100] flex flex-wrap justify-center items-center gap-3 isolation-isolate px-6 max-w-[340px] mx-auto", // Added flex-wrap, max-w, px-6 to force wrap
                            enableWebBento
                                ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-0 right-0 w-[50vw]"
                                : "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-0 right-0"
                        )}
                        style={{
                            transform: 'translateZ(0)',
                            willChange: 'opacity, transform',
                            contain: 'layout paint style'
                        }}
                    >
                        {filteredExploreItems.map((item, index) => {
                            const isTargeted = currentStep?.targetId === `nav-item-${item.id}`;
                            const isLocked = isWalkthroughActive && !isTargeted;
                            return (
                                <motion.button
                                    key={item.id}
                                    id={`nav-item-${item.id}`} // Keeping the ID for walkthrough targeting
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        transition: { delay: index * 0.05 }
                                    }}
                                    exit={{ opacity: 0, y: 20 }}
                                    onPointerDown={() => {
                                        if (isLocked) return;
                                        setPressedItem(item.id);
                                    }}
                                    onPointerUp={() => setPressedItem(null)}
                                    onPointerLeave={() => setPressedItem(null)}
                                    onPointerEnter={() => item.path && router.prefetch(item.path)}
                                    onClick={() => handleSubMenuItem(item)}
                                    whileTap={{ scale: 1.15 }}
                                    transition={{ type: 'spring', damping: 8, stiffness: 400 }}
                                    className={cn(
                                        "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl",
                                        "select-none",
                                        isLocked && "opacity-50 grayscale cursor-not-allowed pointer-events-none"
                                    )}
                                    aria-label={item.accessibilityLabel}
                                >
                                    {pressedItem === item.id && (
                                        <BubbleIndicator
                                            isPressed={true}
                                            className="inset-0 rounded-2xl z-0"
                                            layoutId="exploreIndicator"
                                            activeColor={NAV_COLORS.explore}
                                        />
                                    )}
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center relative z-10 transition-opacity duration-200",
                                        pressedItem === item.id ? "opacity-0" : "opacity-100",
                                        item.id === 'app-tour' && "bg-gradient-to-br from-indigo-500 to-blue-600",
                                        item.id === 'app-tour' && "bg-gradient-to-br from-indigo-500 to-blue-600",
                                        item.id === 'about' && "bg-gradient-to-br from-gray-500 to-slate-600",
                                        item.id === 'feedback' && "bg-gradient-to-br from-orange-500 to-amber-600",
                                        item.id === 'admin' && "bg-gradient-to-br from-red-500 to-rose-600",
                                        item.id === 'version' && "bg-gradient-to-br from-purple-500 to-violet-600",
                                        item.id === 'ramadan' && "bg-gradient-to-br from-emerald-500 to-green-600",
                                        "shadow-lg"
                                    )}>
                                        <item.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-[10px] font-medium text-foreground/80 text-center max-w-[60px] leading-tight relative z-10">{item.label}</span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Insights Panel - styled like Log menu */}
            <AnimatePresence>
                {activePanel === 'insights' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 15 }}
                        transition={SPRING_REVEAL}
                        className={cn(
                            "fixed z-[100] flex justify-center gap-3 isolation-isolate",
                            enableWebBento
                                ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-0 right-0 w-[50vw] max-w-[640px] mx-auto"
                                : "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4"
                        )}
                        style={{
                            transform: 'translateZ(0)',
                            willChange: 'opacity, transform',
                            contain: 'layout paint style'
                        }}
                    >
                        {INSIGHTS_ITEMS.map((item, index) => {
                            const isTargeted = currentStep?.targetId === `nav-item-${item.id}`;
                            const isLocked = isWalkthroughActive && !isTargeted;
                            return (
                                <motion.button
                                    key={item.id}
                                    id={`nav-item-${item.id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        transition: { delay: index * 0.05 }
                                    }}
                                    exit={{ opacity: 0, y: 20 }}
                                    onPointerDown={() => {
                                        if (isLocked) return;
                                        setPressedItem(item.id);
                                    }}
                                    onPointerUp={() => setPressedItem(null)}
                                    onPointerLeave={() => setPressedItem(null)}
                                    onPointerEnter={() => item.path && router.prefetch(item.path)}
                                    onClick={() => handleSubMenuItem(item)}
                                    whileTap={{ scale: 1.15 }}
                                    transition={{ type: 'spring', damping: 8, stiffness: 400 }}
                                    className={cn(
                                        "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl",
                                        "select-none",
                                        isLocked && "opacity-50 grayscale cursor-not-allowed pointer-events-none"
                                    )}
                                    aria-label={item.accessibilityLabel}
                                >
                                    {pressedItem === item.id && (
                                        <BubbleIndicator
                                            isPressed={true}
                                            className="inset-0 rounded-2xl z-0"
                                            layoutId="insightsIndicator"
                                            activeColor={NAV_COLORS.insights}
                                        />
                                    )}
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center relative z-10 transition-opacity duration-200",
                                        pressedItem === item.id ? "opacity-0" : "opacity-100",
                                        item.id === 'insights-view' && "bg-gradient-to-br from-amber-400 to-orange-500",
                                        item.id === 'trends' && "bg-gradient-to-br from-emerald-400 to-teal-500",

                                        "shadow-lg"
                                    )}>
                                        <item.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-[10px] font-medium text-foreground/80 relative z-10">{item.label}</span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Panel - styled like Log menu */}
            <AnimatePresence>
                {activePanel === 'profile' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 15 }}
                        transition={SPRING_REVEAL}
                        className={cn(
                            "fixed z-[100] flex justify-center gap-3 isolation-isolate",
                            enableWebBento
                                ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-0 right-0 w-[50vw] max-w-[640px] mx-auto"
                                : "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4"
                        )}
                        style={{
                            transform: 'translateZ(0)',
                            willChange: 'opacity, transform',
                            contain: 'layout paint style'
                        }}
                    >
                        {filteredProfileItems.map((item, index) => {
                            const Icon = item.id === 'theme' && isDarkMode ? Moon : item.icon;
                            const isTargeted = currentStep?.targetId === `nav-item-${item.id}`;
                            const isLocked = isWalkthroughActive && !isTargeted;
                            return (
                                <motion.button
                                    key={item.id}
                                    id={`nav-item-${item.id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        transition: { delay: index * 0.05 }
                                    }}
                                    exit={{ opacity: 0, y: 20 }}
                                    onPointerDown={() => {
                                        if (isLocked) return;
                                        setPressedItem(item.id);
                                    }}
                                    onPointerUp={() => setPressedItem(null)}
                                    onPointerLeave={() => setPressedItem(null)}
                                    onPointerEnter={() => item.path && router.prefetch(item.path)}
                                    onClick={() => handleSubMenuItem(item)}
                                    whileTap={{ scale: 1.15 }}
                                    transition={{ type: 'spring', damping: 8, stiffness: 400 }}
                                    className={cn(
                                        "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl",
                                        "select-none",
                                        isLocked && "opacity-50 grayscale cursor-not-allowed pointer-events-none"
                                    )}
                                    aria-label={item.accessibilityLabel}
                                >
                                    {pressedItem === item.id && (
                                        <BubbleIndicator
                                            isPressed={true}
                                            className="inset-0 rounded-2xl z-0"
                                            layoutId="profileIndicator"
                                            activeColor={NAV_COLORS.profile}
                                        />
                                    )}
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center relative z-10 transition-opacity duration-200",
                                        pressedItem === item.id ? "opacity-0" : "opacity-100",
                                        item.id === 'user-centre' && "bg-gradient-to-br from-blue-500 to-indigo-600",
                                        item.id === 'favorites' && "bg-gradient-to-br from-pink-500 to-rose-600",
                                        item.id === 'theme' && "bg-gradient-to-br from-amber-400 to-yellow-500",
                                        item.id === 'admin' && "bg-gradient-to-br from-red-500 to-rose-600",
                                        "shadow-lg"
                                    )}>
                                        <Icon className="w-6 h-6 text-white" />
                                        {item.id === 'admin' && showAdminDot && (
                                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white/20" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-medium text-foreground/80 text-center max-w-[60px] leading-tight relative z-10">{item.label}</span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Navigation Bar - STABILIZED SHELL */}
            {/* 1. NavShell: Static Container (No Animations) - Now Animated for Hide/Show */}
            <motion.div
                className={cn(
                    "fixed z-50",
                    enableWebBento
                        ? "left-0 right-0 w-[50vw] max-w-[640px] mx-auto bottom-[calc(0.5rem+env(safe-area-inset-bottom))]"
                        : "left-4 right-4 bottom-[calc(0.5rem+env(safe-area-inset-bottom))]",
                    "h-16", // CONSTANT HEIGHT (4rem)
                    "rounded-[32px] overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]", // Clipped & Shadowed Container
                    "pointer-events-auto",
                    "isolate",
                    "transform-gpu" // Preserve translate utilities + GPU layer
                )}
                style={{
                    willChange: 'transform, opacity',
                    contain: 'layout paint style'
                }}
                animate={{
                    y: isNavVisible ? 0 : 120, // 120px should clear 4rem (64px) + .5rem (8px) + safe area + margin
                    opacity: isNavVisible ? 1 : 0.8, // Optional: slightly dim when hidden, but user said translate only. Keeping visible opacity.
                    scale: pressedItem ? 1.02 : 1 // Grow on press (User Request)
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    mass: 1
                }}
            >
                {/* 1. Base Liquid Body (Glass) */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-[32px]",
                        "bg-white/10 dark:bg-black/20", // Slightly more base opacity for volume
                        "backdrop-blur-xl backdrop-saturate-[180%]", // Keeping high saturation for color bleed
                        "pointer-events-none"
                    )}
                />




                {/* 4. Inset Thickness Highlight (The Rim) */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-[32px] pointer-events-none",
                        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.05)]",
                        "dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.1)]"
                    )}
                />

                {/* 5. NavContent: INTERACTIVE LAYER (Animations live here) */}
                <div
                    className={cn(
                        "relative flex items-center justify-between w-full h-full",
                        "px-1.5",
                        // Removed border here as Inset Highlight handles it better
                    )}
                >
                    {PRIMARY_NAV.map((item) => {
                        const isActive = activeTab === item.id || activePanel === item.id;
                        const Icon = item.icon;
                        const isPressed = pressedItem === item.id;
                        const shouldPulseExplore = RAMADAN_ENABLED && item.id === 'explore' && !ramadanWelcomeSeen;

                        const isTargeted = currentStep?.targetId === `nav-item-${item.id}`;
                        // Lock logic: If walkthrough active, only allow interaction if this specific item is the target
                        const isLocked = isWalkthroughActive && !isTargeted;

                        return (
                            <motion.button
                                key={item.id}
                                id={`nav-item-${item.id}`} // Ensure ID exists for tour targeting
                                onPointerDown={() => {
                                    if (isLocked) return;
                                    handleNavPress(item);
                                    setPressedItem(item.id);
                                }}
                                onPointerUp={() => setPressedItem(null)}
                                onPointerLeave={() => setPressedItem(null)}
                                // Aggressive Prefetch on Interact
                                onPointerEnter={() => item.path && router.prefetch(item.path)}
                                onClick={(e) => e.preventDefault()}
                                className={cn(
                                    "relative flex flex-col items-center justify-center",
                                    "flex-1 h-full",
                                    "rounded-[24px]",
                                    isPressed && "z-20",
                                    "select-none cursor-pointer",
                                    isLocked && "opacity-50 grayscale cursor-not-allowed pointer-events-none" // Visual feedback for lock
                                )}
                                style={{
                                    WebkitTapHighlightColor: "transparent"
                                }}
                                aria-label={item.accessibilityLabel}
                                aria-current={isActive ? 'page' : undefined}
                                // PRESS ANIMATION IS HERE NOW, NOT ON CONTAINER
                                animate={{ scale: isPressed ? 0.85 : 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                                {/* Active State "Bubble" Indicator */}
                                {((activePanel ? activePanel === item.id : activeTab === item.id)) && !item.isAction && (
                                    <BubbleIndicator
                                        isPressed={isPressed}
                                        layoutId="navIndicator"
                                        activeColor={NAV_COLORS[item.id]}
                                        className="inset-1"
                                    />
                                )}

                                {/* Log Button (Central CTA - Custom Physical Object) */}
                                {item.isAction ? (
                                    <motion.div
                                        className={cn(
                                            "flex items-center justify-center",
                                            "w-12 h-12 rounded-full",
                                            "bg-gradient-to-b from-emerald-400 to-emerald-600",
                                            "shadow-[0_8px_16px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)]"
                                        )}
                                        animate={{
                                            rotate: activePanel === 'log' ? 45 : 0,
                                            scale: isPressed ? 0.9 : 1
                                        }}
                                        transition={LIQUID_SPRING}
                                    >
                                        <PlusCircle className="relative z-10 w-6 h-6 text-white mix-blend-plus-lighter" />
                                    </motion.div>
                                ) : (
                                    <div className="relative z-10 flex flex-col items-center gap-0.5 pointer-events-none">
                                        <Icon
                                            className={cn(
                                                "w-6 h-6 transition-all duration-300",
                                                (activePanel ? activePanel === item.id : activeTab === item.id)
                                                    ? "text-white drop-shadow-md scale-105 stroke-[2.5px]" // Active = White floating on reflection (3. Content Front)
                                                    : "text-foreground/50 grayscale-[0.3] stroke-[2px]",
                                                shouldPulseExplore && "animate-icon-pulse-1 text-amber-300 drop-shadow-[0_0_14px_rgba(251,191,36,0.7)]"
                                            )}
                                        />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div >


        </>
    );
}
