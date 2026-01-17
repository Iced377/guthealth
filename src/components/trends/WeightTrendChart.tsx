import React, { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { WeightPoint } from '@/types';
import { format, parseISO } from 'date-fns';
import { HapticsService } from '@/lib/haptics';
import LiquidSegmentedControl from '@/components/ui/LiquidSegmentedControl';
import { useTrendsMotionController } from './useTrendsMotionController';
import { cn } from '@/lib/utils';
import { formatGraphNumber } from '@/utils/format';

import { ChartInteractivityGate } from './ChartInteractivityGate';

interface WeightTrendChartProps {
    data: WeightPoint[];
    isDarkMode: boolean;
}

// Helper for safe date formatting
const safeFormatDate = (dateStr: string, formatStr: string) => {
    try {
        if (!dateStr) return '';
        return format(parseISO(dateStr), formatStr);
    } catch (e) {
        return dateStr;
    }
};

type ViewMode = 'Weight' | 'Fat Mass' | 'Both';
const VIEW_OPTIONS: ViewMode[] = ['Weight', 'Fat Mass', 'Both'];

function WeightTrendChart({ data, isDarkMode }: WeightTrendChartProps) {
    const { isChartInteractionEnabled, globalInputDisabled } = useTrendsMotionController();
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [viewModeIndex, setViewModeIndex] = useState(0);
    const viewMode = VIEW_OPTIONS[viewModeIndex];

    const weightColor = '#2aac6b'; // Primary Green
    const fatColor = '#f59e0b'; // Amber/Orange for Fat
    const labelColor = isDarkMode ? '#a1a1aa' : '#71717a';

    // Calculate domain min/max dynamically based on view
    const getDomain = () => {
        const weights = data.map(d => d.weight).filter(Number);
        const fats = data.map(d => d.fatMass || 0).filter(v => v > 0);

        let min = 0, max = 100;

        if (viewMode === 'Weight') {
            min = Math.min(...weights);
            max = Math.max(...weights);
        } else if (viewMode === 'Fat Mass') {
            min = fats.length ? Math.min(...fats) : 0;
            max = fats.length ? Math.max(...fats) : 20;
        } else {
            // Both
            const allValues = [...weights, ...fats];
            min = Math.min(...allValues);
            max = Math.max(...allValues);
        }

        const padding = (max - min) * 0.2;
        return [Math.max(0, min - padding), max + padding];
    };

    const domain = getDomain();

    const pointerEventsStyle = globalInputDisabled ? 'none' : 'auto';

    return (
        <div
            className="w-full h-full relative"
            style={{ pointerEvents: pointerEventsStyle }}
            onTouchStart={() => isChartInteractionEnabled && setIsScrubbing(true)}
            onTouchEnd={() => setIsScrubbing(false)}
            onMouseEnter={() => isChartInteractionEnabled && setIsScrubbing(true)}
            onMouseLeave={() => setIsScrubbing(false)}
        >
            {/* Toggle Control - Positioned Top Center */}
            <div className="absolute top-0 left-0 right-0 flex justify-center z-20 pointer-events-auto p-2">
                <LiquidSegmentedControl
                    className={cn(globalInputDisabled && "opacity-50 pointer-events-none")}
                    options={VIEW_OPTIONS.map(opt => ({ id: opt, label: opt }))}
                    selected={VIEW_OPTIONS[viewModeIndex]}
                    onChange={(id) => {
                        if (globalInputDisabled) return;
                        HapticsService.selection();
                        const idx = VIEW_OPTIONS.indexOf(id as ViewMode);
                        if (idx !== -1) setViewModeIndex(idx);
                    }}
                    layoutIdPrefix="weight-view-mode"
                // className="w-full max-w-[300px]" // Passed via className prop above? No, separate prop.
                // The original code passed it as prop.
                />
                {/* Note: Original code had className prop on LiquidSegmentedControl, but I moved it to className prop. */}
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 60, right: 0, left: 0, bottom: 0 }} /* Top margin for toggle */
                    onMouseMove={() => {
                        if (isChartInteractionEnabled && !isScrubbing) {
                            setIsScrubbing(true);
                            HapticsService.selection();
                        }
                    }}
                >
                    <ChartInteractivityGate isEnabled={isChartInteractionEnabled}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={weightColor} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={weightColor} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={fatColor} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={fatColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>

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
                            domain={domain}
                            type="number"
                            allowDataOverflow={false}
                            tickFormatter={(val) => formatGraphNumber(val)}
                        />

                        {isChartInteractionEnabled && (
                            <Tooltip
                                cursor={{ stroke: labelColor, strokeDasharray: '4 4' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-background/80 backdrop-blur-md border border-border p-3 rounded-2xl shadow-xl">
                                                <p className="font-semibold mb-1">{safeFormatDate(label, 'EEEE, MMM d')}</p>

                                                {(viewMode === 'Weight' || viewMode === 'Both') && (
                                                    <p className="text-xl font-bold flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-[#2aac6b]" />
                                                        {formatGraphNumber(payload.find(p => p.dataKey === 'weight')?.value as number)} <span className="text-xs font-normal text-muted-foreground">kg</span>
                                                    </p>
                                                )}

                                                {(viewMode === 'Fat Mass' || viewMode === 'Both') && (
                                                    <p className="text-xl font-bold flex items-center gap-2 mt-1">
                                                        <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                                                        {formatGraphNumber(payload.find(p => p.dataKey === 'fatMass')?.value as number || 0)} <span className="text-xs font-normal text-muted-foreground">kg fat</span>
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        )}

                        {(viewMode === 'Weight' || viewMode === 'Both') && (
                            <Area
                                type="monotone"
                                dataKey="weight"
                                stroke={weightColor}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorWeight)"
                                animationDuration={0}
                                isAnimationActive={false}
                            />
                        )}

                        {(viewMode === 'Fat Mass' || viewMode === 'Both') && (
                            <Area
                                type="monotone"
                                dataKey="fatMass"
                                stroke={fatColor}
                                strokeWidth={3}
                                fillOpacity={viewMode === 'Both' ? 0.6 : 1}
                                fill="url(#colorFat)"
                                animationDuration={0}
                                isAnimationActive={false}
                            />
                        )}
                    </ChartInteractivityGate>
                </AreaChart>
            </ResponsiveContainer>
        </div >
    );
}

export default React.memo(WeightTrendChart);
