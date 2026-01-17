import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ActivityPoint } from '@/types';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import React from 'react';
import { HapticsService } from '@/lib/haptics';
import LiquidSegmentedControl from '@/components/ui/LiquidSegmentedControl';
import { useTrendsMotionController } from './useTrendsMotionController';
import { cn } from '@/lib/utils';
import { formatGraphNumber } from '@/utils/format';
import { ChartInteractivityGate } from './ChartInteractivityGate';

interface ActivityTrendChartProps {
    data: ActivityPoint[];
    isDarkMode: boolean;
}

// Helper
const safeFormatDate = (dateStr: string, formatStr: string) => {
    try {
        if (!dateStr) return '';
        return format(parseISO(dateStr), formatStr);
    } catch (e) {
        return dateStr;
    }
};

type ViewMode = 'Steps' | 'Calories' | 'Correlation';
const VIEW_OPTIONS: ViewMode[] = ['Steps', 'Calories', 'Correlation'];

function ActivityTrendChart({ data, isDarkMode }: ActivityTrendChartProps) {
    const { isChartInteractionEnabled, globalInputDisabled } = useTrendsMotionController();
    const [isScrubbing, setIsScrubbing] = useState(false);

    const stepsColor = '#3b82f6';
    const labelColor = isDarkMode ? '#a1a1aa' : '#71717a';

    return (
        <div className="w-full h-full relative">
            <ChartInteractivityGate isEnabled={isChartInteractionEnabled}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                        onMouseMove={() => {
                            if (isChartInteractionEnabled && !isScrubbing) {
                                setIsScrubbing(true);
                                HapticsService.selection();
                            }
                        }}
                    >
                        {isScrubbing && isChartInteractionEnabled && (
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        )}

                        <XAxis
                            dataKey="date"
                            tickFormatter={(value) => safeFormatDate(value, 'MMM d')}
                            stroke={labelColor}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            hide={!isScrubbing}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            stroke={labelColor}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            hide={!isScrubbing}
                            domain={[0, 'auto']}
                            tickFormatter={(val) => formatGraphNumber(val)}
                        />

                        {isChartInteractionEnabled && (
                            <Tooltip
                                cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-background/80 backdrop-blur-md border border-border p-3 rounded-2xl shadow-xl">
                                                <p className="font-semibold mb-1">{safeFormatDate(label, 'EEEE, MMM d')}</p>
                                                <p className="text-xl font-bold flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                                                    {formatGraphNumber(payload[0].value as number)} <span className="text-xs font-normal text-muted-foreground">steps</span>
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        )}

                        <Bar
                            dataKey="steps"
                            maxBarSize={60}
                            radius={[4, 4, 4, 4]}
                            animationDuration={0}
                            fill={stepsColor}
                            opacity={0.8}
                            isAnimationActive={false}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartInteractivityGate>
        </div>
    );
}

export default React.memo(ActivityTrendChart);
