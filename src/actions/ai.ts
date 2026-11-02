'use server';

// Authenticated entry points for AI flows called from client components.
// The flow modules in src/ai/flows are server-only and are not server actions themselves,
// so they cannot be invoked from the browser without passing through these checks.

import { requireUser } from '@/lib/auth/server-auth';
import { analyzeFoodItem, type AnalyzeFoodItemInput, type AnalyzeFoodItemOutput } from '@/ai/flows/fodmap-detection';
import { isSimilarToSafeFoods, type FoodSimilarityInput, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
import { identifyFoodFromImage, type IdentifyFoodFromImageInput, type IdentifyFoodFromImageOutput } from '@/ai/flows/identify-food-from-image-flow';
import { processMealDescription, type ProcessMealDescriptionInput, type ProcessMealDescriptionOutput } from '@/ai/flows/process-meal-description-flow';
import { getPersonalizedDietitianInsight, type PersonalizedDietitianInput, type PersonalizedDietitianOutput } from '@/ai/flows/personalized-dietitian-flow';
import { processFeedback, type ProcessFeedbackInput, type ProcessedFeedbackOutput } from '@/ai/flows/process-feedback-flow';
import { verifyFoodAnalysisFlow, type VerifyFoodAnalysisInput, type VerifyFoodAnalysisOutput } from '@/ai/flows/verify-food-analysis';

export type AiActionAuth = { idToken: string };


// Errors thrown from server actions reach the client as a generic failure in production.
// Callers already handle rejected promises for these flows.
async function authorise(auth: AiActionAuth): Promise<string> {
    return requireUser(auth?.idToken);
}

export async function analyzeFoodItemAction(auth: AiActionAuth, input: AnalyzeFoodItemInput): Promise<AnalyzeFoodItemOutput> {
    await authorise(auth);
    return analyzeFoodItem(input);
}

export async function isSimilarToSafeFoodsAction(auth: AiActionAuth, input: FoodSimilarityInput): Promise<FoodSimilarityOutput> {
    await authorise(auth);
    return isSimilarToSafeFoods(input);
}

export async function identifyFoodFromImageAction(auth: AiActionAuth, input: IdentifyFoodFromImageInput): Promise<IdentifyFoodFromImageOutput> {
    await authorise(auth);
    return identifyFoodFromImage(input);
}

export async function processMealDescriptionAction(auth: AiActionAuth, input: ProcessMealDescriptionInput): Promise<ProcessMealDescriptionOutput> {
    await authorise(auth);
    return processMealDescription(input);
}

export async function getPersonalizedDietitianInsightAction(auth: AiActionAuth, input: PersonalizedDietitianInput): Promise<PersonalizedDietitianOutput> {
    await authorise(auth);
    return getPersonalizedDietitianInsight(input);
}

export async function processFeedbackAction(auth: AiActionAuth, input: ProcessFeedbackInput): Promise<ProcessedFeedbackOutput> {
    const uid = await authorise(auth);
    return processFeedback({ ...input, userId: uid });
}

export async function verifyFoodAnalysisAction(auth: AiActionAuth, input: VerifyFoodAnalysisInput): Promise<VerifyFoodAnalysisOutput> {
    const uid = await authorise(auth);
    // The verification flow writes the user id to admin telemetry; never take it from the client.
    return verifyFoodAnalysisFlow({ ...input, userId: uid });
}
