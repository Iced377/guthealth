
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
  currentLocalMinutes: z.number().optional().describe("Minutes since midnight in user's local time."),
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
  daysLogged: z.number().optional().describe("Number of distinct days with at least one food log."),
  averageMealsPerDay: z.number().optional().describe("Average number of logged meals per logged day."),
  todayLowCalorieFlag: z.enum(['none', 'low_midday', 'low_evening', 'very_low_evening']).optional(),
  coachTier: z.enum(['new', 'emerging', 'advanced']).optional(),
  ramadanMode: z.enum(['fasting', 'witnessing', 'hidden']).optional(),
  ramadanStartDate: z.string().optional(),
  ramadanDaysUntil: z.number().optional(),
  ramadanDayNumber: z.number().optional(),
  fastingPreference: z.boolean().optional(),
  isKeto: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  lowCalorieDays: z.number().optional(),
  veryLowCalorieDays: z.number().optional(),
  trendsAnalysis: TrendsAnalysisSchema.optional(),
  illogicalFlags: z.array(z.string()).optional(),
});
export type PersonalizedDietitianInput = z.infer<typeof PersonalizedDietitianInputSchema>;
export type FoodItemForAI = z.infer<typeof FoodItemSchemaForAI>;

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
- **Minutes Since Midnight:** {{#if currentLocalMinutes}}{{currentLocalMinutes}}{{else}}N/A{{/if}}
- **Time Since Last Meal:** {{#if hoursSinceLastMeal}}{{hoursSinceLastMeal}} hours{{else}}Unknown{{/if}}
- **Coach Tier:** {{#if coachTier}}{{coachTier}}{{else}}unknown{{/if}}
- **Days Logged:** {{#if daysLogged}}{{daysLogged}}{{else}}0{{/if}}
- **Avg Meals/Day:** {{#if averageMealsPerDay}}{{averageMealsPerDay}}{{else}}0{{/if}}
- **Goal:** {{#if userProfile.goal}}{{userProfile.goal}}{{else}}Not specified{{/if}}
- **Ramadan Mode:** {{#if ramadanMode}}{{ramadanMode}}{{else}}not_active{{/if}}
- **Ramadan Start Date:** {{#if ramadanStartDate}}{{ramadanStartDate}}{{else}}N/A{{/if}}
- **Ramadan Countdown:** {{#if ramadanDaysUntil}}{{ramadanDaysUntil}} days{{else}}N/A{{/if}}
- **Current Weight:** {{#if userProfile.currentWeight}}{{userProfile.currentWeight}} kg{{else}}Not specified{{/if}}
- **Activity Level:** {{#if userProfile.activityLevel}}{{userProfile.activityLevel}}{{else}}Not specified{{/if}}
- **Dietary Preferences:** {{#if userProfile.dietaryPreferences}}{{#each userProfile.dietaryPreferences}}{{.}}, {{/each}}{{else}}None{{/if}}
- **Fasting Preference:** {{#if fastingPreference}}Yes{{else}}No/Unknown{{/if}}
- **Keto Preference:** {{#if isKeto}}Yes{{else}}No/Unknown{{/if}}
- **Vegetarian:** {{#if isVegetarian}}Yes{{else}}No/Unknown{{/if}}
- **Vegan:** {{#if isVegan}}Yes{{else}}No/Unknown{{/if}}
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

{{#if lowCalorieDays}}
**Data Quality Signals:**
- **Low-Cal Days (<1100 kcal):** {{lowCalorieDays}}
- **Very Low-Cal Days (<900 kcal):** {{veryLowCalorieDays}}
{{/if}}
{{#if todayLowCalorieFlag}}
**Today's Intake Context Flag:** {{todayLowCalorieFlag}}
{{/if}}
{{#if illogicalFlags}}
**Sanity Check Flags:** {{#each illogicalFlags}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}



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

0.  **Ramadan Context & Disclosure (CRITICAL):**
    *   **IF \`ramadanMode\` = \`fasting\`:**
        *   Treat daytime low intake as expected. Focus on hydration between Iftar and sleep, balanced Suhoor, and gentle pacing at Iftar.
        *   You may reference Iftar/Suhoor, but keep language **non‑religious** and **health‑focused**.
        *   **Do NOT** describe this as "intermittent fasting" or say the user "prefers intermittent fasting." Use **"Ramadan fasting"** or **"fasting window"** language instead.
        *   **If \`ramadanDaysUntil\` > 0:** mention “Ramadan starts in {{ramadanDaysUntil}} days” in the opening summary.
        *   **If \`ramadanDaysUntil\` = 0:** mention “Ramadan starts today” in the opening summary.
        *   **If \`ramadanDayNumber\` exists:** mention “Ramadan is underway (Day {{ramadanDayNumber}})” in the opening summary.
    *   **IF \`ramadanMode\` = \`witnessing\`:**
        *   Do **NOT** give fasting directives. Provide neutral wellness tips, supportive routines, and respectful scheduling guidance.
        *   Avoid Iftar/Suhoor instructions.
        *   **IMPORTANT:** Ignore any intermittent fasting preference in this mode. Do not mention fasting states, windows, or projections.
        *   **Meal Timing Guidance (WITNESSING):** Offer practical ideas for eating and hydrating respectfully at work/school, e.g. eat earlier at home, take a private lunch break, plan a light snack before commuting, and hydrate discretely. Emphasize sustainability and not skipping meals entirely.
        *   **If \`ramadanDaysUntil\` > 0:** mention “Ramadan starts in {{ramadanDaysUntil}} days” in the opening summary.
        *   **If \`ramadanDaysUntil\` = 0:** mention “Ramadan starts today” in the opening summary.
        *   **If \`ramadanDayNumber\` exists:** mention “Ramadan is underway (Day {{ramadanDayNumber}})” in the opening summary.
    *   **IF \`ramadanMode\` = \`hidden\` OR not_active:**
        *   Do **NOT** mention Ramadan at all. Provide standard guidance only.

1.  **FIRST: Onboarding-First for New or Sparse Data Users:**
    *   **IF \`coachTier\` is \`new\` OR \`daysLogged\` < 3 OR \`averageMealsPerDay\` < 2 OR \`veryLowCalorieDays\` > 0:**
        *   Focus the response on **how to use the app** and **building the habit** of logging.
        *   Explain, in simple science-backed language, that consistent logging improves accuracy and reduces guesswork.
        *   Be explicit that data is **limited** and avoid confident conclusions.
        *   Provide practical guidance:
            *   **Log every meal/snack** daily and include **timing**.
            *   **Track steps and weight** so energy intake/expenditure align with goals.
            *   **Manual entry** is possible by tapping the relevant **main dashboard card** (meals, steps, weight) for any date.
            *   Recommend connecting **Apple Health** for steps.
            *   If they own a **Fitbit Aria** smart scale, mention the app can pull weight automatically.
        *   Ask 1-2 clarifying questions if profile/goal/symptoms are missing.
        *   **DO NOT** do macro deep-dives, fasting projections, or keto rules unless the user explicitly asks.
    *   **TODAY'S CALORIE CONTEXT (CRITICAL):**
        *   **IF \`todayLowCalorieFlag\` = \`low_midday\`:** This is normal for midday. Encourage completing logs and suggest a plan for the rest of the day.
        *   **IF \`todayLowCalorieFlag\` = \`low_evening\` or \`very_low_evening\`:** Flag as likely incomplete or insufficient intake for the day. Suggest a balanced meal or snack **unless** the user is fasting by preference or \`ramadanMode\` = \`fasting\`.
        *   **IF fastingPreference OR \`ramadanMode\` = \`fasting\`:** Treat low daytime intake as expected and shift advice to hydration and meal planning for the eating window.

2.  **CRITICAL: Time of Day & Context Awareness:**
    *   **IF Late Night (22:00 - 04:00):**
        *   **STOP:** Do NOT suggest exercise/walking. The prioritized advice is SLEEP and RECOVERY.
        *   **FASTING (Only if \`fastingPreference\` is true OR \`ramadanMode\` = \`fasting\`):** 
            *   **IF \`hoursSinceLastMeal\` > 4:** State clearly that their fast **ALREADY STARTED** {{hoursSinceLastMeal}} hours ago. Use the provided "Projected Fast Completion" times strictly.
            *   **IF \`hoursSinceLastMeal\` <= 4:** Consider them still in their **Fed State** (Digesting). Do NOT say "Fast has started".
            *   Do NOT say "If you stop eating now".
            *   **NO SNACKS:** Unless explicitly requested.
    *   **IF Morning:** Focus on fueling for the day.
    *   **IF Evening:** Focus on winding down and protein targets.
    *   **IF \`fastingPreference\` is false/unknown AND \`ramadanMode\` is not \`fasting\`:** Do NOT discuss fasting windows, fasted/fed states, or projected fast completion unless the user explicitly asks.

3.  **Analyze User's Progress Towards Their Goal:**
    *   Start with a short, plain-language summary tied to their goal and any logged symptoms (best practices).
    *   **Weight Loss (\`lose_fat\`):** Analyze if their caloric intake and food choices align with a deficit.
        *   **DATA QUALITY GUARDRAIL:** If \`veryLowCalorieDays\` > 0 or \`lowCalorieDays\` > 0, treat calorie totals as **incomplete logging**. Do NOT celebrate large deficits. Emphasize consistent logging instead.
        *   **METABOLIC GUARDRAIL (CRITICAL):** If Safety Floor is available, check if 'Average Daily Intake' < 'Safety Floor' ({{safetyFloor}} kcal). If Safety Floor is N/A, skip this check.
        *   **IF UNDER FLOOR:** Do NOT praise the large deficit. WARN them that consistently eating below {{safetyFloor}} kcal risks **metabolic slowdown** and cortisol increase. Recommend INCREASING intake slightly to stay above this floor.
        *   **IF ABOVE FLOOR:** Affirm the sustainable deficit.
    *   **Muscle Gain (\`gain_muscle\`):** Check if protein intake is sufficient and if they are eating enough overall to fuel growth.
    *   **Macronutrient Analysis (Crucial):**
        *   **Calculate Protein %:** (Protein_g * 4) / Total_Calories.
            *   **Guidance:** Ideally, Protein should be a significant portion for satiety and muscle (aiming for >25-30% is often good). Praise high protein or suggest increasing it if low.
        *   **KETO/LOW CARB Deep Dive (Only if \`isKeto\` is true or the user explicitly asks):**
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
    *   *Fasting Window (State Recognition) — ONLY if \`ramadanMode\` = \`fasting\` OR (\`ramadanMode\` is not set AND \`fastingPreference\` is true) OR the user explicitly asks:*
        *   **If \`ramadanMode\` = \`fasting\`:** label this section as **“Ramadan Fasting Routine”** and avoid “intermittent fasting” phrasing.
        *   **If \`ramadanMode\` = \`witnessing\` or \`hidden\`:** skip this entire section even if preferences mention fasting.
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

4.  **Evaluate Daily Habits & Trends:**
    *   Look at the *trends* in their logs. Are they consistent? Do they skip meals? Do they binge at night?
    *   If they asked "How am I doing?", give a direct assessment based on their specific goal. "You are doing great with protein, but your caloric intake is slightly low/high for your goal."

5.  **Provide Actionable "Next Steps":**
    *   Don't just analyze; tell them what to do *next*.
    *   Example: "For your next meal, try to add more fiber to stay full." or "You've hit your protein goal, maybe focus on veggies for dinner."
    *   Respect dietary preferences (e.g., if \`isVegetarian\` or \`isVegan\`, avoid meat/fish suggestions).

6.  **Tone & Style:**
    *   Be encouraging but honest. Like a real coach.
    *   Use Markdown for clarity (bolding key points, lists).
    *   Keep it concise where possible, but detailed enough to be valuable.
    *   **NEVER** suggest "Go for a walk" if it is past 10 PM.

7.  **SAFETY & TONE GUARDRAILS:**
    *   **NO PROFANITY:** Do not use swear words, crude humor, or sexual references.
    *   **NO MEDICAL ADVICE:** Framing remains wellness coaching.
    *   **RESPECT:** Maintain a supportive, professional yet friendly 'coach' persona.
    *   **ROUND NUMBERS:** All calorie and macro numbers MUST be whole integers (e.g., 1625 kcal, 135g). Never use decimals.
    *   **ILLOGICAL INPUTS:** If \`illogicalFlags\` is present, gently flag the issue and ask the user to verify or correct the log before drawing conclusions.

**Output the response as a JSON object with a single key 'aiResponse'.**
`,
});

const getDateKey = (timestamp: string | Date): string | null => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hasPreference = (prefs: string[] | undefined, needles: string[]): boolean => {
  if (!prefs || prefs.length === 0) {
    return false;
  }
  return prefs.some((pref) => {
    const normalized = pref.toLowerCase();
    return needles.some((needle) => normalized.includes(needle));
  });
};

const summarizeLogging = (foodLog: (FoodItemForAI | LoggedFoodItem)[], todayKey: string | null) => {
  const dailyCalories = new Map<string, number>();
  const dailyMeals = new Map<string, number>();
  let singleMealOver2500 = false;
  let todayMeals = 0;
  let todayCalories = 0;

  for (const item of foodLog) {
    const dateKey = getDateKey(item.timestamp);
    if (!dateKey) {
      continue;
    }
    dailyMeals.set(dateKey, (dailyMeals.get(dateKey) || 0) + 1);
    if (todayKey && dateKey === todayKey) {
      todayMeals += 1;
    }
    if (typeof item.calories === 'number') {
      dailyCalories.set(dateKey, (dailyCalories.get(dateKey) || 0) + item.calories);
      if (todayKey && dateKey === todayKey) {
        todayCalories += item.calories;
      }
      if (item.calories > 2500) {
        singleMealOver2500 = true;
      }
    }
  }

  const daysLogged = dailyMeals.size;
  const totalMeals = Array.from(dailyMeals.values()).reduce((sum, count) => sum + count, 0);
  const averageMealsPerDay = daysLogged > 0 ? Math.round(totalMeals / daysLogged) : 0;

  let lowCalorieDays = 0;
  let veryLowCalorieDays = 0;
  let extremeDailyCalories = false;
  for (const [dateKey, calories] of dailyCalories.entries()) {
    if (todayKey && dateKey === todayKey) {
      continue;
    }
    if (calories > 0 && calories < 1100) {
      lowCalorieDays += 1;
    }
    if (calories > 0 && calories < 900) {
      veryLowCalorieDays += 1;
    }
    if (calories > 6000) {
      extremeDailyCalories = true;
    }
  }

  return {
    daysLogged,
    averageMealsPerDay,
    lowCalorieDays,
    veryLowCalorieDays,
    singleMealOver2500,
    extremeDailyCalories,
    todayMeals,
    todayCalories,
  };
};

const getMostRecentDateKey = (foodLog: (FoodItemForAI | LoggedFoodItem)[]): string | null => {
  let latestTime = -1;
  let latestKey: string | null = null;
  for (const item of foodLog) {
    const date = new Date(item.timestamp);
    const time = date.getTime();
    if (!Number.isNaN(time) && time > latestTime) {
      latestTime = time;
      latestKey = getDateKey(item.timestamp);
    }
  }
  return latestKey;
};

const personalizedDietitianFlow = ai.defineFlow(
  {
    name: 'personalizedDietitianFlow',
    inputSchema: PersonalizedDietitianInputSchema,
    outputSchema: PersonalizedDietitianOutputSchema,
  },
  async (input) => {
    try {
      const tdee = input.userProfile?.tdee;
      const safetyFloor = tdee ? Math.round(tdee * 0.75) : undefined;
      const prefs = input.userProfile?.dietaryPreferences;
      const ramadanMode = input.ramadanMode;
      const fastingPreferenceFromPrefs = hasPreference(prefs, ['fast', 'intermittent']);
      const fastingPreference =
        ramadanMode === 'fasting'
          ? true
          : ramadanMode
            ? false
            : fastingPreferenceFromPrefs;
      const isKeto = hasPreference(prefs, ['keto', 'low carb', 'low-carb']);
      const isVegetarian = hasPreference(prefs, ['vegetarian']);
      const isVegan = hasPreference(prefs, ['vegan']);

      const todayKey = getMostRecentDateKey(input.foodLog);
      const logSummary = summarizeLogging(input.foodLog, todayKey);
      const illogicalFlags: string[] = [];
      if (logSummary.singleMealOver2500) {
        illogicalFlags.push('single_meal_over_2500_kcal');
      }
      if (logSummary.extremeDailyCalories) {
        illogicalFlags.push('extreme_daily_calories');
      }
      if (logSummary.averageMealsPerDay > 0 && logSummary.averageMealsPerDay < 2) {
        illogicalFlags.push('low_meal_frequency');
      }
      if (logSummary.lowCalorieDays > 0) {
        illogicalFlags.push('low_calorie_day_possible_incomplete_logging');
      }
      if (logSummary.veryLowCalorieDays > 0) {
        illogicalFlags.push('very_low_calorie_day_possible_incomplete_logging');
      }
      if (input.userProfile?.maxFastingWindowHours && input.userProfile.maxFastingWindowHours > 48) {
        illogicalFlags.push('fasting_window_over_48h');
      }
      if (input.recentFastingWindows?.some((window) => window.durationHours > 48)) {
        illogicalFlags.push('fasting_window_over_48h_recent');
      }

      let todayLowCalorieFlag: 'none' | 'low_midday' | 'low_evening' | 'very_low_evening' = 'none';
      const minutesSinceMidnight = typeof input.currentLocalMinutes === 'number'
        ? input.currentLocalMinutes
        : undefined;
      const isLateDay = minutesSinceMidnight !== undefined
        ? minutesSinceMidnight >= 17 * 60
        : (input.timeOfDaySegment === 'Evening' || input.timeOfDaySegment === 'Late Night');
      const isMiddayWindow = minutesSinceMidnight !== undefined
        ? minutesSinceMidnight >= 12 * 60 && minutesSinceMidnight < 17 * 60
        : (input.timeOfDaySegment === 'Afternoon');

      if (typeof input.dailyTotals?.calories === 'number') {
        const totalCals = input.dailyTotals.calories;
        const earlyDay = minutesSinceMidnight !== undefined ? minutesSinceMidnight < 12 * 60 : false;
        if (earlyDay && totalCals === 0) {
          todayLowCalorieFlag = 'none';
        } else if (isLateDay && totalCals < 900) {
          todayLowCalorieFlag = 'very_low_evening';
        } else if (isLateDay && totalCals < 1100) {
          todayLowCalorieFlag = 'low_evening';
        } else if (isMiddayWindow && totalCals < 1100) {
          todayLowCalorieFlag = 'low_midday';
        }
      }

      let coachTier: 'new' | 'emerging' | 'advanced' = 'advanced';
      if (logSummary.daysLogged < 3 || !input.userProfile?.goal || !input.userProfile?.tdee) {
        coachTier = 'new';
      } else if (logSummary.daysLogged < 5 || logSummary.averageMealsPerDay < 2) {
        coachTier = 'emerging';
      }

      const transformedInput = {
        ...input,
        safetyFloor: safetyFloor,
        daysLogged: logSummary.daysLogged,
        averageMealsPerDay: logSummary.averageMealsPerDay,
        todayLowCalorieFlag: todayLowCalorieFlag !== 'none' ? todayLowCalorieFlag : undefined,
        coachTier: coachTier,
        ramadanMode: ramadanMode,
        fastingPreference: fastingPreference,
        isKeto: isKeto,
        isVegetarian: isVegetarian,
        isVegan: isVegan,
        lowCalorieDays: logSummary.lowCalorieDays,
        veryLowCalorieDays: logSummary.veryLowCalorieDays,
        illogicalFlags: illogicalFlags.length > 0 ? illogicalFlags : undefined,
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
