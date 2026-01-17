import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { TimelineEntry, LoggedFoodItem, MicronutrientDetail } from '@/types';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import {
    Atom, Sparkles, Bone, Activity, PersonStanding, Eye, ShieldCheck, Droplet,
    Wind, Brain, Heart, ShieldQuestion, Network, Target, Nut, Sun
} from 'lucide-react';

export type MicronutrientStatus = 'ok' | 'low' | 'high' | 'unknown';
export type TimeRange = 'TODAY' | '7D' | '30D' | 'CUSTOM';

export interface NormalizedMicronutrient {
    id: string; // e.g., 'VitaminA'
    name: string; // Display name e.g. 'Vitamin A'
    category: 'vitamins' | 'minerals' | 'macros' | 'other';

    // Values
    currentValue: number;
    targetValue: number | null; // null if no target set
    maxTargetValue?: number; // For upper limits if we had them, usually just target for DV
    unit: 'mg' | 'mcg' | 'IU' | '%';

    // Status
    hasTarget: boolean;
    status: MicronutrientStatus;
    score: number; // 0.0 to 1.0 (clamped) for completion rings. 0 if unknown.

    // Metadata
    icon: React.ElementType;
}

export interface UseMicronutrientsResult {
    data: NormalizedMicronutrient[];
    loading: boolean;
    error: string | null;
    setTimeRange: (range: TimeRange) => void;
    setCustomDateRange: (range: { start: Date; end: Date } | null) => void;
    timeRange: TimeRange;
    customDateRange: { start: Date; end: Date } | null;
}

// Reuse icon mapping from previous component but exportable if needed
const RepresentativeLucideIcons: { [key: string]: React.ElementType } = {
    VitaminA: Eye,
    VitaminC: ShieldCheck,
    VitaminD: Sun,
    VitaminE: ShieldQuestion,
    VitaminK: Heart,
    Riboflavin: Activity,
    VitaminB6: Brain,
    VitaminB12: Brain,
    Calcium: Bone,
    Magnesium: Activity,
    Iron: Wind,
    Zinc: PersonStanding,
    Chromium: Target,
    Potassium: Droplet,
    Sodium: Droplet,
    Omega3: Heart,
    // Fallbacks
    Atom, Bone, Activity, PersonStanding, Eye, ShieldCheck, Droplet, Wind, Brain, Heart, ShieldQuestion, Network, Target, Nut, Sun
};

// Configuration with categories
interface ConfigItem {
    name: string;
    displayName: string;
    target: number;
    unit: 'mg' | 'mcg' | 'IU' | '%';
    category: 'vitamins' | 'minerals' | 'macros' | 'other';
    icon?: React.ElementType;
}

const MICRONUTRIENTS_CONFIG: ConfigItem[] = [
    // Vitamins
    { name: 'VitaminA', displayName: 'Vitamin A', target: 100, unit: '%', category: 'vitamins' },
    { name: 'VitaminC', displayName: 'Vitamin C', target: 100, unit: '%', category: 'vitamins' },
    { name: 'VitaminD', displayName: 'Vitamin D', target: 800, unit: 'IU', category: 'vitamins', icon: Sun },
    { name: 'VitaminE', displayName: 'Vitamin E', target: 100, unit: '%', category: 'vitamins' },
    { name: 'VitaminK', displayName: 'Vitamin K', target: 100, unit: '%', category: 'vitamins' },
    { name: 'Riboflavin', displayName: 'Riboflavin (B2)', target: 100, unit: '%', category: 'vitamins' },
    { name: 'VitaminB6', displayName: 'Vitamin B6', target: 1.7, unit: 'mg', category: 'vitamins' },
    { name: 'VitaminB12', displayName: 'Vitamin B12', target: 100, unit: '%', category: 'vitamins' },

    // Minerals
    { name: 'Calcium', displayName: 'Calcium', target: 1000, unit: 'mg', category: 'minerals' },
    { name: 'Magnesium', displayName: 'Magnesium', target: 420, unit: 'mg', category: 'minerals' },
    { name: 'Iron', displayName: 'Iron', target: 100, unit: '%', category: 'minerals' },
    { name: 'Zinc', displayName: 'Zinc', target: 11, unit: 'mg', category: 'minerals' },
    { name: 'Chromium', displayName: 'Chromium', target: 0.035, unit: 'mg', category: 'minerals' },
    { name: 'Potassium', displayName: 'Potassium', target: 100, unit: '%', category: 'minerals' },
    { name: 'Sodium', displayName: 'Sodium', target: 2300, unit: 'mg', category: 'minerals' },

    // Essential Fats / Other
    { name: 'Omega3', displayName: 'Omega-3', target: 500, unit: 'mg', category: 'other', icon: Heart },
];

export function useMicronutrients(userId?: string | null): UseMicronutrientsResult {
    const [data, setData] = useState<NormalizedMicronutrient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [timeRange, setTimeRange] = useState<TimeRange>('TODAY');
    const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);

    useEffect(() => {
        if (!userId) {
            setData([]);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Determine Date Range
                let start: Date;
                let end: Date = endOfDay(new Date());

                if (timeRange === 'CUSTOM' && customDateRange) {
                    start = startOfDay(customDateRange.start);
                    end = endOfDay(customDateRange.end);
                } else if (timeRange === '7D') {
                    start = startOfDay(subDays(new Date(), 6)); // 7 days inclusive
                } else if (timeRange === '30D') {
                    start = startOfDay(subDays(new Date(), 29)); // 30 days inclusive
                } else {
                    // TODAY
                    start = startOfDay(new Date());
                }

                // Fetch Logs
                const entriesColRef = collection(db, 'users', userId, 'timelineEntries');
                const q = query(
                    entriesColRef,
                    where('timestamp', '>=', Timestamp.fromDate(start)),
                    where('timestamp', '<=', Timestamp.fromDate(end))
                );

                const querySnapshot = await getDocs(q);
                const foodItems = querySnapshot.docs
                    .map(doc => doc.data() as TimelineEntry)
                    .filter((entry): entry is LoggedFoodItem => entry.entryType === 'food' || entry.entryType === 'manual_macro');

                // Aggregation Containers
                const totals = new Map<string, number>();

                // Initialize from config
                MICRONUTRIENTS_CONFIG.forEach(config => {
                    totals.set(config.name, 0);
                });

                // 1. Sum up all values
                foodItems.forEach(item => {
                    const microsInfo = item.fodmapData?.micronutrientsInfo;
                    if (!microsInfo) return;

                    const combined = [
                        ...(microsInfo.notable || []),
                        ...(microsInfo.fullList || [])
                    ];

                    combined.forEach(micro => {
                        const rawName = micro.name.toLowerCase();

                        // Find matching config
                        let config = MICRONUTRIENTS_CONFIG.find(c =>
                            c.name.toLowerCase() === rawName ||
                            c.displayName.toLowerCase() === rawName
                        );

                        // Special case Omega-3 mapping
                        if (!config && (rawName === 'epa' || rawName === 'dha')) {
                            config = MICRONUTRIENTS_CONFIG.find(c => c.name === 'Omega3');
                        }

                        if (config) {
                            let valueToAdd = 0;
                            const amountString = String(micro.amount || '').toLowerCase();
                            const amountNum = parseFloat(amountString.replace(/[^0-9.]/g, ''));

                            if (!isNaN(amountNum)) {
                                // Normalize to Mg if target is Mg
                                if ((config.unit === 'mg' || config.name === 'Omega3')) {
                                    if (amountString.includes('mcg') || amountString.includes('µg')) {
                                        valueToAdd = amountNum / 1000;
                                    } else if (amountString.includes('mg')) {
                                        valueToAdd = amountNum;
                                    }
                                } else if (config.unit === 'IU') {
                                    if (amountString.includes('iu')) {
                                        valueToAdd = amountNum;
                                    }
                                } else if (config.unit === '%') {
                                    if (micro.dailyValuePercent) {
                                        valueToAdd = micro.dailyValuePercent;
                                    }
                                }
                            }

                            // Accumulate
                            const current = totals.get(config.name) || 0;
                            totals.set(config.name, current + valueToAdd);
                        }
                    });
                });

                // 2. Normalize for Consumption
                const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

                const normalizedResults: NormalizedMicronutrient[] = MICRONUTRIENTS_CONFIG.map(config => {
                    const totalAccumulated = totals.get(config.name) || 0;
                    const dailyAverage = totalAccumulated / dayCount;

                    const hasTarget = config.target > 0;
                    const targetVal = hasTarget ? config.target : null;

                    let score = 0;
                    if (hasTarget && targetVal) {
                        score = Math.min(1, dailyAverage / targetVal);
                    }

                    // Status determination
                    let status: MicronutrientStatus = 'unknown';
                    if (hasTarget && targetVal) {
                        if (dailyAverage >= targetVal) {
                            if (config.name === 'Sodium') status = 'high';
                            else status = 'ok';
                        } else if (dailyAverage >= targetVal * 0.7) {
                            status = 'ok';
                        } else {
                            status = 'low';
                        }

                        // Refine Sodium
                        if (config.name === 'Sodium') {
                            if (dailyAverage <= targetVal) status = 'ok';
                            else status = 'high';
                        }
                    } else {
                        status = 'unknown';
                    }

                    return {
                        id: config.name,
                        name: config.displayName,
                        category: config.category,
                        currentValue: dailyAverage,
                        targetValue: targetVal,
                        unit: config.unit,
                        hasTarget,
                        status,
                        score,
                        icon: config.icon || RepresentativeLucideIcons[config.name] || Atom
                    };
                });

                setData(normalizedResults);

            } catch (err) {
                console.error("Error in useMicronutrients:", err);
                setError("Failed to load nutrient data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, timeRange, customDateRange]);

    return {
        data,
        loading,
        error,
        setTimeRange,
        setCustomDateRange,
        timeRange,
        customDateRange
    };
}
