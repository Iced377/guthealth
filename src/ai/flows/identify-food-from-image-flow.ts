
'use server';
/**
 * @fileOverview Identifies food items, ingredients, and estimates portions from an image.
 *
 * - identifyFoodFromImage - Processes an image to identify food details.
 * - IdentifyFoodFromImageInput - Input schema for the flow.
 * - IdentifyFoodFromImageOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IdentifyFoodFromImageInputSchema = z.object({
  imageDataUri: z.string().describe(
    "A photo of a food item or packaging, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
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
  model: 'googleai/gemini-pro-vision', 
  input: { schema: IdentifyFoodFromImageInputSchema },
  output: { schema: IdentifyFoodFromImageOutputSchema },
  config: {
    temperature: 0.2, // Set low temperature for consistent identification
  },
  prompt: `You are an expert food identification AI. Analyze the provided image and respond strictly according to the IdentifyFoodFromImageOutputSchema.
User's locale (optional, for context): {{{userLocale}}}
Image: {{media url=imageDataUri}}

Your tasks:
1.  **'identifiedFoodName'**: Identify the primary food item. If packaged, the product name. If a dish, its name. For ambiguous cooking (e.g., eggs), use general terms ('cooked eggs') unless method is obvious.
2.  **'identifiedIngredients'**: Provide a comma-separated list of main ingredients.
    *   **CRITICAL FOR SUPPLEMENTS/LABELS**: If OCR detects specific nutrient quantities (e.g., "Vitamin D3 50000 IU", "Iron 10mg"), these exact strings MUST be included in 'identifiedIngredients'. Do not alter or omit these OCR'd quantities.
    *   For dishes, list common ingredients.
3.  **'estimatedPortionSize' & 'estimatedPortionUnit'**: Provide rough estimates.
    *   For multiple distinct, countable items (e.g., 4 eggs), use count for 'estimatedPortionSize' ("4") and item type for 'estimatedPortionUnit' ("eggs").
    *   Otherwise, use general estimates (e.g., "1", "100" for size; "serving", "g", "piece", "item" for unit). Be generic if unsure.
4.  **'ocrText'**: Extract all visible text using OCR.
5.  **'recognitionSuccess'**: Set to true if 'identifiedFoodName' and 'identifiedIngredients' are confidently identified for form pre-filling. Otherwise, false.
6.  **'errorMessage'**: If 'recognitionSuccess' is false or issues arise, briefly explain.

Prioritize practical values for form pre-filling. If image is unclear or not food, set 'recognitionSuccess' to false and provide an 'errorMessage'.

Examples:
- Picture of four cooked eggs:
  identifiedFoodName: "Cooked Eggs"
  identifiedIngredients: "Eggs"
  estimatedPortionSize: "4"
  estimatedPortionUnit: "eggs"
  recognitionSuccess: true

- Picture of a can of "Campbell's Chicken Noodle Soup":
  identifiedFoodName: "Campbell's Chicken Noodle Soup"
  identifiedIngredients: "Chicken stock, enriched egg noodles, chicken meat, water, salt, modified food starch, chicken fat, monosodium glutamate, dehydrated chicken broth, flavoring, beta carotene, dehydrated garlic, dehydrated onions" (or summarized if OCR'd)
  estimatedPortionSize: "1"
  estimatedPortionUnit: "can"
  ocrText: "Campbell's Chicken Noodle Soup..."
  recognitionSuccess: true

- Supplement label showing "Vitamin D3 50,000 IU" and "Calcium 200mg":
  identifiedFoodName: "Vitamin Supplement" (or product name if visible)
  identifiedIngredients: "Vitamin D3 50,000 IU, Calcium 200mg, other ingredients..." (ensure exact OCR'd quantities are preserved)
  estimatedPortionSize: "1"
  estimatedPortionUnit: "capsule" (or as seen on label)
  ocrText: "Supplement Facts Vitamin D3 50,000 IU Calcium 200mg..."
  recognitionSuccess: true

- Blurry image:
  recognitionSuccess: false
  errorMessage: "Image is too blurry to identify food."
`,
});

const defaultErrorOutput: IdentifyFoodFromImageOutput = {
    identifiedFoodName: undefined,
    identifiedIngredients: undefined,
    estimatedPortionSize: undefined,
    estimatedPortionUnit: undefined,
    ocrText: undefined,
    recognitionSuccess: false,
    errorMessage: 'AI processing failed to return an output.',
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
    } catch(err: any) {
      console.error("[IdentifyFoodByPhotoFlow] Error during AI processing:", err);
      return {
        ...defaultErrorOutput,
        errorMessage: `AI analysis error: ${err.message || 'Unknown error.'}`
      }
    }
  }
);
