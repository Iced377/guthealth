import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, Label } from 'recharts';
import { useState, useMemo, useRef, useEffect } from 'react';
import React from 'react';
import { format, parseISO } from 'date-fns';
import { useTrendsMotionController } from './useTrendsMotionController';
import { cn } from '@/lib/utils';
import { HapticsService } from '@/lib/haptics';
import { formatGraphNumber } from '@/utils/format';
import { ChartInteractivityGate } from './ChartInteractivityGate';

interface DataPoint {
    x: number;
    y: number;
    date?: string; // Added optional date
}

interface CorrelationTrendChartProps {
    data: DataPoint[];
    isDarkMode: boolean;
}

const CustomYAxisTick = (props: any) => {
    const { x, y, payload, visible, primaryColor, secondaryColor } = props;
    return (
        <g transform={`translate(${x},${y})`} style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s' }}>
            <text x={0} y={0} dy={0} textAnchor="end" fill={primaryColor} fontSize={12}>
                {formatGraphNumber(payload.value)}
            </text>
            <text x={0} y={0} dy={12} textAnchor="end" fill={secondaryColor} fontSize={10}>
                kcal
            </text>
        </g>
    );
};

function CorrelationTrendChart({ data, isDarkMode }: CorrelationTrendChartProps) {
    const { isChartInteractionEnabled, globalInputDisabled } = useTrendsMotionController();
    const [isWebview, setIsWebview] = useState(false);

    // 1. Calculate boundaries (Midpoints)
    const STEP_THRESHOLD = 8000;
    const CALORIE_THRESHOLD = 2000;

    // Bounds for axes
    const maxSteps = Math.max(...data.map(d => d.x), 12000) + 1000;
    const maxCals = Math.max(...data.map(d => d.y), 2500) + 500;

    // Linear Regression for Trend Line
    const trendData = useMemo(() => {
        if (data.length < 2) return [];
        const n = data.length;
        const sumX = data.reduce((acc, d) => acc + d.x, 0);
        const sumY = data.reduce((acc, d) => acc + d.y, 0);
        const sumXY = data.reduce((acc, d) => acc + d.x * d.y, 0);
        const sumXX = data.reduce((acc, d) => acc + d.x * d.x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return [{ x: 0, y: intercept }, { x: maxSteps, y: slope * maxSteps + intercept }];
    }, [data, maxSteps]);

    const labelColor = `var(--chart-axis, ${isDarkMode ? '#a1a1aa' : '#71717a'})`;
    const stepsColor = 'var(--metric-steps, #3b82f6)';
    const caloriesColor = 'var(--metric-calories, #ef4444)';
    const trendLineColor = 'var(--state-over, #f59e0b)';
    const zoneSedentaryFill = 'var(--state-risk, #fee2e2)';
    const zoneSedentaryLabel = 'var(--state-risk, #ef4444)';
    const zoneOptimalFill = 'var(--state-on-track, #dcfce7)';
    const zoneOptimalLabel = 'var(--state-on-track, #22c55e)';
    const zoneLowFill = 'var(--web-surface-2, #f3f4f6)';
    const zoneLowLabel = `var(--chart-axis, ${isDarkMode ? '#9ca3af' : '#9ca3af'})`;
    const zoneGrindFill = 'var(--state-over, #fef9c3)';
    const zoneGrindLabel = 'var(--state-over, #eab308)';
    const tooltipStyle: React.CSSProperties = {
        backgroundColor: `var(--chart-tooltip-bg, ${isDarkMode ? 'rgba(11,11,15,0.95)' : 'rgba(255,255,255,0.92)'})`,
        borderColor: `var(--chart-tooltip-border, ${isDarkMode ? 'rgba(31,41,55,0.7)' : 'rgba(15,23,42,0.08)'})`,
    };

    useEffect(() => {
        if (typeof document === 'undefined') return;
        setIsWebview(document.documentElement.dataset.webview === 'true');
    }, []);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);

    // Animation gate for stability
    const isFirstRender = useRef(true);
    useEffect(() => { isFirstRender.current = false; }, []);
    const shouldAnimate = isFirstRender.current;

    return (
        <div className="w-full h-full relative">
            <ChartInteractivityGate isEnabled={isChartInteractionEnabled}>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 15 }}>
                        {/* Quadrant Backgrounds - "Very subtle washes" */}
                        <ReferenceArea
                            x1={0} x2={STEP_THRESHOLD} y1={CALORIE_THRESHOLD} y2={maxCals}
                            fill={zoneSedentaryFill} fillOpacity={data.length > 0 ? 0.03 : 0}
                            stroke="none"
                            label={{ value: 'Sedentary', position: 'insideTopLeft', fill: zoneSedentaryLabel, fontSize: 10, fontWeight: 600, dx: 10, dy: 10, opacity: 0.4 }}
                        />
                        <ReferenceArea
                            x1={STEP_THRESHOLD} x2={maxSteps} y1={CALORIE_THRESHOLD} y2={maxCals}
                            fill={zoneOptimalFill} fillOpacity={data.length > 0 ? 0.03 : 0}
                            stroke="none"
                            label={{ value: 'Optimal Flux', position: 'insideTopRight', fill: zoneOptimalLabel, fontSize: 10, fontWeight: 600, dx: -10, dy: 10, opacity: 0.4 }}
                        />
                        <ReferenceArea
                            x1={0} x2={STEP_THRESHOLD} y1={0} y2={CALORIE_THRESHOLD}
                            fill={zoneLowFill} fillOpacity={data.length > 0 ? 0.03 : 0}
                            stroke="none"
                            label={{ value: 'Low Flux', position: 'insideBottomLeft', fill: zoneLowLabel, fontSize: 10, fontWeight: 600, dx: 10, dy: -10, opacity: 0.4 }}
                        />
                        <ReferenceArea
                            x1={STEP_THRESHOLD} x2={maxSteps} y1={0} y2={CALORIE_THRESHOLD}
                            fill={zoneGrindFill} fillOpacity={data.length > 0 ? 0.03 : 0}
                            stroke="none"
                            label={{ value: 'The Grind', position: 'insideBottomRight', fill: zoneGrindLabel, fontSize: 10, fontWeight: 600, dx: -10, dy: -10, opacity: 0.4 }}
                        />

                        {/* Quadrant Dividers - "Thin dashed reference lines" */}
                        <ReferenceLine x={STEP_THRESHOLD} stroke={labelColor} strokeOpacity={0.1} strokeDasharray="3 3" />
                        <ReferenceLine y={CALORIE_THRESHOLD} stroke={labelColor} strokeOpacity={0.1} strokeDasharray="3 3" />

                        <XAxis
                            type="number"
                            dataKey="x"
                            domain={[0, maxSteps]}
                            tickFormatter={(val) => val >= 1000 ? `${formatGraphNumber(val / 1000)}k` : formatGraphNumber(val)}
                            stroke={labelColor}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: (isWebview || isScrubbing) ? labelColor : 'transparent', fontSize: 12 }}
                            mirror={true}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            domain={[0, maxCals]}
                            stroke={isScrubbing ? labelColor : 'transparent'}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={<CustomYAxisTick visible={isWebview || isScrubbing} primaryColor={labelColor} secondaryColor={labelColor} />}
                            tickFormatter={(val) => formatGraphNumber(val)}
                            width={0}
                        />

                        {isChartInteractionEnabled && (
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3', stroke: labelColor, strokeOpacity: 0.5 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const pt = payload[0].payload as DataPoint;
                                        return (
                                            <div className="bg-background/80 backdrop-blur-md border border-border p-3 rounded-2xl shadow-xl min-w-[160px]" style={tooltipStyle}>
                                                <p className="font-semibold mb-2 text-sm text-foreground">
                                                    {pt.date ? format(parseISO(pt.date), 'EEEE, MMM d') : 'Log'}
                                                </p>

                                                <p className="text-xl font-bold flex items-center gap-2 mb-1">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stepsColor }} />
                                                    <span className="text-foreground">{formatGraphNumber(pt.x)}</span>
                                                    <span className="text-xs font-normal text-muted-foreground">steps</span>
                                                </p>

                                                <p className="text-xl font-bold flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: caloriesColor }} />
                                                    <span className="text-foreground">{formatGraphNumber(pt.y)}</span>
                                                    <span className="text-xs font-normal text-muted-foreground">kcal</span>
                                                </p>

                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2 font-medium">
                                                    {pt.x > STEP_THRESHOLD ? (pt.y > CALORIE_THRESHOLD ? 'Optimal Flux' : 'The Grind') : (pt.y > CALORIE_THRESHOLD ? 'Sedentary' : 'Low Flux')}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        )}

                        {/* Trend Line */}
                        <Scatter
                            name="Trend"
                            data={trendData}
                            line={{ stroke: trendLineColor, strokeWidth: 2, strokeDasharray: '5 5', opacity: isScrubbing ? 0.3 : 0.8 }}
                            shape={() => <g />}
                            legendType="none"
                            isAnimationActive={shouldAnimate}
                        />

                        {/* Data Points */}
                        <Scatter
                            name="Days"
                            data={data}
                            fill={stepsColor}
                            onClick={(data) => {
                                if (!isChartInteractionEnabled) return;
                                setIsScrubbing(true);
                            }}
                            isAnimationActive={shouldAnimate}
                        >
                        </Scatter>

                    </ScatterChart>
                </ResponsiveContainer>
            </ChartInteractivityGate>
        </div>
    );
}

export default React.memo(CorrelationTrendChart);
