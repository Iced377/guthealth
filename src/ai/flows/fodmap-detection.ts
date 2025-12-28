
'use server';
/**
 * @fileOverview This file contains the Genkit flow for FODMAP detection in food items, considering portion sizes,
 * and also estimates calorie, macronutrient content, Glycemic Index, Fiber, Micronutrients, Gut Bacteria Impact,
 * Keto Friendliness, and detects common allergens, providing textual summaries.
 *
 * - analyzeFoodItem - Analyzes a food item for FODMAPs and various health indicators.
 * - AnalyzeFoodItemInput - The input type for the analyzeFoodItem function.
 * - AnalyzeFoodItemOutput - The return type for the analyzeFoodItem function. (Now ExtendedAnalyzeFoodItemOutput from types)
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ExtendedAnalyzeFoodItemOutput as AnalyzeFoodItemOutput } from '@/types'; // Import the extended type

const DetailedFoodFODMAPProfileSchema = z.object({
  fructans: z.number().optional().describe('Estimated Fructans content in the given portion (e.g., in grams or a relative scale 0-10).'),
  galactans: z.number().optional().describe('Estimated Galactans (GOS) content in the given portion.'),
  polyolsSorbitol: z.number().optional().describe('Estimated Sorbitol content in the given portion.'),
  polyolsMannitol: z.number().optional().describe('Estimated Mannitol content in the given portion.'),
  lactose: z.number().optional().describe('Estimated Lactose content in the given portion.'),
  fructose: z.number().optional().describe('Estimated excess Fructose content in the given portion.'),
  totalOligos: z.number().optional().describe('Total Oligosaccharides (Fructans + GOS).'),
  totalPolyols: z.number().optional().describe('Total Polyols (Sorbitol + Mannitol).'),
}).describe("A detailed, estimated FODMAP profile for the specified food item and portion. Values represent amounts or relative levels. This profile should be based on reliable data sources if possible, considering the portion size.");

export type FoodFODMAPProfile = z.infer<typeof DetailedFoodFODMAPProfileSchema>;


const AnalyzeFoodItemInputSchema = z.object({
  foodItem: z.string().describe('The name of the food item to analyze. This may include quantities, e.g., "4 eggs and 2 slices of toast".'),
  ingredients: z.string().describe('A comma-separated list of ingredients in the food item.'),
  portionSize: z.string().describe('The size of the portion, e.g., "100", "0.5", "1". This refers to the overall meal portion if foodItem is complex.'),
  portionUnit: z.string().describe('The unit for the portion, e.g., "g", "cup", "medium apple", "meal". This refers to the overall meal portion unit.'),
});
export type AnalyzeFoodItemInput = z.infer<typeof AnalyzeFoodItemInputSchema>;

const FodmapScoreSchema = z.enum(['Green', 'Yellow', 'Red']);
export type FodmapScore = z.infer<typeof FodmapScoreSchema>;

const IngredientScoreSchema = z.object({
  ingredient: z.string().describe("The name of the ingredient."),
  score: FodmapScoreSchema.describe("The FODMAP score for this ingredient (Green, Yellow, or Red) considering its likely amount in the overall portion."),
  reason: z.string().optional().describe("Brief reason for the ingredient's score, especially if Yellow or Red.")
});

// New schemas for additional health indicators
const GlycemicIndexInfoSchema = z.object({
  value: z.number().optional().describe("Estimated Glycemic Index (GI) value of the food item per serving. Provide if known from common food databases."),
  level: z.enum(['Low', 'Medium', 'High', 'Unknown']).optional().describe("Categorical GI level (Low: <=55, Medium: 56-69, High: >=70, Unknown) based on the GI value and portion.")
}).describe("Information about the food item's estimated Glycemic Index.");

const DietaryFiberInfoSchema = z.object({
  amountGrams: z.number().optional().describe("Estimated total dietary fiber in grams for the given portion."),
  quality: z.enum(['Low', 'Adequate', 'High']).optional().describe("Qualitative assessment of fiber content (Low, Adequate, High) for the portion based on general dietary recommendations (e.g., a few grams is low, 5-7g is adequate, >7g is high for a single item).")
}).describe("Information about the food item's estimated dietary fiber content.");

const MicronutrientDetailSchema = z.object({
  name: z.string().describe("Name of the micronutrient, e.g., 'Iron', 'Vitamin C', 'Calcium', 'Potassium', 'Magnesium', 'Vitamin B12', 'Vitamin D3', 'Omega-3', 'EPA', 'DHA'."),
  amount: z.string().optional().describe("Estimated amount of the micronutrient in the portion, with units (e.g., '10 mg', '90 mcg', '50000 IU', 'Omega-3 800mg (480 EPA, 320 DHA)'). If the user input specified a quantity (e.g., 'Vitamin D3 50000 IU', 'Omega-3 800mg (480 EPA, 320 DHA)'), YOU MUST use that exact user-provided string or the correctly summed/transcribed value here (e.g., '50000 IU' for D3, or '800 mg' for Omega-3 if it's a sum of EPA/DHA). DO NOT use vague phrases like 'Varies, check label' or 'Varies by dose' if the user provided a specific quantity."),
  dailyValuePercent: z.number().optional().describe("Estimated percentage of Daily Value (%DV) for the micronutrient, if applicable and known for an average adult. If a specific amount was provided by the user (e.g. '50000 IU Vitamin D3') and you cannot confidently convert this to %DV, omit this field or set to null."),
  iconName: z.string().optional().describe("A suggested relevant lucide-react icon name based on the nutrient's primary **supported body part or physiological function**. Examples: 'Bone' for Calcium or Phosphorus, 'Activity' for Magnesium (muscle/nerve function), 'PersonStanding' for Zinc (growth), 'Eye' for Vitamin A, 'ShieldCheck' for Vitamin C & D (immune support), 'Droplet' for Potassium & Sodium (electrolyte balance), 'Wind' for Iron (oxygen transport), 'Brain' for B12 & Iodine, 'Baby' for Folate (development), 'Heart' for Vitamin K, Omega-3, EPA, DHA (cardiovascular support). Use generic names like 'Atom' or 'Sparkles' if a specific, intuitive functional icon is not available. If no good icon, omit."),
}).describe("Details for a specific micronutrient.");

const MicronutrientsInfoSchema = z.object({
  notable: z.array(MicronutrientDetailSchema).optional().describe("Up to 3-5 most notable or abundant micronutrients in the food item for the given portion, OR THOSE EXPLICITLY MENTIONED BY THE USER WITH QUANTITIES. User-specified nutrients (like 'D3 50,000 IU', 'Omega-3 800mg (480 EPA, 320 DHA)') MUST appear here with their user-specified amounts."),
  fullList: z.array(MicronutrientDetailSchema).optional().describe("Optionally, a more comprehensive list of micronutrients if readily available and concise, including any user-specified nutrients. Any user-specified nutrient with a quantity MUST be accurately represented here, including specific forms like EPA and DHA if detailed by the user."),
}).describe("Overview of key micronutrients in the food item.");

const GutBacteriaImpactInfoSchema = z.object({
  sentiment: z.enum(['Positive', 'Negative', 'Neutral', 'Unknown']).optional().describe("Estimated general impact on gut bacteria diversity or balance (Positive, Negative, Neutral, Unknown). Consider prebiotics, probiotics, processed ingredients, etc."),
  reasoning: z.string().optional().describe("Short reasoning for the estimated gut bacteria impact (e.g., 'Contains prebiotic fiber', 'High in processed sugars, may negatively impact diversity', 'Contains probiotics')."),
}).describe("Estimated impact of the food item on gut bacteria.");

const KetoFriendlinessInfoSchema = z.object({
    score: z.enum(['Strict Keto', 'Moderate Keto', 'Low Carb', 'Not Keto-Friendly', 'Unknown']).describe("Assessment of the food's suitability for a ketogenic diet for the given portion."),
    reasoning: z.string().optional().describe("Brief explanation for the keto score (e.g., 'High in net carbs due to X', 'Low carb, suitable for keto in moderation', 'Mainly fats and protein, good for keto')."),
    estimatedNetCarbs: z.number().optional().describe("Optional estimated net carbs in grams for the portion, if calculable (Total Carbs - Fiber).")
}).describe("Information about the food item's keto-friendliness.");

const AISummariesSchema = z.object({
  fodmapSummary: z.string().optional().describe("Optional concise summary of FODMAP analysis if the main 'reason' is very detailed. E.g., 'Mainly low FODMAP but watch portion of X'."),
  micronutrientSummary: z.string().optional().describe("Brief (1-2 sentence) textual summary of key micronutrients. E.g., 'Good source of Vitamin C and Iron.' or 'Notable for Calcium content.' If specific user-provided nutrients like '50,000 IU D3' or 'Omega-3 800mg (EPA/DHA)' were included, acknowledge these if they are significant (e.g., 'Primarily a high dose Vitamin D3 supplement as specified.' or 'Contains specified amounts of Omega-3 fatty acids EPA and DHA.')."),
  glycemicIndexSummary: z.string().optional().describe("Brief (1 sentence) textual summary of glycemic impact. E.g., 'Likely has a low glycemic impact based on its ingredients.'"),
  gutImpactSummary: z.string().optional().describe("Optional concise summary of gut bacteria impact if 'gutBacteriaImpact.reasoning' is detailed."),
  ketoSummary: z.string().optional().describe("Brief (1-2 sentence) textual summary of keto-friendliness. E.g., 'Appears suitable for a strict keto diet.' or 'Too high in carbs for keto.'"),
}).describe("Additional concise textual summaries for display in an 'AI Notes' section.");

const AnalyzeFoodItemOutputSchema = z.object({
  ingredientFodmapScores: z.array(IngredientScoreSchema).describe('A list of ingredients and their FODMAP scores, adjusted for the overall portion.'),
  overallRisk: FodmapScoreSchema.describe('The overall FODMAP risk level of the food item for the specified portion (Green, Yellow, or Red).'),
  reason: z.string().describe('Explanation of why the food item has the assigned risk level for the given portion. Mention key ingredients and portion impact.'),
  detailedFodmapProfile: DetailedFoodFODMAPProfileSchema.optional().describe("An estimated detailed FODMAP profile for the given portion of the food item."),
  calories: z.number().optional().describe('Estimated total calories for the given portion.'),
  protein: z.number().optional().describe('Estimated total protein in grams for the given portion.'),
  carbs: z.number().optional().describe('Estimated total carbohydrates in grams for the given portion.'),
  fat: z.number().optional().describe('Estimated total fat in grams for the given portion.'),
  glycemicIndexInfo: GlycemicIndexInfoSchema.optional().describe("Glycemic Index information."),
  dietaryFiberInfo: DietaryFiberInfoSchema.optional().describe("Dietary fiber information."),
  micronutrientsInfo: MicronutrientsInfoSchema.optional().describe("Micronutrients overview."),
  gutBacteriaImpact: GutBacteriaImpactInfoSchema.optional().describe("Gut bacteria impact assessment."),
  ketoFriendliness: KetoFriendlinessInfoSchema.optional().describe("Keto-friendliness assessment."),
  detectedAllergens: z.array(z.string()).optional().describe("List of common allergens detected in the ingredients (e.g., Milk, Wheat, Soy). If none, can be empty or omitted."),
  aiSummaries: AISummariesSchema.optional().describe("Concise AI-generated textual summaries for display in notes."),
});

const defaultErrorOutput: AnalyzeFoodItemOutput = {
  ingredientFodmapScores: [],
  overallRisk: 'Red',
  reason: 'AI analysis failed to complete. Please try again or check your input.',
  detailedFodmapProfile: undefined,
  calories: undefined,
  protein: undefined,
  carbs: undefined,
  fat: undefined,
  glycemicIndexInfo: { level: 'Unknown' },
  dietaryFiberInfo: { quality: 'Low' },
  micronutrientsInfo: { notable: [{ name: "Error", amount: "Analysis incomplete" }] },
  gutBacteriaImpact: { sentiment: 'Unknown', reasoning: 'Analysis incomplete.' },
  ketoFriendliness: { score: 'Unknown', reasoning: 'Analysis incomplete.' },
  detectedAllergens: [],
  aiSummaries: {
    fodmapSummary: 'Analysis failed.',
    micronutrientSummary: 'Analysis failed.',
    glycemicIndexSummary: 'Analysis failed.',
    gutImpactSummary: 'Analysis failed.',
    ketoSummary: 'Analysis failed.'
  },
};


export async function analyzeFoodItem(input: AnalyzeFoodItemInput): Promise<AnalyzeFoodItemOutput> {
  return analyzeFoodItemFlow(input);
}

const analyzeFoodItemPrompt = ai.definePrompt({
  name: 'analyzeFoodItemPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: {schema: AnalyzeFoodItemInputSchema},
  output: {schema: AnalyzeFoodItemOutputSchema},
  config: {
    temperature: 0.2,
  },
  prompt: `You are an expert AI for comprehensive, portion-aware food analysis for IBS users.
Input: Food: '{{{foodItem}}}', Ingredients: '{{{ingredients}}}', Portion: '{{{portionSize}}} {{{portionUnit}}}'.
Output a JSON object strictly adhering to 'AnalyzeFoodItemOutputSchema'.

Key tasks:
1.  **Portion-Specific Analysis:** All analyses for '{{{portionSize}}} {{{portionUnit}}}'.
    *   FODMAPs: For each ingredient in '{{{ingredients}}}', assess FODMAP content relative to the meal portion. Output 'overallRisk', 'reason', and if possible, 'detailedFodmapProfile'.

2.  **Quantity-Aware Nutrition (Calories, Macros, Micronutrients):**
    *   Prioritize quantities in '{{{foodItem}}}' (e.g., "4 eggs") for component nutrition.
    *   '{{{portionSize}}} {{{portionUnit}}}' applies to the whole meal or components without specific quantities.
    *   For composite/branded items (e.g., "Sausage McMuffin with Egg, 1 hashbrown"), use general knowledge and estimate additions.
    *   Ensure final 'calories', 'protein', 'carbs', 'fat', and 'micronutrientsInfo' sum all components accurately.

3.  **Micronutrients ('micronutrientsInfo'):**
    *   User-Specified (from Ingredients): If '{{{ingredients}}}' contains nutrients with quantities (e.g., "Vitamin D3 50,000 IU", "B6 7mg", "B6 10.5mg", "Omega-3 800mg (480 EPA, 320 DHA)"), accurately transcribe these. If multiple entries for the SAME nutrient with compatible units (e.g., all mg or all mcg for B6) are found, sum them into a single 'MicronutrientDetailSchema.amount' string (e.g., "17.5 mg for B6" from the example). For complex entries like "Omega-3 800mg (480 EPA, 320 DHA)", you can list "Omega-3" with "800mg" and also "EPA" with "480mg" and "DHA" with "320mg" as separate 'MicronutrientDetail' entries if simpler, or a single "Omega-3" entry showing "800mg (480 EPA, 320 DHA)" as the amount. Ensure the 'amount' string reflects the quantity and unit from the input. Calculate 'dailyValuePercent' only if confident.
    *   Estimate key micronutrients for foods/quantities in '{{{foodItem}}}'.
    *   Suggest 'iconName' based on nutrient function per schema.

4.  **Other Health Indicators (Portion-Specific):**
    *   'glycemicIndexInfo': Estimate value and level.
    *   'dietaryFiberInfo': Estimate grams and quality.
    *   'gutBacteriaImpact': Estimate sentiment and 'reasoning'.
    *   'ketoFriendliness': Assess score, 'reasoning', and optional 'estimatedNetCarbs'.
    *   'detectedAllergens': List common allergens from '{{{ingredients}}}'.

5.  **AI Summaries ('aiSummaries'):** Concise textual summaries for each category. Acknowledge significant user-specified high-dose supplements or specific Omega-3 details.

Strictly follow output schema. Omit/default optional sub-fields if not estimable. Ensure nutrition reflects quantities in '{{{foodItem}}}', scaled to '{{{portionSize}}} {{{portionUnit}}}'.
`,
});

const analyzeFoodItemFlow = ai.defineFlow(
  {
    name: 'analyzeFoodItemFlow',
    inputSchema: AnalyzeFoodItemInputSchema,
    outputSchema: AnalyzeFoodItemOutputSchema,
  },
  async (input): Promise<AnalyzeFoodItemOutput> => {
    try {
      const {output} = await analyzeFoodItemPrompt(input);
      if (!output) {
        console.warn('[AnalyzeFoodItemFlow] AI prompt returned no output. Falling back to default error response.');
        return {
          ...defaultErrorOutput,
          reason: `AI analysis failed for item: "${input.foodItem}". No output from prompt.`,
          aiSummaries: {
            fodmapSummary: `FODMAP analysis failed for "${input.foodItem}".`,
            micronutrientSummary: `Micronutrient analysis failed for "${input.foodItem}".`,
            glycemicIndexSummary: `Glycemic Index analysis failed for "${input.foodItem}".`,
            gutImpactSummary: `Gut Impact analysis failed for "${input.foodItem}".`,
            ketoSummary: `Keto analysis failed for "${input.foodItem}".`,
          }
        };
      }
      return output! as AnalyzeFoodItemOutput;
    } catch (error: any) {
      console.error('[AnalyzeFoodItemFlow] Error during AI processing:', error);
      const errorMessage = error.message || 'Unknown error';
      const modelNotFoundError = errorMessage.includes("NOT_FOUND") || errorMessage.includes("Model not found") || errorMessage.includes("model"); // Broader check for model-related errors
      
      let specificSummaryMessage: string;
      if (modelNotFoundError) {
        specificSummaryMessage = "AI Model not accessible. Please check configuration or model name specified in the flow.";
      } else {
        specificSummaryMessage = `Analysis error: ${errorMessage}`;
      }

      return {
        ...defaultErrorOutput,
        reason: `Error during AI analysis for "${input.foodItem}": ${errorMessage}.`,
        aiSummaries: {
            fodmapSummary: `FODMAP: ${specificSummaryMessage}`,
            micronutrientSummary: `Micronutrients: ${specificSummaryMessage}`,
            glycemicIndexSummary: `Glycemic Index: ${specificSummaryMessage}`,
            gutImpactSummary: `Gut Impact: ${specificSummaryMessage}`,
            ketoSummary: `Keto: ${specificSummaryMessage}`,
        }
      };
    }
  }
);

export type { FoodFODMAPProfile as DetailedFodmapProfileFromAI };
