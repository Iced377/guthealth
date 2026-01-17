import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { LoggedFoodItem, DailyNutritionSummary, AchievedMicronutrient, PedometerLog } from "@/types"

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

export const processAchievedMicros = (logs: LoggedFoodItem[]): AchievedMicronutrient[] => {
  // Placeholder logic - normally would aggregate from log.fodmapData.micronutrientsInfo
  // For now, return empty or mock if needed, but let's try to extract if data exists
  const map = new Map<string, number>();

  logs.forEach(log => {
    const micros = log.fodmapData?.micronutrientsInfo?.notable;
    if (micros) {
      micros.forEach(m => {
        const val = m.dailyValuePercent || 0;
        const current = map.get(m.name) || 0;
        map.set(m.name, current + val);
      });
    }
  });

  const achieved: AchievedMicronutrient[] = [];
  map.forEach((totalDV, name) => {
    if (totalDV >= 30) { // arbitrary threshold for "achieved" or displaying
      achieved.push({ name, totalDV });
    }
  });

  return achieved.sort((a, b) => b.totalDV - a.totalDV);
};

export const calculateDailyPedometerStats = (logs: PedometerLog[]) => {
  if (!logs.length) return null;
  // Assuming logs might be cumulative or singular updates? 
  // Usually pedometer logs for a day might be a single entry from a sync, or multiple.
  // Let's assume we take the max matching entry or sum if they are incremental?
  // For simplicity, let's sum them if multiple, or just take the latest.
  // If they are distinct sources, we might default to one.

  // Simple logic: Sum steps
  const totalSteps = logs.reduce((sum, log) => sum + log.steps, 0);
  const totalDistance = logs.reduce((sum, log) => sum + (log.distance || 0), 0);

  // Return a synthetic log object representing the total
  return {
    id: 'daily-summary',
    timestamp: new Date(),
    entryType: 'pedometer_data',
    steps: totalSteps,
    distance: totalDistance,
    source: logs[0]?.source || 'apple_health'
  } as PedometerLog;
};
