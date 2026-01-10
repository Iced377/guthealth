
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
  timeOfDaySegment: z.string().optional().describe("Current time segment: 'Morning', 'Afternoon', 'Evening', 'Late Night'."),
  trendsAnalysis: TrendsAnalysisSchema.optional().describe("Computed insights from the user's historical trends graphs, providing context on long-term observance of calorie goals."),
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
- **Max Recorded Fasting Window:** {{#if userProfile.maxFastingWindowHours}}{{userProfile.maxFastingWindowHours}} hours{{else}}N/A{{/if}}
{{#if projectedFastingEndTimes}}
- **Projected Fast Completion (Tomorrow):** 
  - 16 Hour Goal: Ends at **{{projectedFastingEndTimes.target16h}}**
  - Your Max ({{userProfile.maxFastingWindowHours}}h): Ends at **{{projectedFastingEndTimes.targetMax}}**
{{/if}}
- **Today's Totals (Calculated):** Calories: {{dailyTotals.calories}}, Protein: {{dailyTotals.protein}}g, Carbs: {{dailyTotals.carbs}}g, Fat: {{dailyTotals.fat}}g

{{#if trendsAnalysis}}
**Analysis from Trends Graphs (Last {{trendsAnalysis.totalDaysAnalyzed}} Days):**
- **Cumulative Net Calorie Change (Guardrailed):** {{#if trendsAnalysis.cumulativeNetCaloriesWithGuardrail}}{{trendsAnalysis.cumulativeNetCaloriesWithGuardrail}}{{else}}{{trendsAnalysis.cumulativeNetCalories}}{{/if}} kcal
  (Note: POSITIVE = Deficit/Savings. NEGATIVE = Surplus. "Guardrailed" means days with < 800 kcal are ignored to prevent false savings.)
- **Activity-Appetite Correlation:** {{#if trendsAnalysis.calorieStepCorrelationSlope}}Slope: {{trendsAnalysis.calorieStepCorrelationSlope}} ({{trendsAnalysis.calorieStepCorrelationStrength}}).
  (Note: Regression of Steps vs Calories. Positive slope (>0.05) implies the user eats more on active days. Near zero implies no correlation. Negative implies they eat less when active.){{else}}N/A{{/if}}
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
        *   **FASTING:** If they last ate > 1 hour ago:
            *   State clearly that their fast **ALREADY STARTED** {{hoursSinceLastMeal}} hours ago. 
            *   Do NOT say "If you stop eating now". 
            *   Use the provided "Projected Fast Completion" times strictly: "Based on your last meal, your 16h fast ends at {{projectedFastingEndTimes.target16h}}".
        *   **NO SNACKS:** Unless explicitly requested.
    *   **IF Morning:** Focus on fueling for the day.
    *   **IF Evening:** Focus on winding down and protein targets.

2.  **Analyze User's Progress Towards Their Goal:**
    *   **Weight Loss (\`lose_fat\`):** Analyze if their caloric intake and food choices align with a deficit. Are they eating nutrient-dense foods that keep them full? Are there hidden calories?
    *   **Muscle Gain (\`gain_muscle\`):** Check if protein intake is sufficient and if they are eating enough overall to fuel growth.
    *   **Maintenance (\`maintain\`):** specific patterns that might cause fluctuations.
    *   *Intermittent Fasting:* Check the 'Max Recorded Fasting Window' and 'hoursSinceLastMeal'. Assess if they are adhering to a window.
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
      const transformedInput = {
        ...input,
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
