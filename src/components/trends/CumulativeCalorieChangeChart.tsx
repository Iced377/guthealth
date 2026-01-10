'use client';

import { useMemo } from 'react';
import type { CaloriePoint } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CumulativeCalorieChangeChartProps {
    data: CaloriePoint[];
    isDarkMode: boolean;
    targetCalories: number;
}

const COLORS = {
    deficit: '#10B981', // Green-500 (Good - Savings)
    surplus: '#EF4444', // Red-500 (Bad - Debt)
    grid: "hsl(var(--border))",
    text: "hsl(var(--muted-foreground))",
};

export default function CumulativeCalorieChangeChart({ data, isDarkMode, targetCalories }: CumulativeCalorieChangeChartProps) {

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Sort visually by date just in case
        const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Guardrail: Filter out days with < 800 calories (assumed incomplete logging)
        const MIN_VALID_CALORIES = 800;
        const validData = sortedData.filter(point => point.calories && point.calories >= MIN_VALID_CALORIES);

        let runningTotal = 0;

        return validData.map(point => {
            // Calculate daily difference
            // If Target=2000, Consumed=1500 -> Diff = +500 (Deficit/Savings)
            // If Target=2000, Consumed=2500 -> Diff = -500 (Surplus/Over)
            const dailyDiff = targetCalories - (point.calories || 0);
            runningTotal += dailyDiff;

            return {
                date: point.date,
                value: runningTotal,
                dailyDiff
            };
        });
    }, [data, targetCalories]);

    const chartConfig = {
        value: { label: "Cummulative Balance", color: COLORS.deficit },
    } satisfies import("@/components/ui/chart").ChartConfig;

    if (!chartData || chartData.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No data available.</p>;
    }

    // Determine gradient offset for 0-crossing
    const gradientOffset = () => {
        const dataMax = Math.max(...chartData.map((i) => i.value));
        const dataMin = Math.min(...chartData.map((i) => i.value));

        if (dataMax <= 0) {
            return 0; // All negative -> All Red
        }
        if (dataMin >= 0) {
            return 1; // All positive -> All Green
        }

        return dataMax / (dataMax - dataMin);
    };

    const off = gradientOffset();

    return (
        <div className="space-y-4">
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                <AreaChart
                    accessibilityLayer
                    data={chartData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                    <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tickFormatter={(value) => value.slice(5)}
                        stroke={COLORS.text}
                        fontSize={12}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        stroke={COLORS.text}
                        fontSize={12}
                        width={50}
                    />
                    <ReferenceLine y={0} stroke={COLORS.text} strokeDasharray="3 3" />
                    <ChartTooltip
                        cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                        content={({ active, payload, label }) => {
                            if (!active || !payload || !payload.length) return null;
                            const val = payload[0].value as number;
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                                    <div className="font-medium mb-1">{label}</div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${val >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="text-muted-foreground">Net Balance:</span>
                                        <span className={`font-mono font-medium ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {val > 0 ? '+' : ''}{Math.round(val)} kcal
                                        </span>
                                    </div>
                                </div>
                            )
                        }}
                    />
                    <defs>
                        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset={off} stopColor={COLORS.deficit} stopOpacity={1} />
                            <stop offset={off} stopColor={COLORS.surplus} stopOpacity={1} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="url(#splitColor)"
                        fill="url(#splitColor)"
                        fillOpacity={0.4}
                        strokeWidth={2}
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    );
}
