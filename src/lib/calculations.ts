import { UserProfile } from '@/types';

export const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    super_active: 1.9,
};

export const GOAL_ADJUSTMENTS = {
    maintain: 0,
    lose_fat: -500, // 500 kcal deficit
    gain_muscle: 300, // 300 kcal surplus
};

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation
 */
export function calculateBMR(
    weightKg: number,
    heightCm: number,
    ageYears: number,
    gender: 'male' | 'female'
): number {
    if (gender === 'male') {
        return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
    } else {
        return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) based on activity level
 */
export function calculateTDEE(
    bmr: number,
    activityLevel: keyof typeof ACTIVITY_MULTIPLIERS
): number {
    return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Calculates Target Calories and Macros based on goals and symptoms
 * 
 * Note: Should consult clinically backed references.
 * Standards:
 * Protein: 1.6-2.2g/kg for muscle gain/retention
 * Fats: 0.8-1g/kg minimum
 * Carbs: Remainder
 * 
 * Adjustments for symptoms can be added here.
 */
export function calculateNutritionTargets(
    bmr: number,
    tdee: number,
    weightKg: number,
    goal: keyof typeof GOAL_ADJUSTMENTS,
    symptoms: string[] = [] // Future extensibility for symptom-specific adjustments
) {
    const targetCalories = Math.round(tdee + GOAL_ADJUSTMENTS[goal]);

    // Protein Setting (High protein is generally better for satiety and muscle)
    // Lose Fat: 2.2g/kg (protect muscle in deficit)
    // Gain Muscle: 2.0g/kg
    // Maintain: 1.8g/kg
    let proteinPerKg = 1.8;
    if (goal === 'lose_fat') proteinPerKg = 2.2;
    if (goal === 'gain_muscle') proteinPerKg = 2.0;

    let proteinGrams = Math.round(weightKg * proteinPerKg);
    let proteinCals = proteinGrams * 4;

    // Fat Setting (Minimum 0.8g/kg for hormonal health)
    let fatPerKg = 0.9;
    if (goal === 'gain_muscle') fatPerKg = 1.0;

    let fatGrams = Math.round(weightKg * fatPerKg);
    let fatCals = fatGrams * 9;

    // Carbs - The remainder
    let remainingCals = targetCalories - (proteinCals + fatCals);
    // Ensure carbs don't go negative or too low (unlikely with this math unless very low cal)
    if (remainingCals < 0) {
        // Adjust if math breaks (sanity check)
        remainingCals = targetCalories * 0.3; // Force 30% carbs
        // Recalculate others to fit if needed, or just accept the slight mismatch for now
        // Better to prioritize calories match
    }
    let carbGrams = Math.round(remainingCals / 4);

    return {
        targetCalories,
        macros: {
            protein: proteinGrams,
            fats: fatGrams,
            carbs: carbGrams
        }
    };
}
