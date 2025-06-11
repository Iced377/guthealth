
'use server';

/**
 * @fileOverview This file defines the daily insights flow, which analyzes a user's food log, symptoms, and micronutrient intake to provide personalized insights.
 *
 * - getDailyInsights - A function that retrieves daily insights based on user data.
 * - DailyInsightsInput - The input type for the getDailyInsights function.
 * - DailyInsightsOutput - The return type for the getDailyInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyInsightsInputSchema = z.object({
  foodLog: z
    .string()
    .describe(
      'A string containing a list of food items the user has logged for the day.'
    ),
  symptoms: z
    .string()
    .describe(
      'A string containing a list of symptoms the user has experienced during the day.'
    ),
  micronutrientSummary: z
    .string()
    .optional()
    .describe(
      'A string summarizing the user\'s micronutrient intake for the day (e.g., "High in Vitamin C, low in Iron. Adequate Vitamin D.").'
    ),
});
export type DailyInsightsInput = z.infer<typeof DailyInsightsInputSchema>;

const DailyInsightsOutputSchema = z.object({
  triggerInsights: z
    .string()
    .describe(
      'Insights about potential trigger foods or high-risk meals based on food log and symptoms. E.g., "You had 3 high-risk meals today" or "Garlic appears to trigger symptoms."'
    ),
  micronutrientFeedback: z
    .string()
    .optional()
    .describe(
      'Feedback on the user\'s micronutrient intake, highlighting areas of concern or sufficiency. E.g., "Your Vitamin C intake was good, but you might need more Iron." If no summary is provided, this should state that micronutrient feedback is unavailable or be omitted.'
    ),
  overallSummary: z
    .string()
    .describe(
      'A general (overall) view or summary of the user\'s logged day, considering food, symptoms, and micronutrients.'
    ),
});
export type DailyInsightsOutput = z.infer<typeof DailyInsightsOutputSchema>;

const defaultErrorOutput: DailyInsightsOutput = {
  triggerInsights: 'Could not determine trigger insights due to an analysis error.',
  micronutrientFeedback: 'Micronutrient feedback unavailable due to an analysis error.',
  overallSummary: 'Could not determine overall summary due to an analysis error.',
};

export async function getDailyInsights(input: DailyInsightsInput): Promise<DailyInsightsOutput> {
  return dailyInsightsFlow(input);
}

const dailyInsightsPrompt = ai.definePrompt({
  name: 'dailyInsightsPrompt',
  model: 'googleai/gemini-1.5-pro-latest', // Standardized model name
  input: {schema: DailyInsightsInputSchema},
  output: {schema: DailyInsightsOutputSchema},
  prompt: `Analyze the user's daily food log, symptoms, and micronutrient summary (if provided) to generate personalized insights.
Output a JSON object strictly adhering to the 'DailyInsightsOutputSchema'.

Food Log: {{{foodLog}}}
Symptoms: {{{symptoms}}}
{{#if micronutrientSummary}}
Micronutrient Summary: {{{micronutrientSummary}}}
{{/if}}

The output JSON should include:
- 'triggerInsights': Identify potential trigger foods or high-risk meals.
- 'micronutrientFeedback': Provide feedback on micronutrient intake. If no summary was provided, the schema description for this field guides the expected output.
- 'overallSummary': A brief, general overview of the day.

Example Input:
Food Log: "Breakfast: Oats with berries. Lunch: Chicken salad. Dinner: Spaghetti bolognese (with onion and garlic)."
Symptoms: "Bloating after dinner."
Micronutrient Summary: "High in Vitamin C, low in Iron."

Example Output (JSON):
{
  "triggerInsights": "The spaghetti bolognese containing onion and garlic may have contributed to your bloating, as these are common FODMAP triggers.",
  "micronutrientFeedback": "Your Vitamin C intake was good today. You might want to focus on iron-rich foods tomorrow.",
  "overallSummary": "Today included a mix of meals. Bloating was noted after dinner, potentially linked to FODMAPs."
}
`,
});

const dailyInsightsFlow = ai.defineFlow(
  {
    name: 'dailyInsightsFlow',
    inputSchema: DailyInsightsInputSchema,
    outputSchema: DailyInsightsOutputSchema,
  },
  async (input: DailyInsightsInput): Promise<DailyInsightsOutput> => {
    try {
      const {output} = await dailyInsightsPrompt(input);
      
      if (!output) {
        console.warn('[DailyInsightsFlow] AI prompt returned no output. Falling back to default error response.');
        return defaultErrorOutput;
      }

      if (
        typeof output.triggerInsights === 'string' &&
        typeof output.overallSummary === 'string' &&
        (output.micronutrientFeedback === undefined || typeof output.micronutrientFeedback === 'string')
      ) {
        return output as DailyInsightsOutput;
      } else {
        console.warn('[DailyInsightsFlow] AI output did not match expected schema. Output:', output);
        let triggerMsg = defaultErrorOutput.triggerInsights;
        let microMsg = defaultErrorOutput.micronutrientFeedback;
        let overallMsg = defaultErrorOutput.overallSummary;

        if (output && typeof (output as any).triggerInsights === 'string') triggerMsg = (output as any).triggerInsights;
        if (output && (output as any).micronutrientFeedback === undefined || typeof (output as any).micronutrientFeedback === 'string') microMsg = (output as any).micronutrientFeedback;
        if (output && typeof (output as any).overallSummary === 'string') overallMsg = (output as any).overallSummary;
        
        return {
            triggerInsights: triggerMsg,
            micronutrientFeedback: microMsg,
            overallSummary: overallMsg,
        };
      }

    } catch (error: any) {
      console.error('[DailyInsightsFlow] Error during AI processing:', error);
      return {
        ...defaultErrorOutput,
        overallSummary: `Error during daily insights analysis: ${error.message || 'Unknown error'}.`,
      };
    }
  }
);
