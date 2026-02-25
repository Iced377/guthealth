'use client';

import React, { useId, useMemo } from 'react';
import { addDays, endOfDay, format, isSameDay, startOfDay, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import LiquidCrystalCard from './LiquidCrystalCard';
import TimelineSymptomCard from '@/components/food-logging/TimelineSymptomCard';
import type { DailyNutritionSummary, LoggedFoodItem, PedometerLog, TimelineEntry, FitbitLog, UserProfile } from '@/types';
import { calculateFastingTime } from '@/lib/dietaryMetrics';
import { useTheme } from '@/contexts/ThemeContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, Cell } from 'recharts';

interface DashboardWebBentoProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    summary: DailyNutritionSummary;
    timelineEntries: TimelineEntry[];
    stepsData?: PedometerLog | null;
    weightData?: FitbitLog | null;
    isToday: boolean;
    isLoadingAi: Record<string, boolean>;
    onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
    onRemoveTimelineEntry: (entryId: string) => void;
    onLogSymptomsForFood: (foodItemId?: string) => void;
    onEditIngredients?: (item: LoggedFoodItem) => void;
    onRepeatMeal?: (item: LoggedFoodItem) => void;
    onToggleFavorite: (itemId: string, currentIsFavorite: boolean) => void;
    userProfile?: UserProfile;
    isAdmin?: boolean;
}

const BentoCard = ({
    title,
    subtitle,
    className,
    children,
    headerRight,
    titleClassName,
    subtitleClassName,
}: {
    title?: string;
    subtitle?: string;
    className?: string;
    children: React.ReactNode;
    headerRight?: React.ReactNode;
    titleClassName?: string;
    subtitleClassName?: string;
}) => (
    <section
        className={cn(
            "relative overflow-hidden webview-card webview-texture",
            className
        )}
    >
        {(title || subtitle || headerRight) && (
            <div className="relative z-10 flex items-start justify-between gap-4 px-6 pt-5">
                <div>
                    {title && <p className={cn("webview-label", titleClassName)}>{title}</p>}
                    {subtitle && <h3 className={cn("text-lg font-semibold webview-title", subtitleClassName)}>{subtitle}</h3>}
                </div>
                {headerRight}
            </div>
        )}
        <div className={cn("relative z-10 px-6 pb-6", (title || subtitle || headerRight) && "pt-4")}>
            {children}
        </div>
    </section>
);

const TrendSparkline = ({
    values,
    stroke,
    fill,
    label,
    valueLabel,
    metaLabel,
    mutedTextClassName,
    surfaceClassName,
    isDarkMode,
}: {
    values: Array<number | null>;
    stroke: string;
    fill: string;
    label: string;
    valueLabel?: string;
    metaLabel?: string;
    mutedTextClassName: string;
    surfaceClassName: string;
    isDarkMode: boolean;
}) => {
    const baseId = useId();
    const areaId = `${baseId}-area`;
    const clean = values.map(v => (typeof v === 'number' && !Number.isNaN(v) ? v : null));
    const hasAny = clean.some(v => v !== null);
    const filled: number[] = [];
    const firstValue = clean.find(v => v !== null) ?? 0;
    let last = firstValue;
    clean.forEach((v) => {
        if (v === null) {
            filled.push(last);
        } else {
            last = v;
            filled.push(v);
        }
    });

    const min = hasAny ? Math.min(...filled) : 0;
    const max = hasAny ? Math.max(...filled) : 1;
    const range = max - min || 1;

    const paddingX = 0;
    const paddingY = 8;
    const points = filled.map((value, idx) => {
        const x = paddingX + (idx / (filled.length - 1 || 1)) * (100 - paddingX * 2);
        const y = paddingY + (1 - ((value - min) / range)) * (100 - paddingY * 2);
        return { x, y };
    });

    const lastPoint = points[points.length - 1] ?? { x: 100, y: 50 };

    const viewBoxMin = 0;
    const viewBoxMax = 100;
    const viewBoxSize = viewBoxMax - viewBoxMin;

    const buildSmoothPath = (pts: Array<{ x: number; y: number }>) => {
        if (pts.length < 2) return '';
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i += 1) {
            const p0 = pts[i - 1] ?? pts[i];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2] ?? p2;
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
        return d;
    };

    const linePath = buildSmoothPath(points);
    const areaPath = `${linePath} L ${viewBoxMax} ${viewBoxMax} L ${viewBoxMin} ${viewBoxMax} Z`;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <div className={cn("text-[10px] uppercase tracking-[0.2em]", mutedTextClassName)}>
                    {label}
                </div>
                {valueLabel && (
                    <div className="text-base font-semibold" style={{ color: stroke }}>
                        {valueLabel}
                    </div>
                )}
                {metaLabel && (
                    <div className={cn("text-[11px]", mutedTextClassName)}>
                        {metaLabel}
                    </div>
                )}
            </div>
            <div className={cn("relative h-24 w-full overflow-hidden rounded-2xl md:h-28", surfaceClassName)}>
                <svg viewBox={`${viewBoxMin} ${viewBoxMin} ${viewBoxSize} ${viewBoxSize}`} preserveAspectRatio="none" className="h-full w-full">
                    <defs>
                        <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={fill} stopOpacity={isDarkMode ? "0.55" : "0.8"} />
                            <stop offset="100%" stopColor={fill} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={areaPath} fill={`url(#${areaId})`} />
                    <path
                        d={linePath}
                        fill="none"
                        stroke={stroke}
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                {!hasAny && (
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center text-xs",
                        mutedTextClassName
                    )}>
                        No recent data
                    </div>
                )}
            </div>
        </div>
    );
};

const SummaryMetric = ({
    label,
    value,
    unit,
    helper,
    accentVar,
}: {
    label: string;
    value: string | number;
    unit?: string;
    helper?: string;
    accentVar: string;
}) => {
    const accent = `var(${accentVar})`;
    return (
        <div className="relative overflow-hidden webview-panel px-4 py-3 min-h-[120px] flex flex-col justify-between">
            <div className="absolute left-0 top-0 h-full w-1.5 z-0" style={{ backgroundColor: accent }} />
            <div className="relative z-10 pl-3 flex flex-col gap-2">
                <div className="webview-label">{label}</div>
                <div
                    className="text-3xl font-semibold webview-metric-value leading-tight"
                    style={{ color: accent, textShadow: '0 6px 18px rgba(0,0,0,0.18)' }}
                >
                    {value}
                    {unit && <span className="text-sm webview-text-muted ml-1">{unit}</span>}
                </div>
                {helper && <div className="text-[11px] webview-text-muted">{helper}</div>}
            </div>
        </div>
    );
};

const BentoNumberTile = ({
    label,
    value,
    unit,
    helper,
    accentVar,
    size = 'md',
    className,
}: {
    label: string;
    value: string | number;
    unit?: string;
    helper?: string;
    accentVar: string;
    size?: 'md' | 'lg' | 'xl';
    className?: string;
}) => {
    const accent = `var(${accentVar})`;
    const textSize = size === 'xl'
        ? 'text-7xl md:text-8xl'
        : size === 'lg'
            ? 'text-4xl md:text-5xl'
            : 'text-3xl md:text-4xl';
    const minHeight = size === 'xl'
        ? 'min-h-[180px]'
        : size === 'lg'
            ? 'min-h-[140px]'
            : 'min-h-[120px]';
    return (
        <div className={cn("webview-tile webview-texture p-5 flex flex-col", minHeight, className)}>
            <div className="absolute left-5 right-5 top-6 h-1 rounded-full" style={{ backgroundColor: accent }} />
            <div className="flex flex-col h-full gap-3">
                <div className="webview-label">{label}</div>
                <div className="flex-1 flex items-center">
                    <div
                        className={cn(
                            "font-semibold webview-metric-value webview-kinetic leading-[0.9] tracking-tight",
                            textSize
                        )}
                        style={{ color: accent }}
                    >
                        {value}
                        {unit && <span className="text-base md:text-lg webview-text-muted ml-2">{unit}</span>}
                    </div>
                </div>
                {helper && <div className="text-xs webview-text-muted">{helper}</div>}
            </div>
        </div>
    );
};

const DailyCaloriesChart = ({
    data,
    target,
    excludeLatest,
}: {
    data: Array<{ label: string; calories: number }>; // label = day
    target?: number;
    excludeLatest?: boolean;
}) => {
    const tooltipStyle: React.CSSProperties = {
        backgroundColor: 'var(--chart-tooltip-bg, rgba(255,255,255,0.95))',
        borderColor: 'var(--chart-tooltip-border, rgba(226,232,240,0.8))',
    };
    const targetValue = typeof target === 'number' && target > 0 ? target : null;
    const insightData = excludeLatest ? data.slice(0, -1) : data;
    const insight = buildCalorieInsight(insightData, targetValue ?? undefined);

    return (
        <div className="space-y-4">
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="var(--chart-grid, rgba(71,85,105,0.15))" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'var(--chart-axis, #475569)', fontSize: 11 }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'var(--chart-axis, #475569)', fontSize: 11 }}
                        />
                        {targetValue !== null && (
                            <ReferenceLine
                                y={targetValue}
                                stroke="var(--chart-target, #94A3B8)"
                                strokeDasharray="4 4"
                                strokeWidth={1}
                            />
                        )}
                        <Tooltip
                            cursor={{ fill: 'var(--chart-cursor, rgba(15,23,42,0.06))' }}
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div className="bg-background/90 backdrop-blur-md border border-border p-3 rounded-xl shadow-lg" style={tooltipStyle}>
                                        <p className="text-xs webview-text-muted mb-1">{label}</p>
                                        <p className="text-lg font-semibold">
                                            {Math.round(payload[0].value as number)} <span className="text-xs webview-text-muted">kcal</span>
                                        </p>
                                    </div>
                                );
                            }}
                        />
                        <Bar
                            dataKey="calories"
                            radius={[8, 8, 6, 6]}
                            maxBarSize={44}
                        >
                            {data.map((entry, index) => {
                                const isOver = targetValue !== null && entry.calories > targetValue;
                                const fill = isOver ? 'var(--state-over, #f59e0b)' : 'var(--metric-calories, #f97316)';
                                return <Cell key={`cell-${index}`} fill={fill} />;
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {insight && (
                <p className="text-xl md:text-2xl lg:text-3xl font-semibold leading-snug tracking-tight text-foreground">
                    {insight}
                </p>
            )}
        </div>
    );
};

const buildCalorieInsight = (
    data: Array<{ label: string; calories: number }>,
    target?: number
) => {
    const values = data
        .map((entry) => (Number.isFinite(entry.calories) ? entry.calories : null))
        .filter((v): v is number => v !== null);

    if (values.length < 3) {
        return 'Log a few more complete days to unlock a deeper progress readout.';
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    const avg = Math.round(total / values.length);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const maxIndex = values.indexOf(maxValue);
    const minIndex = values.indexOf(minValue);
    const maxLabel = data[maxIndex]?.label ?? 'Peak day';
    const minLabel = data[minIndex]?.label ?? 'Light day';
    const range = maxValue - minValue;
    const rangeRatio = avg > 0 ? range / avg : 0;
    const firstChunk = values.slice(0, 4);
    const lastChunk = values.slice(-3);
    const firstAvg = firstChunk.reduce((sum, value) => sum + value, 0) / firstChunk.length;
    const lastAvg = lastChunk.reduce((sum, value) => sum + value, 0) / lastChunk.length;
    const momentumDelta = lastAvg - firstAvg;

    const variability = rangeRatio < 0.25
        ? 'tight and steady'
        : rangeRatio < 0.45
            ? 'moderately swingy'
            : 'wide and punchy';

    const momentum = momentumDelta > 120
        ? 'rising'
        : momentumDelta < -120
            ? 'cooling'
            : 'holding steady';

    const targetPhrase = target
        ? `Averaging ${avg} kcal, about ${Math.round(Math.abs(avg - target))} ${avg >= target ? 'over' : 'under'} target`
        : `Averaging ${avg} kcal across logged days`;

    const templates = [
        `Your intake is ${variability} — peaking on ${maxLabel} (~${Math.round(maxValue)}) and dipping on ${minLabel} (~${Math.round(minValue)}), with momentum ${momentum} lately.`,
        `The week shows ${variability} swings, topped by ${maxLabel} and softened by ${minLabel}. Momentum is ${momentum} into the last few days.`,
        `Peaks clustered around ${maxLabel} while ${minLabel} served as the reset. The rhythm is ${variability} and momentum is ${momentum}.`,
    ];

    const templateIndex = (avg + maxValue + minValue) % templates.length;
    const body = templates[templateIndex];

    return `${targetPhrase}. ${body}`;
};

const getEntriesForDate = (allEntries: TimelineEntry[], date: Date) => {
    return allEntries
        .filter(entry => isSameDay(new Date(entry.timestamp), date))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .filter(e => ['food', 'manual_macro', 'symptom'].includes(e.entryType));
};

export default function DashboardWebBento({
    currentDate,
    onDateChange,
    summary,
    timelineEntries,
    stepsData,
    weightData,
    isToday,
    isLoadingAi,
    onSetFeedback,
    onRemoveTimelineEntry,
    onLogSymptomsForFood,
    onEditIngredients,
    onRepeatMeal,
    onToggleFavorite,
    userProfile,
    isAdmin = false,
}: DashboardWebBentoProps) {
    const { isDarkMode } = useTheme();
    const currentEntries = useMemo(() => getEntriesForDate(timelineEntries, currentDate), [timelineEntries, currentDate]);
    const mealsLogged = currentEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro').length;
    const steps = stepsData?.steps ?? 0;
    const weight = weightData?.weight;
    const fastingTime = calculateFastingTime(timelineEntries);
    const displayDate = format(currentDate, 'EEEE, MMM d');
    const weightLabel = weight ? `${weight.toFixed(1)} kg` : "—";
    const targetCalories = userProfile?.profile?.tdee ?? null;
    const deltaCalories = targetCalories ? Math.round(summary.calories - targetCalories) : null;
    const deltaLabel = deltaCalories !== null ? `${deltaCalories > 0 ? '+' : ''}${deltaCalories}` : '—';
    const deltaColor = deltaCalories === null
        ? 'var(--state-neutral, #64748b)'
        : deltaCalories > 0
            ? 'var(--state-over, #f59e0b)'
            : 'var(--state-under, #38bdf8)';
    const calorieProgress = targetCalories ? Math.min(100, (summary.calories / targetCalories) * 100) : 0;
    const macroTargets = userProfile?.profile?.macros
        ? {
            calories: userProfile.profile.tdee ?? 2168,
            protein: userProfile.profile.macros.protein,
            carbs: userProfile.profile.macros.carbs,
            fat: userProfile.profile.macros.fats,
        }
        : {
            calories: 2168,
            protein: 160,
            carbs: 210,
            fat: 100,
        };
    const getPercent = (current: number, target: number) => {
        if (!target || target === 0) return 0;
        return (current / target) * 100;
    };
    const isKeto = userProfile?.profile?.dietaryPreferences?.includes('keto');
    const netCarbs = Math.max(0, summary.carbs - (summary.fiber || 0));
    const carbsValue = isKeto ? netCarbs : summary.carbs;
    const carbsLabel = isKeto ? 'Net Carbs' : 'Carbs';
    const stepsLabel = steps > 999 ? `${(steps / 1000).toFixed(1)}k` : `${steps}`;
    const caloriesPercent = getPercent(summary.calories, macroTargets.calories);
    const proteinPercent = getPercent(summary.protein, macroTargets.protein);
    const carbsPercent = getPercent(carbsValue, macroTargets.carbs);
    const fatPercent = getPercent(summary.fat, macroTargets.fat);

    const streak = useMemo(() => {
        let currentStreak = 0;
        const today = currentDate;
        for (let i = 0; i < 365; i += 1) {
            const dateToCheck = subDays(today, i);
            const hasLog = timelineEntries.some((entry) =>
                (entry.entryType === 'food' || entry.entryType === 'manual_macro') &&
                isSameDay(new Date(entry.timestamp), dateToCheck)
            );
            if (hasLog) {
                currentStreak += 1;
            } else if (i === 0 && !hasLog) {
                continue;
            } else {
                break;
            }
        }
        return currentStreak;
    }, [timelineEntries]);

    const trendDays = useMemo(
        () => Array.from({ length: 7 }, (_, idx) => addDays(currentDate, idx - 6)),
        [currentDate]
    );
    const { stepsTrend, weightTrend, caloriesTrend } = useMemo(() => {
        const stepsMap = new Map<string, number>();
        const weightMap = new Map<string, number>();
        const caloriesMap = new Map<string, number>();

        timelineEntries.forEach((entry) => {
            const key = format(new Date(entry.timestamp), 'yyyy-MM-dd');
            if (entry.entryType === 'pedometer_data') {
                const stepsValue = (entry as PedometerLog).steps ?? 0;
                stepsMap.set(key, (stepsMap.get(key) ?? 0) + stepsValue);
            }
            if (entry.entryType === 'fitbit_data') {
                const weightValue = (entry as FitbitLog).weight;
                if (typeof weightValue === 'number') {
                    weightMap.set(key, weightValue);
                }
            }
            if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
                const caloriesValue = entry.calories ?? 0;
                caloriesMap.set(key, (caloriesMap.get(key) ?? 0) + caloriesValue);
            }
        });

        const hasSteps = trendDays.some((d) => stepsMap.has(format(d, 'yyyy-MM-dd')));
        const hasWeights = trendDays.some((d) => weightMap.has(format(d, 'yyyy-MM-dd')));
        const hasCalories = trendDays.some((d) => caloriesMap.has(format(d, 'yyyy-MM-dd')));

        const stepsSeries = hasSteps
            ? trendDays.map((d) => stepsMap.get(format(d, 'yyyy-MM-dd')) ?? 0)
            : trendDays.map(() => null);

        const weightSeries = hasWeights
            ? trendDays.map((d) => weightMap.get(format(d, 'yyyy-MM-dd')) ?? null)
            : trendDays.map(() => null);

        const caloriesSeries = hasCalories
            ? trendDays.map((d) => caloriesMap.get(format(d, 'yyyy-MM-dd')) ?? 0)
            : trendDays.map(() => null);

        return {
            stepsTrend: stepsSeries,
            weightTrend: weightSeries,
            caloriesTrend: caloriesSeries,
        };
    }, [timelineEntries, trendDays]);

    const calorieChartData = useMemo(() => {
        return trendDays.map((day, idx) => ({
            label: format(day, 'EEE'),
            calories: Math.round((caloriesTrend[idx] ?? 0) as number),
        }));
    }, [trendDays, caloriesTrend]);

    const signalsInsights = useMemo(() => {
        const insights: Array<{
            id: string;
            label: string;
            title: string;
            preview: string;
            accent: string;
        }> = [];

        const windowStart = startOfDay(subDays(currentDate, 6));
        const windowEnd = endOfDay(currentDate);
        const foodLogs = timelineEntries.filter(
            (entry) =>
                (entry.entryType === 'food' || entry.entryType === 'manual_macro') &&
                entry.timestamp >= windowStart &&
                entry.timestamp <= windowEnd
        );

        const dailyStats = new Map<string, { calories: number; entries: number }>();
        foodLogs.forEach((entry) => {
            const key = format(new Date(entry.timestamp), 'yyyy-MM-dd');
            if (!dailyStats.has(key)) {
                dailyStats.set(key, { calories: 0, entries: 0 });
            }
            const day = dailyStats.get(key)!;
            day.calories += (entry as LoggedFoodItem).calories || 0;
            day.entries += 1;
        });

        const loggedDays = Array.from(dailyStats.values()).filter((day) => day.calories > 200).length;
        const avgLogsPerDay = foodLogs.length / Math.max(1, loggedDays);
        const avgCalories = loggedDays > 0
            ? Math.round(Array.from(dailyStats.values()).reduce((sum, day) => sum + (day.calories > 200 ? day.calories : 0), 0) / loggedDays)
            : 0;

        const hasSymptoms = timelineEntries.some(
            (entry) =>
                entry.entryType === 'symptom' &&
                entry.timestamp >= windowStart &&
                entry.timestamp <= windowEnd
        );

        const hydrationPreview = loggedDays > 0
            ? 'Spreading fluids across the day improves comfort and consistency.'
            : 'Build a gentle hydration rhythm to unlock steadier daily energy.';
        insights.push({
            id: 'hydration-rhythm',
            label: 'Hydration • Today',
            title: 'Hydration Rhythm',
            preview: hydrationPreview,
            accent: 'var(--metric-hydration, #14b8a6)',
        });

        const timingPreview = avgLogsPerDay >= 2
            ? 'Consistent meal timing supports hunger regulation and energy.'
            : 'Aim for two+ meals per day to reveal timing patterns.';
        insights.push({
            id: 'meal-timing',
            label: 'Habits • Today',
            title: 'Meal Timing Consistency',
            preview: timingPreview,
            accent: 'var(--metric-steps, #10b981)',
        });

        const symptomPreview = hasSymptoms
            ? 'Logging symptoms alongside meals reveals triggers more clearly.'
            : 'Add quick symptom notes to surface patterns faster.';
        insights.push({
            id: 'symptom-patterns',
            label: 'Symptoms • Today',
            title: 'Track Symptom Patterns',
            preview: symptomPreview,
            accent: 'var(--state-risk, #ef4444)',
        });

        if (targetCalories && targetCalories > 0) {
            const delta = avgCalories - targetCalories;
            const absDelta = Math.abs(delta);
            const direction = delta > 0 ? 'above' : 'below';
            const caloriesPreview = loggedDays >= 3
                ? `Averaging ${avgCalories} kcal/day, about ${absDelta} kcal ${direction} target.`
                : 'Log 3+ days to compare your weekly average against target.';
            insights.push({
                id: 'calorie-balance',
                label: 'Calories • Logged Days',
                title: 'Calorie Balance (Logged Days)',
                preview: caloriesPreview,
                accent: 'var(--metric-calories, #f97316)',
            });
        }

        return insights;
    }, [currentDate, timelineEntries, targetCalories]);

    const stepsStroke = 'var(--metric-steps, #10b981)';
    const stepsFill = 'var(--metric-steps, #10b981)';
    const weightStroke = 'var(--metric-weight, #6366f1)';
    const weightFill = 'var(--metric-weight, #6366f1)';

    const trendSurface = "bg-transparent";

    const cardTitle = "webview-label";
    const cardSubtitle = "webview-title";
    const subtlePanel = "webview-panel";
    const subtleText = "webview-text-muted";
    const bodyText = "webview-text-primary";
    const mutedBody = "webview-text-secondary";


    return (
        <div className="relative w-full">
            <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-12 pt-10">
                <div className="flex flex-col gap-6">
                    <header className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-2">
                                <div className="webview-label">{displayDate}</div>
                                <div className="webview-hero-title">
                                    {isToday ? "Today's Snapshot" : "Daily Snapshot"}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 transition-colors webview-icon-button"
                                    onClick={() => onDateChange(new Date(currentDate.getTime() - 86400000))}
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 transition-colors webview-icon-button"
                                    onClick={() => onDateChange(new Date(currentDate.getTime() + 86400000))}
                                    disabled={isToday}
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </Button>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-12 gap-6">
                        <section className="col-span-12 lg:col-span-8 webview-hero-card webview-texture p-6">
                            <div className="relative z-10 space-y-5">
                                <div className="space-y-2">
                                    <div className="webview-label">Daily Balance</div>
                                    <div className="text-5xl md:text-6xl font-semibold webview-metric-value webview-kinetic" style={{ color: deltaColor }}>
                                        {deltaLabel}
                                        <span className="text-base webview-text-muted ml-2">kcal</span>
                                    </div>
                                    {targetCalories ? (
                                        <div className="text-sm webview-text-secondary">
                                            Target {Math.round(targetCalories)} kcal · {Math.round(summary.calories)} logged
                                        </div>
                                    ) : (
                                        <div className="text-sm webview-text-muted">
                                            Set a target to see daily balance.
                                        </div>
                                    )}
                                </div>
                                <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--chart-grid, rgba(71,85,105,0.2))' }}>
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${calorieProgress}%`, backgroundColor: 'var(--metric-calories, #f97316)' }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <SummaryMetric
                                        label="Meals"
                                        value={mealsLogged}
                                        helper="Logged"
                                        accentVar="--state-neutral"
                                    />
                                    <SummaryMetric
                                        label="Steps"
                                        value={stepsLabel}
                                        helper="Today"
                                        accentVar="--metric-steps"
                                    />
                                    <SummaryMetric
                                        label="Weight"
                                        value={weightLabel}
                                        helper="Latest"
                                        accentVar="--metric-weight"
                                    />
                                    <SummaryMetric
                                        label="Fasting"
                                        value={fastingTime}
                                        helper="Today"
                                        accentVar="--metric-fasting"
                                    />
                                </div>
                            </div>
                        </section>

                        <BentoNumberTile
                            className="col-span-12 lg:col-span-4"
                            label="Streak"
                            value={streak}
                            unit="days"
                            helper="Consecutive days logged"
                            accentVar="--metric-hydration"
                            size="xl"
                        />

                        <div className="col-span-12 flex items-end justify-between">
                            <div>
                                <div className="webview-label">Macros</div>
                                <div className="webview-section-title">Nutrition Balance</div>
                            </div>
                        </div>

                        <BentoNumberTile
                            className="col-span-6 lg:col-span-3"
                            label="Calories"
                            value={Math.round(summary.calories)}
                            unit="kcal"
                            helper={`${Math.round(caloriesPercent)}% of target`}
                            accentVar="--metric-calories"
                            size="lg"
                        />
                        <BentoNumberTile
                            className="col-span-6 lg:col-span-3"
                            label="Protein"
                            value={`${Math.round(summary.protein)}g`}
                            helper={`${Math.round(proteinPercent)}% of target`}
                            accentVar="--metric-protein"
                            size="lg"
                        />
                        <BentoNumberTile
                            className="col-span-6 lg:col-span-3"
                            label={carbsLabel}
                            value={`${Math.round(carbsValue)}g`}
                            helper={`${Math.round(carbsPercent)}% of target`}
                            accentVar="--metric-carbs"
                            size="lg"
                        />
                        <BentoNumberTile
                            className="col-span-6 lg:col-span-3"
                            label="Fat"
                            value={`${Math.round(summary.fat)}g`}
                            helper={`${Math.round(fatPercent)}% of target`}
                            accentVar="--metric-fat"
                            size="lg"
                        />

                        <BentoCard
                            className="col-span-12 lg:col-span-8"
                            title="Daily Calories"
                            subtitle="7-day flow"
                            titleClassName={cardTitle}
                            subtitleClassName={cardSubtitle}
                        >
                            <DailyCaloriesChart
                                data={calorieChartData}
                                target={targetCalories ?? undefined}
                                excludeLatest={isToday}
                            />
                        </BentoCard>

                        <BentoCard
                            className="col-span-12 lg:col-span-4"
                            title="Vitals"
                            subtitle="Movement & Weight"
                            titleClassName={cardTitle}
                            subtitleClassName={cardSubtitle}
                        >
                            <div className="grid gap-4">
                                <div className={cn(
                                    "rounded-2xl p-4",
                                    subtlePanel,
                                    "webview-texture"
                                )}>
                                    <TrendSparkline
                                        values={stepsTrend}
                                        stroke={stepsStroke}
                                        fill={stepsFill}
                                        label="Steps"
                                        valueLabel={`${stepsLabel} steps`}
                                        metaLabel="7-day trend"
                                        mutedTextClassName={subtleText}
                                        surfaceClassName={trendSurface}
                                        isDarkMode={isDarkMode}
                                    />
                                </div>
                                <div className={cn(
                                    "rounded-2xl p-4",
                                    subtlePanel,
                                    "webview-texture"
                                )}>
                                    <TrendSparkline
                                        values={weightTrend}
                                        stroke={weightStroke}
                                        fill={weightFill}
                                        label="Weight"
                                        valueLabel={weight ? `${weight.toFixed(1)} kg` : '—'}
                                        metaLabel="7-day trend"
                                        mutedTextClassName={subtleText}
                                        surfaceClassName={trendSurface}
                                        isDarkMode={isDarkMode}
                                    />
                                </div>
                            </div>
                        </BentoCard>

                        <BentoCard
                            className="col-span-12 lg:col-span-8"
                            title="Timeline"
                            subtitle="Recent Meals & Logs"
                            titleClassName={cardTitle}
                            subtitleClassName={cardSubtitle}
                        >
                            <div className="max-h-[560px] space-y-6 overflow-y-auto pr-1">
                                {currentEntries.length === 0 ? (
                                    <div className={cn(
                                        "flex flex-col items-center justify-center rounded-2xl py-16 text-center",
                                        subtlePanel
                                    )}>
                                        <p className={cn(
                                            "text-sm",
                                            mutedBody
                                        )}>No meals logged for this day yet.</p>
                                    </div>
                                ) : (
                                    currentEntries.map((entry, index) => (
                                        <div
                                            key={entry.id}
                                            id={`timeline-card-${entry.id}`}
                                            className="transform transition-all duration-500"
                                            style={{ animationDelay: `${index * 40}ms` }}
                                        >
                                            {entry.entryType === 'symptom' ? (
                                                <div className="glass-crystal rounded-3xl overflow-hidden p-0 border-0">
                                                    <TimelineSymptomCard item={entry} onRemoveItem={() => onRemoveTimelineEntry(entry.id)} />
                                                </div>
                                            ) : (
                                                <LiquidCrystalCard
                                                    item={entry as LoggedFoodItem}
                                                    onSetFeedback={onSetFeedback}
                                                    onRemoveItem={() => onRemoveTimelineEntry(entry.id)}
                                                    onLogSymptoms={() => onLogSymptomsForFood(entry.id)}
                                                    isLoadingAi={!!isLoadingAi[entry.id]}
                                                    onEditIngredients={onEditIngredients}
                                                    onRepeatMeal={onRepeatMeal}
                                                    onToggleFavorite={onToggleFavorite}
                                                    isAdminView={isAdmin}
                                                />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </BentoCard>

                        <BentoCard
                            className="col-span-12 lg:col-span-4"
                            title="Signals"
                            subtitle="Daily Insights"
                            titleClassName={cardTitle}
                            subtitleClassName={cardSubtitle}
                        >
                            <div className="grid gap-4">
                                {signalsInsights.map((insight) => (
                                    <div
                                        key={insight.id}
                                        className={cn(
                                            "rounded-2xl p-4",
                                            subtlePanel,
                                            "webview-texture"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="h-2.5 w-2.5 rounded-full mt-1"
                                                style={{ backgroundColor: insight.accent }}
                                            />
                                            <div className="space-y-1">
                                                <p className={cn(
                                                    "text-xs uppercase tracking-[0.2em]",
                                                    subtleText
                                                )}>{insight.label}</p>
                                                <p className={cn(
                                                    "text-lg font-semibold",
                                                    bodyText
                                                )}>
                                                    {insight.title}
                                                </p>
                                                <p className={cn(
                                                    "text-xs webview-text-muted"
                                                )}>{insight.preview}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </BentoCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
