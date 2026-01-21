'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronRight, Heart, Utensils } from 'lucide-react';
import type { LoggedFoodItem } from '@/types';
import { getFoodIcon } from '../food-logging/food-icons';

interface ReuseMealMenuProps {
    isOpen: boolean;
    onClose: () => void;
    favorites: LoggedFoodItem[];
    onSelectMeal: (item: LoggedFoodItem) => void;
    onOpenFavorites: () => void;
}

export default function ReuseMealMenu({
    isOpen,
    onClose,
    favorites,
    onSelectMeal,
    onOpenFavorites,
}: ReuseMealMenuProps) {
    const { isDarkMode } = useTheme();
    const menuRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Display all favorites 
    const displayedFavorites = favorites;

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
                    />

                    {/* Menu Popup */}
                    <motion.div
                        ref={menuRef}
                        // Match "floating sub-menu" animation (SPRING_REVEAL)
                        // From LiquidNavigation.tsx: { type: "spring", stiffness: 300, damping: 20 }
                        initial={{ opacity: 0, scale: 0.8, y: 20, x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.8, y: 20, x: "-50%" }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                        }}
                        className={cn(
                            // STRICT CENTERING & GUARDRAILS
                            // 1. Fixed positioning relative to viewport
                            "fixed z-[61]",
                            // 2. Center horizontally: Left 50%
                            "left-1/2",
                            // 3. Bottom positioning: Above nav bar area
                            "bottom-[15vh]",
                            // 4. Width constraints: 90% of screen width, max 24rem (sm)
                            "w-[90vw] max-w-sm",
                            // 5. Margin auto to prevent edge touching
                            "mx-auto",

                            "rounded-[32px] overflow-hidden", // More rounded for liquid feel
                            // Shadow & Glass Lensing Effect
                            "shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)]",
                            isDarkMode
                                ? "bg-black/10 text-white"
                                : "bg-white/10 text-black",
                            "backdrop-blur-[32px] backdrop-saturate-[220%] backdrop-brightness-[1.1]", // Deep Lensing stack
                            "border-0" // Refraction edge
                        )}
                        style={{
                            transformOrigin: "bottom center"
                        }}
                    >
                        {/* Cut off at ~3.5 items. Each item is roughly 72px. 3.5 * 72 = ~252px. 
                            Using 260px gives a nice "cut off" look. */}
                        <div className="flex flex-col py-2 max-h-[260px] overflow-y-auto overflow-x-hidden scrollbar-hide">
                            {displayedFavorites.length > 0 ? (
                                displayedFavorites.map((item, index) => {
                                    const FoodIcon = getFoodIcon(item.name);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => onSelectMeal(item)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3.5 w-full text-left transition-colors outline-none focus:outline-none focus:ring-0 focus:bg-transparent select-none",
                                                isDarkMode ? "active:bg-white/15" : "active:bg-black/10",
                                                index !== displayedFavorites.length - 1 && "border-b border-gray-200/10 dark:border-gray-700/30"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                                "bg-gradient-to-br from-green-400/20 to-emerald-500/20"
                                            )}>
                                                <FoodIcon className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-[15px] truncate leading-tight">{item.name}</h4>
                                                <p className="text-xs opacity-60 truncate mt-0.5">{item.calories ? `${item.calories} kcal` : 'No macros'}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 opacity-30" />
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-6 py-8 text-center opacity-60">
                                    <Utensils className="mx-auto w-8 h-8 opacity-50 mb-2" />
                                    <p className="text-sm">No favorites yet.</p>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="h-[1px] w-full bg-gray-200/10 dark:bg-gray-700/30 my-0.5" />

                            {/* Open Favorites Link */}
                            <button
                                onClick={onOpenFavorites}
                                className={cn(
                                    "flex items-center justify-center gap-2 w-full py-4 text-[15px] font-medium transition-colors outline-none focus:outline-none focus:ring-0 focus:bg-transparent select-none",
                                    isDarkMode ? "text-emerald-400 active:bg-white/10" : "text-emerald-600 active:bg-black/10"
                                )}
                            >
                                <Heart className="w-4 h-4" />
                                Open Favorites
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
