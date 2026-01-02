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
    Label
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

export default function CaloriesStepsCorrelationChart({ data, isDarkMode }: CaloriesStepsCorrelationChartProps) {
    // Calculate domain for better visual scaling
    const maxSteps = Math.max(...data.map(d => d.steps), 10000);
    const maxCalories = Math.max(...data.map(d => d.calories), 2500);

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
                    domain={[0, 'auto']}
                    stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                    fontSize={12}
                    tickFormatter={(value) => value.toLocaleString()}
                >
                    <Label value="Daily Steps" offset={0} position="insideBottom" style={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 }} />
                </XAxis>
                <YAxis
                    type="number"
                    dataKey="calories"
                    name="Calories"
                    unit=" kcal"
                    domain={[0, 'auto']}
                    stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                    fontSize={12}
                >
                    <Label value="Calories Consumed" angle={-90} position="insideLeft" style={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 }} />
                </YAxis>
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
                <Scatter data={data} fill={isDarkMode ? '#60a5fa' : '#3b82f6'} shape="circle" />
            </ScatterChart>
        </ResponsiveContainer>
    );
}
