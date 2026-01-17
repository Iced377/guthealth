
'use server';

/**
 * @fileOverview This file defines the daily insights flow, which analyzes a user's food log and symptoms to provide personalized insights.
 *
 * - getDailyInsights - A function that retrieves daily insights based on user data.
 * - DailyInsightsInput - The input type for the getDailyInsights function.
 * - DailyInsightsOutput - The return type for the getDailyInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

});
export type DailyInsightsInput = z.infer<typeof DailyInsightsInputSchema>;

const DailyInsightsOutputSchema = z.object({
  triggerInsights: z
    .string()
    .describe(
      'Insights about potential trigger foods or high-risk meals based on food log and symptoms. E.g., "You had 3 high-risk meals today" or "Garlic appears to trigger symptoms."'
    ),

  overallSummary: z
    .string()
    .describe(
      'A general (overall) view or summary of the user\'s logged day, considering food and symptoms.'
    ),
});
export type DailyInsightsOutput = z.infer<typeof DailyInsightsOutputSchema>;

const defaultErrorOutput: DailyInsightsOutput = {
  triggerInsights: 'Could not determine trigger insights due to an analysis error.',

  overallSummary: 'Could not generate a daily summary at this time. Please try again later.',
};

export async function getDailyInsights(input: DailyInsightsInput): Promise<DailyInsightsOutput> {
  return dailyInsightsFlow(input);
}

const dailyInsightsPrompt = ai.definePrompt({
  name: 'dailyInsightsPrompt',
  // Model will be inherited from the ai object in genkit.ts
  input: { schema: DailyInsightsInputSchema },
  output: { schema: DailyInsightsOutputSchema },
  prompt: `Analyze the user's daily food log and symptoms.
Output a JSON object strictly matching 'DailyInsightsOutputSchema'.

Data:
Food Log: {{{foodLog}}}
Symptoms: {{{symptoms}}}


Instructions:
- 'triggerInsights': Identify potential trigger foods or high-risk meals.

- 'overallSummary': Provide a brief general overview of the day.
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
      const { output } = await dailyInsightsPrompt(input);

      if (!output) {
        console.warn('[DailyInsightsFlow] System computation returned no output. Falling back to default error response.');
        return defaultErrorOutput;
      }
      return output;

    } catch (error: any) {
      console.error('[DailyInsightsFlow] Error during AI processing:', error);
      const modelNotFoundError = error.message?.includes("NOT_FOUND") || error.message?.includes("model not found");
      let specificSummaryMessage = `Error during daily insights analysis: ${error.message || 'Unknown error'}.`;
      if (modelNotFoundError) {
        specificSummaryMessage = "Analysis failed: The configured model is not accessible. Please check API key and project settings.";
      }

      return {
        ...defaultErrorOutput,
        overallSummary: specificSummaryMessage,
      };
    }
  }
);
