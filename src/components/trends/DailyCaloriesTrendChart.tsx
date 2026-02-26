import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, AreaChart, Area } from 'recharts';
import { CaloriePoint } from '@/types';
import { format, parseISO } from 'date-fns';
import { HapticsService } from '@/lib/haptics';
import { cn } from "@/lib/utils";
import LiquidChartCarousel from './LiquidChartCarousel';
import { useTrendsMotionController } from './useTrendsMotionController';
import { formatGraphNumber } from '@/utils/format';
import { ChartInteractivityGate } from './ChartInteractivityGate';
import { DragControls } from 'framer-motion';

interface DailyCaloriesTrendChartProps {
  data: CaloriePoint[];
  isDarkMode: boolean;
  targetCalories: number;
  maintenanceCalories?: number; // New Prop for TDEE
  dragControls?: DragControls;
}

// Helper for safe date formatting
const safeFormatDate = (dateStr: string, formatStr: string) => {
  try {
    if (!dateStr) return '';
    return format(parseISO(dateStr), formatStr);
  } catch (e) {
    return dateStr;
  }
};

interface ChartSlideProps {
  data: any[];
  isDarkMode: boolean;
  targetCalories: number;
  maintenanceCalories?: number; // Pass down
  isChartInteractionEnabled: boolean;
  targetLineColor: string;
  labelColor: string;
  gridColor: string;
  cursorColor: string;
  tooltipStyle: React.CSSProperties;
  showAxis: boolean;
  shouldAnimate: boolean;
}

const DailyCaloriesSlide = ({
  data,
  isDarkMode,
  targetCalories,
  maintenanceCalories,
  isChartInteractionEnabled,
  targetLineColor,
  labelColor,
  gridColor,
  cursorColor,
  tooltipStyle,
  showAxis,
  shouldAnimate
}: ChartSlideProps) => {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const safetyFloor = maintenanceCalories ? maintenanceCalories * 0.75 : undefined;
  const metricColor = 'var(--metric-calories, #f97316)';
  const overColor = 'var(--state-over, #f59e0b)';
  const riskColor = 'var(--state-risk, #ef4444)';
  const onTrackColor = 'var(--state-on-track, #10b981)';

  return (
    <div
      className="w-full h-full relative"
      onTouchStart={() => isChartInteractionEnabled && setIsScrubbing(true)}
      onTouchEnd={() => setIsScrubbing(false)}
      onMouseEnter={() => isChartInteractionEnabled && setIsScrubbing(true)}
      onMouseLeave={() => setIsScrubbing(false)}
    >
      <ChartInteractivityGate isEnabled={isChartInteractionEnabled}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
            onMouseMove={() => {
              if (isChartInteractionEnabled && !isScrubbing) {
                setIsScrubbing(true);
                HapticsService.selection();
              }
            }}
          >
            {(isScrubbing || showAxis) && isChartInteractionEnabled && (
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke={gridColor} />
            )}
            <XAxis
              dataKey="date"
              tickFormatter={(value) => safeFormatDate(value, 'MMM d')}
              stroke={labelColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: (showAxis || isScrubbing) ? labelColor : 'transparent', fontSize: 12 }}
              interval="preserveStartEnd"
              mirror={true}
            />
            <YAxis
              stroke={labelColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: (showAxis || isScrubbing) ? labelColor : 'transparent', fontSize: 12 }}
              domain={[0, 'auto']}
              tickFormatter={(val) => formatGraphNumber(val)}
              className="transition-opacity duration-300"
              mirror={true}
            />

            {/* Goldilocks Zone (Optimal Range) */}
            {safetyFloor && (
              <ReferenceArea
                y1={safetyFloor}
                y2={targetCalories}
                fill={onTrackColor}
                fillOpacity={0.08}
              />
            )}

            {/* Target Line */}
            <ReferenceLine
              y={targetCalories}
              stroke={targetLineColor}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={isScrubbing ? { position: 'right', value: 'Target', fill: targetLineColor, fontSize: 10 } : undefined}
            />

            {/* Safety Floor Line */}
            {safetyFloor && (
              <ReferenceLine
                y={safetyFloor}
                stroke={riskColor}
                strokeDasharray="2 2"
                strokeWidth={1}
                opacity={0.6}
                label={isScrubbing ? { position: 'right', value: 'Metabolic Floor', fill: riskColor, fontSize: 10 } : undefined}
              />
            )}

            {isChartInteractionEnabled && (
              <Tooltip
                cursor={{ fill: cursorColor }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value as number;
                    const isBelowFloor = safetyFloor && val < safetyFloor && val > 800; // Ignore <800 as likely partial log
                    return (
                      <div className="bg-background/80 backdrop-blur-md border border-border p-3 rounded-2xl shadow-xl" style={tooltipStyle}>
                        <p className="font-semibold mb-1">{safeFormatDate(label, 'EEEE, MMM d')}</p>
                        <p className="text-2xl font-bold flex items-center gap-2">
                          <span
                            className={cn("w-2 h-2 rounded-full", isBelowFloor && "animate-pulse")}
                            style={{ backgroundColor: isBelowFloor ? riskColor : metricColor }}
                          />
                          {formatGraphNumber(val)} <span className="text-xs font-normal text-muted-foreground">kcal</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Target: {targetCalories}
                          {isBelowFloor && <span className="block font-semibold mt-0.5" style={{ color: 'var(--state-risk, #ef4444)' }}>⚠️ Below Metabolic Floor</span>}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            )}
            <Bar
              dataKey="calories"
              maxBarSize={60}
              radius={[4, 4, 4, 4]}
              animationDuration={1000}
              isAnimationActive={shouldAnimate}
            >
              {data.map((entry, index) => {
                const isBelowFloor = safetyFloor && entry.calories < safetyFloor && entry.calories > 800;
                let color = metricColor;
                if (entry.calories > targetCalories) color = overColor;
                if (isBelowFloor) color = riskColor;

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                    opacity={isBelowFloor ? 0.9 : 1}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartInteractivityGate>
    </div>
  );
};

const CumulativeCaloriesSlide = ({
  data,
  targetLineColor,
  labelColor,
  isChartInteractionEnabled,
  gridColor,
  cursorColor,
  tooltipStyle,
  showAxis,
  shouldAnimate
}: ChartSlideProps) => {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const metricColor = 'var(--metric-calories, #3b82f6)';
  const deficitColor = 'var(--state-on-track, #22c55e)';
  const surplusColor = 'var(--state-risk, #ef4444)';

  return (
    <div
      className="w-full h-full relative"
      onTouchStart={() => isChartInteractionEnabled && setIsScrubbing(true)}
      onTouchEnd={() => setIsScrubbing(false)}
      onMouseEnter={() => isChartInteractionEnabled && setIsScrubbing(true)}
      onMouseLeave={() => setIsScrubbing(false)}
    >
      <ChartInteractivityGate isEnabled={isChartInteractionEnabled}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
            onMouseMove={() => isChartInteractionEnabled && !isScrubbing && setIsScrubbing(true)}
          >
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={metricColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            {(isScrubbing || showAxis) && isChartInteractionEnabled && (
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke={gridColor} />
            )}
            <XAxis
              dataKey="date"
              tickFormatter={(value) => safeFormatDate(value, 'MMM d')}
              stroke={labelColor}
              fontSize={12}
              tick={{ fill: (showAxis || isScrubbing) ? labelColor : 'transparent', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              mirror={true}
            />
            <YAxis
              tick={{ fill: (showAxis || isScrubbing) ? labelColor : 'transparent', fontSize: 12 }}
              stroke={labelColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              mirror={true}
            />
            {/* Zero Line for Net Context */}
            <ReferenceLine y={0} stroke={targetLineColor} strokeDasharray="3 3" />

            {isChartInteractionEnabled && (
              <Tooltip
                cursor={{ stroke: cursorColor, strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value as number;
                    // FLIPPED: Greater than 0 means Deficit (Good)
                    const isDeficit = val > 0;
                    return (
                      <div className="bg-background/80 backdrop-blur-md border border-border p-3 rounded-2xl shadow-xl" style={tooltipStyle}>
                        <p className="font-semibold mb-1">{safeFormatDate(label, 'MMM d')} • Net Balance</p>
                        <p className="text-2xl font-bold flex items-center gap-2" style={{ color: isDeficit ? deficitColor : surplusColor }}>
                          {isDeficit ? "+" : ""}{formatGraphNumber(val)} <span className="text-xs font-normal text-muted-foreground">kcal</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isDeficit ? "Cumulative Deficit (Good)" : "Cumulative Surplus"}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke={metricColor}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCumulative)"
              animationDuration={1000}
              isAnimationActive={shouldAnimate}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartInteractivityGate>
    </div>
  );
};

function DailyCaloriesTrendChart({ data, isDarkMode, targetCalories, maintenanceCalories, viewModeIndex = 0, onViewModeChange, dragControls }: DailyCaloriesTrendChartProps & { viewModeIndex?: number; onViewModeChange?: (index: number) => void; }) {
  const { isChartInteractionEnabled, globalInputDisabled } = useTrendsMotionController();
  const [isWebview, setIsWebview] = useState(false);

  // Fallback local state if not controlled
  const [localViewModeIndex, setLocalViewModeIndex] = useState(0);
  const isControlled = onViewModeChange !== undefined;
  const currentIndex = isControlled ? viewModeIndex : localViewModeIndex;

  const handleIndexChange = (index: number) => {
    if (isControlled && onViewModeChange) {
      onViewModeChange(index);
    } else {
      setLocalViewModeIndex(index);
    }
  };

  // Animation gate for stability
  const isFirstRender = useRef(true);
  useEffect(() => { isFirstRender.current = false; }, []);
  const shouldAnimate = isFirstRender.current;

  // Colors
  const targetLineColor = `var(--chart-target, ${isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'})`;
  const labelColor = `var(--chart-axis, ${isDarkMode ? '#a1a1aa' : '#71717a'})`;
  const gridColor = `var(--chart-grid, ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'})`;
  const cursorColor = `var(--chart-cursor, ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'})`;
  const tooltipStyle: React.CSSProperties = {
    backgroundColor: `var(--chart-tooltip-bg, ${isDarkMode ? 'rgba(11,11,15,0.95)' : 'rgba(255,255,255,0.92)'})`,
    borderColor: `var(--chart-tooltip-border, ${isDarkMode ? 'rgba(31,41,55,0.7)' : 'rgba(15,23,42,0.08)'})`,
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setIsWebview(document.documentElement.dataset.webview === 'true');
  }, []);

  const showAxis = isWebview;

  // Calculate Cumulative Data
  const chartData = useMemo(() => {
    let runningNet = 0;
    return data.map(d => {
      // "Flip it because negative is good" -> We want Deficit to be Positive (Upwards)
      const net = targetCalories - d.calories;
      runningNet += net;
      return {
        ...d,
        net,
        cumulative: runningNet
      };
    });
  }, [data, targetCalories]);

  const pointerEventsStyle = globalInputDisabled ? 'none' : 'auto';

  return (
    <div
      className="w-full h-full relative"
      style={{ pointerEvents: pointerEventsStyle }}
    >
      <LiquidChartCarousel
        currentIndex={currentIndex}
        onIndexChange={handleIndexChange}
        showDots={false}
        dragControls={dragControls}
      >
        <DailyCaloriesSlide
          data={chartData}
          isDarkMode={isDarkMode}
          targetCalories={targetCalories}
          maintenanceCalories={maintenanceCalories}
          isChartInteractionEnabled={isChartInteractionEnabled}
          targetLineColor={targetLineColor}
          labelColor={labelColor}
          gridColor={gridColor}
          cursorColor={cursorColor}
          tooltipStyle={tooltipStyle}
          showAxis={showAxis}
          shouldAnimate={shouldAnimate}
        />
        <CumulativeCaloriesSlide
          data={chartData}
          isDarkMode={isDarkMode}
          targetCalories={targetCalories}
          maintenanceCalories={maintenanceCalories}
          isChartInteractionEnabled={isChartInteractionEnabled}
          targetLineColor={targetLineColor}
          labelColor={labelColor}
          gridColor={gridColor}
          cursorColor={cursorColor}
          tooltipStyle={tooltipStyle}
          showAxis={showAxis}
          shouldAnimate={shouldAnimate}
        />
      </LiquidChartCarousel>
    </div>
  );
}

export default React.memo(DailyCaloriesTrendChart);
