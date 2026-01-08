
'use client';

import type { ActivityPoint } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useMemo } from 'react';

interface ActivityTrendChartProps {
    data: ActivityPoint[];
    isDarkMode: boolean;
}

const getColors = (isDarkMode: boolean) => {
    return {
        steps: isDarkMode ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-2))', // Blue/Teal
        average: isDarkMode ? 'hsl(var(--primary))' : 'hsl(var(--primary))',
        grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
        text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
    };
};

export default function ActivityTrendChart({ data, isDarkMode }: ActivityTrendChartProps) {
    const colors = getColors(isDarkMode);

    const chartData = useMemo(() => {
        // Calculate 7-day moving average
        return data.map((point, index, array) => {
            if (index < 6) return { ...point, movingAverage: null }; // Need 7 days

            const slice = array.slice(index - 6, index + 1);
            const sum = slice.reduce((acc, curr) => acc + curr.steps, 0);
            const avg = Math.round(sum / 7);

            return {
                ...point,
                movingAverage: avg
            };
        });
    }, [data]);

    const chartConfig = {
        steps: { label: "Steps", color: colors.steps },
        movingAverage: { label: "7-Day Avg", color: colors.average },
        burned: { label: "Calories Burned", color: "hsl(var(--chart-3))" }
    } satisfies import("@/components/ui/chart").ChartConfig;

    if (!data || data.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No activity data available for the selected period.</p>;
    }

    return (
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <ComposedChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
            >
                <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => value.slice(5)}
                    stroke={colors.text}
                    angle={0}
                    interval="preserveStartEnd"
                    textAnchor="middle"
                    height={30}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    stroke={colors.text}
                />
                <ChartTooltip
                    cursor={true}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                    dataKey="steps"
                    fill="var(--color-steps)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                    stackId="a"
                />
                <Line
                    type="monotone"
                    dataKey="movingAverage"
                    stroke="var(--color-movingAverage)"
                    strokeWidth={3}
                    dot={false}
                    name="7-Day Avg"
                />
                <ChartLegend content={<ChartLegendContent />} />
            </ComposedChart>
        </ChartContainer>
    );
}
