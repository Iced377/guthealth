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

  // LOGIC UPDATE: Single Source of Truth
  // Apple Health / Fitbit send "Status Updates" (e.g. "Total is now 500", "Total is now 1000").
  // Usage of 'reduce' to sum them was incorrect.
  // We should take the entry with the MAX steps (or latest timestamp) to represent the day.

  // Sort by steps descending to find the highest count reported for the day
  const bestLog = logs.sort((a, b) => b.steps - a.steps)[0];

  return {
    id: 'daily-summary',
    timestamp: bestLog.timestamp,
    entryType: 'pedometer_data',
    steps: bestLog.steps,
    distance: bestLog.distance,
    source: bestLog.source
  } as PedometerLog;
};
