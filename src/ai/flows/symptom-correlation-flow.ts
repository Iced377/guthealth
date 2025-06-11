
'use server';
/**
 * @fileOverview This file defines the symptom correlation flow.
 * It analyzes a user's food log and symptom records to identify potential patterns
 * and provide insights about individual sensitivities.
 *
 * - getSymptomCorrelations - Analyzes food and symptom data for correlations.
 * - SymptomCorrelationInput - The input type for the flow.
 * - SymptomCorrelationOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

// Define input structures based on types/index.ts
const LoggedFoodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  ingredients: z.string(),
  portionSize: z.string(),
  portionUnit: z.string(),
  timestamp: z.string().datetime().describe("ISO 8601 datetime string for when the food was logged."),
  overallFodmapRisk: z.enum(['Green', 'Yellow', 'Red']).optional().describe("Overall FODMAP risk of this item at the logged portion."),
});

const SymptomSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const SymptomLogEntrySchema = z.object({
  id: z.string(),
  linkedFoodItemIds: z.array(z.string()).optional().describe("IDs of food items potentially linked to these symptoms."),
  symptoms: z.array(SymptomSchema),
  severity: z.number().optional().describe("Symptom severity (e.g., 1-5)."),
  notes: z.string().optional(),
  timestamp: z.string().datetime().describe("ISO 8601 datetime string for when symptoms were logged."),
});

const SymptomCorrelationInputSchema = z.object({
  foodLog: z.array(LoggedFoodItemSchema).describe("A chronological list of the user's logged food items."),
  symptomLog: z.array(SymptomLogEntrySchema).describe("A chronological list of the user's logged symptoms."),
  safeFoods: z.array(z.object({ name: z.string(), portionSize: z.string(), portionUnit: z.string() })).optional().describe("User's marked safe foods with portions."),
});
export type SymptomCorrelationInput = z.infer<typeof SymptomCorrelationInputSchema>;

const InsightSchema = z.object({
  type: z.enum(['potential_trigger', 'potential_safe', 'observation', 'no_clear_pattern', 'error']).describe("Type of insight."),
  title: z.string().describe("A concise title for the insight card."),
  description: z.string().describe("Detailed explanation of the insight or pattern found."),
  relatedFoodNames: z.array(z.string()).optional().describe("Names of food items related to this insight."),
  relatedSymptoms: z.array(z.string()).optional().describe("Names of symptoms related to this insight."),
  confidence: z.enum(['low', 'medium', 'high']).optional().describe("Confidence level in this correlation."),
  suggestionToUser: z.string().optional().describe("An actionable suggestion for the user, e.g., 'Consider discussing with your dietitian.' or 'Try logging more consistently.'"),
});

const SymptomCorrelationOutputSchema = z.object({
  insights: z.array(InsightSchema).describe("A list of insights derived from correlating food and symptom logs. Examples: 'Bloating reported 4 times after eating onion >15g.' or 'You’ve had no symptoms after 3 lentil meals under 30g. Mark as safe?'"),
});
export type SymptomCorrelationOutput = z.infer<typeof SymptomCorrelationOutputSchema>;

const defaultErrorOutput: SymptomCorrelationOutput = {
  insights: [{
    type: 'error',
    title: 'Analysis Error',
    description: 'Could not complete symptom correlation analysis due to an internal error. Please try again later.',
    confidence: 'low',
  }]
};

export async function getSymptomCorrelations(input: SymptomCorrelationInput): Promise<SymptomCorrelationOutput> {
  if (input.foodLog.length < 3 && input.symptomLog.length < 1) {
    return { insights: [{
        type: 'observation',
        title: 'More Data Needed',
        description: 'Log more meals and symptoms to receive personalized insights.',
        confidence: 'low',
    }] };
  }
  return symptomCorrelationFlow(input);
}

const symptomCorrelationPrompt = ai.definePrompt({
  name: 'symptomCorrelationPrompt',
  // model: 'googleai/gemini-1.5-pro-latest', // Temporarily use default model
  input: {schema: SymptomCorrelationInputSchema},
  output: {schema: SymptomCorrelationOutputSchema},
  prompt: `You are an AI assistant for IBS pattern identification.
Analyze the user's food and symptom logs to find correlations.
Consider timing (1-4 hour onset typical), ingredients, portions, frequency, and overall FODMAP risk.
Output a JSON object strictly adhering to 'SymptomCorrelationOutputSchema'.

User's Food Log:
{{#each foodLog}}- {{this.name}} ({{this.portionSize}} {{this.portionUnit}}, Ingredients: {{this.ingredients}}, Logged: {{this.timestamp}}, Risk: {{#if this.overallFodmapRisk}}{{this.overallFodmapRisk}}{{else}}N/A{{/if}}){{else}}(None){{/each}}

User's Symptom Log:
{{#each symptomLog}}- Symptoms: {{#each this.symptoms}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}} (Logged: {{this.timestamp}}, Severity: {{#if this.severity}}{{this.severity}}{{else}}N/A{{/if}}, Notes: {{#if this.notes}}"{{this.notes}}"{{else}}N/A{{/if}}){{else}}(None){{/each}}

{{#if safeFoods.length}}User's Marked Safe Foods (reference):{{#each safeFoods}} - {{this.name}} ({{this.portionSize}} {{this.portionUnit}}){{/each}}{{/if}}

Generate 2-3 key insights. Prioritize strong correlations. Safe foods are less likely triggers unless portion significantly increased.
If data is sparse, provide an 'observation' insight stating more data is needed.
Examples of insights:
- 'potential_trigger': Title="Garlic & Bloating Link", Description="Bloating reported 3/4 times within 2-4 hours post-garlic meals.", Confidence='medium'.
- 'potential_safe': Title="Oats Seem Safe", Description="'Oats with berries' logged 5 times, no subsequent symptoms.", Confidence='medium'.
`,
});

const symptomCorrelationFlow = ai.defineFlow(
  {
    name: 'symptomCorrelationFlow',
    inputSchema: SymptomCorrelationInputSchema,
    outputSchema: SymptomCorrelationOutputSchema,
  },
  async (input: SymptomCorrelationInput): Promise<SymptomCorrelationOutput> => {
    try {
      const {output} = await symptomCorrelationPrompt(input);
      if (!output || !output.insights) {
        console.warn('[SymptomCorrelationFlow] AI prompt returned no or invalid output. Falling back to default error response.');
        return {
          ...defaultErrorOutput,
          insights: [{ ...defaultErrorOutput.insights[0], description: "Symptom correlation analysis did not produce a valid result."}]
        };
      }
      return output!;
    } catch (error: any) {
      console.error('[SymptomCorrelationFlow] Error during AI processing:', error);
      const modelNotFoundError = error.message?.includes("NOT_FOUND") || error.message?.includes("Model not found");
      let specificDescription = `Error during symptom correlation: ${error.message || 'Unknown error'}.`;
      if (modelNotFoundError) {
        specificDescription = "Symptom correlation analysis failed: The configured AI model is not accessible. Please check API key and project settings.";
      }
      
      return {
        ...defaultErrorOutput,
        insights: [{ ...defaultErrorOutput.insights[0], description: specificDescription }]
      };
    }
  }
);
