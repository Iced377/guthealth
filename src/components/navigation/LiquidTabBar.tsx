'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import {
    LayoutGrid,
    Heart,
    Plus,
    BarChart3,
    User,
    Sparkles,
    Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
    isAction?: boolean;
}

const tabs: TabItem[] = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Home', path: '/' },
    { id: 'favorites', icon: Heart, label: 'Favorites', path: '/favorites' },
    { id: 'add', icon: Plus, label: 'Add', path: '', isAction: true },
    { id: 'trends', icon: BarChart3, label: 'Trends', path: '/trends' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
];

// Spring animation config for smooth, bouncy transitions
const SPRING_CONFIG = {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 1
};

interface LiquidTabBarProps {
    onAddClick?: () => void;
    onPhotoClick?: () => void;
    className?: string;
}

export default function LiquidTabBar({ onAddClick, onPhotoClick, className }: LiquidTabBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    // Determine active tab from pathname
    const activeTab = tabs.find(tab =>
        tab.path && (pathname === tab.path || (tab.path !== '/' && pathname.startsWith(tab.path)))
    )?.id || 'dashboard';

    const triggerHaptic = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const handleTabPress = (tab: TabItem) => {
        triggerHaptic();

        if (tab.isAction) {
            setIsAddMenuOpen(!isAddMenuOpen);
        } else {
            setIsAddMenuOpen(false);
            router.push(tab.path);
        }
    };

    const handleQuickAction = (action: 'ai' | 'photo') => {
        triggerHaptic();
        setIsAddMenuOpen(false);
        if (action === 'ai' && onAddClick) {
            onAddClick();
        } else if (action === 'photo' && onPhotoClick) {
            onPhotoClick();
        }
    };

    return (
        <>
            {/* Backdrop for Add menu */}
            <AnimatePresence>
                {isAddMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={() => setIsAddMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Main Tab Bar */}
            <motion.nav
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-50",
                    "pb-[env(safe-area-inset-bottom)]",
                    className
                )}
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={SPRING_CONFIG}
            >
                <div className="mx-4 mb-2">
                    <LayoutGroup>
                        <motion.div
                            className={cn(
                                "relative flex items-center justify-around",
                                "px-2 py-2 rounded-[28px]",
                                // Liquid Glass material
                                "bg-white/30 dark:bg-black/40",
                                "backdrop-blur-3xl saturate-200",
                                "border border-white/10 dark:border-white/5",
                                "shadow-2xl shadow-black/20"
                            )}
                        >
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;

                                return (
                                    <motion.button
                                        key={tab.id}
                                        onClick={() => handleTabPress(tab)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center",
                                            "w-16 h-14 rounded-2xl",
                                            "transition-colors duration-200",
                                            tab.isAction ? "scale-110" : ""
                                        )}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{ duration: 0.1 }}
                                    >
                                        {/* Selection indicator - glass pill */}
                                        {isActive && !tab.isAction && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className={cn(
                                                    "absolute inset-0 rounded-2xl",
                                                    "bg-white/40 dark:bg-white/20"
                                                )}
                                                transition={SPRING_CONFIG}
                                            />
                                        )}

                                        {/* Add button special styling */}
                                        {tab.isAction ? (
                                            <motion.div
                                                className={cn(
                                                    "flex items-center justify-center",
                                                    "w-14 h-14 rounded-full",
                                                    "bg-gradient-to-br from-green-500 to-emerald-600",
                                                    "shadow-lg shadow-green-500/40"
                                                )}
                                                animate={{ rotate: isAddMenuOpen ? 45 : 0 }}
                                                transition={SPRING_CONFIG}
                                            >
                                                <Plus className="w-7 h-7 text-white" />
                                            </motion.div>
                                        ) : (
                                            <>
                                                <Icon
                                                    className={cn(
                                                        "relative z-10 w-6 h-6 transition-colors duration-200",
                                                        isActive
                                                            ? "text-primary dark:text-white"
                                                            : "text-muted-foreground"
                                                    )}
                                                />
                                                <span
                                                    className={cn(
                                                        "relative z-10 text-[10px] mt-0.5 font-medium transition-colors duration-200",
                                                        isActive
                                                            ? "text-primary dark:text-white"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    {tab.label}
                                                </span>
                                            </>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    </LayoutGroup>
                </div>
            </motion.nav>

            {/* Add Menu Popup */}
            <AnimatePresence>
                {isAddMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={SPRING_CONFIG}
                        className={cn(
                            "fixed bottom-32 left-1/2 -translate-x-1/2 z-50",
                            "flex gap-4"
                        )}
                    >
                        {/* Quick action buttons */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-3xl",
                                "bg-white/20 dark:bg-black/30 backdrop-blur-2xl",
                                "border border-white/30 dark:border-white/10",
                                "shadow-xl"
                            )}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleQuickAction('ai')}
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center",
                                "bg-gradient-to-br from-indigo-500 to-purple-600",
                                "shadow-lg"
                            )}>
                                <Sparkles className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-xs font-medium text-foreground">AI Log</span>
                        </motion.button>

                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
                            exit={{ opacity: 0, y: 20 }}
                            className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-3xl",
                                "bg-white/20 dark:bg-black/30 backdrop-blur-2xl",
                                "border border-white/30 dark:border-white/10",
                                "shadow-xl"
                            )}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleQuickAction('photo')}
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center",
                                "bg-gradient-to-br from-pink-500 to-rose-600",
                                "shadow-lg"
                            )}>
                                <Camera className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-xs font-medium text-foreground">Photo</span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
