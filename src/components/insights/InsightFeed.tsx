import { InsightScene } from './InsightScene';
import { useInsightsMotionController } from './useInsightsMotionController';
import { FrostBackplate } from './LiquidPrimitive';
import { Button } from '@/components/ui/button';

// Mock Data
const MOCK_INSIGHTS = [
    {
        id: '1',
        category: 'Calories',
        title: 'Calorie Deficit On Track',
        preview: 'You are 200kcal under your target, which aligns with your fat loss goal. Great job hitting protein early.',
        detail: (
            <div className="space-y-4">
                <FrostBackplate>
                    <p className="mb-2 font-bold text-white">Analysis</p>
                    <p>Your consistency is paying off. You've hit your deficit target for 5 of the last 7 days.</p>
                </FrostBackplate>
                <FrostBackplate>
                    <p className="mb-2 font-bold text-white">Recommendation</p>
                    <p>Consider a high-protein snack around 3pm to prevent evening hunger spikes based on your history.</p>
                </FrostBackplate>
                <div className="pt-4">
                    <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white">Log High-Protein Snack</Button>
                </div>
            </div>
        )
    },
    {
        id: '2',
        category: 'Fasting',
        title: 'Fasting Window Approaching',
        preview: 'Your 16h fast typically starts at 8pm. You have 1 hour left in your eating window.',
        detail: (
            <div className="space-y-4">
                <FrostBackplate>
                    <p className="mb-2 font-bold text-white">Timing</p>
                    <p>Based on your circadian rhythm data, stopping food intake by 8pm improves your deep sleep scores by 15%.</p>
                </FrostBackplate>
            </div>
        )
    },
    {
        id: '3',
        category: 'Weight',
        title: 'Weekly Weight Trend',
        preview: 'Down 0.8 lbs this week. The slope is perfect for sustainable loss without muscle catabolism.',
        detail: (
            <div className="space-y-4">
                <div className="h-40 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 mb-4">
                    <span className="text-xs text-white/30">Chart Placeholder</span>
                </div>
                <FrostBackplate>
                    <p>Your moving average is trending down steadily. Water retention from yesterday's sodium seems to have flushed out.</p>
                </FrostBackplate>
            </div>
        )
    }
];

export function InsightFeed() {
    const { selectedCategory } = useInsightsMotionController();

    // Filter
    const filtered = selectedCategory === 'Today'
        ? MOCK_INSIGHTS
        : MOCK_INSIGHTS.filter(i => i.category === selectedCategory);

    return (
        <div className="px-4 pb-32 min-h-screen">
            {filtered.length === 0 ? (
                <div className="py-20 text-center text-white/30">
                    <p>No updates for {selectedCategory} yet.</p>
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
