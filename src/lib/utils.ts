import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { LoggedFoodItem, DailyNutritionSummary, PedometerLog } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateDaySummary = (logs: LoggedFoodItem[]): DailyNutritionSummary => {
  return logs.reduce((acc, log) => ({
    calories: acc.calories + (log.calories || 0),
    protein: acc.protein + (log.protein || 0),
    carbs: acc.carbs + (log.carbs || 0),
    fat: acc.fat + (log.fat || 0),
    fiber: (acc.fiber || 0) + (log.fodmapData?.dietaryFiberInfo?.amountGrams || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
};



export const calculateDailyPedometerStats = (logs: PedometerLog[]) => {
  if (!logs.length) return null;

  // Apple Health / Fitbit send "Status Updates" (e.g. "Total is now 500", "Total is now 1000").
  // We should take the MAX steps from auto sources, then apply any manual adjustments.
  const autoLogs = logs.filter(l => l.source !== 'manual');
  const manualLogs = logs.filter(l => l.source === 'manual');

  const autoMax = autoLogs.length ? Math.max(...autoLogs.map(l => l.steps)) : 0;
  const manualSum = manualLogs.reduce((sum, l) => sum + l.steps, 0);
  const totalSteps = Math.max(0, Math.round(autoMax + manualSum));

  // Most recent update determines the "source" label
  const getUpdateTime = (log: PedometerLog) =>
    (log.syncedAt ? log.syncedAt.getTime() : log.timestamp.getTime());
  const latestLog = [...logs].sort((a, b) => getUpdateTime(b) - getUpdateTime(a))[0];

  return {
    id: 'daily-summary',
    timestamp: latestLog.timestamp,
    entryType: 'pedometer_data',
    steps: totalSteps,
    distance: latestLog.distance,
    source: latestLog.source,
    syncedAt: latestLog.syncedAt
  } as PedometerLog;
};
