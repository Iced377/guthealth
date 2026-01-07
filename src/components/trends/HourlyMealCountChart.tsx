'use client';

import type { HourlyMealCountPoint } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface HourlyMealCountChartProps {
    data: HourlyMealCountPoint[];
    isDarkMode: boolean;
}

const getChartColors = (isDarkMode: boolean) => {
    return {
        count: isDarkMode ? 'hsl(142, 70%, 50%)' : 'hsl(142, 76%, 36%)', // Using Primary Green for frequency (hsl from global css potentially, or hardcoded green)
        grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
        text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
    };
};

export default function HourlyMealCountChart({ data, isDarkMode }: HourlyMealCountChartProps) {
    const colors = getChartColors(isDarkMode);

    const chartConfig = {
        count: { label: "Meals Logged", color: colors.count },
    } satisfies import("@/components/ui/chart").ChartConfig;

    if (!data || data.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No meal data available for the selected period.</p>;
    }

    const maxValInDatapoints = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0;
    // Ensure Y axis has at least some height, e.g. 5 meals
    const yAxisDomainMax = Math.max(maxValInDatapoints, 5);
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
                    stroke={colors.text}
                    angle={0}
                    textAnchor={"middle"}
                    height={30}
                    interval={data.length > 12 ? Math.floor(data.length / 12) : 0}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    stroke={colors.text}
                    domain={yAxisDomain}
                    allowDecimals={false} // Count is integer
                    label={{ value: 'Number of Meals', angle: -90, position: 'insideLeft', fill: colors.text, dy: 55, dx: -5 }}
                />
                <ChartTooltip
                    cursor={true}
                    content={<ChartTooltipContent indicator="dot" formatter={(value, name, props) => [value, chartConfig[props.dataKey as keyof typeof chartConfig]?.label || name]} />}
                />
                <Bar
                    dataKey="count"
                    fill={colors.count}
                    radius={[4, 4, 0, 0]}
                />
                <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
        </ChartContainer>
    );
}
