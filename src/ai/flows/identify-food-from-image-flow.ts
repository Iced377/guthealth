
'use server';
/**
 * @fileOverview Identifies food items, ingredients, and estimates portions from an image.
 *
 * - identifyFoodFromImage - Processes an image to identify food details.
 * - IdentifyFoodFromImageInput - Input schema for the flow.
 * - IdentifyFoodFromImageOutput - Output schema for the flow.
 */

import { ai, DEFAULT_AI_MODEL } from '@/ai/genkit';
import { z } from 'genkit';

const IdentifyFoodFromImageInputSchema = z.object({
  imageDataUri: z.string().describe(
    "A photo of a food item or packaging, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  additionalContext: z.string().optional().describe("User provided context about the meal (e.g., 'gluten free pasta', 'homemade lasagna with extra cheese'). This is a STRONG HINT. Treat it as source of truth ONLY if it explicitly asserts identity (e.g., 'this is X', 'these are X')."),
  userLocale: z.string().optional().describe("User's locale, e.g., 'en-US', to help with units and food names if possible."),
});
export type IdentifyFoodFromImageInput = z.infer<typeof IdentifyFoodFromImageInputSchema>;

const IdentifyFoodFromImageOutputSchema = z.object({
  identifiedFoodName: z.string().optional().describe('The most likely name of the food item identified from the image. Could be a product name or a dish name. This will be used to populate the "Food Name" field.'),
  identifiedIngredients: z.string().optional().describe('A comma-separated list of ingredients identified or inferred from the image (e.g., from packaging text or visual cues). This will populate the "Ingredients" field. If specific nutrient quantities like "Vitamin D3 50000 IU" are OCRd from a supplement label, they MUST be included here exactly as OCRd.'),
  estimatedPortionSize: z.string().optional().describe('A rough estimate of the portion size number (e.g., "1", "100", "0.5", "4" if four distinct items like eggs are counted). This is highly approximate.'),
  estimatedPortionUnit: z.string().optional().describe('A rough estimate of the portion unit (e.g., "serving", "g", "ml", "item", "eggs", "slices"). This is highly approximate.'),
  ocrText: z.string().optional().describe('Any visible text extracted via OCR from the image, for informational purposes or debugging.'),
  recognitionSuccess: z.boolean().describe('Whether the AI was able to confidently identify a food item and its details suitable for form population.'),
  errorMessage: z.string().optional().describe('An error message if identification failed or was problematic.'),
});
export type IdentifyFoodFromImageOutput = z.infer<typeof IdentifyFoodFromImageOutputSchema>;

export async function identifyFoodFromImage(input: IdentifyFoodFromImageInput): Promise<IdentifyFoodFromImageOutput> {
  return identifyFoodFromImageFlow(input);
}

const identifyFoodPrompt = ai.definePrompt({
  name: 'identifyFoodFromImagePrompt',
  model: DEFAULT_AI_MODEL,
  input: { schema: IdentifyFoodFromImageInputSchema },
  output: { schema: IdentifyFoodFromImageOutputSchema },
  config: {
    temperature: 0.2, // Set low temperature for consistent identification
  },
  prompt: `You are an expert food identification AI. Analyze the provided image and respond strictly according to the IdentifyFoodFromImageOutputSchema.
User's locale (optional, for context): {{{userLocale}}}
User's Additional Context: "{{{additionalContext}}}"
Image: {{media url=imageDataUri}}

Your tasks:
IMPORTANT CONTEXT GATING:
* Use Additional Context as a STRONG HINT, not a source of truth by default.
* Only treat it as definitive if it explicitly asserts identity, e.g. "this is X", "these are X", "I ate X", "it's X".
* If context conflicts with what the image clearly shows, prefer the image unless the context explicitly asserts identity.
* Do NOT blend unrelated context into the image. If context is vague, keep identification image-based.

1.  **'identifiedFoodName'**: Identify the primary food item.
    *   **NOUN ONLY**: Output the food name ONLY (e.g. "Chocolate Brownie").
    *   **NO QUANTITIES**: Do NOT include portion sizes here (i.e. NOT "Half a brownie", NOT "2 Eggs").
    *   **CONTEXT AS HINT**: If the user's "Additional Context" explicitly asserts identity, USE THAT NAME (but strip quantities). Otherwise, use the image as primary.

2.  **'identifiedIngredients'**: Provide a comma-separated list of main ingredients.
    *   **CRITICAL - VISUAL QUANTITY ESTIMATION**: You **MUST** include an estimated quantity in round brackets next to each ingredient where possible. Example: "Rice (200g), Chicken Breast (150g), Broccoli (80g)".
    *   **CONTEXT USAGE**: If the user specifies a dietary/ingredient base (e.g., "keto dough", "gluten-free bun", "almond flour crust"), REWRITE the relevant base ingredient accordingly, even if the image alone is ambiguous.
        - Example: Image shows pizza + context "keto dough" -> ingredients should include "keto dough" or "almond flour crust" instead of standard wheat dough.
    *   **CONTEXT USAGE (BEVERAGE OVERRIDES)**: If the user specifies a beverage variant or substitution (e.g., "Coke Zero", "Diet Coke", "sparkling water"), REWRITE the drink ingredient accordingly, even if the image shows a generic soda cup.
    *   **SUPPLEMENTS/LABELS**: If OCR detects nutrient quantities (e.g., "Vitamin D3 50,000 IU"), they MUST be included exactly as written.

3.  **'estimatedPortionSize' & 'estimatedPortionUnit'**: Provide the total estimate.
    *   Use context if provided (e.g. user says "half bowl").
    *   For countable items (e.g., 4 eggs), use "4" and "eggs".
    *   Otherwise, estimate the *entire* visible portion (e.g. "1" "plate", "400" "g").

4.  **'ocrText'**: Extract all visible text using OCR.
5.  **'recognitionSuccess'**: True if identified.
6.  **'errorMessage'**: If failed.

Prioritize practical values for form pre-filling. If image is unclear or not food, set 'recognitionSuccess' to false.

Examples:
- User Context: "My morning omelet"
  Image: Plate with eggs and spinach.
  identifiedFoodName: "Morning Omelet"
  identifiedIngredients: "Eggs (3 large), Spinach (50g), Cheese (30g)"
  estimatedPortionSize: "1"
  estimatedPortionUnit: "omelet"
  recognitionSuccess: true

- Picture of supplement label:
  identifiedFoodName: "Vitamin Supplement" 
  identifiedIngredients: "Vitamin D3 50,000 IU, Calcium 200mg"
  identifiedIngredients: "Vitamin D3 50,000 IU, Calcium 200mg"
  recognitionSuccess: true

SAFETY GUARDRAIL: Output MUST be appropriate for a general audience. Strictly avoid profanity, crude humor, or offensive language in 'identifiedFoodName' or other fields. If the image is offensive, set 'recognitionSuccess' to false and provide a polite 'errorMessage'.`,
});

const defaultErrorOutput: IdentifyFoodFromImageOutput = {
  identifiedFoodName: undefined,
  identifiedIngredients: undefined,
  estimatedPortionSize: undefined,
  estimatedPortionUnit: undefined,
  ocrText: undefined,
  recognitionSuccess: false,
  errorMessage: 'Analysis failed to return an output.',
};

const identifyFoodFromImageFlow = ai.defineFlow(
  {
    name: 'identifyFoodFromImageFlow',
    inputSchema: IdentifyFoodFromImageInputSchema,
    outputSchema: IdentifyFoodFromImageOutputSchema,
  },
  async (input): Promise<IdentifyFoodFromImageOutput> => {
    try {
      const { output } = await identifyFoodPrompt(input);
      if (!output) {
        return defaultErrorOutput;
      }
      return output;
    } catch (err: any) {
      console.error("[IdentifyFoodByPhotoFlow] Error during AI processing:", err);
      return {
        ...defaultErrorOutput,
        errorMessage: `Analysis error: ${err.message || 'Unknown error.'}`
      }
    }
  }
);
