import type { CaloriePoint } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine } from 'recharts';

interface DailyCaloriesTrendChartProps {
  data: CaloriePoint[];
  // theme: string; // Removed unused theme prop
  isDarkMode: boolean;
  targetCalories: number;
}

const COLORS = {
  safe: '#3B82F6',   // Blue-500 (Under Limit)
  danger: '#EF4444', // Red-500 (Over Limit)
  grid: "hsl(var(--border))",
  text: "hsl(var(--muted-foreground))",
  target: "hsl(var(--foreground))"
};

export default function DailyCaloriesTrendChart({ data, isDarkMode, targetCalories }: DailyCaloriesTrendChartProps) {

  const chartConfig = {
    calories: { label: "Calories (kcal)", color: COLORS.safe },
  } satisfies import("@/components/ui/chart").ChartConfig;

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No data available for the selected period.</p>;
  }

  // Filter out invalid data to prevent NaN
  const validData = data.filter(d => !isNaN(d.calories) && d.calories >= 0);

  if (validData.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No valid data available.</p>;
  }

  const maxY = Math.max(...data.map(d => d.calories), targetCalories * 1.2);

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={validData}
        margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
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
          domain={[0, 'auto']}
        />
        <ReferenceLine
          y={targetCalories}
          stroke={COLORS.target}
          strokeDasharray="3 3"
          label={{ position: 'top', value: 'Target', fill: COLORS.text, fontSize: 10 }}
        />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar
          dataKey="calories"
          radius={[4, 4, 0, 0]}
          fill={COLORS.safe}
        >
          {validData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.calories > targetCalories ? COLORS.danger : COLORS.safe}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
