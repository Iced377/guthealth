import { LiquidGlassPanel } from './LiquidPrimitive';
import { LiquidLens } from './LiquidLens';
import { Flame, Footprints, Moon, Utensils } from 'lucide-react';
import { useInsightsMotionController } from './useInsightsMotionController';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens, LiquidMode } from '@/lib/liquid-tokens';
import { cn } from '@/lib/utils';

export function TodayBrief() {
    const { requestExpand } = useInsightsMotionController();
    const timeNow = new Date().getHours();
    const fastingHours = 14.5;

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
                        Good {timeNow < 12 ? 'Morning' : timeNow < 18 ? 'Afternoon' : 'Evening'}, Abed.
                    </h1>
                    <p className={cn("text-sm line-clamp-2 pr-8 leading-relaxed", tokens.text.secondary)}>
                        You're on track. 2 wins, 1 suggestion for dinner. Keep up the high protein streak.
                    </p>
                </div>

                {/* Micro Metrics Row */}
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 py-1 mt-auto">
                    <LiquidLens size="sm" className="gap-2 pr-3 whitespace-nowrap">
                        <Moon className="h-3 w-3 text-indigo-400" />
                        <span className={tokens.text.primary}>{fastingHours}h Fast</span>
                    </LiquidLens>
                    <LiquidLens size="sm" className="gap-2 pr-3 whitespace-nowrap">
                        <Flame className="h-3 w-3 text-orange-400" />
                        <span className={tokens.text.primary}>1,240 kcal</span>
                    </LiquidLens>
                    <LiquidLens size="sm" className="gap-2 pr-3 whitespace-nowrap">
                        <Utensils className="h-3 w-3 text-blue-400" />
                        <span className={tokens.text.primary}>110g Prot</span>
                    </LiquidLens>
                    <LiquidLens size="sm" className="gap-2 pr-3 whitespace-nowrap">
                        <Footprints className="h-3 w-3 text-green-400" />
                        <span className={tokens.text.primary}>6.2k Steps</span>
                    </LiquidLens>
                </div>
            </div>
        </LiquidGlassPanel>
    );
}
