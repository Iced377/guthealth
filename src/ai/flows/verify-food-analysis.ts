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
    claimedKetoScore: z.string().optional().describe('Keto score label from analysis (e.g., "Strict Keto", "Moderate Keto", "Low Carb", "Not Keto-Friendly", "Unknown").'),
    userId: z.string().optional(),
    entryId: z.string().optional(),
    claimedHealthTags: z.object({
        isGutHealthy: z.boolean().optional(),
    }).optional(),
    macros: z.object({
        calories: z.number().nullable().optional(),
        protein: z.number().nullable().optional(),
        carbs: z.number().nullable().optional(),
        fat: z.number().nullable().optional(),
    }).optional().describe("Quantative macro data to audit. Null values indicate missing data."),
});

export type VerifyFoodAnalysisInput = z.infer<typeof VerifyFoodAnalysisInputSchema>;

const VerifyFoodAnalysisOutputSchema = z.object({
    verified: z.boolean().describe("True if the analysis is consistent and supported by evidence. False if hallucinations or conflicts detected."),
    flags: z.array(z.string()).describe("List of specific issues found (e.g. 'Claimed Low FODMAP but ingredients contain Garlic', 'Missing Macros'). Empty if verified."),
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
    prompt: `You are a strict QA Auditor for a nutrition AI. Your job is to catch hallucinations, logical inconsistencies, or DATA GAPS.

Audit Target:
- Food: "{{foodItemName}}"
- Ingredients provided: "{{ingredients}}"
- Portion: "{{portionSize}} {{portionUnit}}"
- Macros: Calories={{macros.calories}}, P={{macros.protein}}, C={{macros.carbs}}, F={{macros.fat}}

Analysis Claims to Verify:
- FODMAP Risk Claim: "{{claimedFodmapRisk}}"
- Reasoning Claim: "{{claimedReason}}"
- Keto Score Claim: "{{claimedKetoScore}}"
{{#if claimedHealthTags}}
- Gut Healthy Claim: {{claimedHealthTags.isGutHealthy}}
{{/if}}

Start Audit:
1. **Ingredient Consistency**: Do the ingredients match the food name? (e.g. A "Chicken Salad" must contain chicken). 
2. **Missing Data Check (CRITICAL)**:
   - Are 'Calories' missing (null/undefined) or 0? 
   - IF the food is NOT naturally 0 calorie/negligible (like Water, Black Coffee, Diet Soda, Plain Tea):
   - -> FLAG IT: "Missing Macros: Calories cannot be 0 for {{foodItemName}}."
   - Check if Macros (P/C/F) are all null/0 for a real food -> FLAG IT.

3. **FODMAP Logic**: check against the ingredients.
   - If Claim is "Green" (Low Risk) but ingredients contain obvious High FODMAPs (Garlic, Onion, Wheat, High Fructose) -> FLAG IT.
   - If Claim is "Red" (High Risk) but ingredients are all safe -> FLAG IT.

4. **Macro/Health Logic**:
    - Only evaluate keto consistency if Keto Score Claim is "Strict Keto" or "Moderate Keto".
    - If Keto Score Claim is "Strict Keto" or "Moderate Keto" but ingredients are high carb (Rice, Bread, Sugar) -> FLAG IT.

5. **Reflexion (Improvement)**:
   - If you flagged an error, suggest a CONSITENT RULE that would prevent this mistake in the future.
   - Example: "If food is Bread, isKeto must be false."

Output JSON:
- "verified": true ONLY if all claims hold up against the ingredients AND macros are present (unless naturally 0-cal).
- "flags": A list of short, clear error strings if verification fails.
- "suggestedPromptImprovement": REQUIRED if verified is false. Provide a concise system prompt instruction to prevent this specific hallucination.

Example Check 1:
Input: "Garlic Bread", Ingredients: "Bread, Garlic, Butter". Claim: "Green (Low Risk)". Macros: Cal: 200...
Output: { 
  "verified": false, 
  "flags": ["Contains Garlic (High FODMAP) but claimed Low Risk"],
  "suggestedPromptImprovement": "If ingredients contain Garlic, FODMAP Risk must be Red/High." 
}

Example Check 2:
Input: "Twix Bar", Ingredients: "Biscuit, Caramel, Chocolate". Macros: Cal: 0, P: 0...
Output: {
  "verified": false,
  "flags": ["Missing Macros: Twix Bar typically has ~250 calories."],
  "suggestedPromptImprovement": "Ensure calories are calculated based on ingredients. Do not return 0."
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

            // Guardrail: only evaluate keto consistency if explicitly claimed as keto-friendly.
            const ketoClaimed = input.claimedKetoScore === 'Strict Keto' || input.claimedKetoScore === 'Moderate Keto';
            if (!ketoClaimed && result.flags?.length) {
                const filteredFlags = result.flags.filter(flag => !/keto claim/i.test(flag));
                const hadOnlyKetoFlags = filteredFlags.length === 0;
                result.flags = filteredFlags;
                if (hadOnlyKetoFlags) {
                    result.verified = true;
                    result.suggestedPromptImprovement = "";
                }
            }

            // Builder-Centric Logging: If verification fails, save 'event' for God View
            if (!result.verified) {
                try {
                    await adminDb.collection('ai_telemetry_events').add({
                        type: 'hallucination_flagged',
                        timestamp: new Date(),
                        userId: input.userId || null,
                        entryId: input.entryId || null,
                        reason: result.flags?.join('; ') || 'verification_failed',
                        meta: {
                            foodItemName: input.foodItemName,
                            flags: result.flags || []
                        }
                    });
                } catch (telemetryErr) {
                    console.error("[Critic] Failed to log telemetry:", telemetryErr);
                }

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
