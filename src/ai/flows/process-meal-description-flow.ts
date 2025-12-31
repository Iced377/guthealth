
'use server';
/**
 * @fileOverview Processes a natural language meal description to extract structured food information
 * and generate a witty name. This flow is intended to be called before `analyzeFoodItem`.
 *
 * - processMealDescription - Processes the meal description.
 * - ProcessMealDescriptionInput - Input schema for the flow.
 * - ProcessMealDescriptionOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessMealDescriptionInputSchema = z.object({
  mealDescription: z.string().describe('A natural language description of the meal, including ingredients and their approximate portion sizes. Example: "A large bowl of oatmeal made with 1/2 cup of rolled oats, 1 cup of water, a handful of blueberries, and a drizzle of honey."'),
});
export type ProcessMealDescriptionInput = z.infer<typeof ProcessMealDescriptionInputSchema>;

const ProcessMealDescriptionOutputSchema = z.object({
  wittyName: z.string().describe('A witty, cheeky, or descriptive name for the meal, generated based on the input. MAX 21 CHARACTERS. Examples: "Greek Purity", "Mofo Chicken Wrap", "Midnight Mistake", "Crisp Sadness".'),
  primaryFoodItemForAnalysis: z.string().describe('The main identified food item or concept from the description, suitable as a "name" for a subsequent FODMAP analysis (e.g., "Oatmeal with blueberries"). This should be a relatively concise and factual summary of the meal. CRITICAL: If the user description includes quantities (e.g., "4 eggs", "50g toast") or distinct additions (e.g. "extra egg", "side of fries"), these MUST be preserved here.'),
  consolidatedIngredients: z.string().describe('A comma-separated list of all significant ingredients identified in the meal description (e.g., "rolled oats, water, blueberries, honey").'),
  estimatedPortionSize: z.string().describe('An estimated single, representative portion size number for the entire described meal (e.g., "1", "1.5", "200"). This is an approximation for overall analysis.'),
  estimatedPortionUnit: z.string().describe('The unit for the estimated portion size (e.g., "serving", "bowl", "plate", "g", "ml"). This accompanies the estimatedPortionSize.'),
});
export type ProcessMealDescriptionOutput = z.infer<typeof ProcessMealDescriptionOutputSchema>;

const defaultErrorOutput: ProcessMealDescriptionOutput = {
  wittyName: 'Analysis Failed',
  primaryFoodItemForAnalysis: 'Could not analyze description due to an error.',
  consolidatedIngredients: 'N/A',
  estimatedPortionSize: 'N/A',
  estimatedPortionUnit: 'N/A',
};

export async function processMealDescription(input: ProcessMealDescriptionInput): Promise<ProcessMealDescriptionOutput> {
  return processMealDescriptionFlow(input);
}

const processMealDescriptionGenkitPrompt = ai.definePrompt({
  name: 'processMealDescriptionPrompt',
  input: { schema: ProcessMealDescriptionInputSchema },
  output: { schema: ProcessMealDescriptionOutputSchema },
  config: {
    temperature: 0.5,
  },
  prompt: `You are an expert food analyst and a witty meal namer.
Analyze the meal description: "{{{mealDescription}}}"
Output a JSON object matching ProcessMealDescriptionOutputSchema.

Tasks:
1.  'wittyName': Generate a fun, memorable, or edgy name for the meal. MAX 21 CHARACTERS (including spaces). This is a HARD LIMIT. Keep it short and punchy.
    *   Examples of compliant names: "Greek Purity", "Mofo Chicken Wrap", "Berry-Good Fuel", "Sad Desk Salad", "Midnight Mistake".
    *   Do NOT exceed 21 characters.
2.  'primaryFoodItemForAnalysis': A concise, factual summary of the meal for subsequent nutritional analysis.
    *   CRITICAL: Accurately list ALL components and quantities from '{{{mealDescription}}}'.
    *   Preserve user-stated quantities and explicit additions (e.g., "Sausage McMuffin with egg, 1 extra egg, 1 hashbrown").
    *   Avoid duplicating components implied in standard item names (e.g., "Egg McMuffin" already includes an egg). Do not add an egg unless "extra egg" is stated.
    *   Example: "4 eggs and 50g toast" -> "4 eggs and 50g toast".
3.  'consolidatedIngredients': Comma-separated list of all significant ingredients.
4.  'estimatedPortionSize' & 'estimatedPortionUnit': Overall estimate for the entire meal.
    *   If description implies a standard single serving (e.g., "Big Mac meal"), use '1' and 'serving' or 'meal', unless explicitly multiple servings are stated.

Adhere strictly to the schema. For 'primaryFoodItemForAnalysis', be factual and preserve user quantities/additions.
`,
});


const processMealDescriptionFlow = ai.defineFlow(
  {
    name: 'processMealDescriptionFlow',
    inputSchema: ProcessMealDescriptionInputSchema,
    outputSchema: ProcessMealDescriptionOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await processMealDescriptionGenkitPrompt(input);
      if (!output) {
        console.warn('[ProcessMealDescriptionFlow] AI prompt returned no output. Falling back to default error response.');
        return {
          ...defaultErrorOutput,
          primaryFoodItemForAnalysis: `Could not analyze: "${input.mealDescription.substring(0, 50)}..."`,
        };
      }
      return output;
    } catch (error: any) {
      console.error('[ProcessMealDescriptionFlow] Error during AI processing:', error);
      return {
        ...defaultErrorOutput,
        primaryFoodItemForAnalysis: `Error analyzing: ${error.message || 'Unknown error'}. Input: "${input.mealDescription.substring(0, 50)}..."`,
      };
    }
  }
);
