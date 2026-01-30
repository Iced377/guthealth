'use server';

import { ai, DEFAULT_AI_MODEL } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyFoodAnalysisInputSchema = z.object({
    foodItemName: z.string(),
    ingredients: z.string(),
    portionSize: z.string(),
    portionUnit: z.string(),
    claimedFodmapRisk: z.string(),
    claimedReason: z.string(),
    claimedHealthTags: z.object({
        isKeto: z.boolean().optional(),
        isGutHealthy: z.boolean().optional(),
    }).optional(),
});

export type VerifyFoodAnalysisInput = z.infer<typeof VerifyFoodAnalysisInputSchema>;

const VerifyFoodAnalysisOutputSchema = z.object({
    verified: z.boolean().describe("True if the analysis is consistent and supported by evidence. False if hallucinations or conflicts detected."),
    flags: z.array(z.string()).describe("List of specific issues found (e.g. 'Claimed Low FODMAP but ingredients contain Garlic'). Empty if verified."),
    suggestedPromptImprovement: z.string().describe("REQUIRED: A concise rule or instruction to add to the System Prompt to prevent this error in the future. If verified is true, return an empty string."),
});

export type VerifyFoodAnalysisOutput = z.infer<typeof VerifyFoodAnalysisOutputSchema>;

const verifyFoodAnalysisPrompt = ai.definePrompt({
    name: 'verifyFoodAnalysisPrompt',
    model: DEFAULT_AI_MODEL, // Strictly using the same model as the main app
    input: { schema: VerifyFoodAnalysisInputSchema },
    output: { schema: VerifyFoodAnalysisOutputSchema },
    config: {
        temperature: 0.1, // Very strict/deterministic
    },
    prompt: `You are a strict QA Auditor for a nutrition AI. Your job is to catch hallucinations or logical inconsistencies.

Audit Target:
- Food: "{{foodItemName}}"
- Ingredients provided: "{{ingredients}}"
- Portion: "{{portionSize}} {{portionUnit}}"

Analysis Claims to Verify:
- FODMAP Risk Claim: "{{claimedFodmapRisk}}"
- Reasoning Claim: "{{claimedReason}}"
{{#if claimedHealthTags}}
- Keto Claim: {{claimedHealthTags.isKeto}}
- Gut Healthy Claim: {{claimedHealthTags.isGutHealthy}}
{{/if}}

Start Audit:
1. **Ingredient Consistency**: Do the ingredients match the food name? (e.g. A "Chicken Salad" must contain chicken). 
2. **FODMAP Logic**: check against the ingredients.
   - If Claim is "Green" (Low Risk) but ingredients contain obvious High FODMAPs (Garlic, Onion, Wheat, High Fructose) -> FLAG IT.
   - If Claim is "Red" (High Risk) but ingredients are all safe -> FLAG IT.
3. **Macro/Health Logic**:
    - If Keto Claim is TRUE but ingredients are high carb (Rice, Bread, Sugar) -> FLAG IT.

6. **Reflexion (Improvement)**:
   - If you flagged an error, suggest a CONSITENT RULE that would prevent this mistake in the future.
   - Example: "If food is Bread, isKeto must be false."

Output JSON:
- "verified": true ONLY if all claims hold up against the ingredients.
- "flags": A list of short, clear error strings if verification fails.
- "suggestedPromptImprovement": REQUIRED if verified is false. Provide a concise system prompt instruction to prevent this specific hallucination.

Example Check:
Input: "Garlic Bread", Ingredients: "Bread, Garlic, Butter". Claim: "Green (Low Risk)"
Output: { 
  "verified": false, 
  "flags": ["Contains Garlic (High FODMAP) but claimed Low Risk"],
  "suggestedPromptImprovement": "If ingredients contain Garlic, FODMAP Risk must be Red/High." 
}
`,
});

import { adminDb } from '@/lib/firebase/admin';

export const verifyFoodAnalysisFlow = ai.defineFlow(
    {
        name: 'verifyFoodAnalysisFlow',
        inputSchema: VerifyFoodAnalysisInputSchema,
        outputSchema: VerifyFoodAnalysisOutputSchema,
    },
    async (input) => {
        try {
            const { output } = await verifyFoodAnalysisPrompt(input);
            const result = output || { verified: true, flags: [], suggestedPromptImprovement: "" };

            // Builder-Centric Logging: If verification fails, save 'event' for God View
            if (!result.verified) {
                try {
                    await adminDb.collection('admin_events').add({
                        type: 'hallucination_detected',
                        timestamp: new Date(), // Admin SDK usually handles Dates fine, or use FieldValue.serverTimestamp() if imported
                        severity: 'warning',
                        foodName: input.foodItemName,
                        flags: result.flags,
                        suggestedPromptImprovement: result.suggestedPromptImprovement,
                        meta: {
                            claimedRisk: input.claimedFodmapRisk,
                            ingredients: input.ingredients,
                            portion: `${input.portionSize} ${input.portionUnit}`
                        },
                        resolved: false
                    });
                    console.log(`[Critic] Logged hallucination for ${input.foodItemName} to admin_events.`);
                } catch (logErr) {
                    console.error("[Critic] Failed to log event:", logErr);
                }
            }

            return result;
        } catch (error) {
            console.error("Verification Flow Error:", error);
            // Log the CRASH too
            try {
                await adminDb.collection('admin_events').add({
                    type: 'critic_system_error',
                    timestamp: new Date(),
                    severity: 'error',
                    foodName: input.foodItemName,
                    error: String(error),
                    resolved: false
                });
            } catch (e) { /* ignore */ }

            return { verified: true, flags: [], suggestedPromptImprovement: "" }; // Fail open (don't flag errors if the critic crashes)
        }
    }
);
