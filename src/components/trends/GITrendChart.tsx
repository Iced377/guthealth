
'use client';

import type { GIPoint } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'; // Changed LineChart/Line to BarChart/Bar

interface GITrendChartProps {
  data: GIPoint[];
  isDarkMode: boolean;
}

const getGIColors = (isDarkMode: boolean) => {
  const baseColors = {
    gi: isDarkMode ? 'hsl(var(--chart-3))' : 'hsl(var(--chart-3))',
    grid: isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))",
    text: isDarkMode ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))",
  };
  return baseColors;
};

export default function GITrendChart({ data, isDarkMode }: GITrendChartProps) {
  const colors = getGIColors(isDarkMode);

  const chartConfig = {
    gi: { label: "Avg. Glycemic Index", color: colors.gi }, // Updated label for clarity with bars
  } satisfies import("@/components/ui/chart").ChartConfig;

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No GI data available for the selected period.</p>;
  }

  const maxGiInDatapoints = data.length > 0 ? Math.max(...data.map(d => d.gi)) : 0;
  const yAxisDomainMax = Math.max(maxGiInDatapoints, 100);
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
          tickFormatter={(value) => value} // Hour is already short "HH:mm"
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
          label={{ value: 'Avg. GI Value', angle: -90, position: 'insideLeft', fill: colors.text, dy: 40, dx: -5 }}
        />
        <ChartTooltip
          cursor={true}
          content={<ChartTooltipContent indicator="dot" formatter={(value, name, props) => [value, chartConfig[props.dataKey as keyof typeof chartConfig]?.label || name]} />}
        />
        <Bar // Changed from Line
          dataKey="gi"
          fill={colors.gi} // Use fill for bars
          radius={[4, 4, 0, 0]} // Optional: rounded tops for bars
        />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  );
}
