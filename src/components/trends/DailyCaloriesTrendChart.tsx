import React, { useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, AreaChart, Area } from 'recharts';
import { CaloriePoint } from '@/types';
import { format, parseISO } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { HapticsService } from '@/lib/haptics';
import { cn } from "@/lib/utils";
import LiquidSegmentedControl from '../ui/LiquidSegmentedControl';
import { useTrendsMotionController } from './useTrendsMotionController';
import { formatGraphNumber } from '@/utils/format';
import { ChartInteractivityGate } from './ChartInteractivityGate';

interface DailyCaloriesTrendChartProps {
  data: CaloriePoint[];
  isDarkMode: boolean;
  targetCalories: number;
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

function DailyCaloriesTrendChart({ data, isDarkMode, targetCalories }: DailyCaloriesTrendChartProps) {
  const { isChartInteractionEnabled, globalInputDisabled } = useTrendsMotionController();
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [viewMode, setViewMode] = useState<'Daily' | 'Cumulative'>('Daily');

  // Colors
  const barColor = '#2aac6b';
  const targetLineColor = isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const labelColor = isDarkMode ? '#a1a1aa' : '#71717a';

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
      onTouchStart={() => isChartInteractionEnabled && setIsScrubbing(true)}
      onTouchEnd={() => setIsScrubbing(false)}
      onMouseEnter={() => isChartInteractionEnabled && setIsScrubbing(true)}
      onMouseLeave={() => setIsScrubbing(false)}
    >
      <ChartInteractivityGate isEnabled={isChartInteractionEnabled}>
        {/* Toggle Control - Liquid Glass */}
        <div className="absolute top-0 right-4 z-20 flex justify-end pointer-events-none">
          <LiquidSegmentedControl
            className={cn("pointer-events-auto", globalInputDisabled && "opacity-50 pointer-events-none")}
            options={[
              { id: 'Daily', label: 'Daily' },
              { id: 'Cumulative', label: 'Cumulative' }
            ]}
            selected={viewMode}
            onChange={(val) => {
              if (globalInputDisabled) return;
              HapticsService.selection();
              setViewMode(val as 'Daily' | 'Cumulative');
            }}
            layoutIdPrefix="daily-calories-mode"
          />
        </div>


        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'Daily' ? (
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
              onMouseMove={() => {
                if (isChartInteractionEnabled && !isScrubbing) {
                  setIsScrubbing(true);
                  HapticsService.selection();
                }
              }}
            >
              {isScrubbing && isChartInteractionEnabled && (
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              )}
              <XAxis
                dataKey="date"
                tickFormatter={(value) => safeFormatDate(value, 'MMM d')}
                stroke={labelColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                hide={!isScrubbing}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke={labelColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                hide={!isScrubbing}
                domain={[0, 'auto']}
                tickFormatter={(val) => formatGraphNumber(val)}
              />
              <ReferenceLine
                y={targetCalories}
                stroke={targetLineColor}
                strokeDasharray="4 4"
                strokeWidth={1}
                label={isScrubbing ? { position: 'right', value: 'Target', fill: targetLineColor, fontSize: 10 } : undefined}
              />
              {isChartInteractionEnabled && (
                <Tooltip
                  cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background/80 backdrop-blur-md border border-border p-3 rounded-2xl shadow-xl">
                          <p className="font-semibold mb-1">{safeFormatDate(label, 'EEEE, MMM d')}</p>
                          <p className="text-2xl font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#2aac6b]" />
                            {formatGraphNumber(payload[0].value as number)} <span className="text-xs font-normal text-muted-foreground">kcal</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Target: {targetCalories}
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
                animationDuration={0}
                isAnimationActive={false} // Disable animation during transitions
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.calories > targetCalories ? '#f43f5e' : barColor}
                    opacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
              onMouseMove={() => isChartInteractionEnabled && !isScrubbing && setIsScrubbing(true)}
            >
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              {isScrubbing && isChartInteractionEnabled && <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />}
              <XAxis
                dataKey="date"
                tickFormatter={(value) => safeFormatDate(value, 'MMM d')}
                stroke={labelColor}
                fontSize={12}
                hide={!isScrubbing}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                hide={!isScrubbing}
                stroke={labelColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              {/* Zero Line for Net Context */}
              <ReferenceLine y={0} stroke={targetLineColor} strokeDasharray="3 3" />

              {isChartInteractionEnabled && (
                <Tooltip
                  cursor={{ stroke: targetLineColor, strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value as number;
                      // FLIPPED: Greater than 0 means Deficit (Good)
                      const isDeficit = val > 0;
                      return (
                        <div className="bg-background/80 backdrop-blur-md border border-border p-3 rounded-2xl shadow-xl">
                          <p className="font-semibold mb-1">{safeFormatDate(label, 'MMM d')} • Net Balance</p>
                          <p className={cn("text-2xl font-bold flex items-center gap-2", isDeficit ? "text-green-500" : "text-red-500")}>
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
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCumulative)"
                animationDuration={0}
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartInteractivityGate>
    </div>
  );
}

export default React.memo(DailyCaloriesTrendChart);
