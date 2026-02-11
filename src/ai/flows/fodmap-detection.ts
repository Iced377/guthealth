
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

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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


const SimilarityAnalysisSchema = z.object({
  isSimilar: z.boolean().describe('Indicates whether the current food item is similar to any of the user-defined safe foods, considering both FODMAP profile and portion context.'),
  similarityReason: z.string().optional().describe('Reasoning behind the similarity assessment. If similar, mention which safe food it resembles and why (e.g., "Similar to your safe intake of 1/2 cup rice due to low overall FODMAPs and comparable portion.").'),
}).describe("Assessment of similarity to user's safe foods.");

// Simplified safe food schema for prompt input
const SimpleSafeFoodSchema = z.object({
  name: z.string(),
  portionSize: z.string(),
  portionUnit: z.string(),
  fodmapProfile: z.any().describe('The safe food\'s FODMAP profile.'),
});

const AnalyzeFoodItemInputSchema = z.object({
  foodItem: z.string().describe('The name of the food item to analyze. This may include quantities, e.g., "4 eggs and 2 slices of toast".'),
  ingredients: z.string().describe('A comma-separated list of ingredients in the food item.'),
  portionSize: z.string().describe('The size of the portion, e.g., "100", "0.5", "1". This refers to the overall meal portion if foodItem is complex.'),
  portionUnit: z.string().describe('The unit for the portion, e.g., "g", "cup", "medium apple", "meal". This refers to the overall meal portion unit.'),
  additionalContext: z.string().optional().describe('User-provided context notes (e.g. "Gluten free", "Half portion"). THIS IS THE SOURCE OF TRUTH.'),
  userSafeFoodItems: z.array(SimpleSafeFoodSchema).optional().describe('Optional list of user safe foods to check for similarity.'),
  feedbackContext: z.string().optional().describe('Optional context about why a previous analysis was incorrect (from the Reflexion Critic).'),
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
  glycemicIndexInfo: GlycemicIndexInfoSchema.describe("Glycemic Index information."),
  dietaryFiberInfo: DietaryFiberInfoSchema.describe("Dietary fiber information."),
  gutBacteriaImpact: GutBacteriaImpactInfoSchema.describe("Gut bacteria impact assessment."),
  ketoFriendliness: KetoFriendlinessInfoSchema.describe("Keto-friendliness assessment."),
  detectedAllergens: z.array(z.string()).optional().describe("List of common allergens detected in the ingredients (e.g., Milk, Wheat, Soy). If none, can be empty or omitted."),
  aiSummaries: AISummariesSchema.optional().describe("Concise AI-generated textual summaries for display in notes."),
  similarityAnalysis: SimilarityAnalysisSchema.optional().describe("Analysis of whether this food is similar to the user's known safe foods."),
});

export type AnalyzeFoodItemOutput = z.infer<typeof AnalyzeFoodItemOutputSchema>;

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

  gutBacteriaImpact: { sentiment: 'Unknown', reasoning: 'Analysis incomplete.' },
  ketoFriendliness: { score: 'Unknown', reasoning: 'Analysis incomplete.' },
  detectedAllergens: [],
  aiSummaries: {
    fodmapSummary: 'Analysis failed.',

    glycemicIndexSummary: 'Analysis failed.',
    gutImpactSummary: 'Analysis failed.',
    ketoSummary: 'Analysis failed.'
  },
  similarityAnalysis: { isSimilar: false },
};

const analyzeFoodItemPrompt = ai.definePrompt({
  name: 'analyzeFoodItemPrompt',
  // Model is inherited from genkit.ts
  input: { schema: AnalyzeFoodItemInputSchema },
  output: { schema: AnalyzeFoodItemOutputSchema },
  config: {
    temperature: 0, // Deterministic results
  },
  prompt: `You are an expert AI for COMPREHENSIVE, PORTION-AWARE food analysis.
Input: Food: '{{{foodItem}}}', Ingredients: '{{{ingredients}}}', Portion: '{{{portionSize}}} {{{portionUnit}}}'.

USER CONTEXT (SOURCE OF TRUTH): "{{{additionalContext}}}"

User Safe Foods (Reference):
{{#if userSafeFoodItems.length}}
{{#each userSafeFoodItems}}
- Name: {{{this.name}}}, Portion: {{{this.portionSize}}} {{{this.portionUnit}}} (Profile provided in data)
{{/each}}
{{else}}
None
{{/if}}

{{#if feedbackContext}}
IMPORTANT CORRECTION INSTRUCTION:
The previous analysis for this item was flagged as incorrect.
Critique: "{{feedbackContext}}"
You MUST fix this error in your new analysis.
{{/if}}

Output a JSON object strictly adhering to 'AnalyzeFoodItemOutputSchema'.

Key tasks:
1.  **CONTEXT IS KING**: 
    - If 'USER CONTEXT' says "Gluten Free", "Vegan", or overrides ingredients, **TRUST THE CONTEXT**.
    - If 'USER CONTEXT' specifies a portion (e.g. "Half bowl", "2 bites"), **ADJUST EVERYTHING (Calories, FODMAPs)** to match that portion, overriding the 'Portion' input if they conflict.

2.  **QUANTITY-DRIVEN NUTRITION (CRITICAL)**:
    - **CHECK INGREDIENTS FOR QUANTITIES**: The 'Ingredients' input may contain quantities in brackets, e.g., "Rice (200g), Chicken (150g)". **YOU MUST USE THESE EXACT QUANTITIES** to calculate calories and macros.
    - If '{{{foodItem}}}' has quantities (e.g., "4 eggs"), use them.
    - Sum all components for final 'calories', 'protein', 'carbs', 'fat'.

3.  **Portion Sizing**:
    - If no explicit quantity is known, assume a **STANDARD SERVING** for the identified food (e.g. 1 medium bowl, 1 slice). Do NOT overestimate.

4.  **Other Health Indicators (STRICT LOGIC)**:
    - **Keto**: If ingredients contain "Sugar", "Cane Sugar", "Honey", "Maple Syrup", "Flour", "Rice", "Bread", "Pasta", or "Oats" -> 'ketoFriendliness.score' MUST be 'Not Keto-Friendly' (unless Context explicitly says "Keto Version").
    - **FODMAP**: If ingredients contain "Garlic", "Onion", "Wheat", "Milk" (unless lactose-free) -> Risk is likely 'Red'/'Yellow'.
    - Provide estimates for GI, Fiber, Gut Impact, and Allergens based on the *entire* portion.

5.  **AI Summaries (SPEED OPTIMIZATION)**:
    - Keep all text fields ('reason', 'aiSummaries.*') **EXTREMELY CONCISE** (max 1 short sentence). Avoid fluff.
    - Example: "High in fructans due to garlic." (Not "This item is high in fructans because it contains garlic which is...")

Strictly follow output schema. Always include Glycemic Index, Fiber, Gut Impact, and Keto fields; if unknown, set their values to "Unknown" or leave numeric fields empty. Ensure nutrition matches the explicit quantities provided in inputs.
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
      const { output } = await analyzeFoodItemPrompt(input);
      if (!output) {
        console.warn('[AnalyzeFoodItemFlow] AI prompt returned no output. Falling back to default error response.');
        return {
          ...defaultErrorOutput,
          reason: `Analysis failed for item: "${input.foodItem}". No output from prompt.`,
          aiSummaries: {
            ...defaultErrorOutput.aiSummaries,
            fodmapSummary: `FODMAP analysis failed for "${input.foodItem}".`,
          }
        };
      }
      return output;
    } catch (error: any) {
      console.error('[AnalyzeFoodItemFlow] Error during AI processing:', error);
      const errorMessage = error.message || 'Unknown error';
      const modelNotFoundError = errorMessage.includes("NOT_FOUND") || errorMessage.includes("model not found") || errorMessage.includes("model"); // Broader check

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

          glycemicIndexSummary: `Glycemic Index: ${specificSummaryMessage}`,
          gutImpactSummary: `Gut Impact: ${specificSummaryMessage}`,
          ketoSummary: `Keto: ${specificSummaryMessage}`,
        }
      };
    }
  }
);

export async function analyzeFoodItem(input: AnalyzeFoodItemInput): Promise<AnalyzeFoodItemOutput> {
  return analyzeFoodItemFlow(input);
}

export type { FoodFODMAPProfile as DetailedFodmapProfileFromAI };
