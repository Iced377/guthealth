
'use server';

/**
 * @fileOverview This file defines the user recommendations flow, which generates helpful tips and insights for the user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const UserRecommendationInputSchema = z.object({
  userId: z.string().optional().describe("User ID for potential future personalization."),
  requestType: z.enum(['general_wellness', 'diet_tip', 'activity_nudge', 'mindfulness_reminder']).optional().describe("The type of recommendation requested, to ensure variety."),
  recentFoodLogSummary: z.string().optional().describe("A brief summary of recently logged food items, e.g., 'Logged 3 meals, 1 high FODMAP.' or 'User has logged several items today.'"),
  recentSymptomSummary: z.string().optional().describe("A brief summary of recently logged symptoms, e.g., 'Reported bloating twice recently.' or 'No symptoms reported today.'"),
  dietaryPreferences: z.array(z.string()).optional().describe("List of user's dietary preferences, e.g., ['Keto', 'Vegan']."),
});
export type UserRecommendationInput = z.infer<typeof UserRecommendationInputSchema>;

const UserRecommendationOutputSchema = z.object({
  recommendationText: z.string().describe('A short, actionable, and insightful recommendation or tip for the user.'),
});
export type UserRecommendationOutput = z.infer<typeof UserRecommendationOutputSchema>;

const defaultErrorOutput: UserRecommendationOutput = {
  recommendationText: "Could not generate a recommendation at this time. Keep logging to get personalized tips!",
};

export async function getUserRecommendation(input: UserRecommendationInput): Promise<UserRecommendationOutput> {
  return userRecommendationFlow(input);
}

const userRecommendationPrompt = ai.definePrompt({
  name: 'userRecommendationPrompt',
  // Model is inherited from genkit.ts
  input: { schema: UserRecommendationInputSchema },
  output: { schema: UserRecommendationOutputSchema },
  prompt: `Generate a short (1-2 sentences), friendly, actionable wellness recommendation.
Output JSON matching UserRecommendationOutputSchema.

Context (use if relevant, omit if not applicable or empty):
{{#if recentFoodLogSummary}}Food activity: {{{recentFoodLogSummary}}}{{/if}}
{{#if recentSymptomSummary}}Symptoms: {{{recentSymptomSummary}}}{{/if}}
{{#if dietaryPreferences}}Diet Preferences: {{#each dietaryPreferences}}{{.}}, {{/each}}{{/if}}
{{#if requestType}}Requested type: {{{requestType}}}{{/if}}

Guidelines:
1. If context (food/symptoms) is given, make tip subtly relevant, especially if matching 'requestType'.
   - E.g., High sugar snack + 'diet_tip' -> "For sustained energy, try fruit and nuts instead of a sugary snack."
   - E.g., Bloating + 'general_wellness' -> "Feeling bloated? Slowing your eating pace might help."
   - If 'dietaryPreferences' are present, align suggestions accordingly (e.g., suggest keto-friendly snacks if Keto).
2. Prioritize 'requestType' if provided:
   - 'general_wellness': Hydration, sleep, stress. (E.g., "Aim for 7-8 hours of sleep for better well-being.")
   - 'diet_tip': Nutrition advice. (E.g., "Varied colorful veggies boost nutrients.")
   - 'activity_nudge': Encourage activity. (E.g., "A 10-min walk can lift mood & energy.")
   - 'mindfulness_reminder': Stress relief. (E.g., "Overwhelmed? A minute of focused breathing can re-center you.")
3. No strong context/request? Provide a general wellness tip. (E.g., "Stay hydrated for energy and digestion.")
4. Be positive, encouraging, and actionable. Avoid being preachy.
Ensure the output is only the 'recommendationText' field's value.
`,
});

const userRecommendationFlow = ai.defineFlow(
  {
    name: 'userRecommendationFlow',
    inputSchema: UserRecommendationInputSchema,
    outputSchema: UserRecommendationOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await userRecommendationPrompt(input);
      if (!output || !output.recommendationText) {
        console.warn('[UserRecommendationFlow] AI prompt returned no or invalid output. Falling back to default error response.');
        return defaultErrorOutput;
      }
      return output;
    } catch (error: any) {
      console.error('[UserRecommendationFlow] Error during AI processing:', error);
      return {
        ...defaultErrorOutput,
        recommendationText: `Could not generate a recommendation: ${error.message || 'Unknown error'}. Keep logging for future tips!`,
      };
    }
  }
);
