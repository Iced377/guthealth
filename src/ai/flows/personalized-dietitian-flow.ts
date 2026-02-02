
'use server';
/**
 * @fileOverview This file defines the Personalized Dietitian AI flow.
 * It takes a user's question and their health data (food logs, symptoms, profile)
 * to provide a deep, personalized dietary insight, acting like a personal dietitian.
 *
 * - getPersonalizedDietitianInsight - Main function to call the flow.
 * - PersonalizedDietitianInput - Input type for the flow.
 * - PersonalizedDietitianOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { LoggedFoodItem, SymptomLog, UserProfile } from '@/types';

// Schemas for LoggedFoodItem and SymptomLog to be used within the input
const FoodItemSchemaForAI = z.object({
  name: z.string(),
  originalName: z.string().optional(),
  ingredients: z.string(),
  portionSize: z.string(),
  portionUnit: z.string(),
  timestamp: z.string().describe("Datetime string for when the food was logged (preferably Local Time)."),
  overallFodmapRisk: z.enum(['Green', 'Yellow', 'Red']).optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  userFeedback: z.enum(['safe', 'unsafe']).optional().nullable(),
  sourceDescription: z.string().optional().describe("Original user text input for AI-logged meals."),
});

const SymptomForAI = z.object({
  name: z.string(),
});

const SymptomLogEntrySchemaForAI = z.object({
  symptoms: z.array(SymptomForAI),
  severity: z.number().optional(),
  notes: z.string().optional(),
  timestamp: z.string().describe("Datetime string for when symptoms were logged (preferably Local Time)."),
  linkedFoodItemIds: z.array(z.string()).optional(),
});

const UserProfileSchemaForAI = z.object({
  displayName: z.string().optional().nullable(),
  safeFoods: z.array(z.object({
    name: z.string(),
    portionSize: z.string(),
    portionUnit: z.string(),
  })).optional(),
  premium: z.boolean().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  goal: z.enum(['maintain', 'lose_fat', 'gain_muscle']).optional(),
  activityLevel: z.string().optional(),
  tdee: z.number().optional(),
  bmr: z.number().optional(),
  currentWeight: z.number().optional(),
  maxFastingWindowHours: z.number().optional().describe("The calculated maximum time in hours between two consecutive meals in the provided logs."),
  macros: z.object({
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fats: z.number().optional(),
  }).optional().describe("User's daily macro targets in grams."),
}).optional();


const TrendsAnalysisSchema = z.object({
  cumulativeNetCalories: z.number().describe("Total accummulated calorie difference (Target - Consumed). Positive = Deficit, Negative = Surplus."),
  cumulativeNetCaloriesWithGuardrail: z.number().optional().describe("Total accumulated calorie difference EXCLUDING days with incomplete logging (< 800 kcal). This is the more accurate 'true' deficit."),
  calorieStepCorrelationSlope: z.number().optional().describe("Slope of the linear regression between Daily Steps (x) and Calories Consumed (y). Positive = eats more when active. Negative = eats less when active."),
  calorieStepCorrelationStrength: z.string().optional().describe("Description of the correlation strength (e.g. 'Strong Positive', 'None')."),
  daysOverCalorieTarget: z.number().describe("Number of days where consumed calories exceeded the target."),
  totalDaysAnalyzed: z.number(),
  averageDailyCalories: z.number(),
  dailyCalorieTarget: z.number(),
  ketoAdherenceDays: z.number().optional().describe("Number of days where Net Carbs were < 50g (Keto limit)."),
  fastingAdherenceDays: z.number().optional().describe("Number of days where a fasting window of > 16 hours was completed."),
  fluxZones: z.object({
    optimalFluxDays: z.number(),
    grindDays: z.number(),
    sedentaryStorageDays: z.number(),
    metabolicStagnationDays: z.number(),
  }).optional().describe("Count of days in each Energy Flux Zone (G-Flux). Optimal=High Step/High Cal. Grind=High Step/Low Cal. Storage=Low Step/High Cal. Stagnation=Low Step/Low Cal."),
});

const PersonalizedDietitianInputSchema = z.object({
  userQuestion: z.string().describe("The user's specific question about their diet, health, or well-being."),
  foodLog: z.array(FoodItemSchemaForAI).describe("A chronological list of the user's logged food items (e.g., last 30-90 days)."),
  symptomLog: z.array(SymptomLogEntrySchemaForAI).describe("A chronological list of the user's logged symptoms (e.g., last 30-90 days)."),
  userProfile: UserProfileSchemaForAI.describe("Basic user profile information, including any marked safe foods."),
  currentLocalTime: z.string().describe("The user's current local time string (e.g. '3:30 PM')."),
  dailyTotals: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }).describe("Pre-calculated totals for the current day to ensure accuracy."),
  hoursSinceLastMeal: z.number().optional().describe("Number of hours elapsed since the last logged meal."),
  projectedFastingEndTimes: z.object({
    target16h: z.string().describe("Time when a 16-hour fast would end, based on last meal."),
    targetMax: z.string().describe("Time when the user's max recorded fast would end, based on last meal.")
  }).optional(),
  recentFastingWindows: z.array(z.object({
    date: z.string(),
    durationHours: z.number()
  })).optional().describe("List of fasting window durations calculated from the last 7 days of logs."),
  timeOfDaySegment: z.string().optional().describe("Current time segment: 'Morning', 'Afternoon', 'Evening', 'Late Night'."),
  safetyFloor: z.number().optional().describe("Calculated 25% deficit limit (TDEE * 0.75). Below this is unsafe."),
});
export type PersonalizedDietitianInput = z.infer<typeof PersonalizedDietitianInputSchema>;

const PersonalizedDietitianOutputSchema = z.object({
  aiResponse: z.string().describe("The AI dietitian's comprehensive and personalized response to the user's question, based on the provided data. This should be insightful and actionable, formatted clearly (e.g., using markdown for lists or emphasis if appropriate, but will be rendered as a string)."),
});
export type PersonalizedDietitianOutput = z.infer<typeof PersonalizedDietitianOutputSchema>;

const defaultErrorOutput: PersonalizedDietitianOutput = {
  aiResponse: "I apologize, the AI dietitian couldn't generate a specific response at this time. This might be due to a temporary issue or the nature of the query. Please try rephrasing or check back later."
};


export async function getPersonalizedDietitianInsight(input: PersonalizedDietitianInput): Promise<PersonalizedDietitianOutput> {
  return personalizedDietitianFlow(input);
}

const personalizedDietitianPrompt = ai.definePrompt({
  name: 'personalizedDietitianPrompt',
  // Model is inherited from genkit.ts
  input: { schema: PersonalizedDietitianInputSchema },
  output: { schema: PersonalizedDietitianOutputSchema },
  prompt: `You are an expert Personal Dietitian and Wellness Coach.
Your goal is to provide a highly personalized, empathetic, and actionable response based on the user's question, their specific health goals, and their daily logs.

**User's Context:**
- **Current Local Time:** {{{currentLocalTime}}} ({{timeOfDaySegment}})
- **Time Since Last Meal:** {{#if hoursSinceLastMeal}}{{hoursSinceLastMeal}} hours{{else}}Unknown{{/if}}
- **Goal:** {{#if userProfile.goal}}{{userProfile.goal}}{{else}}Not specified{{/if}}
- **Current Weight:** {{#if userProfile.currentWeight}}{{userProfile.currentWeight}} kg{{else}}Not specified{{/if}}
- **Activity Level:** {{#if userProfile.activityLevel}}{{userProfile.activityLevel}}{{else}}Not specified{{/if}}
- **Dietary Preferences:** {{#if userProfile.dietaryPreferences}}{{#each userProfile.dietaryPreferences}}{{.}}, {{/each}}{{else}}None{{/if}}
- **TDEE (Daily Energy Expenditure):** {{#if userProfile.tdee}}{{userProfile.tdee}} kcal{{else}}N/A{{/if}}
- **Safety Floor (Min Recommended Intake):** {{#if safetyFloor}}{{safetyFloor}} kcal{{else}}N/A{{/if}} (TDEE * 0.75)
- **Macro Targets:** {{#if userProfile.macros}}P: {{userProfile.macros.protein}}g, C: {{userProfile.macros.carbs}}g, F: {{userProfile.macros.fats}}g{{else}}Not specified{{/if}}
- **Max Recorded Fasting Window:** {{#if userProfile.maxFastingWindowHours}}{{userProfile.maxFastingWindowHours}} hours{{else}}N/A{{/if}}
{{#if recentFastingWindows}}
- **Recent Fasting Consistency (Last 7 Days):**
  {{#each recentFastingWindows}}
  - {{this.date}}: {{this.durationHours}} hours
  {{/each}}
{{/if}}
{{#if projectedFastingEndTimes}}
- **Projected Fast Completion (Tomorrow):** 
  - 16 Hour Goal: Ends at **{{projectedFastingEndTimes.target16h}}**
  - Your Max ({{userProfile.maxFastingWindowHours}}h): Ends at **{{projectedFastingEndTimes.targetMax}}**
{{/if}}
- **Today's Totals (Calculated):** Calories: {{dailyTotals.calories}}, Protein: {{dailyTotals.protein}}g, Carbs: {{dailyTotals.carbs}}g, Fat: {{dailyTotals.fat}}g
  (Protein: {{dailyTotals.protein}}g * 4 = ~{{#if dailyTotals.protein}}...{{/if}} kcal. Check % of total.)

{{#if trendsAnalysis}}
**Analysis from Trends Graphs (Last {{trendsAnalysis.totalDaysAnalyzed}} Days):**
- **Cumulative Net Calorie Change (Guardrailed):** {{#if trendsAnalysis.cumulativeNetCaloriesWithGuardrail}}{{trendsAnalysis.cumulativeNetCaloriesWithGuardrail}}{{else}}{{trendsAnalysis.cumulativeNetCalories}}{{/if}} kcal
  (Note: POSITIVE = Deficit/Savings. NEGATIVE = Surplus. "Guardrailed" means days with < 800 kcal are ignored to prevent false savings.)
- **Activity-Appetite Correlation:** {{#if trendsAnalysis.calorieStepCorrelationSlope}}Slope: {{trendsAnalysis.calorieStepCorrelationSlope}} ({{trendsAnalysis.calorieStepCorrelationStrength}}).
  (Note: Regression of Steps vs Calories. Positive slope (>0.05) implies the user eats more when active. Near zero implies no correlation. Negative implies they eat less when active.){{else}}N/A{{/if}}
- **Adherence:** Exceeded daily calorie target ({{trendsAnalysis.dailyCalorieTarget}} kcal) on {{trendsAnalysis.daysOverCalorieTarget}} days out of {{trendsAnalysis.totalDaysAnalyzed}}.
- **Average Daily Intake:** {{trendsAnalysis.averageDailyCalories}} kcal/day.
{{#if trendsAnalysis.fluxZones}}
- **Energy Flux Zones (G-Flux Status):**
  - **Optimal Flux (High Steps/High Cal):** {{trendsAnalysis.fluxZones.optimalFluxDays}} days. (Ideal state for metabolic health & maintenance).
  - **The Grind (High Steps/Low Cal):** {{trendsAnalysis.fluxZones.grindDays}} days. (Fat loss phase, caution for burnout).
  - **Sedentary Storage (Low Steps/High Cal):** {{trendsAnalysis.fluxZones.sedentaryStorageDays}} days. (Risk of fat gain).
  - **Metabolic Stagnation (Low Steps/Low Cal):** {{trendsAnalysis.fluxZones.metabolicStagnationDays}} days. (Risk of metabolic adaptation/low energy).
{{/if}}
{{/if}}

**User's Question:**
"{{{userQuestion}}}"

**User's Recent Food Log (Chronological):**
{{#each foodLog}}
- {{this.timestamp}}: **{{this.name}}**
  - Portion: {{this.portionSize}} {{this.portionUnit}}, Ingredients: {{this.ingredients}}
  - Calories: {{#if this.calories}}{{this.calories}}{{else}}N/A{{/if}}, Protein: {{#if this.protein}}{{this.protein}}{{else}}N/A{{/if}}g, Carbs: {{#if this.carbs}}{{this.carbs}}{{else}}N/A{{/if}}g, Fat: {{#if this.fat}}{{this.fat}}{{else}}N/A{{/if}}g
{{else}}
(No food items logged recently)
{{/each}}

**User's Recent Symptom Log:**
{{#each symptomLog}}
- {{this.timestamp}}: **{{#each this.symptoms}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}** (Severity: {{#if this.severity}}{{this.severity}}{{else}}N/A{{/if}})
{{else}}
(No symptoms logged recently)
{{/each}}


**RESPONSE STRATEGY:**

1.  **CRITICAL: Time of Day & Context Awareness:**
    *   **IF Late Night (22:00 - 04:00):**
        *   **STOP:** Do NOT suggest exercise/walking. The prioritized advice is SLEEP and RECOVERY.
        *   **FASTING:** 
            *   **IF \`hoursSinceLastMeal\` > 4:** State clearly that their fast **ALREADY STARTED** {{hoursSinceLastMeal}} hours ago. Use the provided "Projected Fast Completion" times strictly.
            *   **IF \`hoursSinceLastMeal\` <= 4:** Consider them still in their **Fed State** (Digesting). Do NOT say "Fast has started".
            *   Do NOT say "If you stop eating now".
            *   **NO SNACKS:** Unless explicitly requested.
    *   **IF Morning:** Focus on fueling for the day.
    *   **IF Evening:** Focus on winding down and protein targets.

2.  **Analyze User's Progress Towards Their Goal:**
    *   **Weight Loss (\`lose_fat\`):** Analyze if their caloric intake and food choices align with a deficit.
        *   **METABOLIC GUARDRAIL (CRITICAL):** Check if 'Average Daily Intake' < 'Safety Floor' ({{safetyFloor}} kcal).
        *   **IF UNDER FLOOR:** Do NOT praise the large deficit. WARN them that consistently eating below {{safetyFloor}} kcal risks **metabolic slowdown** and cortisol increase. Recommend INCREASING intake slightly to stay above this floor.
        *   **IF ABOVE FLOOR:** Affirm the sustainable deficit.
    *   **Muscle Gain (\`gain_muscle\`):** Check if protein intake is sufficient and if they are eating enough overall to fuel growth.
    *   **Macronutrient Analysis (Crucial):**
        *   **Calculate Protein %:** (Protein_g * 4) / Total_Calories.
            *   **Guidance:** Ideally, Protein should be a significant portion for satiety and muscle (aiming for >25-30% is often good). Praise high protein or suggest increasing it if low.
        *   **KETO/LOW CARB Deep Dive (If 'Keto' or 'Low Carb' is preferred):**
            *   **Adherence Check:** You managed to stay under 50g Net Carbs on **{{trendsAnalysis.ketoAdherenceDays}} out of {{trendsAnalysis.totalDaysAnalyzed}} days**.
                *   IF > 80%: Praise consistency!
                *   IF < 50%: Discuss difficulty. "It looks like sticking to strict Keto has been tough ({{trendsAnalysis.ketoAdherenceDays}} days adhered)."
            *   **Carb Thresholds:**
                *   **< 20g Net Carbs:** "Strict Keto" (Therapeutic level).
                *   **20g - 50g Net Carbs:** "Standard Keto" (Management level).
                *   **> 50g:** "Low Carb" (Likely out of deep ketosis). warn if this was unintentional.
            *   **Electrolyte Check (The Keto Flu):**
                *   **Scan Symptoms:** If User reports **Headache, Fatigue, Brain Fog, Muscle Cramps, or Dizziness**...
                *   **ADVICE:** This is likely "Keto Flu" (Electrolyte Imbalance). Recommend increasing **Sodium** (Salt), **Potassium** (Avocado/Lite Salt), and **Magnesium**. Hydration alone washes out electrolytes on Keto.
            *   **"Rabbit Starvation" Protocol:**
                *   **Check:** Is Fat intake low (< 40-50% of calories) AND Carbs low?
                *   **WARNING:** High Protein + Low Fat + Low Carb is dangerous ("Rabbit Starvation"). Keto requires FAT as the fuel source. Suggest adding healthy fats (Olive Oil, Avocado, Nuts).
            *   **Protein Sparing:** Protein should be adequate for muscle sparing, but not excessive on strict therapeutic keto (though less of a concern for weight loss). Focus on *Fats* filling the remaining energy need.
    *   **Maintenance (\`maintain\`):** specific patterns that might cause fluctuations.
    *   *Intermittent Fasting (State Recognition):*
        *   **A) Current Status (CRITICAL):** Check 'hoursSinceLastMeal'.
            *   **IF < 4 hours:** User is in **FED STATE** (Digestion/Anabolic).
                *   **ADVICE:** "You are currently in your eating window (Fed State) and digesting your last meal (~{{hoursSinceLastMeal}}h ago)."
                *   **Do NOT** say "You are fasting".
                *   **Do NOT** project Fast Completion times yet (it's too early).
            *   **IF > 4 hours:** User is entering **POST-ABSORPTIVE** or **FASTED** state.
                *   **ADVICE:** "Fast Started [X] hours ago."
                *   **Display Projections:** Show the "Projected Fast Completion" times.
        *   **B) Weekly Trend:** Analyze **'Recent Fasting Consistency'**.
            *   **Adherence Check:** You completed a >16h fast on **{{trendsAnalysis.fastingAdherenceDays}} out of {{trendsAnalysis.totalDaysAnalyzed}} days**.
            *   Highlight days with > 14-16h fasts.

    *   **Calorie & Safety Floor Context:**
        *   **Timing Matters:** 
            *   If **Morning/Afternoon:** And intake < Floor, say "You have plenty of time left. Plan your upcoming meals to reach at least {{safetyFloor}} kcal."
            *   If **Evening/Late:** And intake < Floor, say "You are ending the day low. Consider a small, protein-rich snack to reach your metabolic safe zone."
            *   **CONTRADICTION CHECK:** If user is "Fasted" (intentionally) or it is very late (>10pm), prioritize SLEEP over forcing food, unless they feel unwell or are dangerously low (<800kcal).
    *   **Energy Flux Assessment:** Reference the "Flux Zones".
        *   **IMPORTANT:** If the "Flux Zones" indicate Stagnation but recent days (or today) show high activity, **Activity Trumps History.** Praise the recent effort to move!
        *   If truly sedentary, encourage movement *at appropriate times* (not midnight).

3.  **Evaluate Daily Habits & Trends:**
    *   Look at the *trends* in their logs. Are they consistent? Do they skip meals? Do they binge at night?
    *   If they asked "How am I doing?", give a direct assessment based on their specific goal. "You are doing great with protein, but your caloric intake is slightly low/high for your goal."

4.  **Provide Actionable "Next Steps":**
    *   Don't just analyze; tell them what to do *next*.
    *   Example: "For your next meal, try to add more fiber to stay full." or "You've hit your protein goal, maybe focus on veggies for dinner."

5.  **Tone & Style:**
    *   Be encouraging but honest. Like a real coach.
    *   Use Markdown for clarity (bolding key points, lists).
    *   Keep it concise where possible, but detailed enough to be valuable.
    *   **NEVER** suggest "Go for a walk" if it is past 10 PM.

6.  **SAFETY & TONE GUARDRAILS:**
    *   **NO PROFANITY:** Do not use swear words, crude humor, or sexual references.
    *   **NO MEDICAL ADVICE:** Framing remains wellness coaching.
    *   **RESPECT:** Maintain a supportive, professional yet friendly 'coach' persona.

**Output the response as a JSON object with a single key 'aiResponse'.**
`,
});

const personalizedDietitianFlow = ai.defineFlow(
  {
    name: 'personalizedDietitianFlow',
    inputSchema: PersonalizedDietitianInputSchema,
    outputSchema: PersonalizedDietitianOutputSchema,
  },
  async (input) => {
    try {
      // Calculate Safety Floor (TDEE * 0.75) if TDEE exists
      const tdee = input.userProfile?.tdee || 2000; // Default fallback to avoid 0 if unknown
      const safetyFloor = Math.round(tdee * 0.75);

      const transformedInput = {
        ...input,
        safetyFloor: safetyFloor,
        // No need to transform timestamps as they are already strings (potentially local time strings)
      };

      const { output } = await personalizedDietitianPrompt(transformedInput);
      if (!output || !output.aiResponse) {
        return defaultErrorOutput;
      }
      return output;
    } catch (error: any) {
      console.error('[PersonalizedDietitianFlow] Error during AI processing:', error);
      const modelNotFoundError = error.message?.includes("NOT_FOUND") || error.message?.includes("model not found");
      let specificResponseMessage = `An error occurred while consulting the AI dietitian: ${error.message || 'Unknown AI error'}. Please try again later.`;
      if (modelNotFoundError) {
        specificResponseMessage = "System analysis failed: The configured model is not accessible. Please check API key and project settings.";
      }

      return {
        aiResponse: specificResponseMessage
      };
    }
  }
);
