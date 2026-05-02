
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

  glycemicIndexSummary?: string;
  gutImpactSummary?: string;
  ketoSummary?: string; // Added for Keto
}

export type ExtendedAnalyzeFoodItemOutput = OriginalAnalyzeFoodItemOutput & {
  glycemicIndexInfo: GlycemicIndexInfo;
  dietaryFiberInfo: DietaryFiberInfo;
  gutBacteriaImpact: GutBacteriaImpactInfo;
  ketoFriendliness: KetoFriendlinessInfo; // Added Keto
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
  favoriteLastUsedAt?: Date;

  // Hallucination Checker Result
  verificationResult?: {
    verified: boolean;
    flags: string[];
  };
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

export interface LoggedSymptom extends Symptom {
  severity: number;
}

export interface SymptomLog {
  id: string;
  linkedFoodItemIds?: string[];
  symptoms: LoggedSymptom[];
  severity?: number;
  notes?: string;
  timestamp: Date;
  experiencedAt: Date;
  triggerContext?: {
    type: 'meal' | 'checkin' | 'delayed';
    mealId?: string;
  };
  appVersion?: string;
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
  source?: 'pedometer_plus_plus' | 'apple_health' | 'manual';
  syncedAt?: Date;
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
  createdAt?: Timestamp | Date; // Added for acquisition tracking
  safeFoods: SafeFood[];
  premium?: boolean;
  isAdmin?: boolean;
  dateOfBirth?: string; // YYYY-MM-DD
  feedbackMeta?: {
    hasSubmittedFeedback: boolean;
    lastFeedbackAt: Timestamp;
    lastFeedbackType: 'improve' | 'bug' | 'feature';
  };
  integrationDebug?: {
    appleHealth?: {
      enabled?: boolean;
      updatedAt?: Timestamp | Date;
    };
  };
  profile?: {
    hasCompletedSetup: boolean;
    gender: 'male' | 'female';
    height: number; // cm
    weight: number; // kg
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'super_active';
    goal: 'maintain' | 'lose_fat' | 'gain_muscle';
    symptoms: string[]; // e.g., ['bloating', 'fatigue']
    dietaryPreferences?: string[]; // e.g., ['keto', 'vegan']
    appleHealthEnabled?: boolean; // Toggle for Apple Health sync

    // Walkthrough tracking
    walkthroughStatus?: {
      completedTopics: string[]; // e.g., ['intro', 'food_logging', 'insights']
      hasSeenIntro: boolean;
      isDismissed: boolean;
    };

    // Calculated
    bmr: number;
    tdee: number;
    expertPromptStatus?: 'pending' | 'accepted' | 'later';
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
  fiber?: number;
}

export interface DailyFodmapCount {
  green: number;
  yellow: number;
  red: number;
}

export type TimeRange = '1D' | '7D' | '30D' | '90D' | '6M' | '1Y' | 'ALL' | 'CUSTOM';

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



// Feedback System Types
// Feedback System Types (Liquid Glass)
export interface FeedbackSubmission {
  id: string;
  uid: string | null;
  isGuest: boolean;
  type: 'improve' | 'bug' | 'feature';
  createdAt: Timestamp;
  appVersion: string;
  buildNumber?: string;
  routeContext: string;
  deviceContext: {
    userAgent: string;
    platform: string;
    viewportW: number;
    viewportH: number;
  };
  ratings: {
    accuracy: number | null;
    convenience: number | null;
    usability: number | null;
    speed: number | null;
    performance: number | null;
  };
  freeform: string | null;
  category?: string;
  route?: string;
  status?: 'new' | 'archived' | 'resolved';
  aiAnalysis?: any;
  didInteract: boolean;
  gestureMeta?: {
    cardsVisitedCount: number;
    totalTimeMs: number;
  };
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

// ==========================================
// EXPERT FEATURE TYPES (Strictly "Expert" branding)
// ==========================================

export interface ExpertProfile {
  id: string;
  linkedUserId: string;
  displayName: string;
  headline: string;
  profilePictureUrl?: string;
  profilePictureCropData?: string; // e.g., JSON string of crop coordinates
  specialityTags: string[];
  active: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface ExpertConsentVersion {
  version: string;
  text: string;
  createdAt: Timestamp | Date;
  active: boolean;
  hash: string;
}

export type ConsentDataCategory = 
  | 'profile' 
  | 'weight' 
  | 'goal' 
  | 'foodJournal' 
  | 'steps' 
  | 'foodRealityCapture' 
  | 'foodRealityReport';

export interface ExpertClientRelationship {
  id: string;
  expertId: string;
  clientUserId: string;
  status: 'active' | 'revoked' | 'paused';
  consentStatus: 'granted' | 'revoked' | 'pending';
  consentedDataCategories: ConsentDataCategory[];
  consentVersion: string;
  consentTextHash: string;
  consentedAt?: Timestamp | Date;
  revokedAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface ExpertConsentAuditEvent {
  id: string;
  relationshipId: string;
  clientUserId: string;
  expertId: string;
  eventType: 'granted' | 'revoked' | 'updated';
  dataCategories: ConsentDataCategory[];
  consentVersion: string;
  timestamp: Timestamp | Date;
}

export type CompletenessStatus = 'full' | 'partial' | 'insufficient' | 'unknown';
export type NormalityStatus = 'normal' | 'mostly_normal' | 'not_normal' | 'inferred_normal' | 'unknown';

export interface FoodRealityCapture {
  id: string;
  userId: string;
  expertId?: string;
  relationshipId?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  source: 'recent_logs' | 'fresh_capture' | 'partial_data';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  selectedDates: string[]; // YYYY-MM-DD
  focusAreas: string[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  completedAt?: Timestamp | Date;
  confidenceScore?: number;
  completenessScore?: number;
  normalityScore?: number;
  reportId?: string;
  sharedWithExpert: boolean;
}

export interface FoodRealityDaySummary {
  id: string;
  captureId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  dayNumber: number;
  mealCount: number;
  aiCoachCompletenessStatus: CompletenessStatus;
  hasBreakfast: boolean;
  hasLunch: boolean;
  hasDinner: boolean;
  hasSnacks: boolean;
  hasDrinks: boolean;
  hasSupplements: boolean;
  isTrainingDay?: boolean;
  normalityStatus: NormalityStatus;
  unusualReasons?: string[];
  missedItems?: string[];
  userConfirmedComplete: boolean;
  completenessScore: number;
  confidenceScore: number;
}

export interface FoodRealityReport {
  id: string;
  captureId: string;
  userId: string;
  expertId?: string;
  relationshipId?: string;
  createdAt: Timestamp | Date;
  averageCalories?: number;
  averageProtein?: number;
  averageCarbs?: number;
  averageFat?: number;
  averageFiber?: number;
  averageWater?: number;
  averageCaffeine?: number;
  proteinDistribution?: any; // JSON string or specific object
  mealTimingPattern?: string;
  lateEatingFrequency?: number;
  snackingPattern?: string;
  restaurantMealFrequency?: number;
  supplementPattern?: string;
  trainingDayFuelNotes?: string;
  loggingConfidence: 'High' | 'Medium' | 'Low';
  dataQualityWarnings?: string[];
  expertStyleSummary?: string;
  userFriendlySummary?: string;
  recommendedNextActions?: string[];
  sharedWithExpert: boolean;
}

export interface ExpertNote {
  id: string;
  expertId: string;
  clientUserId: string;
  relationshipId: string;
  tags: string[];
  noteText?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  visibility: 'expert_only';
}
