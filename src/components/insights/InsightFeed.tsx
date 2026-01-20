import { InsightScene } from './InsightScene';
import { useInsightsMotionController } from './useInsightsMotionController';
import { FrostBackplate } from './LiquidPrimitive';
import { Button } from '@/components/ui/button';
import { useActionContext } from '@/contexts/ActionContext';
import { calculateTrendsAnalysis } from '@/utils/insights';
import { useMemo } from 'react';

export function InsightFeed() {
    const { selectedCategory } = useInsightsMotionController();
    const { timelineEntries, userProfile } = useActionContext();

    const trends = useMemo(() => {
        return calculateTrendsAnalysis(timelineEntries, userProfile);
    }, [timelineEntries, userProfile]);

    const realInsights = useMemo(() => {
        const insights = [];

        // 1. Calories Insight
        const netCals = trends.cumulativeNetCaloriesWithGuardrail || trends.cumulativeNetCalories;
        insights.push({
            id: 'calories-insight',
            category: 'Calories',
            title: netCals > 0 ? 'Calorie Deficit' : 'Calorie Surplus',
            preview: netCals > 0
                ? `You are ${Math.abs(netCals)}kcal under your maintenance target over the last ${trends.totalDaysAnalyzed} days.`
                : `You are ${Math.abs(netCals)}kcal over your maintenance target over the last ${trends.totalDaysAnalyzed} days.`,
            detail: (
                <div className="space-y-4">
                    <FrostBackplate>
                        <p className="mb-2 font-bold text-white">Analysis</p>
                        <p>
                            {netCals > 0
                                ? "You're consistently hitting your deficit goals. This is the primary driver for fat loss."
                                : "You're currently in a surplus. Ensure this aligns with your goal (e.g. muscle gain) or adjust portion sizes."}
                        </p>
                    </FrostBackplate>
                    <FrostBackplate>
                        <p className="mb-2 font-bold text-white">Adherence</p>
                        <p>You exceeded your daily target on {trends.daysOverCalorieTarget} out of {trends.totalDaysAnalyzed} days.</p>
                    </FrostBackplate>
                </div>
            )
        });

        // 2. Correlation/Flux Impact (The "Slope" User noticed)
        if (trends.calorieStepCorrelationSlope !== undefined) {
            const slope = trends.calorieStepCorrelationSlope;
            const impact = slope > 0.05 ? "Positive" : (slope < -0.05 ? "Inverse" : "Neutral");
            insights.push({
                id: 'correlation-insight',
                category: 'Weight', // Using Weight category for "Impact"
                title: 'Activity Impact',
                preview: `Correlation Slope: ${slope}. ${impact === 'Positive' ? 'You eat more when active.' : (impact === 'Inverse' ? 'You eat less when active.' : 'No strong link between activity and intake.')}`,
                detail: (
                    <div className="space-y-4">
                        <div className="h-40 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 mb-4">
                            {/* In a real app we'd render the mini chart here */}
                            <span className="text-xs text-white/30">Correlation Graph</span>
                        </div>
                        <FrostBackplate>
                            <p className="mb-2 font-bold text-white">Slope Analysis ({slope})</p>
                            <p>
                                {impact === 'Positive'
                                    ? "Your appetite scales with your activity. This is natural, but watch out for 'rewarding' yourself with food after exercise if trying to lose weight."
                                    : (impact === 'Inverse'
                                        ? "Interestingly, you eat less on active days. This creates a massive calorie deficit on those days."
                                        : "Your calorie intake is stable regardless of your activity level.")}
                            </p>
                        </FrostBackplate>
                    </div>
                )
            });
        }

        // 3. Fasting (Static/Computed mainly)
        insights.push({
            id: 'fasting-insight',
            category: 'Fasting',
            title: 'Fasting Consistency',
            preview: `Your max recorded fast recently was ${trends.maxFastingWindowHours || 0} hours.`,
            detail: (
                <div className="space-y-4">
                    <FrostBackplate>
                        <p className="mb-2 font-bold text-white">metric</p>
                        <p>Aim for 16 hours to optimize autophagy and gut rest.</p>
                    </FrostBackplate>
                </div>
            )
        });

        return insights;

    }, [trends]);

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
                    >
                        {insight.detail}
                    </InsightScene>
                ))
            )}
        </div>
    );
}
