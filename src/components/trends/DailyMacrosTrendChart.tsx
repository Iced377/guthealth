import { useState, useMemo } from 'react';
import React from 'react';
import type { MacroPoint } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { HapticsService } from '@/lib/haptics';
import { useTrendsMotionController } from './useTrendsMotionController';
import { formatGraphNumber } from '@/utils/format';
import { ChartInteractivityGate } from './ChartInteractivityGate';

interface DailyMacrosTrendChartProps {
  data: MacroPoint[];
  isDarkMode: boolean;
  viewMode: 'Protein' | 'Carbs' | 'Fat';
  onViewChange: (mode: 'Protein' | 'Carbs' | 'Fat') => void;
}

const COLORS = {
  Protein: '#EF4444', // Red-500
  Carbs: '#EAB308',   // Yellow-500
  Fat: '#3B82F6',     // Blue-500
  grid: "hsl(var(--border))",
  text: "hsl(var(--muted-foreground))",
};

function DailyMacrosTrendChart({ data, isDarkMode, viewMode, onViewChange }: DailyMacrosTrendChartProps) {
  const { isChartInteractionEnabled, globalInputDisabled } = useTrendsMotionController();
  const [unit, setUnit] = useState<'grams' | 'calories'>('grams');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Prepare Data based on Mode
  const chartData = useMemo(() => {
    return data.map(point => {
      let proteinVal = point.protein || 0;
      let carbsVal = point.carbs || 0;
      let fatVal = point.fat || 0;

      if (unit === 'calories') {
        proteinVal *= 4;
        carbsVal *= 4;
        fatVal *= 9;
      }

      return {
        ...point,
        protein: proteinVal,
        carbs: carbsVal,
        fat: fatVal,
        // For single view, we might want a generic 'value' key if we were simplifying, but Recharts handles keys fine.
      };
    });
  }, [data, unit]);

  const handleBarClick = (data: any) => {
    if (!isChartInteractionEnabled) return;
    HapticsService.selection();
    if (selectedDate === data.date) {
      setSelectedDate(null);
    } else {
      setSelectedDate(data.date);
    }
  };

  const handleViewChange = (mode: 'Protein' | 'Carbs' | 'Fat') => {
    if (globalInputDisabled) return;
    if (mode !== viewMode) {
      // HapticsService.impact('light'); // Optional per spec
      onViewChange(mode);
    }
  }

  // Determine active color for single bar view
  const activeColor = COLORS[viewMode];
  const pointerEventsStyle = globalInputDisabled ? 'none' : 'auto';

  return (
    <div
      className="w-full h-full flex flex-col relative"
      style={{ minHeight: '400px', pointerEvents: pointerEventsStyle }}
      onMouseEnter={() => isChartInteractionEnabled && setIsScrubbing(true)}
      onMouseLeave={() => setIsScrubbing(false)}
    >

      {/* Controls Row - Compact & Liquid */}
      <div className="absolute top-0 right-0 left-0 z-10 flex justify-between items-start px-4 pointer-events-none">
        {/* Spacer to push controls to sides or center if needed. 
              Actually, spec says "Collapse controls into a single compact control row".
              Let's float them top right or center top. center top might conflict with header? 
              LiquidGraphScene header is top left. So top right is good.
          */}
        <div className="flex-1" /> {/* Spacer */}

        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "pointer-events-auto flex items-center gap-2 bg-background/50 backdrop-blur-md p-1 rounded-full border shadow-sm transition-all duration-300",
            globalInputDisabled && "opacity-50 pointer-events-none"
          )}
        >
          {/* Macro Segmented Control */}
          <div className="flex relative items-center bg-muted/50 rounded-full p-1 h-8">
            {(['Protein', 'Carbs', 'Fat'] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleViewChange(m)}
                className={cn(
                  "relative px-3 py-1 text-xs font-semibold rounded-full transition-all z-10",
                  viewMode === m ? "text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {viewMode === m && (
                  <motion.div
                    layoutId="activeMacroTab"
                    className="absolute inset-0 bg-foreground rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{m}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-border/50" />

          {/* Unit Toggle */}
          <button
            onClick={() => setUnit(unit === 'grams' ? 'calories' : 'grams')}
            className="text-xs font-medium px-2 text-muted-foreground hover:text-foreground transition-colors w-14 text-center"
          >
            {unit === 'grams' ? 'g' : '%Kcal'}
          </button>
        </div>
      </div>

      <ChartInteractivityGate isEnabled={isChartInteractionEnabled}>
        <ChartContainer
          config={{
            protein: { label: "Protein", color: COLORS.Protein },
            carbs: { label: "Carbs", color: COLORS.Carbs },
            fat: { label: "Fat", color: COLORS.Fat },
          }}
          className="w-full flex-1 mt-12 mb-4"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
            // stackOffset={unit === 'calories' ? "expand" : "none"} // User said "Single macro view default". Stacking deliberate.
            // But if user selects "Protein", we valid only show protein. 
            // So stackOffset is irrelevant if only 1 bar is shown.
            >
              <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" opacity={0.1} />
              {/* Remove Axes lines per spec, retain faint grid */}
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => value.slice(5)}
                stroke={COLORS.text}
                fontSize={12}
                opacity={0.5} // Faint
              />
              {/* Y Axis - maybe hidden or very minimal? Spec says "More legible label in focus". Default faint. */}
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => unit === 'calories' ? `${formatGraphNumber(value)} kcal` : `${formatGraphNumber(value)}g`}
                fontSize={10}
                width={30}
                opacity={0.0} // Hidden by default per "Remove axis lines entirely... gridlines faint"
              />

              {isChartInteractionEnabled && (
                <ChartTooltip
                  cursor={false} // We handle selection visual manually
                  content={({ active, payload, label }) => {
                    if (!selectedDate || label !== selectedDate) return null; // Only show for selected
                    if (!active || !payload || !payload.length) return null;

                    const dataPoint = payload[0].payload;

                    // Calculate Percentage
                    const p = dataPoint.protein || 0;
                    const c = dataPoint.carbs || 0;
                    const f = dataPoint.fat || 0;

                    let totalCals = 0;
                    let activeCals = 0;

                    if (unit === 'grams') {
                      totalCals = (p * 4) + (c * 4) + (f * 9);
                      const val = dataPoint[viewMode.toLowerCase() as keyof typeof dataPoint];
                      if (viewMode === 'Protein') activeCals = val * 4;
                      else if (viewMode === 'Carbs') activeCals = val * 4;
                      else if (viewMode === 'Fat') activeCals = val * 9;
                    } else {
                      totalCals = p + c + f;
                      activeCals = dataPoint[viewMode.toLowerCase() as keyof typeof dataPoint];
                    }

                    const pct = totalCals > 0 ? Math.round((activeCals / totalCals) * 100) : 0;

                    return (
                      <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-4 shadow-xl text-white min-w-[160px]">
                        <div className="text-sm font-medium text-white/50 mb-2">{label}</div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColor }} />
                              <span className="text-sm font-medium">{viewMode}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-lg font-bold font-mono leading-none">
                                {formatGraphNumber(dataPoint[viewMode.toLowerCase() as keyof typeof dataPoint])}
                                <span className="text-xs text-white/50 ml-1">{unit === 'grams' ? 'g' : 'kcal'}</span>
                              </span>
                              <span className="text-xs text-white/70 font-mono mt-1">
                                {formatGraphNumber(pct)}% of daily cals
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </ChartInteractivityGate>

      {/* Persistent Popup if selectedDate is set? 
           Recharts Tooltip is transient. If we need persistent selection, we should render a custom absolute div 
           positioned relative to the chart?
           Implementing "Tap to reveal" with persistence usually requires manual coordinate handling or 
           just letting Recharts Tooltip handle 'click' (if properly configured) or just mimicking it.
           For now, the standard tooltip with custom styling is a safe 90% solution. 
           If the user insists on "persist until tap elsewhere", we might need more logic. 
       */}

    </div>
  );
}

export default React.memo(DailyMacrosTrendChart);
