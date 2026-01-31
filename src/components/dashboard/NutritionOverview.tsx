'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyNutritionSummary } from '@/types';
import { Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NutritionGoals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

interface NutritionOverviewProps {
    summary: DailyNutritionSummary;
    goals?: NutritionGoals;
    dietaryPreferences?: string[];
}

// Helper component for the Liquid Progress Bar (Mercury Tube)
const LiquidProgress = ({ value, colorClass, indicatorClass }: { value: number, colorClass: string, indicatorClass: string }) => (
    <div className={cn("h-3 w-full rounded-full overflow-hidden relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] bg-black/5 dark:bg-black/40 border-b border-white/20")}>
        <div
            className={cn("h-full rounded-r-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.1)] transition-all duration-700 cubic-bezier(0.34,1.56,0.64,1)", indicatorClass)}
            style={{ width: `${value}%` }}
        >
            {/* Liquid Shine */}
            <div className="absolute top-[10%] left-0 right-0 h-[30%] bg-gradient-to-b from-white/60 to-transparent opacity-80" />
        </div>
    </div>
);

// Reusable Liquid Macro Card Component
const MacroCard = ({
    title,
    value,
    subtext,
    percent,
    icon: Icon,
    colorTheme
}: {
    title: string,
    value: number | string,
    subtext: string,
    percent?: number,
    icon: React.ElementType,
    colorTheme: 'orange' | 'red' | 'yellow' | 'blue'
}) => {

    // Theme configurations
    const themes = {
        orange: {
            border: "border-orange-200/20 dark:border-orange-800/30",
            bg: "bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent",
            iconColor: "text-orange-500",
            textColor: "text-orange-950 dark:text-orange-100",
            subTextColor: "text-orange-900/60 dark:text-orange-200/60",
            progressTrack: "bg-orange-950/5",
            progressIndicator: "bg-gradient-to-r from-orange-400 to-orange-500",
            shadow: "shadow-[0_8px_16px_-6px_rgba(249,115,22,0.2)]"
        },
        red: {
            border: "border-red-200/20 dark:border-red-800/30",
            bg: "bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent",
            iconColor: "text-red-500",
            textColor: "text-red-950 dark:text-red-100",
            subTextColor: "text-red-900/60 dark:text-red-200/60",
            progressTrack: "bg-red-950/5",
            progressIndicator: "bg-gradient-to-r from-red-400 to-red-500",
            shadow: "shadow-[0_8px_16px_-6px_rgba(239,68,68,0.2)]"
        },
        yellow: {
            border: "border-yellow-200/20 dark:border-yellow-800/30",
            bg: "bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent",
            iconColor: "text-yellow-500",
            textColor: "text-yellow-950 dark:text-yellow-100",
            subTextColor: "text-yellow-900/60 dark:text-yellow-200/60",
            progressTrack: "bg-yellow-950/5",
            progressIndicator: "bg-gradient-to-r from-yellow-400 to-yellow-500",
            shadow: "shadow-[0_8px_16px_-6px_rgba(234,179,8,0.2)]"
        },
        blue: {
            border: "border-blue-200/20 dark:border-blue-800/30",
            bg: "bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent",
            iconColor: "text-blue-500",
            textColor: "text-blue-950 dark:text-blue-100",
            subTextColor: "text-blue-900/60 dark:text-blue-200/60",
            progressTrack: "bg-blue-950/5",
            progressIndicator: "bg-gradient-to-r from-blue-400 to-blue-500",
            shadow: "shadow-[0_8px_16px_-6px_rgba(59,130,246,0.2)]"
        }
    };

    const theme = themes[colorTheme];

    return (
        <Card className={cn(
            "relative overflow-hidden group select-none backdrop-blur-md border transition-all duration-500 hover:scale-[1.02]",
            theme.border,
            theme.bg,
            theme.shadow
        )}>

            {/* LAYER 3 (Back): Subtle Gloss/Reflection overlay inside the card background */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-50 pointer-events-none mix-blend-overlay" />

            {/* LAYER 2 (Middle): Floating 3D Icon - Blurred & Angled for Depth */}
            <div className="absolute right-[-15%] top-[-15%] h-[80%] w-[80%] z-0 pointer-events-none transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-12 opacity-[0.12] blur-sm">
                <Icon className={cn("h-full w-full", theme.iconColor)} />
            </div>

            {/* LAYER 1 (Front): Content & Data - Sharp & Higher Z-Index */}
            <div className="relative z-10 flex flex-col h-full justify-between p-4 mix-blend-hard-light">
                <CardHeader className="p-0 pb-2 space-y-0">
                    <CardTitle className={cn("text-[10px] font-bold uppercase tracking-widest opacity-80", theme.textColor)}>
                        {title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="flex flex-col gap-0.5 mb-3">
                        <span className={cn("text-3xl font-black font-headline leading-none tracking-tight", theme.textColor)}>
                            {value}
                        </span>
                        <span className={cn("text-[10px] font-semibold uppercase tracking-wide opacity-80", theme.subTextColor)}>
                            {subtext}
                        </span>
                    </div>

                    {/* Liquid Mercury Progress Bar */}
                    {percent !== undefined && (
                        <LiquidProgress
                            value={Math.min(100, percent)}
                            colorClass={theme.progressTrack}
                            indicatorClass={theme.progressIndicator}
                        />
                    )}
                </CardContent>
            </div>
        </Card>
    );
};

export default function NutritionOverview({ summary, goals, dietaryPreferences }: NutritionOverviewProps) {
    // defaults if not provided
    const targets = goals || {
        calories: 2168,
        protein: 160,
        carbs: 210,
        fat: 100,
    };

    const getPercent = (current: number, target: number) => {
        if (!target || target === 0) return 0;
        return (current / target) * 100;
    };

    // Logic: If Keto, show Net Carbs
    const isKeto = dietaryPreferences?.includes('keto');
    const netCarbs = Math.max(0, summary.carbs - (summary.fiber || 0));

    // Determine Carbs Display
    const carbsTitle = isKeto ? "Net Carbs" : "Carbs";
    const carbsValue = isKeto ? Math.round(netCarbs) : Math.round(summary.carbs);
    const carbsPercent = getPercent(carbsValue, targets.carbs);
    const carbsSubtext = `${Math.round(carbsPercent)}% of target`;

    return (
        <div className="w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">

                {/* Calories */}
                <MacroCard
                    title="Calories"
                    value={Math.round(summary.calories)}
                    subtext={`${Math.round(getPercent(summary.calories, targets.calories))}% of target`}
                    percent={getPercent(summary.calories, targets.calories)}
                    icon={Flame}
                    colorTheme="orange"
                />

                {/* Protein */}
                <MacroCard
                    title="Protein"
                    value={`${Math.round(summary.protein)}g`}
                    subtext={`${Math.round(getPercent(summary.protein, targets.protein))}% of target`}
                    percent={getPercent(summary.protein, targets.protein)}
                    icon={Beef}
                    colorTheme="red"
                />

                {/* Carbs (Dynamic) */}
                <MacroCard
                    title={carbsTitle}
                    value={`${carbsValue}g`}
                    subtext={carbsSubtext}
                    percent={carbsPercent}
                    icon={Wheat}
                    colorTheme="yellow"
                />

                {/* Fat */}
                <MacroCard
                    title="Fat"
                    value={`${Math.round(summary.fat)}g`}
                    subtext={`${Math.round(getPercent(summary.fat, targets.fat))}% of target`}
                    percent={getPercent(summary.fat, targets.fat)}
                    icon={Droplet}
                    colorTheme="blue"
                />
            </div>
        </div>
    );
}
