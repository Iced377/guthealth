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
import { liquidDisplacementBase64 } from '@/config/liquidFilter';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavVisibility } from '@/components/navigation/useNavVisibilityController';
import { APP_VERSION } from '@/config/releaseNotes';
import { useWalkthrough } from '@/contexts/WalkthroughContext';

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
    { id: 'app-tour', icon: HelpCircle, label: 'App Tour', accessibilityLabel: 'App Tour, start guided experience' },
    { id: 'about', icon: Info, label: 'About', path: '/about', accessibilityLabel: 'About, app information' },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback', path: '/feedback', accessibilityLabel: 'Give Feedback, send feedback' },
    { id: 'version', icon: Tag, label: APP_VERSION, accessibilityLabel: 'Version, view release notes' },
];

// Insights sub-items
const INSIGHTS_ITEMS: SubMenuItem[] = [
    { id: 'insights', icon: Lightbulb, label: 'Insights', path: '/insights', accessibilityLabel: 'Insights, AI analysis' },
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
    insights: '#f59e0b', // amber-500
    profile: '#ec4899', // pink-500
    log: '#10b981', // emerald-500
};

// Reusable Bubble Indicator Component
const BubbleIndicator = ({ isPressed, layoutId, className, activeColor }: { isPressed: boolean, layoutId?: string, className?: string, activeColor?: string }) => (
    <motion.div
        layoutId={layoutId} // Enables the fluid morphing travel
        className={cn(
            "absolute inset-0 rounded-[28px] overflow-hidden",
            // PURE LENS EFFECT:
            "bg-white/5 dark:bg-white/5", // Very subtle tint
            "backdrop-blur-md", // Standard blue
            "border border-white/20 dark:border-white/10",
            className
        )}
        // Removed SVG filter for now as it might be distorting the highlight improperly
        animate={{
            scale: isPressed ? 0.75 : 1, // Deep press effect (0.75 scale)
        }}
        transition={LIQUID_SPRING}
    >
        {/* Subtle Gradient Glow (Ambient Light) */}
        <div
            className="absolute inset-0 opacity-20 transition-colors duration-500"
            style={{
                background: `radial-gradient(circle at center, ${activeColor || 'transparent'}, transparent 70%)`
            }}
        />
    </motion.div>
);

const SPRING_REVEAL = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface LiquidNavigationProps {
    onWriteClick?: () => void;
    onScanClick?: () => void;
    onReuseClick?: () => void;
    onSymptomsClick?: () => void;
    onFeedbackClick?: () => void;
    onAppTourClick?: () => void;
    onVersionClick?: () => void;
    isAdmin?: boolean;
    hasCompletedTour?: boolean;
    isReleaseNotesOpen?: boolean;
}

export default function LiquidNavigation({
    onWriteClick,
    onScanClick,
    onReuseClick,
    onSymptomsClick,
    onFeedbackClick,
    onAppTourClick,
    onVersionClick,
    isAdmin = false,
    hasCompletedTour = false,
    isReleaseNotesOpen = false,
}: LiquidNavigationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { isNavVisible } = useNavVisibility();
    const { currentStep, isWalkthroughActive } = useWalkthrough();

    // Panel states
    const [activePanel, setActivePanel] = useState<'log' | 'explore' | 'insights' | 'profile' | null>(null);
    const [pressedItem, setPressedItem] = useState<string | null>(null);
    const [showAdminDot, setShowAdminDot] = useState(false);

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

    // Determine active tab
    const getActiveTab = useCallback(() => {
        if (isReleaseNotesOpen) return 'explore';
        if (pathname === '/') return 'home';
        if (pathname.startsWith('/favorites')) return 'explore';
        if (pathname.startsWith('/insights') || pathname.startsWith('/trends')) return 'insights';
        if (pathname.startsWith('/profile')) return 'profile';
        return 'home';
    }, [pathname, isReleaseNotesOpen]);

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

    return (
        <>
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
                        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[100] flex justify-center gap-3 isolation-isolate" // Bumped Z & added isolation
                        style={{
                            transform: 'translateZ(0)',
                            willChange: 'opacity, transform',
                            contain: 'layout paint style'
                        }}
                    >
                        {LOG_ACTIONS.map((action, index) => (
                            <motion.button
                                key={action.id}
                                // Removed layoutId to prevent morphing conflict
                                initial={{ opacity: 0, y: 20 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    transition: { delay: index * 0.05 }
                                }}
                                exit={{ opacity: 0, y: 20 }}
                                onPointerDown={() => setPressedItem(action.id)}
                                onPointerUp={() => setPressedItem(null)}
                                onPointerLeave={() => setPressedItem(null)}
                                onClick={() => handleLogAction(action.id)}
                                className={cn(
                                    "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl",
                                    // Liquid Glass material
                                    "bg-white/15 dark:bg-black/40",
                                    "backdrop-blur-2xl saturate-150",
                                    "border-0",
                                    "shadow-[0_8px_32px_rgba(0,0,0,0.05)]",
                                    "select-none"
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
                        ))}
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
                        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[100] flex justify-center gap-3 isolation-isolate"
                        style={{
                            transform: 'translateZ(0)',
                            willChange: 'opacity, transform',
                            contain: 'layout paint style'
                        }}
                    >
                        {filteredExploreItems.map((item, index) => (
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
                                onPointerDown={() => setPressedItem(item.id)}
                                onPointerUp={() => setPressedItem(null)}
                                onPointerLeave={() => setPressedItem(null)}
                                onClick={() => handleSubMenuItem(item)}
                                className={cn(
                                    "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl",
                                    // Liquid Glass material
                                    "bg-white/15 dark:bg-black/40",
                                    "backdrop-blur-2xl saturate-150",
                                    "border-0",
                                    "shadow-[0_8px_32px_rgba(0,0,0,0.05)]",
                                    "select-none"
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
                                    item.id === 'about' && "bg-gradient-to-br from-gray-500 to-slate-600",
                                    item.id === 'feedback' && "bg-gradient-to-br from-orange-500 to-amber-600",
                                    item.id === 'admin' && "bg-gradient-to-br from-red-500 to-rose-600",
                                    item.id === 'version' && "bg-gradient-to-br from-purple-500 to-violet-600",
                                    "shadow-lg"
                                )}>
                                    <item.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[10px] font-medium text-foreground/80 text-center max-w-[60px] leading-tight relative z-10">{item.label}</span>
                            </motion.button>
                        ))}
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
                        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[100] flex justify-center gap-3 isolation-isolate"
                        style={{
                            transform: 'translateZ(0)',
                            willChange: 'opacity, transform',
                            contain: 'layout paint style'
                        }}
                    >
                        {INSIGHTS_ITEMS.map((item, index) => (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    transition: { delay: index * 0.05 }
                                }}
                                exit={{ opacity: 0, y: 20 }}
                                onPointerDown={() => setPressedItem(item.id)}
                                onPointerUp={() => setPressedItem(null)}
                                onPointerLeave={() => setPressedItem(null)}
                                onClick={() => handleSubMenuItem(item)}
                                className={cn(
                                    "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl",
                                    // Liquid Glass material (same as Log menu)
                                    "bg-white/15 dark:bg-black/40",
                                    "backdrop-blur-2xl saturate-150",
                                    "border-0",
                                    "shadow-[0_8px_32px_rgba(0,0,0,0.05)]",
                                    "select-none"
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
                                    item.id === 'insights' && "bg-gradient-to-br from-amber-400 to-orange-500",
                                    item.id === 'trends' && "bg-gradient-to-br from-emerald-400 to-teal-500",

                                    "shadow-lg"
                                )}>
                                    <item.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[10px] font-medium text-foreground/80 relative z-10">{item.label}</span>
                            </motion.button>
                        ))}
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
                        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[100] flex justify-center gap-3 isolation-isolate"
                        style={{
                            transform: 'translateZ(0)',
                            willChange: 'opacity, transform',
                            contain: 'layout paint style'
                        }}
                    >
                        {filteredProfileItems.map((item, index) => {
                            const Icon = item.id === 'theme' && isDarkMode ? Moon : item.icon;
                            return (
                                <motion.button
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        transition: { delay: index * 0.05 }
                                    }}
                                    exit={{ opacity: 0, y: 20 }}
                                    onPointerDown={() => setPressedItem(item.id)}
                                    onPointerUp={() => setPressedItem(null)}
                                    onPointerLeave={() => setPressedItem(null)}
                                    onClick={() => handleSubMenuItem(item)}
                                    className={cn(
                                        "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl",
                                        // Liquid Glass material
                                        "bg-white/15 dark:bg-black/40",
                                        "backdrop-blur-2xl saturate-150",
                                        "border-0",
                                        "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
                                        "select-none"
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
                    "fixed left-4 right-4 z-50",
                    // Fix: Use bottom calc to handle safe area instead of padding which crushed the height
                    "bottom-[calc(0.5rem+env(safe-area-inset-bottom))]",
                    "h-16", // CONSTANT HEIGHT (4rem)
                    "pointer-events-auto",
                    "isolate" // Layer isolation
                )}
                style={{
                    transform: 'translateZ(0)', // Force GPU layer
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
                {/* 2. Backplate: Opacity Guard (Always Visible) */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-[32px]",
                        "bg-white/15 dark:bg-black/40", // HARDENED OPACITY -> 15%
                        "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05),0_0_0_1px_rgba(255,255,255,0.1)]",
                        "pointer-events-none"
                    )}
                />

                {/* 3. BlurLayer: Frosted Glass (Static) */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-[32px]",
                        "backdrop-blur-xl backdrop-saturate-150",
                        "-webkit-backdrop-filter-blur-[20px]", // Webkit fallback hint
                        "pointer-events-none"
                    )}
                />

                {/* 4. Scrim: Inner Contrast (Prevent gaps) */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-[32px]",
                        "bg-white/10 dark:bg-black/10",
                        "pointer-events-none"
                    )}
                />

                {/* 5. NavContent: INTERACTIVE LAYER (Animations live here) */}
                <div
                    className={cn(
                        "relative flex items-center justify-between w-full h-full",
                        "px-1.5",
                        "border border-white/50 dark:border-white/10 rounded-[32px]",
                    )}
                >
                    {PRIMARY_NAV.map((item) => {
                        const isActive = activeTab === item.id || activePanel === item.id;
                        const Icon = item.icon;
                        const isPressed = pressedItem === item.id;

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
                                                    : "text-foreground/50 grayscale-[0.3] stroke-[2px]"
                                            )}
                                        />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div >

            {/* Liquid Glass Displacement Filter */}
            <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
                <filter id="liquidDisplacement">
                    <feImage
                        href={liquidDisplacementBase64}
                        result="map"
                        preserveAspectRatio="none"
                        width="100%"
                        height="100%"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="map"
                        scale="100"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
            </svg>
        </>
    );
}
