import { useState, useMemo } from 'react'; // Added imports
import type { MacroPoint } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'; // Changed LineChart to BarChart
import { Button } from "@/components/ui/button"; // For filters
import { cn } from "@/lib/utils";

interface DailyMacrosTrendChartProps {
  data: MacroPoint[];
  isDarkMode: boolean;
}

const COLORS = {
  protein: '#EF4444', // Red-500
  carbs: '#EAB308',   // Yellow-500
  fat: '#3B82F6',     // Blue-500
  grid: "hsl(var(--border))",
  text: "hsl(var(--muted-foreground))",
};

export default function DailyMacrosTrendChart({ data, isDarkMode }: DailyMacrosTrendChartProps) {
  const [unit, setUnit] = useState<'grams' | 'calories'>('grams');
  const [visibleMacros, setVisibleMacros] = useState<string[]>(['protein', 'carbs', 'fat']);

  const toggleMacro = (macro: string) => {
    setVisibleMacros(prev =>
      prev.includes(macro) ? prev.filter(m => m !== macro) : [...prev, macro]
    );
  };

  const chartConfig = {
    protein: { label: "Protein", color: COLORS.protein },
    carbs: { label: "Carbs", color: COLORS.carbs },
    fat: { label: "Fat", color: COLORS.fat },
  } satisfies import("@/components/ui/chart").ChartConfig;

  // Prepare Data based on Mode
  const chartData = useMemo(() => {
    return data.map(point => {
      if (unit === 'grams') {
        return point; // Already in grams
      } else {
        // Convert to Calorie Contribution
        return {
          ...point, // keep date
          protein: (point.protein || 0) * 4,
          carbs: (point.carbs || 0) * 4,
          fat: (point.fat || 0) * 9,
        };
      }
    });
  }, [data, unit]);

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No data available for the selected period.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Filter Toggles */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => toggleMacro('protein')}
            className={cn("px-3 py-1.5 rounded-full border transition-colors flex items-center gap-2 font-medium",
              visibleMacros.includes('protein') ? "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400" : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", visibleMacros.includes('protein') ? "bg-red-500" : "bg-muted-foreground")} />
            Protein
          </button>
          <button
            onClick={() => toggleMacro('carbs')}
            className={cn("px-3 py-1.5 rounded-full border transition-colors flex items-center gap-2 font-medium",
              visibleMacros.includes('carbs') ? "bg-yellow-500/10 border-yellow-500 text-yellow-600 dark:text-yellow-400" : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", visibleMacros.includes('carbs') ? "bg-yellow-500" : "bg-muted-foreground")} />
            Carbs
          </button>
          <button
            onClick={() => toggleMacro('fat')}
            className={cn("px-3 py-1.5 rounded-full border transition-colors flex items-center gap-2 font-medium",
              visibleMacros.includes('fat') ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400" : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", visibleMacros.includes('fat') ? "bg-blue-500" : "bg-muted-foreground")} />
            Fat
          </button>
        </div>

        {/* Unit Toggle */}
        <div className="border rounded-md p-0.5 bg-muted flex items-center">
          <button
            onClick={() => setUnit('grams')}
            className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", unit === 'grams' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            Grams
          </button>
          <button
            onClick={() => setUnit('calories')}
            className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", unit === 'calories' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            % Kcal
          </button>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          stackOffset={unit === 'calories' ? "expand" : "none"} // Expand creates 100% chart
        >
          <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => value.slice(5)} // Show MM-DD
            stroke={COLORS.text}
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            stroke={COLORS.text}
            tickFormatter={(value) => unit === 'calories' ? `${(value * 100).toFixed(0)}%` : value} // Format % for stackOffset="expand" (it processes 0-1)
            fontSize={12}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              // Custom tooltip to show meaningful info
              // In Calories mode, values are calories. In Grams mode, grams.
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 border-b pb-1 mb-1 font-medium">{label}</div>
                    {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="capitalize text-muted-foreground">{entry.name}:</span>
                        <span className="font-medium font-mono">
                          {Math.round(entry.value)}
                          {unit === 'calories' ? ' kcal' : 'g'}
                          {/* Calculate percentage manually for Grams mode if needed, or show % for Calories mode */}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }}
          />

          {visibleMacros.includes('protein') && (
            <Bar dataKey="protein" stackId="a" fill={COLORS.protein} radius={[0, 0, 4, 4]} />
          )}
          {visibleMacros.includes('carbs') && (
            <Bar dataKey="carbs" stackId="a" fill={COLORS.carbs} radius={[0, 0, 0, 0]} />
          )}
          {visibleMacros.includes('fat') && (
            <Bar dataKey="fat" stackId="a" fill={COLORS.fat} radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
