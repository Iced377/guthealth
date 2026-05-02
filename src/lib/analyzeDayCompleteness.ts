import type { LoggedFoodItem, CompletenessStatus } from '@/types';

export interface DayCompletenessResult {
  status: CompletenessStatus;
  confidenceScore: number;
  missingSignals: string[];
  mealCount: number;
  hasBreakfast: boolean;
  hasLunch: boolean;
  hasDinner: boolean;
  hasSnacks: boolean;
  hasDrinks: boolean;
  portionConfidence: number;
}

export function analyzeDayCompleteness(meals: LoggedFoodItem[]): DayCompletenessResult {
  let hasBreakfast = false;
  let hasLunch = false;
  let hasDinner = false;
  let hasSnacks = false;
  let hasDrinks = false;
  let portionConfidence = 100;
  const missingSignals: string[] = [];

  const foodMeals = meals.filter(m => m.entryType === 'food' || m.entryType === 'manual_macro');
  const mealCount = foodMeals.length;

  for (const meal of foodMeals) {
    const mealType = meal.mealType?.toLowerCase() || '';
    
    if (mealType.includes('breakfast')) hasBreakfast = true;
    else if (mealType.includes('lunch')) hasLunch = true;
    else if (mealType.includes('dinner')) hasDinner = true;
    else if (mealType.includes('snack')) hasSnacks = true;

    // Fallback: Infer from time if mealType is absent
    if (!meal.mealType && meal.timestamp) {
      const hour = new Date(meal.timestamp).getHours();
      if (hour >= 5 && hour < 11) hasBreakfast = true;
      else if (hour >= 11 && hour < 16) hasLunch = true;
      else if (hour >= 16 && hour < 23) hasDinner = true;
      else hasSnacks = true;
    }

    if (!meal.portionSize || meal.portionSize === 'unknown') {
      portionConfidence -= 10;
    }

    // Rough check for drinks (basic heuristic)
    const name = meal.name.toLowerCase();
    if (name.includes('water') || name.includes('coffee') || name.includes('tea') || name.includes('juice') || name.includes('drink')) {
      hasDrinks = true;
    }
  }

  if (!hasBreakfast) missingSignals.push('Missing breakfast');
  if (!hasLunch) missingSignals.push('Missing lunch');
  if (!hasDinner) missingSignals.push('Missing dinner');

  let status: CompletenessStatus = 'unknown';

  if (hasBreakfast && hasLunch && hasDinner && mealCount >= 3) {
    status = 'full';
  } else if ((hasBreakfast && hasLunch) || (hasLunch && hasDinner) || (hasBreakfast && hasDinner) || mealCount >= 2) {
    status = 'partial';
  } else {
    status = 'insufficient';
  }

  // Cap portion confidence at 0
  portionConfidence = Math.max(0, portionConfidence);

  // Calculate overall confidence based on signals
  let confidenceScore = 100;
  if (status === 'partial') confidenceScore -= 30;
  if (status === 'insufficient') confidenceScore -= 60;
  if (portionConfidence < 50) confidenceScore -= 20;

  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  return {
    status,
    confidenceScore,
    missingSignals,
    mealCount,
    hasBreakfast,
    hasLunch,
    hasDinner,
    hasSnacks,
    hasDrinks,
    portionConfidence
  };
}
