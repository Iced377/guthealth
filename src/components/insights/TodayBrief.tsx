'use client';

import { LiquidGlassPanel } from './LiquidPrimitive';
import { LiquidLens } from './LiquidLens';
import { Flame, Footprints, Moon, Utensils } from 'lucide-react';
import { useInsightsMotionController } from './useInsightsMotionController';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens, LiquidMode } from '@/lib/liquid-tokens';
import { cn } from '@/lib/utils';

export interface TodayBriefProps {
    userName: string;
    calories: number;
    protein: number;
    steps: number | null;
    hoursSinceLastMeal: number | null;
    streakDays: number;
    wins: string[];
    insightText: string;
}

export function TodayBrief({
    userName,
    calories,
    protein,
    steps,
    hoursSinceLastMeal,
    streakDays,
    wins,
    insightText
}: TodayBriefProps) {
    const { requestExpand } = useInsightsMotionController();
    const timeNow = new Date().getHours();

    // Formatting Helpers
    const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(Math.round(num));
    const formatSteps = (num: number) => num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();

    // Theme
    const { isDarkMode } = useTheme();
    const mode: LiquidMode = isDarkMode ? 'dark' : 'light';
    const tokens = getLiquidTokens(mode);

    return (
        <LiquidGlassPanel
            className="mx-4 mt-0 mb-4 p-5 overflow-hidden flex flex-col justify-between"
            intensity="low"
            style={{ minHeight: 150, maxHeight: 210 }}
        >
            <div className="flex flex-col gap-2">
                {/* Greeting */}
                <div>
                    <h1 className={cn("text-2xl font-bold mb-1 line-clamp-1 w-[90%]", tokens.text.primary)}>
                        Good {timeNow < 12 ? 'Morning' : timeNow < 18 ? 'Afternoon' : 'Evening'}, {userName}.
                    </h1>
                    <p className={cn("text-sm line-clamp-2 pr-8 leading-relaxed", tokens.text.secondary)}>
                        {insightText}
                    </p>

                    {/* Gamification Badges */}
                    {(streakDays > 0 || wins.length > 0) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {streakDays > 0 && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                                    <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                                        {streakDays} Day Streak
                                    </span>
                                </div>
                            )}
                            {wins.map((win, i) => (
                                <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                                        {win}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Micro Metrics Row */}
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 py-1 mt-auto">
                    <LiquidLens size="sm" className="gap-2 pr-3 whitespace-nowrap">
                        <Moon className="h-3 w-3 text-indigo-400" />
                        <span className={tokens.text.primary}>
                            {hoursSinceLastMeal !== null ? `${hoursSinceLastMeal}h Fast` : '—'}
                        </span>
                    </LiquidLens>
                    <LiquidLens size="sm" className="gap-2 pr-3 whitespace-nowrap">
                        <Flame className="h-3 w-3 text-orange-400" />
                        <span className={tokens.text.primary}>{formatNumber(calories)} kcal</span>
                    </LiquidLens>
                    <LiquidLens size="sm" className="gap-2 pr-3 whitespace-nowrap">
                        <Utensils className="h-3 w-3 text-blue-400" />
                        <span className={tokens.text.primary}>{Math.round(protein)}g Prot</span>
                    </LiquidLens>
                    <LiquidLens size="sm" className="gap-2 pr-3 whitespace-nowrap">
                        <Footprints className="h-3 w-3 text-green-400" />
                        <span className={tokens.text.primary}>
                            {steps !== null ? `${formatSteps(steps)} Steps` : 'Connect'}
                        </span>
                    </LiquidLens>
                </div>
            </div>
        </LiquidGlassPanel>
    );
}
