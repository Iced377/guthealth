'use client';

import React from 'react';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import TimelineFoodCard from '@/components/food-logging/TimelineFoodCard';
import { LoggedFoodItem } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';

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
    fodmapData: {
        overallRisk: 'Green',
        reason: 'Low FODMAP ingredients detected.',
        micronutrientsInfo: {
            notable: [
                { name: "Vitamin D", amount: "15 mcg", dailyValuePercent: 75, iconName: "Sun" },
                { name: "Omega-3", amount: "2.5 g", dailyValuePercent: 150, iconName: "Fish" }
            ]
        },
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
            micronutrientSummary: "Excellent source of protein and healthy fats.",
        }
    }
};

export default function WalkthroughStage() {
    const { isWalkthroughActive, currentStep } = useWalkthrough();

    // specific steps that require the mock card
    const showMockCard = isWalkthroughActive && currentStep?.id.startsWith('tour-meal-card');

    return (
        <AnimatePresence>
            {showMockCard && (
                <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    {/* 
                        Use pointer-events-auto on the card wrapper if we want it to be interactive.
                        We place it in the center for clear visibility.
                     */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-[90vw] max-w-md pointer-events-auto"
                    >
                        <TimelineFoodCard
                            item={MOCK_FOOD_ITEM}
                            isLoadingAi={false}
                            cardId="walkthrough-mock-card"
                            // Pass dummy handlers if needed to prevent errors
                            onToggleFavorite={() => { }}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
