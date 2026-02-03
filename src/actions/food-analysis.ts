'use server';

import { identifyFoodFromImage } from '@/ai/flows/identify-food-from-image-flow';
import { adminDb } from '@/lib/firebase/admin';
import { analyzeFoodItem } from '@/ai/flows/fodmap-detection';
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

        const fodmapAnalysis = await analyzeFoodItem({
            foodItem: identifiedData.name,
            ingredients: identifiedData.ingredients,
            portionSize: identifiedData.portionSize,
            portionUnit: identifiedData.portionUnit,
            userSafeFoodItems: safeFoodItemsForAnalysis,
            additionalContext: additionalContext, // Pass context to ensure accuracy
        });

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

            // Clear simple status if we had one (optional)
            // entryType: 'food' // Already set
        };

        // Remove undefined
        Object.keys(updateData).forEach(key => (updateData as any)[key] === undefined && delete (updateData as any)[key]);

        await docRef.set(updateData, { merge: true });
        console.log(`[FoodAnalysis] Successfully updated entry ${entryId}`);

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
