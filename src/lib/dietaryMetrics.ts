import { UserProfile, DailyNutritionSummary, TimelineEntry, PedometerLog, FitbitLog } from '@/types';
import { differenceInMinutes, format } from 'date-fns';
import { Car, Footprints, Scale, Sprout, Timer, Wheat, Zap } from 'lucide-react';

export interface DashboardMetric {
    id: string;
    label: string;
    value: string;
    subtext?: string;
    icon: any;
    color: 'red' | 'green' | 'blue' | 'orange' | 'purple' | 'yellow';
    activeDotIndex: number; // 0, 1, 2 depending on position
}

/**
 * Calculates time since the last food entry.
 */
export const calculateFastingTime = (entries: TimelineEntry[]): string => {
    const now = new Date();
    // Sort descending just in case
    const sorted = [...entries]
        .filter(e => e.entryType === 'food' || e.entryType === 'manual_macro')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (sorted.length === 0) return "--";

    const lastMeal = new Date(sorted[0].timestamp);
    const diffMinutes = differenceInMinutes(now, lastMeal);

    if (diffMinutes < 60) return `${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);

    // If unreasonably long (e.g. > 1 week), user probably stopped logging.
    if (hours > 168) return "Ready";

    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
};

/**
 * Determines which metrics to show in the carousel based on User Diet.
 */
export const getDietaryMetrics = (
    userProfile: UserProfile | undefined,
    summary: DailyNutritionSummary,
    entries: TimelineEntry[],
    stepsData?: PedometerLog | null,
    weightData?: FitbitLog | null
): DashboardMetric[] => {
    const diets = userProfile?.profile?.dietaryPreferences || [];

    // Base Metrics
    const stepsMetric: DashboardMetric = {
        id: 'steps',
        label: 'Steps',
        value: stepsData?.steps ? stepsData.steps.toLocaleString() : '0',
        icon: Footprints,
        color: 'red',
        activeDotIndex: 0
    };

    const weightMetric: DashboardMetric = {
        id: 'weight',
        label: 'Weight',
        value: weightData?.weight ? `${weightData.weight}` : '--', // removed 'kg' to match design
        subtext: weightData?.fatPercent ? `${weightData.fatPercent}% Body Fat` : undefined,
        icon: Scale,
        color: 'blue',
        activeDotIndex: 2
    };

    // Conditional Metric (The "Middle" one usually)
    let dietMetric: DashboardMetric;

    if (diets.includes('intermittent_fasting')) {
        dietMetric = {
            id: 'fasting',
            label: 'Fasting Timer',
            value: calculateFastingTime(entries),
            subtext: 'Since last meal',
            icon: Timer,
            color: 'orange',
            activeDotIndex: 1
        };
    } else if (diets.includes('keto')) {
        // Net Carbs = Total Carbs - Fiber
        const netCarbs = Math.max(0, Math.round(summary.carbs - (summary.fiber || 0)));
        dietMetric = {
            id: 'net_carbs',
            label: 'Net Carbs',
            value: `${netCarbs}g`,
            subtext: `${Math.round(summary.fiber || 0)}g Fiber`,
            icon: Wheat, // or Zap for energy? Wheat implies carbs.
            color: 'yellow',
            activeDotIndex: 1
        };
    } else if (diets.includes('vegan') || diets.includes('vegetarian') || diets.includes('low_fodmap')) {
        // Fiber is key for these
        dietMetric = {
            id: 'fiber',
            label: 'Fiber',
            value: `${Math.round(summary.fiber || 0)}g`,
            icon: Sprout,
            color: 'green',
            activeDotIndex: 1
        };
    } else {
        // Default
        dietMetric = {
            id: 'fiber',
            label: 'Fiber',
            value: `${Math.round(summary.fiber || 0)}g`,
            icon: Sprout,
            color: 'green',
            activeDotIndex: 1
        };
    }

    // Assign indices dynamically if we want flexible ordering, but 
    // for now we stick to the Steps -> Diet -> Weight pattern.
    stepsMetric.activeDotIndex = 0;
    dietMetric.activeDotIndex = 1;
    weightMetric.activeDotIndex = 2;

    return [stepsMetric, dietMetric, weightMetric];
};
