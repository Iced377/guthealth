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
}

// Helper component for the Engraved Progress Bar
const EngravedProgress = ({ value, colorClass, indicatorClass }: { value: number, colorClass: string, indicatorClass: string }) => (
    <div className={cn("h-2.5 w-full rounded-full overflow-hidden relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] bg-black/10 dark:bg-black/40 border-b border-white/10")}>
        <div
            className={cn("h-full rounded-md shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] transition-all duration-500 ease-out", indicatorClass)}
            style={{ width: `${value}%` }}
        />
    </div>
);

// Reusable Macro Card Component to enforce the 3-Layer Design
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
    percent?: number, // Optional for Calories
    icon: React.ElementType,
    colorTheme: 'orange' | 'red' | 'yellow' | 'blue'
}) => {

    // Theme configurations
    const themes = {
        orange: {
            border: "border-orange-500/20",
            bg: "bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent",
            iconColor: "text-orange-500",
            textColor: "text-orange-950 dark:text-orange-100",
            subTextColor: "text-orange-800/60 dark:text-orange-200/60",
            progressTrack: "bg-orange-950/10",
            progressIndicator: "bg-orange-500",
            shadow: "shadow-orange-500/5"
        },
        red: {
            border: "border-red-500/20",
            bg: "bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent",
            iconColor: "text-red-500",
            textColor: "text-red-950 dark:text-red-100",
            subTextColor: "text-red-800/60 dark:text-red-200/60",
            progressTrack: "bg-red-950/10",
            progressIndicator: "bg-red-500",
            shadow: "shadow-red-500/5"
        },
        yellow: {
            border: "border-yellow-500/20",
            bg: "bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent",
            iconColor: "text-yellow-500",
            textColor: "text-yellow-950 dark:text-yellow-100",
            subTextColor: "text-yellow-800/60 dark:text-yellow-200/60",
            progressTrack: "bg-yellow-950/10",
            progressIndicator: "bg-yellow-500",
            shadow: "shadow-yellow-500/5"
        },
        blue: {
            border: "border-blue-500/20",
            bg: "bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent",
            iconColor: "text-blue-500",
            textColor: "text-blue-950 dark:text-blue-100",
            subTextColor: "text-blue-800/60 dark:text-blue-200/60",
            progressTrack: "bg-blue-950/10",
            progressIndicator: "bg-blue-500",
            shadow: "shadow-blue-500/5"
        }
    };

    const theme = themes[colorTheme];

    return (
        <Card className={cn(
            "relative overflow-hidden group select-none backdrop-blur-3xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
            theme.border,
            theme.bg,
            theme.shadow
        )}>

            {/* LAYER 3 (Back): Subtle Gloss/Reflection overlay inside the card background */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-70 pointer-events-none" />

            {/* LAYER 2 (Middle): Floating 3D Icon - Blurred & Angled for Depth */}
            <div className="absolute right-[-15%] top-[-15%] h-[70%] w-[70%] z-0 pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                <Icon className={cn("h-full w-full opacity-[0.15] blur-[1px]", theme.iconColor)} />
            </div>
            {/* Secondary Icon Layer for extra depth */}
            <div className="absolute right-[-5%] bottom-[-20%] h-[50%] w-[50%] z-0 pointer-events-none opacity-[0.05]">
                <Icon className={cn("h-full w-full", theme.iconColor)} />
            </div>


            {/* LAYER 1 (Front): Content & Data - Sharp & Higher Z-Index */}
            <div className="relative z-10 flex flex-col h-full justify-between p-4">
                <CardHeader className="p-0 pb-1.5 space-y-0">
                    <CardTitle className={cn("text-xs font-semibold uppercase tracking-wider opacity-90", theme.textColor)}>
                        {title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="flex flex-col gap-0.5 mb-3">
                        <span className={cn("text-2xl font-bold font-headline leading-none", theme.textColor)}>
                            {value}
                        </span>
                        <span className={cn("text-xs font-medium", theme.subTextColor)}>
                            {subtext}
                        </span>
                    </div>

                    {/* Engraved Progress Bar */}
                    {percent !== undefined && (
                        <EngravedProgress
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

export default function NutritionOverview({ summary, goals }: NutritionOverviewProps) {
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

    return (
        <div className="w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">

                {/* Calories */}
                <MacroCard
                    title="Calories"
                    value={Math.round(summary.calories)}
                    subtext="kcal"
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

                {/* Carbs */}
                <MacroCard
                    title="Carbs"
                    value={`${Math.round(summary.carbs)}g`}
                    subtext={`${Math.round(getPercent(summary.carbs, targets.carbs))}% of target`}
                    percent={getPercent(summary.carbs, targets.carbs)}
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
