'use client';

// Client-side AI calls. Each function attaches the signed-in user's ID token and calls
// the authenticated server action in src/actions/ai.ts. Names match the original flow
// functions so call sites only change their import path.

import {
    analyzeFoodItemAction,
    isSimilarToSafeFoodsAction,
    identifyFoodFromImageAction,
    processMealDescriptionAction,
    getPersonalizedDietitianInsightAction,
    processFeedbackAction,
    verifyFoodAnalysisAction,
} from '@/actions/ai';
import { getActionAuth } from '@/lib/auth/client-token';
import type { AnalyzeFoodItemInput } from '@/ai/flows/fodmap-detection';
import type { FoodSimilarityInput } from '@/ai/flows/food-similarity';
import type { IdentifyFoodFromImageInput } from '@/ai/flows/identify-food-from-image-flow';
import type { ProcessMealDescriptionInput } from '@/ai/flows/process-meal-description-flow';
import type { PersonalizedDietitianInput } from '@/ai/flows/personalized-dietitian-flow';
import type { ProcessFeedbackInput } from '@/ai/flows/process-feedback-flow';
import type { VerifyFoodAnalysisInput } from '@/ai/flows/verify-food-analysis';

export async function analyzeFoodItem(input: AnalyzeFoodItemInput) {
    return analyzeFoodItemAction(await getActionAuth(), input);
}

export async function isSimilarToSafeFoods(input: FoodSimilarityInput) {
    return isSimilarToSafeFoodsAction(await getActionAuth(), input);
}

export async function identifyFoodFromImage(input: IdentifyFoodFromImageInput) {
    return identifyFoodFromImageAction(await getActionAuth(), input);
}

export async function processMealDescription(input: ProcessMealDescriptionInput) {
    return processMealDescriptionAction(await getActionAuth(), input);
}

export async function getPersonalizedDietitianInsight(input: PersonalizedDietitianInput) {
    return getPersonalizedDietitianInsightAction(await getActionAuth(), input);
}

export async function processFeedback(input: ProcessFeedbackInput) {
    return processFeedbackAction(await getActionAuth(), input);
}

export async function verifyFoodAnalysisFlow(input: VerifyFoodAnalysisInput) {
    return verifyFoodAnalysisAction(await getActionAuth(), input);
}
