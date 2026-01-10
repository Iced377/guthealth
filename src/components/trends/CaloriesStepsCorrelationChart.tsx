"use client"

import React from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Label,
    ReferenceArea,
    ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

export interface CorrelationPoint {
    date: string;
    steps: number;
    calories: number;
}

interface CaloriesStepsCorrelationChartProps {
    data: CorrelationPoint[];
    isDarkMode: boolean;
    targetCalories: number;
}

const CustomTooltip = ({ active, payload, label, isDarkMode }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className={`p-3 rounded-lg border shadow-lg ${isDarkMode ? 'bg-card border-border text-card-foreground' : 'bg-white border-slate-200 text-slate-800'}`}>
                <p className="font-semibold mb-1">{data.date}</p>
                <div className="text-sm space-y-1">
                    <p className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Steps: <span className="font-mono font-medium">{data.steps.toLocaleString()}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Calories: <span className="font-mono font-medium">{data.calories.toLocaleString()} kcal</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function CaloriesStepsCorrelationChart({ data, isDarkMode, targetCalories }: CaloriesStepsCorrelationChartProps) {
    // Calculate domain for better visual scaling
    // Ensure the domain covers at least the 7500 step mark and target calories for the zones to make sense
    const STEP_THRESHOLD = 7500;

    const maxDataSteps = Math.max(...data.map(d => d.steps), 0);
    const maxDataCalories = Math.max(...data.map(d => d.calories), 0);

    // Enforce minimum domain to show all quadrants even if data is low
    // We want to show at least up to 12k steps or 1.2x data max
    const maxSteps = Math.max(maxDataSteps * 1.1, STEP_THRESHOLD * 1.5, 12000);

    // We want to show at least up to 1.2x TDEE or 1.2x data max
    const maxCalories = Math.max(maxDataCalories * 1.1, targetCalories * 1.3, 2500);

    return (
        <ResponsiveContainer width="100%" height={350}>
            <ScatterChart
                margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 0,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                <XAxis
                    type="number"
                    dataKey="steps"
                    name="Steps"
                    unit=""
                    domain={[0, maxSteps]}
                    stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                    fontSize={12}
                    minTickGap={32}
                    tickFormatter={(value) => Math.round(value).toLocaleString()}
                    allowDecimals={false}
                >
                    <Label value="Daily Steps" offset={0} position="insideBottom" style={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 }} />
                </XAxis>
                <YAxis
                    type="number"
                    dataKey="calories"
                    name="Calories"
                    unit=" kcal"
                    domain={[0, maxCalories]}
                    stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                    fontSize={12}
                    tickFormatter={(value) => Math.round(value).toLocaleString()}
                    allowDecimals={false}
                >
                    <Label value="Calories Consumed" angle={-90} position="insideLeft" style={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 }} />
                </YAxis>

                {/* Energy Flux Zones */}
                {/* 1. Metabolic Stagnation (Low Flux) - Low Steps, Low Cal */}
                <ReferenceArea
                    x1={0} x2={STEP_THRESHOLD}
                    y1={0} y2={targetCalories}
                    fill="gray" fillOpacity={isDarkMode ? 0.1 : 0.05}
                >
                    <Label value="Low Flux" position="insideBottomLeft" offset={10} fill={isDarkMode ? "#64748b" : "#94a3b8"} fontSize={10} />
                </ReferenceArea>

                {/* 2. Sedentary Storage - Low Steps, High Cal */}
                <ReferenceArea
                    x1={0} x2={STEP_THRESHOLD}
                    y1={targetCalories} y2={maxCalories}
                    fill="red" fillOpacity={isDarkMode ? 0.1 : 0.05}
                >
                    <Label value="Sedentary Storage" position="insideTopLeft" offset={10} fill={isDarkMode ? "#f87171" : "#ef4444"} fontSize={10} />
                </ReferenceArea>

                {/* 3. The Grind - High Steps, Low Cal */}
                <ReferenceArea
                    x1={STEP_THRESHOLD} x2={maxSteps}
                    y1={0} y2={targetCalories}
                    fill="orange" fillOpacity={isDarkMode ? 0.1 : 0.05}
                >
                    <Label value="The Grind" position="insideBottomRight" offset={10} fill={isDarkMode ? "#fbbf24" : "#f59e0b"} fontSize={10} />
                </ReferenceArea>

                {/* 4. Optimal Flux - High Steps, High Cal */}
                <ReferenceArea
                    x1={STEP_THRESHOLD} x2={maxSteps}
                    y1={targetCalories} y2={maxCalories}
                    fill="green" fillOpacity={isDarkMode ? 0.1 : 0.05}
                >
                    <Label value="Optimal Flux" position="insideTopRight" offset={10} fill={isDarkMode ? "#4ade80" : "#22c55e"} fontSize={10} />
                </ReferenceArea>

                <ReferenceLine x={STEP_THRESHOLD} stroke={isDarkMode ? "#475569" : "#cbd5e1"} strokeDasharray="3 3" />
                <ReferenceLine y={targetCalories} stroke={isDarkMode ? "#475569" : "#cbd5e1"} strokeDasharray="3 3" />


                <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} trigger="click" />
                <Scatter
                    name="Daily Log"
                    data={data}
                    fill="#8884d8"
                >
                    {/* Custom shape or just circles. Let's use simple circles but color them nicely */}
                    {data.map((entry, index) => (
                        <rect key={index} width={0} height={0} /> // Placeholder, actual styling is in the fill above or cell
                    ))}
                    {/* We can use a single color for now, visually distinct */}
                </Scatter>
                <Scatter
                    name="Daily Log"
                    data={data}
                    fill={isDarkMode ? '#60a5fa' : '#3b82f6'}
                    shape="circle"
                />

                {/* Regression Line */}
                {(() => {
                    if (data.length < 2) return null;

                    const n = data.length;
                    const sumX = data.reduce((acc, p) => acc + p.steps, 0);
                    const sumY = data.reduce((acc, p) => acc + p.calories, 0);
                    const sumXY = data.reduce((acc, p) => acc + (p.steps * p.calories), 0);
                    const sumXX = data.reduce((acc, p) => acc + (p.steps * p.steps), 0);

                    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
                    const intercept = (sumY - slope * sumX) / n;

                    const minX = Math.min(...data.map(d => d.steps));
                    const maxX = Math.max(...data.map(d => d.steps));

                    const regressionData = [
                        { steps: minX, calories: slope * minX + intercept },
                        { steps: maxX, calories: slope * maxX + intercept }
                    ];

                    return (
                        <Scatter
                            name="Trend"
                            data={regressionData}
                            line={{ stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 5' }}
                            shape={() => <g />} // Hide dots for the line endpoints
                            legendType="none"
                            tooltipType="none"
                        />
                    );
                })()}
            </ScatterChart>
        </ResponsiveContainer>
    );
}
