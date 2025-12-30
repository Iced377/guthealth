
'use client';

import type { ActivityPoint } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ActivityTrendChartProps {
    data: ActivityPoint[];
    isDarkMode: boolean;
}

const getColors = (isDarkMode: boolean) => {
    return {
        steps: isDarkMode ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-2))', // Blue/Teal
        grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
        text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
    };
};

export default function ActivityTrendChart({ data, isDarkMode }: ActivityTrendChartProps) {
    const colors = getColors(isDarkMode);

    const chartConfig = {
        steps: { label: "Steps", color: colors.steps },
        burned: { label: "Calories Burned", color: "hsl(var(--chart-3))" }
    } satisfies import("@/components/ui/chart").ChartConfig;

    if (!data || data.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No activity data available for the selected period.</p>;
    }

    return (
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <AreaChart
                accessibilityLayer
                data={data}
                margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
                <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(5)}
                    stroke={colors.text}
                    angle={data.length > 10 ? -35 : 0}
                    textAnchor={data.length > 10 ? "end" : "middle"}
                    height={data.length > 10 ? 50 : 30}
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
                <defs>
                    <linearGradient id="fillSteps" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="var(--color-steps)"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="95%"
                            stopColor="var(--color-steps)"
                            stopOpacity={0.1}
                        />
                    </linearGradient>
                </defs>
                <Area
                    dataKey="steps"
                    type="monotone"
                    fill="url(#fillSteps)"
                    stroke="var(--color-steps)"
                    strokeWidth={2.5}
                    stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
        </ChartContainer>
    );
}
