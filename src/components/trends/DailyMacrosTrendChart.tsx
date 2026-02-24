import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MacroPoint } from '@/types';
import { ReferenceLine, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
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
  macroTargets?: { protein: number; carbs: number; fats: number };
  targetCalories?: number;
}

// Helper for safe date
const safeFormatDate = (d: string, fmt: string) => {
  try { return format(parseISO(d), fmt); } catch { return d; }
};

function DailyMacrosTrendChart({ data, isDarkMode, viewMode, onViewChange, isExpanded: propExpanded = false, graphId, macroTargets, targetCalories }: DailyMacrosTrendChartProps) {
  const { isChartInteractionEnabled, globalInputDisabled, focusedSceneId } = useTrendsMotionController();

  // Determine expanded state from prop OR context
  const isExpanded = propExpanded || (graphId && focusedSceneId === graphId);

  const [isWebview, setIsWebview] = useState(false);
  const proteinColor = 'var(--metric-protein, #EF4444)';
  const carbsColor = 'var(--metric-carbs, #EAB308)';
  const fatColor = 'var(--metric-fat, #3B82F6)';
  const axisColor = `var(--chart-axis, ${isDarkMode ? '#a1a1aa' : '#71717a'})`;
  const gridColor = `var(--chart-grid, ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'})`;
  const targetLineColor = `var(--chart-target, ${isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)'})`;
  const tooltipStyle: React.CSSProperties = {
    backgroundColor: `var(--chart-tooltip-bg, ${isDarkMode ? 'rgba(11,11,15,0.95)' : 'rgba(255,255,255,0.95)'})`,
    borderColor: `var(--chart-tooltip-border, ${isDarkMode ? 'rgba(31,41,55,0.7)' : 'rgba(15,23,42,0.08)'})`,
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setIsWebview(document.documentElement.dataset.webview === 'true');
  }, []);

  const showAxis = isWebview;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Animation gate for stability
  const isFirstRender = useRef(true);
  useEffect(() => { isFirstRender.current = false; }, []);
  const shouldAnimate = isFirstRender.current;

  // Calculate Target Lines
  // Assuming stack order: Protein (bottom) -> Fat (middle) -> Carbs (top)
  const tCals = targetCalories || 2000;

  // Use provided gram targets if available, otherwise default to "Zone" split (30% P, 35% F, 35% C) or Balanced
  const pTargetPct = macroTargets
    ? Math.round((macroTargets.protein * 4 / tCals) * 100)
    : 30; // Default 30% Protein

  const fTargetPct = macroTargets
    ? Math.round((macroTargets.fats * 9 / tCals) * 100)
    : 35; // Default 35% Fat

  // Lines: 
  // 1. Top of Protein = pTargetPct
  // 2. Top of Fat (Stacked on P) = pTargetPct + fTargetPct
  const lineProteinTop = pTargetPct;
  const lineFatTop = pTargetPct + fTargetPct;

  // Data Preparation: Calculate Calories and Percentages for Stacking
  const chartData = useMemo(() => {
    return data.map(point => {
      const pCals = (point.protein || 0) * 4;
      const fCals = (point.fat || 0) * 9;
      const cCals = (point.carbs || 0) * 4;
      const total = pCals + fCals + cCals;

      const safeTotal = total || 1;

      const pPct = Math.round((pCals / safeTotal) * 100);
      const fPct = Math.round((fCals / safeTotal) * 100);
      // Force remainder to ensure total is exactly 100% for chart alignment
      const cPct = 100 - pPct - fPct;

      return {
        ...point,
        dateShort: safeFormatDate(point.date, 'MMM d'), // Helper needed or use slice
        pCals,
        fCals,
        cCals,
        pPct,
        fPct,
        cPct,
        total
      };
    });
  }, [data]);

  const handleBarClick = (data: any) => {
    if (!isChartInteractionEnabled) return;
    HapticsService.selection();
    if (selectedDate === data.date) {
      setSelectedDate(null);
    } else {
      setSelectedDate(data.date);
    }
  };


  const pointerEventsStyle = globalInputDisabled ? 'none' : 'auto';

  return (
    <div
      className="w-full h-full flex flex-col relative"
      style={{ minHeight: isExpanded ? '100%' : '400px', pointerEvents: pointerEventsStyle }}
      onMouseEnter={() => isChartInteractionEnabled && setIsScrubbing(true)}
      onMouseLeave={() => setIsScrubbing(false)}
    >
      {/* Simple Legend / Header */}
      <div className="absolute top-2 left-4 z-10 flex items-center gap-4 text-xs font-medium text-muted-foreground pointer-events-none">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: proteinColor }} /> Protein</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: fatColor }} /> Fat</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: carbsColor }} /> Carbs</div>
      </div>

      {/* Graph Area */}
      <ChartInteractivityGate isEnabled={isChartInteractionEnabled} className="flex-1 w-full mt-8 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
            barSize={12} // Slimmer bars for elegance
          >
            {(showAxis || isScrubbing) && (
              <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" opacity={0.1} />
            )}



            <XAxis
              dataKey="date"
              tickFormatter={(val) => safeFormatDate(val, 'MMM d')}
              stroke={axisColor}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: (showAxis || isScrubbing) ? axisColor : 'transparent', fontSize: 10 }}
              mirror={true}
            />

            <YAxis
              hide={false}
              tickLine={false}
              axisLine={false}
              unit="%"
              stroke={axisColor}
              fontSize={10}
              width={30}
              tick={{ fill: (showAxis || isScrubbing) ? axisColor : 'transparent', fontSize: 10 }}
              domain={[0, 100]}
              mirror={true}
            />

            {isChartInteractionEnabled && (
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background/95 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl min-w-[200px] z-50" style={tooltipStyle}>
                      {/* Header */}
                      <div className="flex flex-col items-center text-center">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">{safeFormatDate(d.date, 'MMM d, yyyy')}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold font-headline text-foreground tracking-tighter">{Math.round(d.total)}</span>
                          <span className="text-sm font-medium text-muted-foreground">kcal</span>
                        </div>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-3 opacity-50" />

                      {/* 3-Column Macro Grid */}
                      <div className="grid grid-cols-3 gap-2 w-full">
                        {/* Protein */}
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: proteinColor }} />
                          <span className="text-sm font-bold font-mono" style={{ color: proteinColor }}>{d.pPct}%</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{Number(d.protein).toFixed(1)}g</span>
                          <span className="text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: proteinColor, opacity: 0.6 }}>Prot</span>
                        </div>

                        {/* Fat */}
                        <div className="flex flex-col items-center gap-0.5 border-l border-white/5">
                          <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: fatColor }} />
                          <span className="text-sm font-bold font-mono" style={{ color: fatColor }}>{d.fPct}%</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{Number(d.fat).toFixed(1)}g</span>
                          <span className="text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: fatColor, opacity: 0.6 }}>Fat</span>
                        </div>

                        {/* Carbs */}
                        <div className="flex flex-col items-center gap-0.5 border-l border-white/5">
                          <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: carbsColor }} />
                          <span className="text-sm font-bold font-mono" style={{ color: carbsColor }}>{d.cPct}%</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{Number(d.carbs).toFixed(1)}g</span>
                          <span className="text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: carbsColor, opacity: 0.6 }}>Carb</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            )}

            {/* Stacked Bars (Order: Protein bottom, Fat middle, Carbs top usually? No preference, standard is P/F/C) */}
            {/* Using Percentages (pPct, fPct, cPct) */}
            <Bar dataKey="pPct" name="Protein" stackId="a" fill={proteinColor} radius={[0, 0, 4, 4]} animationDuration={1000} isAnimationActive={shouldAnimate} />
            <Bar dataKey="fPct" name="Fat" stackId="a" fill={fatColor} animationDuration={1000} isAnimationActive={shouldAnimate} />
            <Bar dataKey="cPct" name="Carbs" stackId="a" fill={carbsColor} radius={[4, 4, 0, 0]} animationDuration={1000} isAnimationActive={shouldAnimate} />

            {/* Target Reference Lines (Dotted) - Rendered last to be on top */}
            <ReferenceLine y={lineProteinTop} stroke={targetLineColor} strokeDasharray="3 3" strokeOpacity={0.7} strokeWidth={2} isFront={true} label={{ position: 'right', value: 'P', fill: targetLineColor, fontSize: 10, opacity: 0.7 }} />
            <ReferenceLine y={lineFatTop} stroke={targetLineColor} strokeDasharray="3 3" strokeOpacity={0.7} strokeWidth={2} isFront={true} label={{ position: 'right', value: 'F', fill: targetLineColor, fontSize: 10, opacity: 0.7 }} />

          </BarChart>
        </ResponsiveContainer>
      </ChartInteractivityGate>
    </div>
  );
}

export default React.memo(DailyMacrosTrendChart);
