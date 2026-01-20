import React, { useState, useRef, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { WeightPoint } from '@/types';
import { format, parseISO } from 'date-fns';
import { HapticsService } from '@/lib/haptics';
import LiquidChartCarousel from './LiquidChartCarousel';
import { useTrendsMotionController } from './useTrendsMotionController';
import { cn } from '@/lib/utils';
import { formatGraphNumber } from '@/utils/format';
import { ChartInteractivityGate } from './ChartInteractivityGate';
import { DragControls } from 'framer-motion';

interface WeightTrendChartProps {
    data: WeightPoint[];
    isDarkMode: boolean;
    viewModeIndex?: number;
    onViewModeChange?: (index: number) => void;
    dragControls?: DragControls;
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

// Sub-component for individual chart slide to avoid code duplication
const WeightChartSlide = ({
    data,
    viewMode,
    isDarkMode,
    isChartInteractionEnabled,
    globalInputDisabled
}: {
    data: WeightPoint[];
    viewMode: ViewMode;
    isDarkMode: boolean;
    isChartInteractionEnabled: boolean;
    globalInputDisabled: boolean;
}) => {
    const [isScrubbing, setIsScrubbing] = useState(false);

    // Animation gate for stability
    const isFirstRender = useRef(true);
    useEffect(() => { isFirstRender.current = false; }, []);
    const shouldAnimate = isFirstRender.current;

    const weightColor = '#2aac6b'; // Primary Green
    const fatColor = '#f59e0b'; // Amber/Orange for Fat
    const labelColor = isDarkMode ? '#a1a1aa' : '#71717a';

    // Sanitize ID for SVG compatibility
    const safeViewMode = viewMode.replace(/\s+/g, '-');

    // Calculate domain min/max dynamically based on view
    const getDomain = () => {
        const weights = data.map(d => d.weight).filter(Number);
        const fats = data.map(d => d.fatMass || 0).filter(v => v > 0);

        let min = 0, max = 100;

        if (viewMode === 'Weight') {
            min = weights.length ? Math.min(...weights) : 0;
            max = weights.length ? Math.max(...weights) : 100;
        } else if (viewMode === 'Fat Mass') {
            min = fats.length ? Math.min(...fats) : 0;
            max = fats.length ? Math.max(...fats) : 20;
        } else {
            // Both - trickier because scales might differ significantly
            // But user asked for "Both", usually on same axis or dual axis?
            // Existing implementation used single axis. Let's stick to that for now.
            const allValues = [...weights, ...fats];
            min = allValues.length ? Math.min(...allValues) : 0;
            max = allValues.length ? Math.max(...allValues) : 100;
        }

        const padding = (max - min) * 0.2;
        return [Math.max(0, min - padding), max + padding];
    };

    const domain = getDomain();

    return (
        <div
            className="w-full h-full relative"
            onTouchStart={() => isChartInteractionEnabled && setIsScrubbing(true)}
            onTouchEnd={() => setIsScrubbing(false)}
            onMouseEnter={() => isChartInteractionEnabled && setIsScrubbing(true)}
            onMouseLeave={() => setIsScrubbing(false)}
        >
            <ChartInteractivityGate isEnabled={isChartInteractionEnabled}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 20, right: 0, left: 0, bottom: 20 }} // Bottom margin for dots
                        onMouseMove={() => {
                            if (isChartInteractionEnabled && !isScrubbing) {
                                setIsScrubbing(true);
                                HapticsService.selection();
                            }
                        }}
                    >
                        <defs>
                            <linearGradient id={`colorWeight-${safeViewMode}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={weightColor} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={weightColor} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id={`colorFat-${safeViewMode}`} x1="0" y1="0" x2="0" y2="1">
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
                            stroke={isScrubbing ? labelColor : 'transparent'}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: isScrubbing ? labelColor : 'transparent', fontSize: 12 }}
                            interval="preserveStartEnd"
                            mirror={true}
                        />
                        <YAxis
                            stroke={isScrubbing ? labelColor : 'transparent'}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: isScrubbing ? labelColor : 'transparent', fontSize: 12 }}
                            domain={domain}
                            type="number"
                            allowDataOverflow={false}
                            tickFormatter={(val) => formatGraphNumber(val)}
                            mirror={true}
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
                                fill={`url(#colorWeight-${safeViewMode})`}
                                animationDuration={1500}
                                isAnimationActive={shouldAnimate}
                            />
                        )}

                        {(viewMode === 'Fat Mass' || viewMode === 'Both') && (
                            <Area
                                type="monotone"
                                dataKey="fatMass"
                                stroke={fatColor}
                                strokeWidth={3}
                                fillOpacity={viewMode === 'Both' ? 0.6 : 1}
                                fill={`url(#colorFat-${safeViewMode})`}
                                animationDuration={1500}
                                isAnimationActive={shouldAnimate}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </ChartInteractivityGate>
        </div>
    );
};

function WeightTrendChart({ data, isDarkMode, viewModeIndex = 0, onViewModeChange, dragControls }: WeightTrendChartProps) {
    const { isChartInteractionEnabled, globalInputDisabled } = useTrendsMotionController();
    // Fallback to local state if not controlled
    const [localViewModeIndex, setLocalViewModeIndex] = useState(0);

    const isControlled = onViewModeChange !== undefined;
    const currentIndex = isControlled ? viewModeIndex : localViewModeIndex;

    const handleIndexChange = (index: number) => {
        if (isControlled && onViewModeChange) {
            onViewModeChange(index);
        } else {
            setLocalViewModeIndex(index);
        }
    };

    const pointerEventsStyle = globalInputDisabled ? 'none' : 'auto';

    return (
        <div
            className="w-full h-full relative"
            style={{ pointerEvents: pointerEventsStyle }}
        >
            <LiquidChartCarousel
                currentIndex={currentIndex}
                onIndexChange={handleIndexChange}
                showDots={false}
                dragControls={dragControls}
            >
                {VIEW_OPTIONS.map((mode) => (
                    <WeightChartSlide
                        key={mode}
                        viewMode={mode}
                        data={data}
                        isDarkMode={isDarkMode}
                        isChartInteractionEnabled={isChartInteractionEnabled}
                        globalInputDisabled={globalInputDisabled}
                    />
                ))}
            </LiquidChartCarousel>
        </div >
    );
}

export default React.memo(WeightTrendChart);
