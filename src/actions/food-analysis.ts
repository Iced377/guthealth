'use server';

import { identifyFoodFromImage } from '@/ai/flows/identify-food-from-image-flow';
import { adminDb } from '@/lib/firebase/admin';
import { analyzeFoodItem } from '@/ai/flows/fodmap-detection';
import { verifyFoodAnalysisFlow } from '@/ai/flows/verify-food-analysis';
import { processMealDescription } from '@/ai/flows/process-meal-description-flow';
import type { FoodFODMAPProfile } from '@/ai/flows/fodmap-detection';

// Helper for fallback profile
const _generateFallbackFodmapProfile = (foodName: string): FoodFODMAPProfile => {
    let hash = 0;
    for (let i = 0; i < foodName.length; i++) {
        const char = foodName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    const pseudoRandom = (seed: number) => {
        let x = Math.sin(seed) * 10000;
        return parseFloat((x - Math.floor(x)).toFixed(1)) * 2;
    };
    return {
        fructans: pseudoRandom(hash + 1),
        galactans: pseudoRandom(hash + 2),
        polyolsSorbitol: pseudoRandom(hash + 3),
        polyolsMannitol: pseudoRandom(hash + 4),
        lactose: pseudoRandom(hash + 5),
        fructose: pseudoRandom(hash + 6),
    };
};

export async function triggerFoodAnalysis(
    entryId: string,
    userId: string,
    imageDataUri: string | undefined, // Can be undefined if just text context, but usually photo
    additionalContext?: string,
    userSafeFoods?: any[] // Pass simplified safe foods list if needed, or fetch from DB? Fetching from DB here is cleaner/safer.
) {
    if (!userId || !entryId) {
        console.error("[FoodAnalysis] Missing userId or entryId");
        return { success: false, error: 'Missing IDs' };
    }

    // Fire and Forget pattern: We don't want to block, but Server Actions ARE implicitly awaited by the caller usually.
    // However, the caller (UI) can choose to ignore the promise.
    // We will do the work here.

    console.log(`[FoodAnalysis] Starting analysis for ${entryId} (User: ${userId})`);

    try {
        // 1. Identify Food
        let identifiedData = {
            name: "Unknown Food",
            ingredients: "No ingredients detected",
            portionSize: "1",
            portionUnit: "serving"
        };

        if (imageDataUri) {
            const idResult = await identifyFoodFromImage({
                imageDataUri,
                additionalContext,
                userLocale: 'en-US' // Defaulting for now, or pass from client
            });

            if (idResult.recognitionSuccess) {
                identifiedData = {
                    name: idResult.identifiedFoodName || "Unknown Food",
                    ingredients: idResult.identifiedIngredients || "",
                    portionSize: idResult.estimatedPortionSize || "1",
                    portionUnit: idResult.estimatedPortionUnit || "serving"
                };
            } else {
                console.warn("[FoodAnalysis] Identification failed.");
                // If failed, we might want to flag it in DB?
                // For now, proceed with "Unknown" so user can edit.
            }
        } else if (additionalContext) {
            // Fallback if no image but context (rare for this flow)
            identifiedData.name = additionalContext;
        }

        // 2. Analyze FODMAPs
        // We need user profile for Safe Foods. 
        // Fetching user profile from Admin DB to stay self-contained
        let safeFoodItemsForAnalysis = userSafeFoods; // If passed

        if (!safeFoodItemsForAnalysis) {
            const userDoc = await adminDb.collection('users').doc(userId).get();
            const userData = userDoc.data();
            if (userData?.safeFoods) {
                safeFoodItemsForAnalysis = userData.safeFoods.map((sf: any) => ({
                    name: sf.name,
                    portionSize: sf.portionSize,
                    portionUnit: sf.portionUnit,
                    fodmapProfile: sf.fodmapProfile,
                }));
            }
        }

        let fodmapAnalysis = await analyzeFoodItem({
            foodItem: identifiedData.name,
            ingredients: identifiedData.ingredients,
            portionSize: identifiedData.portionSize,
            portionUnit: identifiedData.portionUnit,
            userSafeFoodItems: safeFoodItemsForAnalysis,
            additionalContext: additionalContext, // Pass context to ensure accuracy
        });
        let verificationResult: { verified: boolean; flags: string[] } | undefined;

        // 2.5 Verification / Critic Pass
        if (fodmapAnalysis) {
            const verification = await verifyFoodAnalysisFlow({
                foodItemName: identifiedData.name,
                ingredients: identifiedData.ingredients,
                portionSize: identifiedData.portionSize,
                portionUnit: identifiedData.portionUnit,
                claimedFodmapRisk: fodmapAnalysis.overallRisk,
                claimedReason: fodmapAnalysis.reason,
                claimedKetoScore: fodmapAnalysis.ketoFriendliness?.score ?? 'Unknown',
                userId,
                entryId,
                claimedHealthTags: {
                    isGutHealthy: fodmapAnalysis.gutBacteriaImpact?.sentiment === 'Positive'
                },
                macros: {
                    calories: fodmapAnalysis.calories ?? null,
                    protein: fodmapAnalysis.protein ?? null,
                    carbs: fodmapAnalysis.carbs ?? null,
                    fat: fodmapAnalysis.fat ?? null
                }
            });

            if (verification) {
                verificationResult = { verified: verification.verified, flags: verification.flags };

                if (!verification.verified) {
                    try {
                        const correctedAnalysis = await analyzeFoodItem({
                            foodItem: identifiedData.name,
                            ingredients: identifiedData.ingredients,
                            portionSize: identifiedData.portionSize,
                            portionUnit: identifiedData.portionUnit,
                            userSafeFoodItems: safeFoodItemsForAnalysis,
                            additionalContext: additionalContext,
                            feedbackContext: verification.flags.join('; ')
                        });

                        const mergedCorrectedAnalysis = {
                            ...(fodmapAnalysis || {}),
                            ...correctedAnalysis,
                            glycemicIndexInfo: correctedAnalysis.glycemicIndexInfo ?? fodmapAnalysis?.glycemicIndexInfo,
                            dietaryFiberInfo: correctedAnalysis.dietaryFiberInfo ?? fodmapAnalysis?.dietaryFiberInfo,
                            gutBacteriaImpact: correctedAnalysis.gutBacteriaImpact ?? fodmapAnalysis?.gutBacteriaImpact,
                            ketoFriendliness: correctedAnalysis.ketoFriendliness ?? fodmapAnalysis?.ketoFriendliness,
                            detectedAllergens: correctedAnalysis.detectedAllergens ?? fodmapAnalysis?.detectedAllergens,
                            aiSummaries: correctedAnalysis.aiSummaries ?? fodmapAnalysis?.aiSummaries,
                        };

                        fodmapAnalysis = mergedCorrectedAnalysis;
                        verificationResult = { verified: true, flags: ['Auto-corrected via Reflexion'] };
                    } catch (reflexionError) {
                        console.error("[FoodAnalysis] Reflexion correction failed:", reflexionError);
                        // Keep original analysis and verificationResult
                    }
                }
            }
        }

        // 3. Update Firestore
        // We use Admin DB to bypass client rules and it's server-side
        const docRef = adminDb.collection('users').doc(userId).collection('timelineEntries').doc(entryId);

        const updateData = {
            name: identifiedData.name,
            originalName: identifiedData.name,
            ingredients: identifiedData.ingredients,
            portionSize: identifiedData.portionSize,
            portionUnit: identifiedData.portionUnit,

            // AI Results
            fodmapData: fodmapAnalysis ?? null, // Firestore handles null? Yes.
            isSimilarToSafe: fodmapAnalysis?.similarityAnalysis?.isSimilar ?? false,
            userFodmapProfile: fodmapAnalysis?.detailedFodmapProfile ?? _generateFallbackFodmapProfile(identifiedData.name),

            // Macros
            calories: fodmapAnalysis?.calories ?? null,
            protein: fodmapAnalysis?.protein ?? null,
            carbs: fodmapAnalysis?.carbs ?? null,
            fat: fodmapAnalysis?.fat ?? null,

            // Verification
            ...(verificationResult ? { verificationResult } : {})

            // Clear simple status if we had one (optional)
            // entryType: 'food' // Already set
        };

        // Remove undefined
        Object.keys(updateData).forEach(key => (updateData as any)[key] === undefined && delete (updateData as any)[key]);

        await docRef.set(updateData, { merge: true });
        console.log(`[FoodAnalysis] Successfully updated entry ${entryId}`);

        // Telemetry: missing macros / health tags
        const missingMacros = updateData.calories == null || updateData.protein == null || updateData.carbs == null || updateData.fat == null;
        if (missingMacros) {
            await logAiTelemetryEvent({
                type: 'missing_macros',
                userId,
                entryId,
                reason: 'one_or_more_null',
                meta: {
                    calories: updateData.calories ?? null,
                    protein: updateData.protein ?? null,
                    carbs: updateData.carbs ?? null,
                    fat: updateData.fat ?? null,
                }
            });
        }

        const missingHealthTags = !fodmapAnalysis?.glycemicIndexInfo || !fodmapAnalysis?.dietaryFiberInfo || !fodmapAnalysis?.gutBacteriaImpact || !fodmapAnalysis?.ketoFriendliness;
        if (missingHealthTags) {
            await logAiTelemetryEvent({
                type: 'missing_health_tags',
                userId,
                entryId,
                reason: 'missing_required_tags',
            });
        }

        return { success: true };

    } catch (error) {
        console.error("[FoodAnalysis] Error:", error);
        // Optionally update DB with error state?
        const docRef = adminDb.collection('users').doc(userId).collection('timelineEntries').doc(entryId);
        await docRef.set({
            name: "Analysis Failed",
            ingredients: "Please edit manually."
        }, { merge: true });

        return { success: false, error: String(error) };
    }
}

export async function logAdminEvent(eventData: any) {
    try {
        await adminDb.collection('admin_events').add({
            ...eventData,
            timestamp: new Date(), // Enforce server timestamp logic or allow client pass? New Date() here is safer.
            loggedAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to log admin event:", error);
        return { success: false, error: String(error) };
    }
}

export async function logAiPerformanceMetric(metric: {
    flow: 'write' | 'scan' | 'reuse';
    durationMs: number;
    success: boolean;
    userId?: string;
    entryId?: string;
    platform?: string;
}) {
    try {
        await adminDb.collection('ai_performance_metrics').add({
            ...metric,
            createdAt: new Date(),
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to log AI performance metric:", error);
        return { success: false, error: String(error) };
    }
}

export async function logAiTelemetryEvent(eventData: {
    type: 'recalc_skipped' | 'override_persisted_after_edit' | 'missing_macros' | 'missing_health_tags' | 'hallucination_flagged';
    userId?: string;
    entryId?: string;
    reason?: string;
    meta?: Record<string, any>;
}) {
    try {
        await adminDb.collection('ai_telemetry_events').add({
            ...eventData,
            timestamp: new Date(),
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to log AI telemetry event:", error);
        return { success: false, error: String(error) };
    }
}

export async function triggerTextFoodAnalysis(
    entryId: string,
    userId: string,
    mealDescription: string,
    userDidOverrideMacros: boolean,
    overrideMacros?: { calories?: number; protein?: number; carbs?: number; fat?: number },
    overrideName?: string
) {
    if (!userId || !entryId) {
        console.error("[TextFoodAnalysis] Missing userId or entryId");
        return { success: false, error: 'Missing IDs' };
    }

    const startTime = Date.now();

    try {
        // 1. Parse description
        const mealDescriptionOutput = await processMealDescription({ mealDescription });

        // 2. Fetch safe foods
        let safeFoodItemsForAnalysis: any[] | undefined;
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (userData?.safeFoods) {
            safeFoodItemsForAnalysis = userData.safeFoods.map((sf: any) => ({
                name: sf.name,
                portionSize: sf.portionSize,
                portionUnit: sf.portionUnit,
                fodmapProfile: sf.fodmapProfile,
            }));
        }

        // 3. Analyze
        let fodmapAnalysis = await analyzeFoodItem({
            foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis,
            ingredients: mealDescriptionOutput.consolidatedIngredients,
            portionSize: mealDescriptionOutput.estimatedPortionSize,
            portionUnit: mealDescriptionOutput.estimatedPortionUnit,
            userSafeFoodItems: safeFoodItemsForAnalysis,
        });

        let verificationResult: { verified: boolean; flags: string[] } | undefined;

        if (fodmapAnalysis) {
            const verification = await verifyFoodAnalysisFlow({
                foodItemName: mealDescriptionOutput.primaryFoodItemForAnalysis,
                ingredients: mealDescriptionOutput.consolidatedIngredients,
                portionSize: mealDescriptionOutput.estimatedPortionSize,
                portionUnit: mealDescriptionOutput.estimatedPortionUnit,
                claimedFodmapRisk: fodmapAnalysis.overallRisk,
                claimedReason: fodmapAnalysis.reason,
                claimedKetoScore: fodmapAnalysis.ketoFriendliness?.score ?? 'Unknown',
                userId,
                entryId,
                claimedHealthTags: {
                    isGutHealthy: fodmapAnalysis.gutBacteriaImpact?.sentiment === 'Positive'
                },
                macros: {
                    calories: fodmapAnalysis.calories ?? null,
                    protein: fodmapAnalysis.protein ?? null,
                    carbs: fodmapAnalysis.carbs ?? null,
                    fat: fodmapAnalysis.fat ?? null
                }
            });

            if (verification) {
                verificationResult = { verified: verification.verified, flags: verification.flags };

                if (!verification.verified) {
                    try {
                        const correctedAnalysis = await analyzeFoodItem({
                            foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis,
                            ingredients: mealDescriptionOutput.consolidatedIngredients,
                            portionSize: mealDescriptionOutput.estimatedPortionSize,
                            portionUnit: mealDescriptionOutput.estimatedPortionUnit,
                            userSafeFoodItems: safeFoodItemsForAnalysis,
                            feedbackContext: verification.flags.join('; ')
                        });

                        const mergedCorrectedAnalysis = {
                            ...(fodmapAnalysis || {}),
                            ...correctedAnalysis,
                            glycemicIndexInfo: correctedAnalysis.glycemicIndexInfo ?? fodmapAnalysis?.glycemicIndexInfo,
                            dietaryFiberInfo: correctedAnalysis.dietaryFiberInfo ?? fodmapAnalysis?.dietaryFiberInfo,
                            gutBacteriaImpact: correctedAnalysis.gutBacteriaImpact ?? fodmapAnalysis?.gutBacteriaImpact,
                            ketoFriendliness: correctedAnalysis.ketoFriendliness ?? fodmapAnalysis?.ketoFriendliness,
                            detectedAllergens: correctedAnalysis.detectedAllergens ?? fodmapAnalysis?.detectedAllergens,
                            aiSummaries: correctedAnalysis.aiSummaries ?? fodmapAnalysis?.aiSummaries,
                        };

                        fodmapAnalysis = mergedCorrectedAnalysis;
                        verificationResult = { verified: true, flags: ['Auto-corrected via Reflexion'] };
                    } catch (reflexionError) {
                        console.error("[TextFoodAnalysis] Reflexion correction failed:", reflexionError);
                    }
                }
            }
        }

        // 4. Update entry
        const docRef = adminDb.collection('users').doc(userId).collection('timelineEntries').doc(entryId);
        const updateData: any = {
            name: overrideName || mealDescriptionOutput.wittyName,
            originalName: mealDescriptionOutput.primaryFoodItemForAnalysis,
            ingredients: mealDescriptionOutput.consolidatedIngredients,
            portionSize: mealDescriptionOutput.estimatedPortionSize,
            portionUnit: mealDescriptionOutput.estimatedPortionUnit,
            sourceDescription: mealDescription,

            fodmapData: fodmapAnalysis ?? null,
            isSimilarToSafe: fodmapAnalysis?.similarityAnalysis?.isSimilar ?? false,
            userFodmapProfile: fodmapAnalysis?.detailedFodmapProfile ?? _generateFallbackFodmapProfile(mealDescriptionOutput.primaryFoodItemForAnalysis),

            macrosOverridden: userDidOverrideMacros,
            calories: userDidOverrideMacros ? (overrideMacros?.calories ?? null) : (fodmapAnalysis?.calories ?? null),
            protein: userDidOverrideMacros ? (overrideMacros?.protein ?? null) : (fodmapAnalysis?.protein ?? null),
            carbs: userDidOverrideMacros ? (overrideMacros?.carbs ?? null) : (fodmapAnalysis?.carbs ?? null),
            fat: userDidOverrideMacros ? (overrideMacros?.fat ?? null) : (fodmapAnalysis?.fat ?? null),

            ...(verificationResult ? { verificationResult } : {})
        };

        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        await docRef.set(updateData, { merge: true });

        // Telemetry: missing macros / health tags
        const missingMacros = updateData.calories == null || updateData.protein == null || updateData.carbs == null || updateData.fat == null;
        if (missingMacros) {
            await logAiTelemetryEvent({
                type: 'missing_macros',
                userId,
                entryId,
                reason: 'one_or_more_null',
                meta: {
                    calories: updateData.calories ?? null,
                    protein: updateData.protein ?? null,
                    carbs: updateData.carbs ?? null,
                    fat: updateData.fat ?? null,
                }
            });
        }

        const missingHealthTags = !fodmapAnalysis?.glycemicIndexInfo || !fodmapAnalysis?.dietaryFiberInfo || !fodmapAnalysis?.gutBacteriaImpact || !fodmapAnalysis?.ketoFriendliness;
        if (missingHealthTags) {
            await logAiTelemetryEvent({
                type: 'missing_health_tags',
                userId,
                entryId,
                reason: 'missing_required_tags',
            });
        }

        await logAiPerformanceMetric({
            flow: 'write',
            durationMs: Math.round(Date.now() - startTime),
            success: true,
            userId,
            entryId,
        });

        return { success: true };
    } catch (error) {
        console.error("[TextFoodAnalysis] Error:", error);
        try {
            await logAiPerformanceMetric({
                flow: 'write',
                durationMs: Math.round(Date.now() - startTime),
                success: false,
                userId,
                entryId,
            });
        } catch (_) { /* ignore */ }
        return { success: false, error: String(error) };
    }
}
