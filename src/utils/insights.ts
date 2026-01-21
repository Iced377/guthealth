
import { format, subDays, isSameDay, startOfDay } from 'date-fns';
import { TimelineEntry, LoggedFoodItem, UserProfile } from '@/types';

/**
 * Generates an "Insight Sentence" based on an array of standard data points.
 * Prioritizes "Meaning" over raw stats.
 */

export function generateCalorieInsight(data: { date: string; calories: number }[], target: number): string {
    if (!data || data.length === 0) return "No data recorded recently.";

    // Sort by date asc
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const last30 = sorted.slice(-30);
    const avg = Math.round(last30.reduce((acc, curr) => acc + curr.calories, 0) / last30.length);

    const diff = avg - target;
    const diffAbs = Math.abs(diff);

    if (diffAbs < 50) return `You're hitting your ${target} kcal target perfectly.`;
    if (diff > 0) return `Averaging ${avg} kcal (${diffAbs} over target).`;
    return `Averaging ${avg} kcal (${diffAbs} under target).`;
}

export function generateWeightInsight(data: { date: string; weight: number }[]): string {
    if (!data || data.length < 2) return "Track more days to see a trend.";

    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const current = sorted[sorted.length - 1].weight;
    const start = sorted[0].weight;
    const diff = current - start;

    if (Math.abs(diff) < 0.1) return "Your weight is effectively stable.";
    if (diff > 0) return `Trending up ${diff.toFixed(1)}kg in this period.`;
    return `Trending down ${Math.abs(diff).toFixed(1)}kg in this period.`;
}

export function generateStepInsight(data: { date: string; steps: number }[]): string {
    if (!data || data.length === 0) return "No activity data available.";

    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const total = sorted.reduce((acc, curr) => acc + curr.steps, 0);
    const avg = Math.round(total / sorted.length);

    if (avg > 10000) return `Excellent active lifestyle (~${(avg / 1000).toFixed(1)}k steps/day).`;
    if (avg > 7000) return `Solid activity (~${(avg / 1000).toFixed(1)}k steps/day).`;
    return `Averaging ${avg.toLocaleString()} steps per day.`;
}

export function generateCorrelationInsight(data: { x: number; y: number }[]): string {
    if (!data || data.length === 0) return "Not enough data for correlation.";

    // Thresholds matching the chart
    const STEP_THRESHOLD = 8000;
    const CALORIE_THRESHOLD = 2000;

    let sedentary = 0;
    let optimal = 0;
    let lowFlux = 0;
    let grind = 0;

    data.forEach(d => {
        if (d.x >= STEP_THRESHOLD && d.y >= CALORIE_THRESHOLD) optimal++;
        else if (d.x < STEP_THRESHOLD && d.y >= CALORIE_THRESHOLD) sedentary++;
        else if (d.x < STEP_THRESHOLD && d.y < CALORIE_THRESHOLD) lowFlux++;
        else grind++;
    });

    const total = data.length;
    const max = Math.max(sedentary, optimal, lowFlux, grind);

    if (optimal === max) return "You're maintaining 'Optimal Flux' (High Energy).";
    if (sedentary === max) return "Warning: 'Sedentary Storage' pattern detected.";
    if (grind === max) return "You're in 'The Grind' (High Activity, Low Fuel).";
    return "Currently in 'Low Flux' (Low Energy, Low Activity).";
}


// --- New Advanced Trends Analysis for AI ---

export interface TrendsAnalysisResult {
    cumulativeNetCalories: number;
    cumulativeNetCaloriesWithGuardrail: number;
    calorieStepCorrelationSlope?: number;
    calorieStepCorrelationStrength?: string;
    daysOverCalorieTarget: number;
    totalDaysAnalyzed: number;
    averageDailyCalories: number;
    dailyCalorieTarget: number;
    maxFastingWindowHours: number; // Added
    fluxZones: {
        optimalFluxDays: number;
        grindDays: number;
        sedentaryStorageDays: number;
        metabolicStagnationDays: number;
    };
}

export function calculateTrendsAnalysis(entries: TimelineEntry[], profile: UserProfile | null): TrendsAnalysisResult {
    const daysToAnalyze = 30; // 30 days history is good for trends
    const now = new Date();
    const startDate = startOfDay(subDays(now, daysToAnalyze));

    const recentEntries = entries.filter(e => e.timestamp >= startDate);

    // 1. Group by Date
    const dailyStats: Record<string, { calories: number; steps: number }> = {};
    const foodTimestamps: number[] = []; // For fasting calc

    recentEntries.forEach(e => {
        const dateKey = e.timestamp.toISOString().split('T')[0];
        if (!dailyStats[dateKey]) dailyStats[dateKey] = { calories: 0, steps: 0 };

        if (e.entryType === 'food') {
            const food = e as LoggedFoodItem;
            dailyStats[dateKey].calories += (food.calories || 0);

            // IGNORE negligible calories for Fasting Calculation (e.g. black coffee, water, supplements)
            if ((food.calories || 0) > 5) {
                foodTimestamps.push(e.timestamp.getTime());
            }

        } else if (e.entryType === 'manual_macro') {
            const macro = e as any;
            dailyStats[dateKey].calories += (macro.calories || 0);
            // IGNORE negligible calories for Fasting
            if ((macro.calories || 0) > 5) {
                foodTimestamps.push(e.timestamp.getTime());
            }

        } else if ((e.entryType === 'fitbit_data' || e.entryType === 'pedometer_data') && 'steps' in e) {
            const stepData = e as any;
            // Take max steps for the day (assuming multiple sources might sync)
            dailyStats[dateKey].steps = Math.max(dailyStats[dateKey].steps, stepData.steps || 0);
        }
    });

    // Fasting Calculation
    foodTimestamps.sort((a, b) => a - b);
    let maxFast = 0;
    for (let i = 1; i < foodTimestamps.length; i++) {
        const diff = (foodTimestamps[i] - foodTimestamps[i - 1]) / (1000 * 60 * 60);
        // Filter out unrealistic fasts (e.g. missed logging days > 48h) or tiny gaps
        if (diff > 4 && diff < 36) {
            if (diff > maxFast) maxFast = diff;
        }
    }
    // Round to 1 decimal
    maxFast = Math.round(maxFast * 10) / 10;


    const dailyData = Object.values(dailyStats);

    // Calculate Valid Days for Average separate from Total Days
    // We filter out days with < 100 calories (likely just logged water/supplements) for the AVERAGE calculation
    // so we don't understate their actual intake.
    const validEatingDays = dailyData.filter(d => d.calories > 100);
    const daysForAverage = validEatingDays.length || 1;
    const totalCalsForAverage = validEatingDays.reduce((acc, curr) => acc + curr.calories, 0);

    const target = profile?.profile?.tdee || 2000;

    // 2. Calculate Metrics
    let cumulativeNet = 0;
    let cumulativeNetGuardrailed = 0;
    let daysOverTarget = 0;
    let totalCals = 0;

    // Flux Counters
    let optimal = 0;
    let grind = 0;
    let sedentary = 0;
    let stagnation = 0;

    const STEP_THRESHOLD = 8000;
    const CALORIE_THRESHOLD = 2000;

    // For Correlation
    const points: { x: number, y: number }[] = [];

    dailyData.forEach(day => {
        const net = target - day.calories;
        cumulativeNet += net;

        // Guardrail: Ignore incomplete days (<800kcal) for deficit calc
        if (day.calories > 800) {
            cumulativeNetGuardrailed += net;
        }

        if (day.calories > target) daysOverTarget++;
        totalCals += day.calories; // Keep raw total for debugging if needed, but return smarter average

        // Flux Check (only if we have steps data for that day AND valid calorie data)
        // Guardrail: Only use days with > 800 kcal for Correlation/Flux to avoid "Day 1" or "Forgot to log" zeros skewing data
        if (day.steps > 0 && day.calories > 800) {
            points.push({ x: day.steps, y: day.calories });
            if (day.steps >= STEP_THRESHOLD && day.calories >= CALORIE_THRESHOLD) optimal++;
            else if (day.steps < STEP_THRESHOLD && day.calories >= CALORIE_THRESHOLD) sedentary++;
            else if (day.steps < STEP_THRESHOLD && day.calories < CALORIE_THRESHOLD) stagnation++; // "Low Flux"
            else grind++;
        }
    });

    // 3. Correlation (Simple Linear Regression)
    let slope: number | undefined;
    let strength = "None";

    if (points.length >= 2) {
        const n = points.length;
        const sumX = points.reduce((a, p) => a + p.x, 0);
        const sumY = points.reduce((a, p) => a + p.y, 0);
        const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
        const sumXX = points.reduce((a, p) => a + p.x * p.x, 0);

        const denominator = (n * sumXX - sumX * sumX);
        if (denominator !== 0) {
            slope = parseFloat(((n * sumXY - sumX * sumY) / denominator).toFixed(4));

            if (slope > 0.05) strength = "Positive";
            else if (slope < -0.05) strength = "Inverse";
            else strength = "Neutral";
        }
    }

    return {
        cumulativeNetCalories: Math.round(cumulativeNet),
        cumulativeNetCaloriesWithGuardrail: Math.round(cumulativeNetGuardrailed),
        calorieStepCorrelationSlope: slope,
        calorieStepCorrelationStrength: strength,
        daysOverCalorieTarget: daysOverTarget,
        totalDaysAnalyzed: dailyData.length,
        averageDailyCalories: Math.round(totalCalsForAverage / daysForAverage),
        dailyCalorieTarget: target,
        maxFastingWindowHours: maxFast || 0,
        fluxZones: {
            optimalFluxDays: optimal,
            grindDays: grind,
            sedentaryStorageDays: sedentary,
            metabolicStagnationDays: stagnation
        }
    };
}
