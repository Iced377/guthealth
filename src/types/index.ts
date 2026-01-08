
import type { AnalyzeFoodItemOutput as OriginalAnalyzeFoodItemOutput, FoodFODMAPProfile as DetailedFodmapProfileFromAI } from "@/ai/flows/fodmap-detection";
import type { ProcessedFeedbackOutput as AIProcessedFeedback } from "@/ai/flows/process-feedback-flow";
import type { FoodFODMAPProfile } from "@/ai/flows/food-similarity";
import type React from 'react';
import type { Timestamp } from 'firebase/firestore';
export type { UserRecommendationInput } from '@/ai/flows/user-recommendations';

export type FodmapScore = 'Green' | 'Yellow' | 'Red';

// Extended AI Output to include new health indicators
export interface GlycemicIndexInfo {
  value?: number;
  level?: 'Low' | 'Medium' | 'High' | 'Unknown';
}

export interface DietaryFiberInfo {
  amountGrams?: number;
  quality?: 'Low' | 'Adequate' | 'High'; // Based on general guidelines
}

export interface MicronutrientDetail {
  name: string; // e.g., "Iron", "Vitamin C"
  amount?: string; // e.g., "10 mg", "90 mcg"
  dailyValuePercent?: number; // e.g., 50 for 50% DV
  iconName?: string; // Suggestion for a lucide-react icon name
}

export interface MicronutrientsInfo {
  notable?: MicronutrientDetail[]; // Top 2-3 most significant or relevant micronutrients
  fullList?: MicronutrientDetail[]; // Optional more comprehensive list for a tooltip/popover
}

export interface GutBacteriaImpactInfo {
  sentiment?: 'Positive' | 'Negative' | 'Neutral' | 'Unknown'; // Impact on gut microbiota
  reasoning?: string; // Brief AI-generated explanation
}

export interface KetoFriendlinessInfo {
  score: 'Strict Keto' | 'Moderate Keto' | 'Low Carb' | 'Not Keto-Friendly' | 'Unknown';
  reasoning?: string;
  estimatedNetCarbs?: number; // Optional: AI can try to estimate this
}

export interface AISummaries {
  fodmapSummary?: string;
  micronutrientSummary?: string;
  glycemicIndexSummary?: string;
  gutImpactSummary?: string;
  ketoSummary?: string; // Added for Keto
}

export type ExtendedAnalyzeFoodItemOutput = OriginalAnalyzeFoodItemOutput & {
  glycemicIndexInfo?: GlycemicIndexInfo;
  dietaryFiberInfo?: DietaryFiberInfo;
  micronutrientsInfo?: MicronutrientsInfo;
  gutBacteriaImpact?: GutBacteriaImpactInfo;
  ketoFriendliness?: KetoFriendlinessInfo; // Added Keto
  detectedAllergens?: string[];
  aiSummaries?: AISummaries;
};


export interface LoggedFoodItem {
  id: string;
  name: string;
  originalName?: string | null;
  ingredients: string;
  portionSize: string;
  portionUnit: string;
  timestamp: Date;
  fodmapData?: ExtendedAnalyzeFoodItemOutput | null; // Use the extended output type here
  isSimilarToSafe?: boolean;
  userFodmapProfile?: FoodFODMAPProfile | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  entryType: 'food' | 'manual_macro';
  mealType?: string;
  sourceDescription?: string | null;
  userFeedback?: 'safe' | 'unsafe' | null;
  macrosOverridden?: boolean;
  isFavorite?: boolean; // Added for favorite functionality
  symptoms?: string[]; // List of symptom IDs
}

export interface Symptom {
  id: string;
  name: string;
  icon?: string;
}

export const COMMON_SYMPTOMS: Symptom[] = [
  { id: 'bloating', name: 'Bloating' },
  { id: 'gas', name: 'Gas' },
  { id: 'cramps', name: 'Cramps' },
  { id: 'diarrhea', name: 'Diarrhea' },
  { id: 'constipation', name: 'Constipation' },
  { id: 'nausea', name: 'Nausea' },
  { id: 'reflux', name: 'Reflux' },
  { id: 'other', name: 'Other' },
];

export interface SymptomLog {
  id: string;
  linkedFoodItemIds?: string[];
  symptoms: Symptom[];
  severity?: number;
  notes?: string;
  timestamp: Date;
  entryType: 'symptom';
}

export interface FitbitLog {
  id: string;
  timestamp: Date;
  entryType: 'fitbit_data';
  weight?: number; // kg
  fatPercent?: number; // %
  steps?: number;
  caloriesBurned?: number;
}

export interface PedometerLog {
  id: string;
  timestamp: Date;
  entryType: 'pedometer_data';
  steps: number;
  distance?: number; // meters
  floorsAscended?: number;
  activeEnergy?: number; // kcal
  source?: 'pedometer_plus_plus';
}

export type TimelineEntry = LoggedFoodItem | SymptomLog | FitbitLog | PedometerLog;


export interface SafeFood {
  id: string;
  name: string;
  ingredients: string;
  portionSize: string;
  portionUnit: string;
  fodmapProfile: FoodFODMAPProfile;
  originalAnalysis?: ExtendedAnalyzeFoodItemOutput; // Use extended type
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  safeFoods: SafeFood[];
  premium?: boolean;
  isAdmin?: boolean;
  dateOfBirth?: string; // YYYY-MM-DD
  profile?: {
    hasCompletedSetup: boolean;
    gender: 'male' | 'female';
    height: number; // cm
    weight: number; // kg
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'super_active';
    goal: 'maintain' | 'lose_fat' | 'gain_muscle';
    symptoms: string[]; // e.g., ['bloating', 'fatigue']
    dietaryPreferences?: string[]; // e.g., ['keto', 'vegan']

    // Calculated
    bmr: number;
    tdee: number;
    macros: {
      protein: number;
      carbs: number;
      fats: number;
    };
  };
}

export type { DetailedFodmapProfileFromAI };

export interface DailyNutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyFodmapCount {
  green: number;
  yellow: number;
  red: number;
}

export type TimeRange = '1D' | '7D' | '30D' | '90D' | '1Y' | 'ALL';

export interface MacroPoint {
  date: string;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CaloriePoint {
  date: string;
  calories: number;
}

export interface WeightPoint {
  date: string;
  weight: number;
  fatPercent?: number;
  fatMass?: number;
}

export interface ActivityPoint {
  date: string;
  steps: number;
  burned: number;
}

export interface SafetyPoint {
  date: string;
  safe: number;
  unsafe: number;
  notMarked: number;
}

export interface GIPoint {
  hour: string; // e.g., "00:00", "01:00"
  gi: number;
}

export interface HourlyCaloriePoint {
  hour: string; // e.g., "00:00", "01:00"
  calories: number;
}

export interface HourlyMealCountPoint {
  hour: string; // e.g., "00:00", "01:00"
  count: number;
}

export interface SymptomFrequency {
  name: string;
  value: number;
}

export interface MicronutrientAchievement {
  name: string;
  achievedDays: number;
  iconName?: string;
}

export interface SingleMicronutrientProgress {
  name: string;
  achievedValue?: number;
  achievedDV: number;
  icon: React.ElementType;
  targetDV: number;
  unit: '%' | 'mg' | 'IU';
}

export type UserMicronutrientProgress = Record<string, SingleMicronutrientProgress>;

// Feedback System Types
export interface FeedbackSubmission {
  id: string; // Document ID from Firestore
  userId: string; // UID or 'anonymous'
  timestamp: Timestamp; // Firestore Timestamp
  feedbackText: string;
  category: string; // User-selected or 'Not specified'
  route: string; // Pathname where feedback was submitted
  status: 'new' | 'viewed' | 'in-progress' | 'planned' | 'completed' | 'dismissed';
  aiAnalysis: AIProcessedFeedback | null; // Output from your Genkit flow
  adminNotes?: string;
}

export type FeedbackSubmissionCreate = Omit<FeedbackSubmission, 'id'>;

// KeptAIInsight and KeptAIInsightFirestore types removed

// Previous AIInsight type (used by Navbar for bubble, now potentially deprecated or for simpler tips)
// To avoid breaking Navbar if it's still using it for /ai-insights page title or other minor things,
// we can keep it distinct for now.
export interface AIInsight {
  id: string;
  text: string;
  timestamp: Date;
  read: boolean;
}
