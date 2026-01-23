import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MacroPoint } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { HapticsService } from '@/lib/haptics';
import { useTrendsMotionController } from './useTrendsMotionController';
import { formatGraphNumber } from '@/utils/format';
import { ChartInteractivityGate } from './ChartInteractivityGate';

interface DailyMacrosTrendChartProps {
  data: MacroPoint[];
  isDarkMode: boolean;
  viewMode: 'Protein' | 'Carbs' | 'Fat';
  onViewChange: (mode: 'Protein' | 'Carbs' | 'Fat') => void;
  isExpanded?: boolean;
  graphId?: string; // ID to check against focusedSceneId
}

const COLORS = {
  Protein: '#EF4444', // Red-500
  Carbs: '#EAB308',   // Yellow-500
  Fat: '#3B82F6',     // Blue-500
  grid: "hsl(var(--border))",
  text: "hsl(var(--muted-foreground))",
};

function DailyMacrosTrendChart({ data, isDarkMode, viewMode, onViewChange, isExpanded: propExpanded = false, graphId }: DailyMacrosTrendChartProps) {
  const { isChartInteractionEnabled, globalInputDisabled, focusedSceneId } = useTrendsMotionController();

  // Determine expanded state from prop OR context
  const isExpanded = propExpanded || (graphId && focusedSceneId === graphId);

  const [unit, setUnit] = useState<'grams' | 'calories'>('grams');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Animation gate for stability
  const isFirstRender = useRef(true);
  useEffect(() => { isFirstRender.current = false; }, []);
  const shouldAnimate = isFirstRender.current;

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
      style={{ minHeight: isExpanded ? '100%' : '400px', pointerEvents: pointerEventsStyle }}
      onMouseEnter={() => isChartInteractionEnabled && setIsScrubbing(true)}
      onMouseLeave={() => setIsScrubbing(false)}
    >

      {/* Controls Row - Compact & Liquid */}
      <div className="absolute top-0 right-0 left-0 z-10 flex justify-between items-start px-4 pointer-events-none">
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

      {/* Graph Area - Direct ResponsiveContainer with Gate */}
      <ChartInteractivityGate isEnabled={isChartInteractionEnabled} className="flex-1 w-full mt-12 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 0, left: 0, bottom: 20 }} // Increased bottom margin for labels
          >
            <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" opacity={0.1} />

            <XAxis
              dataKey="date"
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value.slice(5)}
              stroke={COLORS.text}
              fontSize={12}
              opacity={0.5}
              tickLine={false}
              axisLine={false}
              tick={{ fill: isScrubbing ? COLORS.text : 'transparent', fontSize: 12 }}
              mirror={true}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => unit === 'calories' ? `${formatGraphNumber(value)} kcal` : `${formatGraphNumber(value)}g`}
              fontSize={10}
              width={30}
              opacity={0.0}
              tick={{ fill: 'transparent', fontSize: 10 }}
              mirror={true}
            />

            {isChartInteractionEnabled && (
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload, label }) => {
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

                  // Matches DailyCaloriesTrendChart structure
                  return (
                    <div className="bg-background/80 backdrop-blur-md border border-border p-3 rounded-2xl shadow-xl min-w-[140px] z-50">
                      <p className="text-xs font-semibold mb-1 text-muted-foreground">{label}</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColor }} />
                            <span className="text-sm font-medium">{viewMode}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-bold font-mono leading-none">
                              {formatGraphNumber(dataPoint[viewMode.toLowerCase() as keyof typeof dataPoint])}
                              <span className="text-xs text-muted-foreground font-normal ml-1">{unit === 'grams' ? 'g' : 'kcal'}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
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
            <Bar
              dataKey={viewMode.toLowerCase()} // "protein", "carbs", or "fat"
              fill={activeColor}
              radius={[4, 4, 4, 4]}
              onClick={handleBarClick}
              animationDuration={1000}
              isAnimationActive={shouldAnimate}
            >
              {/* 
                   We map cells to handle selection opacity.
                   Note: Recharts <Cell> inside <Bar> is correct usage.
                */}
              {chartData.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={activeColor}
                  opacity={selectedDate === entry.date ? 1 : selectedDate ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartInteractivityGate>

    </div>
  );
}

export default React.memo(DailyMacrosTrendChart);
