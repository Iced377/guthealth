
'use client';

import type { WeightPoint } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

interface WeightTrendChartProps {
    data: WeightPoint[];
    isDarkMode: boolean;
}

const getColors = (isDarkMode: boolean) => {
    return {
        weight: isDarkMode ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-1))', // Greenish/Primary
        grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
        text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
    };
};

export default function WeightTrendChart({ data, isDarkMode }: WeightTrendChartProps) {
    const colors = getColors(isDarkMode);

    const chartConfig = {
        weight: { label: "Weight (kg)", color: colors.weight },
        fatMass: { label: "Fat Mass (kg)", color: "hsl(var(--chart-2))" },
    } satisfies import("@/components/ui/chart").ChartConfig;

    if (!data || data.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No weight data available for the selected period.</p>;
    }

    // Adaptive domain for weight
    const minWeight = Math.min(...data.map(d => d.weight));
    const maxWeight = Math.max(...data.map(d => d.weight));
    const padding = (maxWeight - minWeight) * 0.1 || 5;

    const yAxisDomain = [
        Math.max(0, Math.floor(minWeight - padding)),
        Math.ceil(maxWeight + padding)
    ];

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
                    domain={yAxisDomain}
                />
                <ChartTooltip
                    cursor={true}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <defs>
                    <linearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="var(--color-weight)"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="95%"
                            stopColor="var(--color-weight)"
                            stopOpacity={0.1}
                        />
                    </linearGradient>
                    <linearGradient id="fillFatMass" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor="var(--color-fatMass)"
                            stopOpacity={0.8}
                        />
                        <stop
                            offset="95%"
                            stopColor="var(--color-fatMass)"
                            stopOpacity={0.1}
                        />
                    </linearGradient>
                </defs>
                {/* Fat Mass first so it's behind? No, weight is larger, so weight behind.
                    Actually, if we stack, they stack on top. If not stacked, they overlay.
                    Weight is total. Fat Mass is part.
                    If I put FatMass AFTER Weight, it draws ON TOP of Weight. 
                    So Weight (Background) -> Fat Mass (Foreground).
                */}
                <Area
                    dataKey="weight"
                    type="monotone"
                    fill="url(#fillWeight)"
                    stroke="var(--color-weight)"
                    strokeWidth={2.5}
                    stackId="a" // Stacked? No, if stacked, they add up. Total would be Weight + Fat.
                // We want them separate. Remove stackId.
                />
                <Area
                    dataKey="fatMass"
                    type="monotone"
                    fill="url(#fillFatMass)"
                    stroke="var(--color-fatMass)"
                    strokeWidth={2.5}
                />
                <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
        </ChartContainer>
    );
}
