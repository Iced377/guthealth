'use client';

import type { HourlyCaloriePoint } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface HourlyCaloriesChartProps {
    data: HourlyCaloriePoint[];
    isDarkMode: boolean;
}

const getChartColors = (isDarkMode: boolean) => {
    return {
        calories: isDarkMode ? 'hsl(var(--chart-5))' : 'hsl(var(--chart-5))', // Using chart-5 to match Daily Calories
        grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
        text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
    };
};

export default function HourlyCaloriesChart({ data, isDarkMode }: HourlyCaloriesChartProps) {
    const colors = getChartColors(isDarkMode);

    const chartConfig = {
        calories: { label: "Avg. Calories", color: colors.calories },
    } satisfies import("@/components/ui/chart").ChartConfig;

    if (!data || data.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No calorie data available for the selected period.</p>;
    }

    const maxValInDatapoints = data.length > 0 ? Math.max(...data.map(d => d.calories)) : 0;
    const yAxisDomainMax = Math.max(maxValInDatapoints, 100);
    const yAxisDomain = [0, yAxisDomainMax];

    return (
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <BarChart
                accessibilityLayer
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => value}
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
                    domain={yAxisDomain}
                    label={{ value: 'Avg. Calories', angle: -90, position: 'insideLeft', fill: colors.text, dy: 45, dx: -5 }}
                />
                <ChartTooltip
                    cursor={true}
                    content={<ChartTooltipContent indicator="dot" formatter={(value, name, props) => [value, chartConfig[props.dataKey as keyof typeof chartConfig]?.label || name]} />}
                />
                <Bar
                    dataKey="calories"
                    fill={colors.calories}
                    radius={[4, 4, 0, 0]}
                />
                <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
        </ChartContainer>
    );
}
