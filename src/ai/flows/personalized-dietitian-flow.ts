
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
  timestamp: z.string().datetime().describe("ISO 8601 datetime string for when the food was logged."),
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
  timestamp: z.string().datetime().describe("ISO 8601 datetime string for when symptoms were logged."),
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
}).optional();


const PersonalizedDietitianInputSchema = z.object({
  userQuestion: z.string().describe("The user's specific question about their diet, health, or well-being."),
  foodLog: z.array(FoodItemSchemaForAI).describe("A chronological list of the user's logged food items (e.g., last 30-90 days)."),
  symptomLog: z.array(SymptomLogEntrySchemaForAI).describe("A chronological list of the user's logged symptoms (e.g., last 30-90 days)."),
  userProfile: UserProfileSchemaForAI.describe("Basic user profile information, including any marked safe foods."),
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
  prompt: `You are an expert AI Dietitian and Wellness Coach.
Provide a comprehensive, empathetic, personalized, and actionable response based on the user's question and ALL their provided data (profile, food log, symptom log).
Output the response as a JSON object with a single key 'aiResponse'.

User's Question:
"{{{userQuestion}}}"

User's Profile Information (if available):
{{#if userProfile}}
Display Name: {{#if userProfile.displayName}}{{userProfile.displayName}}{{else}}N/A{{/if}}
Premium User: {{#if userProfile.premium}}Yes{{else}}No{{/if}}
Marked Safe Foods (name, portion):
{{#if userProfile.safeFoods}}
  {{#each userProfile.safeFoods}}
  - {{this.name}} ({{this.portionSize}} {{this.portionUnit}})
  {{/each}}
{{else}}
(No specific safe foods marked by user)
{{/if}}
{{else}}
(No user profile information provided)
{{/if}}

User's Recent Food Log (chronological):
{{#each foodLog}}
- Meal: {{this.name}} (Portion: {{this.portionSize}} {{this.portionUnit}}, Ingredients: {{this.ingredients}})
  Logged: {{this.timestamp}}
  {{#if this.sourceDescription}}Original Description: "{{this.sourceDescription}}"{{/if}}
  FODMAP Risk: {{#if this.overallFodmapRisk}}{{this.overallFodmapRisk}}{{else}}N/A{{/if}}
  Nutrition (Approx.): Calories: {{#if this.calories}}{{this.calories}}{{else}}N/A{{/if}}, Protein: {{#if this.protein}}{{this.protein}}{{else}}N/A{{/if}}g, Carbs: {{#if this.carbs}}{{this.carbs}}{{else}}N/A{{/if}}g, Fat: {{#if this.fat}}{{this.fat}}{{else}}N/A{{/if}}g
  User Feedback: {{#if this.userFeedback}}{{this.userFeedback}}{{else}}None{{/if}}
{{else}}
(No food items logged recently or provided for analysis)
{{/each}}

User's Recent Symptom Log (chronological):
{{#each symptomLog}}
- Symptoms: {{#each this.symptoms}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}
  Logged: {{this.timestamp}}
  Severity: {{#if this.severity}}{{this.severity}}{{else}}N/A{{/if}}
  {{#if this.notes}}Notes: "{{this.notes}}"{{/if}}
  {{#if this.linkedFoodItemIds}}Linked to {{this.linkedFoodItemIds.length}} food(s).{{/if}}
{{else}}
(No symptoms logged recently or provided for analysis)
{{/each}}

RESPONSE GUIDELINES:
1.  **Analysis & Insight:**
    *   Analyze patterns between food (timing, ingredients, FODMAPs, user feedback) and symptoms if question relates to triggers.
    *   Suggest specific, actionable dietary changes based on logs if about diet improvement.
    *   Connect general well-being questions to dietary habits if relevant.
    *   If data is insufficient for a deep answer, state this clearly, but offer general advice or suggest what additional data would be helpful.
2.  **Personalization & Tone:**
    *   Be highly personalized: refer to specific foods logged or symptoms reported.
    *   Maintain a supportive, encouraging, and caring tone.
    *   Avoid definitive medical diagnoses. Frame suggestions as possibilities to explore or discuss with a healthcare professional.
3.  **Formatting:**
    *   Synthesize information to provide new insights; do NOT just repeat input data.
    *   Structure your response clearly using paragraphs. For multiple points, consider markdown bullet points (* or -) for readability.
    *   Your entire response should be the value for the 'aiResponse' field.
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
          foodLog: input.foodLog.map(item => ({
              ...item,
              timestamp: typeof item.timestamp === 'string' ? item.timestamp : new Date(item.timestamp).toISOString(),
          })),
          symptomLog: input.symptomLog.map(item => ({
              ...item,
              timestamp: typeof item.timestamp === 'string' ? item.timestamp : new Date(item.timestamp).toISOString(),
          })),
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
        specificResponseMessage = "AI Dietitian analysis failed: The configured AI model is not accessible. Please check API key and project settings.";
      }
      
      return { 
        aiResponse: specificResponseMessage
      };
    }
  }
);
