'use client';

import { InsightScene } from './InsightScene';
import { useInsightsMotionController } from './useInsightsMotionController';
import { FrostBackplate } from './LiquidPrimitive';
import { Button } from '@/components/ui/button';
import { useActionContext } from '@/contexts/ActionContext';
import { calculateTrendsAnalysis } from '@/utils/insights';
import { useMemo, useEffect, useState } from 'react';
import { differenceInDays, startOfDay, subDays } from 'date-fns';
import { RAMADAN_ENABLED } from '@/lib/featureFlags';

const HIGHLIGHT_HISTORY_KEY = 'insights_highlight_history_v1';
const HIGHLIGHT_HISTORY_TTL = 7 * 24 * 60 * 60 * 1000;

export function InsightFeed() {
    const { selectedCategory } = useInsightsMotionController();
    const { timelineEntries, userProfile } = useActionContext();
    const [ramadanMode, setRamadanMode] = useState<'fasting' | 'witnessing' | 'hidden' | null>(null);

    useEffect(() => {
        if (!RAMADAN_ENABLED) {
            setRamadanMode(null);
            return;
        }
        const profileMode = (userProfile as any)?.ramadanConfig?.status;
        if (profileMode === 'fasting' || profileMode === 'witnessing' || profileMode === 'hidden') {
            setRamadanMode(profileMode);
            return;
        }
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('ramadan_user_mode_v1');
            if (stored === 'fasting' || stored === 'witnessing' || stored === 'hidden') {
                setRamadanMode(stored);
                return;
            }
        }
        setRamadanMode(null);
    }, [userProfile]);

    const trends = useMemo(() => {
        return calculateTrendsAnalysis(timelineEntries, userProfile);
    }, [timelineEntries, userProfile]);

    const realInsights = useMemo(() => {
        const insights: any[] = [];
        const candidates: { priority: number; insight: any }[] = [];

        const now = new Date();
        const last30Start = startOfDay(subDays(now, 30));
        const last7Start = startOfDay(subDays(now, 7));

        const foodLogs = timelineEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro');
        const foodLogs30 = foodLogs.filter(e => e.timestamp >= last30Start);
        const foodLogs7 = foodLogs.filter(e => e.timestamp >= last7Start);

        const dailyStats = new Map<string, { calories: number; protein: number; carbs: number; fat: number; fiber: number; entries: number }>();
        const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

        foodLogs30.forEach((entry: any) => {
            const key = toDateKey(entry.timestamp);
            if (!dailyStats.has(key)) {
                dailyStats.set(key, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, entries: 0 });
            }
            const day = dailyStats.get(key)!;
            day.calories += entry.calories || 0;
            day.protein += entry.protein || 0;
            day.carbs += entry.carbs || 0;
            day.fat += entry.fat || 0;
            day.fiber += entry.fodmapData?.dietaryFiberInfo?.amountGrams || entry.fiber || 0;
            day.entries += 1;
        });

        const dailyEntries = Array.from(dailyStats.entries());
        const loggedDays = dailyEntries.filter(([, day]) => day.calories > 200).length;
        const loggedDays7 = dailyEntries.filter(([key, day]) => new Date(key) >= last7Start && day.calories > 200).length;
        const avgLogsPerDay7 = foodLogs7.length / Math.max(1, loggedDays7);

        const firstLog = foodLogs.length ? new Date(Math.min(...foodLogs.map(f => f.timestamp.getTime()))) : null;
        const daysSinceFirstLog = firstLog ? Math.max(0, differenceInDays(now, firstLog)) : 0;

        const hasSteps = timelineEntries.some(e =>
            (e.entryType === 'pedometer_data' || e.entryType === 'fitbit_data') &&
            (e as any).steps && e.timestamp >= last7Start
        );
        const hasWeight = Boolean(userProfile?.profile?.weight) || timelineEntries.some(e =>
            e.entryType === 'fitbit_data' && (e as any).weight
        );

        const dietaryPrefs = userProfile?.profile?.dietaryPreferences || [];
        const isFastingUser = dietaryPrefs.includes('intermittent_fasting');
        const isKetoUser = dietaryPrefs.includes('keto');
        const isRamadanFasting = ramadanMode === 'fasting';
        const isRamadanWitnessing = ramadanMode === 'witnessing';

        const isNewUser = !firstLog || daysSinceFirstLog < 7 || loggedDays < 3;
        const hasSufficientCalories = loggedDays >= 5 && avgLogsPerDay7 >= 2;
        const stage = isNewUser ? 0 : loggedDays < 7 ? 1 : loggedDays < 14 ? 2 : 3;

        const avgCalories = loggedDays > 0
            ? Math.round(dailyEntries.reduce((acc, [, day]) => acc + (day.calories > 200 ? day.calories : 0), 0) / Math.max(1, loggedDays))
            : 0;
        const avgProtein = loggedDays > 0
            ? Math.round(dailyEntries.reduce((acc, [, day]) => acc + (day.protein || 0), 0) / Math.max(1, loggedDays))
            : 0;
        const avgFiber = loggedDays > 0
            ? Math.round(dailyEntries.reduce((acc, [, day]) => acc + (day.fiber || 0), 0) / Math.max(1, loggedDays))
            : 0;

        const target = userProfile?.profile?.tdee || 0;
        const userGoal = userProfile?.profile?.goal || 'maintain';

        const add = (priority: number, insight: any) => candidates.push({ priority, insight });

        const recentIds = new Set<string>();
        if (typeof window !== 'undefined') {
            try {
                const raw = localStorage.getItem(HIGHLIGHT_HISTORY_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) as { id: string; ts: number }[];
                    const nowTs = Date.now();
                    parsed
                        .filter(item => nowTs - item.ts < HIGHLIGHT_HISTORY_TTL)
                        .forEach(item => recentIds.add(item.id));
                }
            } catch (e) {
                // ignore history parse errors
            }
        }

        if (isNewUser) {
            add(1, {
                id: 'start-here',
                category: 'Getting Started',
                title: 'Start With the Basics',
                preview: 'Log meals daily, track steps, and add weight to unlock real insights.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">First Week Focus</p>
                            <p>Prioritize daily meal logs and meal timing. This helps your coach understand patterns before giving advanced guidance.</p>
                        </FrostBackplate>
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Add Steps & Weight</p>
                            <p>Steps and weight help us connect intake to energy output and goal progress. You can add these manually from the dashboard cards, or connect Apple Health and Fitbit Aria for automatic sync.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (loggedDays7 < 3 && !isNewUser) {
            add(2, {
                id: 'logging-consistency',
                category: 'Habits',
                title: 'Rebuild Your Logging Streak',
                preview: `You logged ${loggedDays7} day${loggedDays7 === 1 ? '' : 's'} in the last week.`,
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Why It Matters</p>
                            <p>Insights get dramatically better after 5–7 fully logged days. Aim for at least 2 meals per day this week.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (!hasSteps) {
            add(2, {
                id: 'steps-missing',
                category: 'Activity',
                title: 'Add Steps for Better Accuracy',
                preview: 'Connect Apple Health or add steps manually to improve energy balance insights.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Quick Win</p>
                            <p>Steps help estimate energy output so we can show more accurate calorie balance and recovery guidance.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (!hasWeight) {
            add(3, {
                id: 'weight-missing',
                category: 'Progress',
                title: 'Track Weight for Progress',
                preview: 'Even weekly weigh-ins improve trend accuracy.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Simple Habit</p>
                            <p>Add weight on the dashboard card or sync from Fitbit Aria. Consistent trends matter more than daily fluctuations.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (loggedDays7 > 0) {
            add(4, {
                id: 'hydration-rhythm',
                category: 'Hydration',
                title: 'Hydration Rhythm',
                preview: 'Spreading fluids across the day improves comfort and consistency.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Why It Helps</p>
                            <p>Smaller, regular sips are often easier on the stomach and can reduce late‑day thirst.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (avgLogsPerDay7 >= 2) {
            add(4, {
                id: 'meal-timing',
                category: 'Habits',
                title: 'Meal Timing Consistency',
                preview: 'Consistent meal timing supports hunger regulation and energy.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Simple Win</p>
                            <p>Aim for similar meal times each day. This helps your body anticipate energy needs and can reduce cravings.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (timelineEntries.some(e => e.entryType === 'symptom')) {
            add(4, {
                id: 'symptom-patterns',
                category: 'Symptoms',
                title: 'Track Symptom Patterns',
                preview: 'Logging symptoms alongside meals reveals triggers more clearly.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Why It Matters</p>
                            <p>Even brief notes make it easier to link foods to how you feel, which improves recommendations.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (stage >= 1) {
            add(5, {
                id: 'sleep-regularity',
                category: 'Recovery',
                title: 'Sleep Regularity',
                preview: 'Consistent sleep supports appetite regulation and energy.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Keep It Simple</p>
                            <p>Try to keep bedtime and wake time within a 60–90 minute window, even on busy weeks.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (hasSufficientCalories && target > 0) {
            const delta = avgCalories - target;
            const absDelta = Math.abs(delta);
            const direction = delta > 0 ? 'above' : 'below';
            const goalLine = userGoal === 'lose_fat'
                ? 'A moderate deficit supports fat loss without sacrificing energy.'
                : userGoal === 'gain_muscle'
                    ? 'A small surplus supports muscle gain when protein is steady.'
                    : 'Staying near maintenance helps stabilize weight and energy.';

            add(4, {
                id: 'calories-balance',
                category: 'Calories',
                title: 'Calorie Balance (Logged Days)',
                preview: `Averaging ${avgCalories} kcal/day, about ${absDelta} kcal ${direction} target.`,
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Based on {loggedDays} logged days</p>
                            <p>{goalLine}</p>
                        </FrostBackplate>
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Next Step</p>
                            <p>If this feels off, verify portion sizes for the largest meals first.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (hasSufficientCalories && avgProtein > 0) {
            add(5, {
                id: 'protein-coverage',
                category: 'Nutrition',
                title: 'Protein Coverage',
                preview: `Averaging ~${avgProtein}g protein per day.`,
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Why It Matters</p>
                            <p>Protein supports recovery and appetite control. Try spreading it across meals (20–30g each) for consistency.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (hasSufficientCalories && avgFiber > 0) {
            const fiberNote = avgFiber < 20
                ? "Your fiber is a bit low. Add beans, veggies, or oats to one meal."
                : "Great fiber coverage. This supports gut health and steadier energy.";
            add(6, {
                id: 'fiber-quality',
                category: 'Nutrition',
                title: 'Fiber Quality',
                preview: `Averaging ~${avgFiber}g fiber per day.`,
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">What to Do</p>
                            <p>{fiberNote}</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (isFastingUser && trends.maxFastingWindowHours > 0) {
            add(6, {
                id: 'fasting-consistency',
                category: 'Fasting',
                title: 'Fasting Window',
                preview: `Longest recent fast: ${trends.maxFastingWindowHours} hours.`,
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Context</p>
                            <p>Consistency matters more than extreme windows. Track how you feel and keep hydration steady.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (isKetoUser && trends.ketoAdherenceDays > 0) {
            add(7, {
                id: 'keto-adherence',
                category: 'Nutrition',
                title: 'Keto Adherence',
                preview: `${trends.ketoAdherenceDays} low‑carb day${trends.ketoAdherenceDays === 1 ? '' : 's'} recently.`,
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Consistency Tip</p>
                            <p>Stable low‑carb days are more effective than extreme swings. Keep protein steady.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (RAMADAN_ENABLED && isRamadanFasting) {
            add(5, {
                id: 'ramadan-hydration-window',
                category: 'Ramadan',
                title: 'Hydration Window',
                preview: 'Spread fluids between Iftar and bedtime for steadier hydration.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Why It Helps</p>
                            <p>Spacing fluids across the evening can reduce late‑night thirst and support next‑day energy.</p>
                        </FrostBackplate>
                    </div>
                )
            });
            add(6, {
                id: 'ramadan-suhoor-balance',
                category: 'Ramadan',
                title: 'Balanced Suhoor',
                preview: 'Protein + fiber at Suhoor can improve fullness through the day.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Simple Plate</p>
                            <p>Include protein, fiber‑rich carbs, and fluids. This supports steady energy and comfort.</p>
                        </FrostBackplate>
                    </div>
                )
            });
            add(6, {
                id: 'ramadan-iftar-pace',
                category: 'Ramadan',
                title: 'Gentle Iftar Pace',
                preview: 'Start light, pause, then continue your main meal.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Why It Works</p>
                            <p>Slower pacing can improve comfort and reduce overeating after a long fast.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (RAMADAN_ENABLED && isRamadanWitnessing) {
            add(6, {
                id: 'ramadan-support',
                category: 'Community',
                title: 'Supportive Routines',
                preview: 'Small scheduling tweaks can make fasting easier for others.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Ideas</p>
                            <p>Plan social meals later in the day and keep daytime meetings short when possible.</p>
                        </FrostBackplate>
                    </div>
                )
            });
            add(7, {
                id: 'ramadan-sleep-support',
                category: 'Recovery',
                title: 'Sleep Steadiness',
                preview: 'Community schedules shift — keep your sleep window steady.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Why It Matters</p>
                            <p>Stable sleep supports mood, focus, and energy even when routines shift around you.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (trends.calorieStepCorrelationSlope !== undefined) {
            const slope = trends.calorieStepCorrelationSlope;
            const impact = slope > 0.05 ? "Positive" : (slope < -0.05 ? "Inverse" : "Neutral");
            add(8, {
                id: 'activity-impact',
                category: 'Activity',
                title: 'Activity Impact',
                preview: impact === 'Positive'
                    ? 'You tend to eat more on active days.'
                    : impact === 'Inverse'
                        ? 'You tend to eat less on active days.'
                        : 'Activity and intake are fairly stable.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">What This Means</p>
                            <p>Notice how appetite shifts with activity. Use it to plan fueling and recovery intentionally.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        if (!hasSufficientCalories) {
            add(2, {
                id: 'insight-unlock',
                category: 'Habits',
                title: 'Unlock Deeper Insights',
                preview: 'Log 5+ days to unlock calorie balance, trends, and consistency insights.',
                detail: (
                    <div className="space-y-4">
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Why This Helps</p>
                            <p>With more complete days, we can estimate trends without guessing. Aim for at least 2 meals per day.</p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        const desiredCount = stage === 0 ? 3 : 4;
        const sorted = [...candidates].sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return Math.random() - 0.5;
        });

        const pickFrom = (pool: { priority: number; insight: any }[], count: number) => {
            const result: any[] = [];
            for (const item of pool) {
                if (result.length >= count) break;
                result.push(item.insight);
            }
            return result;
        };

        const withoutRecent = sorted.filter(item => !recentIds.has(item.insight.id));
        let selected = pickFrom(withoutRecent, desiredCount);

        if (selected.length < desiredCount) {
            const existing = new Set(selected.map(s => s.id));
            const fallbackPool = sorted.filter(item => !existing.has(item.insight.id));
            selected = [...selected, ...pickFrom(fallbackPool, desiredCount - selected.length)];
        }

        return selected.length ? selected : insights;

    }, [trends, timelineEntries, userProfile, ramadanMode]);

    const selectedInsightKey = useMemo(() => realInsights.map(i => i.id).join('|'), [realInsights]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!selectedInsightKey) return;
        try {
            const now = Date.now();
            const raw = localStorage.getItem(HIGHLIGHT_HISTORY_KEY);
            const existing = raw ? (JSON.parse(raw) as { id: string; ts: number }[]) : [];
            const cleaned = existing.filter(item => now - item.ts < HIGHLIGHT_HISTORY_TTL);
            const incoming = realInsights.map(insight => ({ id: insight.id, ts: now }));
            const merged = [...incoming, ...cleaned.filter(item => !incoming.some(i => i.id === item.id))];
            localStorage.setItem(HIGHLIGHT_HISTORY_KEY, JSON.stringify(merged.slice(0, 50)));
        } catch (e) {
            // ignore history write errors
        }
    }, [selectedInsightKey, realInsights]);

    // Filter
    const filtered = selectedCategory === 'Today'
        ? realInsights
        : realInsights.filter(i => i.category === selectedCategory);

    return (
        <div className="px-4 pb-32 min-h-screen">
            {filtered.length === 0 ? (
                <div className="py-20 text-center text-white/30">
                    <p>No active insights for {selectedCategory}.</p>
                </div>
            ) : (
                filtered.map(insight => (
                    <InsightScene
                        key={insight.id}
                        id={insight.id}
                        category={insight.category}
                        title={insight.title}
                        preview={insight.preview}
                        timeAgo="Today"
                    >
                        {insight.detail}
                    </InsightScene>
                ))
            )}
        </div>
    );
}
