
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
        weight: { label: "Weight (kg)", color: "hsl(var(--chart-3))" }, // Matches 'not marked'
        fatMass: { label: "Fat Mass (kg)", color: "hsl(var(--chart-2))" },
    } satisfies import("@/components/ui/chart").ChartConfig;

    if (!data || data.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No weight data available for the selected period.</p>;
    }

    // Adaptive domain for weight
    const minWeight = Math.min(...data.map(d => d.weight));
    const maxWeight = Math.max(...data.map(d => d.weight));
    const weightPadding = (maxWeight - minWeight) * 0.1 || 5;
    const weightDomain = [Math.max(0, Math.floor(minWeight - weightPadding)), Math.ceil(maxWeight + weightPadding)];

    // Adaptive domain for fat mass
    const fatMassData = data.map(d => d.fatMass || 0); // Handle potentially undefined
    const minFat = Math.min(...fatMassData);
    const maxFat = Math.max(...fatMassData);
    const fatPadding = (maxFat - minFat) * 0.1 || 2;
    // If no fat data, default to 0-10 or similar to avoid chart errors
    const fatDomain = maxFat > 0
        ? [Math.max(0, Math.floor(minFat - fatPadding)), Math.ceil(maxFat + fatPadding)]
        : [0, 10];

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
                    yAxisId="weight"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    stroke={colors.text}
                    domain={weightDomain}
                    label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: colors.text, fontSize: 12 } }}
                    width={50}
                />
                <YAxis
                    yAxisId="fat"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    stroke={colors.text} // Functionally same color for text, or use fat color?
                    domain={fatDomain}
                    label={{ value: 'Fat Mass (kg)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: colors.text, fontSize: 12 } }}
                    width={50}
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
                <Area
                    yAxisId="weight"
                    dataKey="weight"
                    type="monotone"
                    fill="url(#fillWeight)"
                    stroke="var(--color-weight)"
                    strokeWidth={2.5}
                />
                <Area
                    yAxisId="fat"
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
