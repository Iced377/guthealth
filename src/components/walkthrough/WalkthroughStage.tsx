'use client';

import React from 'react';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import LiquidCrystalCard from '@/components/dashboard/LiquidCrystalCard';
import LiquidNavigation from '@/components/navigation/LiquidNavigation';
import { LoggedFoodItem } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Repeat, ListChecks, Heart, Edit3, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Data for the Walkthrough Card
const MOCK_FOOD_ITEM: LoggedFoodItem = {
    id: 'walkthrough-mock-item',
    name: 'Grilled Salmon with Quinoa',
    timestamp: new Date(),
    calories: 450,
    protein: 35,
    carbs: 40,
    fat: 18,
    portionSize: '1',
    portionUnit: 'plate',
    ingredients: 'Salmon fillet, quinoa, steamed broccoli, lemon, olive oil',
    entryType: 'food',
    isFavorite: false,
    userFeedback: null,
    macrosOverridden: false,
    isSimilarToSafe: true, // Trigger "Safe" badge for demo
    fodmapData: {
        overallRisk: 'Green',
        ingredientFodmapScores: [],
        reason: 'Low FODMAP ingredients detected.',

        dietaryFiberInfo: {
            amountGrams: 5,
            quality: "Adequate"
        },
        glycemicIndexInfo: {
            level: 'Low',
            value: 45
        },
        ketoFriendliness: {
            score: 'Moderate Keto',
            reasoning: "Quinoa adds some carbs but healthy fats balance it.",
            estimatedNetCarbs: 35
        },
        gutBacteriaImpact: {
            sentiment: 'Positive',
            reasoning: "High in fiber and anti-inflammatory fats."
        },
        detectedAllergens: [],
        aiSummaries: {
            fodmapSummary: "This meal is safe for most people.",

        }
    }
};

export default function WalkthroughStage() {
    const { isWalkthroughActive, currentStep } = useWalkthrough();

    // specific steps that require the mock card
    // Hide card during "actions" step as requested
    const showMockCard = isWalkthroughActive && currentStep?.id.startsWith('tour-meal-card') && currentStep?.id !== 'tour-meal-card-actions';

    const showActionMenu = isWalkthroughActive && currentStep?.id === 'tour-meal-card-actions';

    // Mock Actions for the visual display
    const MOCK_ACTIONS = [
        { label: "Reuse Meal", icon: <Repeat className="w-6 h-6 text-emerald-500" /> },
        { label: "Log Symptoms", icon: <ListChecks className="w-6 h-6 text-emerald-500" /> },
        { label: "Unfavorite", icon: <Heart className="w-6 h-6 text-red-500 fill-red-500" /> },
        { label: "Edit", icon: <Edit3 className="w-6 h-6 text-emerald-500" /> },
        { label: "Mark as Safe", icon: <ThumbsUp className="w-6 h-6 text-emerald-500" /> },
    ];

    return (
        <AnimatePresence>
            {showMockCard && (
                <div className="fixed inset-0 z-[125] pointer-events-none flex items-center justify-center bg-transparent">
                    {/* 
                        Use pointer-events-auto on the card wrapper if we want it to be interactive.
                        We place it in the center for clear visibility.
                     */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-[90vw] max-w-md pointer-events-none [&_*]:pointer-events-none relative" // Added relative for stability
                    >
                        {/* Use the new LiquidCrystalCard for consistency */}
                        <LiquidCrystalCard
                            item={MOCK_FOOD_ITEM}
                            isLoadingAi={false}
                            // Pass dummy handlers to prevent interaction errors during tour
                            onToggleFavorite={() => { }}
                            onSetFeedback={() => { }}
                            onRemoveItem={() => { }}
                            onLogSymptoms={() => { }}
                        />
                    </motion.div>
                </div>
            )}

            {showActionMenu && (
                <motion.div
                    key="mock-action-menu"
                    // Match "floating sub-menu" animation (SPRING_REVEAL)
                    initial={{ opacity: 0, scale: 0.8, y: 20, x: "-50%" }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, scale: 0.8, y: 20, x: "-50%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn(
                        "fixed z-[126] pointer-events-none [&_*]:pointer-events-none", // Slightly above the card (z-125) but below Tooltip (z-130)
                        "left-1/2",
                        "bottom-[15vh]",
                        "w-[90vw] max-w-sm",
                        "mx-auto",
                        "rounded-[32px] overflow-hidden",
                        "shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.4)]",
                        "bg-white/80 dark:bg-zinc-900/80 text-foreground", // Adaptive Theme Styling
                        "backdrop-blur-3xl saturate-150"
                    )}
                    style={{ transformOrigin: "bottom center" }}
                >
                    <div className="px-6 py-4">
                        <h3 className="font-headline font-bold text-lg text-center text-foreground/90">Actions for {MOCK_FOOD_ITEM.name}</h3>
                    </div>

                    <div className="flex flex-col py-2 max-h-[360px] overflow-y-auto overflow-x-hidden scrollbar-hide">
                        {MOCK_ACTIONS.map((action, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 w-full text-left transition-colors select-none active:bg-white/15"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                                    "bg-gradient-to-br from-green-400/20 to-emerald-500/20"
                                )}>
                                    {action.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-[15px] truncate leading-tight">
                                        {action.label}
                                    </h4>
                                </div>
                                <div className="w-4 h-4" /> {/* Spacer for symmetry */}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {isWalkthroughActive && (['tour-navbar-options', 'welcome-4'].includes(currentStep?.id || '')) && (
                <div className="fixed inset-0 z-[126] pointer-events-none [&_*]:pointer-events-none">
                    {/* 
                        Render a non-interactive clone of the actual Nav bar.
                        It will sit on top of the frost layer (z-120) to appear "highlighted".
                        We use pointer-events-none so users can't actually click it during the tour (unless we want them to).
                      */}
                    <LiquidNavigation forceActiveTab="insights" />
                </div>
            )}
        </AnimatePresence>
    );
}
