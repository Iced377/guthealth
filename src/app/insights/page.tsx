
'use client';

import { formatISO, addHours } from 'date-fns';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Navbar from '@/components/shared/Navbar';
import { Loader2, Brain, Sparkles, ThumbsDown, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LoggedFoodItem, SymptomLog, UserProfile } from '@/types';
import { getPersonalizedDietitianInsight, type PersonalizedDietitianInput } from '@/ai/flows/personalized-dietitian-flow';
import { db } from '@/config/firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  Timestamp,
  getDoc,
  limit,
  where,
} from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const TEMPORARILY_UNLOCK_ALL_FEATURES = true; // Kept true as per previous state
const DATA_FETCH_LIMIT_DAYS = 90;
const PREDEFINED_QUESTION = "What do you think about my food today so far and what would you recommend for the rest of today?";
const FASTING_CALORIE_THRESHOLD = 5; // Entries below this (e.g. coffee, meds, diet soda) do not break a fast

export default function AIInsightsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [currentAIResponse, setCurrentAIResponse] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentAIResponse, scrollToBottom]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      setError("Please log in to use the GutCheck Assistant.");
      return;
    }

    const fetchUserProfileData = async () => {
      setError(null);
      try {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
          setUserProfile({ uid: authUser.uid, email: authUser.email, displayName: authUser.displayName, safeFoods: [], premium: false });
        }
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setError("Could not load your user profile. Please try again later.");
      }
    };

    fetchUserProfileData();
  }, [authUser, authLoading]);


  const calculateMaxFastingWindow = (logs: LoggedFoodItem[]): number => {
    // Filter out negligible calorie items (coffee, supplements, etc.)
    const fastingLogs = logs.filter(log => (log.calories || 0) >= FASTING_CALORIE_THRESHOLD);

    if (fastingLogs.length < 2) return 0;

    // Sort ascending by time
    const sortedLogs = [...fastingLogs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Group logs by day (Local Date String as key to ensure we separate days correctly)
    const logsByDay: { [key: string]: LoggedFoodItem[] } = {};
    sortedLogs.forEach(log => {
      const dayKey = log.timestamp.toLocaleDateString();
      if (!logsByDay[dayKey]) logsByDay[dayKey] = [];
      logsByDay[dayKey].push(log);
    });

    const dayKeys = Object.keys(logsByDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let maxFastHours = 0;

    for (let i = 0; i < dayKeys.length - 1; i++) {
      const currentDayLogs = logsByDay[dayKeys[i]];
      const nextDayLogs = logsByDay[dayKeys[i + 1]];

      if (currentDayLogs.length > 0 && nextDayLogs.length > 0) {
        // Last meal of current day
        const lastMeal = currentDayLogs[currentDayLogs.length - 1];
        // First meal of next day
        const firstMeal = nextDayLogs[0];

        const diffMs = firstMeal.timestamp.getTime() - lastMeal.timestamp.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // Only consider it a "fast" if it's reasonable (e.g. < 48 hours, > 4 hours)
        if (diffHours > maxFastHours && diffHours < 48) {
          maxFastHours = diffHours;
        }
      }
    }

    return Math.round(maxFastHours * 10) / 10;
  };

  const handleQuestionSubmit = async () => {
    if (!authUser) return;

    setIsGeneratingInsight(true);
    setCurrentAIResponse(null);
    setError(null);

    try {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - DATA_FETCH_LIMIT_DAYS);

      const timelineEntriesColRef = collection(db, 'users', authUser.uid, 'timelineEntries');

      let foodLogQuery;
      let symptomLogQuery;

      const isPremium = userProfile?.premium || TEMPORARILY_UNLOCK_ALL_FEATURES;

      if (isPremium) {
        foodLogQuery = query(timelineEntriesColRef, where('entryType', 'in', ['food', 'manual_macro']), where('timestamp', '>=', Timestamp.fromDate(startDate)), orderBy('timestamp', 'desc'));
        symptomLogQuery = query(timelineEntriesColRef, where('entryType', '==', 'symptom'), where('timestamp', '>=', Timestamp.fromDate(startDate)), orderBy('timestamp', 'desc'));
      } else {
        const freeUserStartDate = new Date(now);
        freeUserStartDate.setDate(now.getDate() - 7);
        foodLogQuery = query(timelineEntriesColRef, where('entryType', 'in', ['food', 'manual_macro']), where('timestamp', '>=', Timestamp.fromDate(freeUserStartDate)), orderBy('timestamp', 'desc'), limit(50));
        symptomLogQuery = query(timelineEntriesColRef, where('entryType', '==', 'symptom'), where('timestamp', '>=', Timestamp.fromDate(freeUserStartDate)), orderBy('timestamp', 'desc'), limit(20));
      }

      const [foodLogSnapshot, symptomLogSnapshot, fitbitLogSnapshot, pedometerLogSnapshot] = await Promise.all([
        getDocs(foodLogQuery),
        getDocs(symptomLogQuery),
        getDocs(query(timelineEntriesColRef, where('entryType', '==', 'fitbit_data'), where('timestamp', '>=', Timestamp.fromDate(startDate)), orderBy('timestamp', 'desc'))),
        getDocs(query(timelineEntriesColRef, where('entryType', '==', 'pedometer_data'), where('timestamp', '>=', Timestamp.fromDate(startDate)), orderBy('timestamp', 'desc')))
      ]);

      const foodLogData: LoggedFoodItem[] = foodLogSnapshot.docs.map(d => {
        const data = d.data();
        let timestamp;
        if (data.timestamp && typeof (data.timestamp as Timestamp).toDate === 'function') {
          timestamp = (data.timestamp as Timestamp).toDate();
        } else {
          console.warn(`Invalid or missing timestamp for food item ${d.id}, using current date as fallback.`);
          timestamp = new Date();
        }
        return { ...data, id: d.id, timestamp } as LoggedFoodItem;
      }).filter(item => item.timestamp);

      const fitbitLogData = fitbitLogSnapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          timestamp: (data.timestamp as Timestamp).toDate(),
          steps: data.steps,
          caloriesBurned: data.caloriesBurned
        };
      });

      const pedometerLogData = pedometerLogSnapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          timestamp: (data.timestamp as Timestamp).toDate(),
          steps: data.steps ?? 0,
          activeEnergy: data.activeEnergy ?? 0
        };
      });

      const maxFastingWindowHours = calculateMaxFastingWindow(foodLogData);

      // EXTRACTED TIME ALGORITHMS
      // 1. Time of Day Context
      const currentHour = now.getHours();
      let timeOfDaySegment = "Afternoon";
      if (currentHour >= 5 && currentHour < 12) timeOfDaySegment = "Morning";
      else if (currentHour >= 12 && currentHour < 17) timeOfDaySegment = "Afternoon";
      else if (currentHour >= 17 && currentHour < 22) timeOfDaySegment = "Evening";
      else timeOfDaySegment = "Late Night";



      // 2. Time Since Last Meal & Fasting Projection
      let hoursSinceLastMeal = 0;
      let projectedFastingEndTimes = undefined;

      // Filter logs for significant calorie intake to determine "Last Meal"
      const significantFoodLogs = foodLogData.filter(log => (log.calories || 0) >= FASTING_CALORIE_THRESHOLD);

      if (significantFoodLogs.length > 0) {
        // Sort descending to find most recent
        const sortedFood = [...significantFoodLogs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const lastMeal = sortedFood[0];
        const diffMs = now.getTime() - lastMeal.timestamp.getTime();
        hoursSinceLastMeal = Number((diffMs / (1000 * 60 * 60)).toFixed(1));

        // Calculate Projected End Times if fasting started after last meal
        if (hoursSinceLastMeal > 0) {
          const end16h = addHours(lastMeal.timestamp, 16);
          const endMax = addHours(lastMeal.timestamp, maxFastingWindowHours || 12); // Default to 12 if no max recorded

          projectedFastingEndTimes = {
            target16h: end16h.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            targetMax: endMax.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          };
        }
      }

      const symptomLogData: SymptomLog[] = symptomLogSnapshot.docs.map(d => {
        const data = d.data();
        let timestamp;
        if (data.timestamp && typeof (data.timestamp as Timestamp).toDate === 'function') {
          timestamp = (data.timestamp as Timestamp).toDate();
        } else {
          console.warn(`Invalid or missing timestamp for symptom log ${d.id}, using current date as fallback.`);
          timestamp = new Date();
        }
        return { ...data, id: d.id, timestamp } as SymptomLog;
      }).filter(item => item.timestamp);

      const processedFoodLog = foodLogData.map(item => ({
        name: item.name,
        originalName: item.originalName ?? undefined,
        ingredients: item.ingredients,
        portionSize: item.portionSize,
        portionUnit: item.portionUnit,
        // Format as Local Time String for AI
        timestamp: item.timestamp.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        overallFodmapRisk: item.fodmapData?.overallRisk ?? undefined,
        calories: item.calories ?? undefined,
        protein: item.protein ?? undefined,
        carbs: item.carbs ?? undefined,
        fat: item.fat ?? undefined,
        userFeedback: item.userFeedback,
        sourceDescription: item.sourceDescription ?? undefined
      }));

      const processedSymptomLog = symptomLogData.map(symptomEntry => {
        let finalLinkedIds: string[] = [];
        const rawLinkedIds = symptomEntry.linkedFoodItemIds;

        if (Array.isArray(rawLinkedIds)) {
          finalLinkedIds = rawLinkedIds.filter(id => typeof id === 'string' && id.trim().length > 0);
        }

        return {
          symptoms: symptomEntry.symptoms.map(s => ({ name: s.name })),
          severity: symptomEntry.severity ?? undefined,
          notes: symptomEntry.notes ?? undefined,
          timestamp: symptomEntry.timestamp.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          linkedFoodItemIds: finalLinkedIds.length > 0 ? finalLinkedIds : undefined,
        };
      });

      // Calculate Daily Totals for "Today" (Local Time)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todaysLogs = foodLogData.filter(item => {
        return item.timestamp >= startOfToday;
      });

      const dailyTotals = todaysLogs.reduce((acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      // --- Trend Analysis Calculation ---
      const tdee = userProfile?.profile?.tdee || 2000;

      // Group all logs by day to calculate daily totals for the period
      const logsByDate: { [key: string]: number } = {};
      const stepsByDate: { [key: string]: number } = {};

      foodLogData.forEach(item => {
        // Use formatISO to match the consistent YYYY-MM-DD format used throughout the app
        const dateKey = formatISO(item.timestamp, { representation: 'date' });
        if (!logsByDate[dateKey]) logsByDate[dateKey] = 0;
        logsByDate[dateKey] += (item.calories || 0);
      });

      // MERGE Fitbit and Pedometer Data based on MAX steps for the day
      fitbitLogData.forEach(item => {
        const dateKey = formatISO(item.timestamp, { representation: 'date' });
        if (!stepsByDate[dateKey] || item.steps > stepsByDate[dateKey]) {
          stepsByDate[dateKey] = item.steps || 0;
        }
      });

      pedometerLogData.forEach(item => {
        const dateKey = formatISO(item.timestamp, { representation: 'date' });
        // Only override if pedometer has MORE steps (assumes user carries phone more or watch died, or prefer highest count)
        if (!stepsByDate[dateKey] || item.steps > stepsByDate[dateKey]) {
          stepsByDate[dateKey] = item.steps || 0;
        }
      });

      // Sort day keys chronologically to easily slice the last 7 days
      // Keys are now YYYY-MM-DD, so string sort works perfectly
      const allDayKeys = Object.keys(logsByDate).sort();

      // Filter for LAST 7 DAYS only to match user's "recent" mental model and charts
      const RECENT_WINDOW_DAYS = 7;
      const recentDayKeys = allDayKeys.slice(-RECENT_WINDOW_DAYS);

      const totalDaysAnalyzed = recentDayKeys.length;
      let cumulativeNetCalories = 0;
      let cumulativeNetCaloriesWithGuardrail = 0;
      let daysOverCalorieTarget = 0;
      let totalCaloriesConsumedPeriod = 0;

      let optimalFluxDays = 0;
      let grindDays = 0;
      let sedentaryStorageDays = 0;
      let metabolicStagnationDays = 0;
      const STEP_THRESHOLD = 7500;

      // Prepare data for regression { steps, calories }
      const regressionPoints: { steps: number, calories: number }[] = [];

      console.log("Flux Zone Debug - Recent Days:", recentDayKeys);

      recentDayKeys.forEach(date => {
        const dayCals = logsByDate[date];
        const daySteps = stepsByDate[date] || 0;
        totalCaloriesConsumedPeriod += dayCals;

        console.log(`Date: ${date}, Cals: ${dayCals}, Steps: ${daySteps}, TDEE: ${tdee}`);

        // Standard Cumulative Net
        cumulativeNetCalories += (tdee - dayCals);

        // Guardrailed Cumulative Net (< 800 kcal ignored)
        if (dayCals >= 800) {
          cumulativeNetCaloriesWithGuardrail += (tdee - dayCals);
        }

        if (dayCals > tdee) {
          daysOverCalorieTarget++;
        }

        // Regression Data Point & Flux Zone Calculation
        if (dayCals > 0) { // Only analyze days with food logs
          if (daySteps > 0) {
            regressionPoints.push({ steps: daySteps, calories: dayCals });
          }

          // Flux Zone Logic
          // Use exact same threshold as the Chart
          const isHighActivity = daySteps >= STEP_THRESHOLD;
          const isHighCalorie = dayCals >= tdee;

          if (isHighActivity && isHighCalorie) optimalFluxDays++;
          else if (isHighActivity && !isHighCalorie) grindDays++;
          else if (!isHighActivity && isHighCalorie) sedentaryStorageDays++;
          else metabolicStagnationDays++;
        }
      });

      // Calculate Regression Slope based on RECENT window
      let slope = 0;
      let slopeStrength = "None";

      if (regressionPoints.length >= 2) {
        const n = regressionPoints.length;
        const sumX = regressionPoints.reduce((acc, p) => acc + p.steps, 0);
        const sumY = regressionPoints.reduce((acc, p) => acc + p.calories, 0);
        const sumXY = regressionPoints.reduce((acc, p) => acc + (p.steps * p.calories), 0);
        const sumXX = regressionPoints.reduce((acc, p) => acc + (p.steps * p.steps), 0);

        const denominator = (n * sumXX - sumX * sumX);
        if (denominator !== 0) {
          slope = (n * sumXY - sumX * sumY) / denominator;
        }

        if (Math.abs(slope) < 0.05) slopeStrength = "None/Negligible";
        else if (slope > 0) slopeStrength = slope > 0.15 ? "Strong Positive" : "Weak Positive";
        else slopeStrength = slope < -0.15 ? "Strong Negative" : "Weak Negative";
      }

      const averageDailyCalories = totalDaysAnalyzed > 0 ? Math.round(totalCaloriesConsumedPeriod / totalDaysAnalyzed) : 0;

      const aiInput: PersonalizedDietitianInput = {
        userQuestion: PREDEFINED_QUESTION,
        foodLog: processedFoodLog as any,
        symptomLog: processedSymptomLog as any,
        userProfile: userProfile ? {
          displayName: userProfile.displayName ?? undefined,
          safeFoods: userProfile.safeFoods.map(sf => ({ name: sf.name, portionSize: sf.portionSize, portionUnit: sf.portionUnit })),
          premium: userProfile.premium ?? undefined,
          goal: userProfile.profile?.goal,
          dietaryPreferences: userProfile.profile?.dietaryPreferences,
          activityLevel: userProfile.profile?.activityLevel,
          tdee: userProfile.profile?.tdee,
          bmr: userProfile.profile?.bmr,
          currentWeight: userProfile.profile?.weight,
          maxFastingWindowHours: maxFastingWindowHours
        } : undefined,
        currentLocalTime: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        timeOfDaySegment: timeOfDaySegment,
        hoursSinceLastMeal: hoursSinceLastMeal,
        projectedFastingEndTimes: projectedFastingEndTimes,
        dailyTotals: dailyTotals,
        trendsAnalysis: {
          cumulativeNetCalories: Math.round(cumulativeNetCalories),
          cumulativeNetCaloriesWithGuardrail: Math.round(cumulativeNetCaloriesWithGuardrail),
          calorieStepCorrelationSlope: Number(slope.toFixed(4)),
          calorieStepCorrelationStrength: slopeStrength,
          daysOverCalorieTarget: daysOverCalorieTarget,
          totalDaysAnalyzed: totalDaysAnalyzed,
          averageDailyCalories: averageDailyCalories,
          dailyCalorieTarget: tdee,
          fluxZones: {
            optimalFluxDays,
            grindDays,
            sedentaryStorageDays,
            metabolicStagnationDays
          }
        }
      };

      const result = await getPersonalizedDietitianInsight(aiInput);
      setCurrentAIResponse(result.aiResponse);

    } catch (err: any) {
      console.error("Error getting AI insight:", err);
      setError("Sorry, I couldn't generate an insight. Please try again or rephrase.");
      setCurrentAIResponse(null);
    } finally {
      setIsGeneratingInsight(false);
    }
  };



  const handleDiscardInsight = () => {
    setCurrentAIResponse(null);
    toast({ title: "Insight Discarded", description: "The response has been cleared." });
  };


  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-foreground">Loading GutCheck Assistant...</p>
        </div>
      </div>
    );
  }

  if (error && !isGeneratingInsight) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <Brain className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-foreground">Insights Unavailable</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/?openDashboard=true">
                <Home className="mr-2 h-4 w-4" /> Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar hideFloatingActionMenu={true} />
      <main className="flex-1 flex flex-col overflow-hidden container mx-auto px-0 sm:px-4 py-0">
        <div className="p-4 border-b border-border text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center">
            <Sparkles className="mr-2 h-7 w-7 text-primary" /> Your Personal Dietitian
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1 max-w-2xl mx-auto">
            Get personalized insights based on your goals, trends, and daily logs by asking: <br />
            <em className="text-primary/90">&quot;{PREDEFINED_QUESTION}&quot;</em>
          </p>
        </div>

        <div
          className="flex-1 p-4 overflow-y-auto"
          ref={scrollAreaRef}
          onScroll={() => { }}
        >
          <div className="space-y-6">
            {currentAIResponse && !isGeneratingInsight && (
              <Card className="bg-green-500/10 border-green-500/30 shadow-lg">
                <CardHeader className="pb-2 pt-3 px-4">
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 opacity-80" /> GutCheck Assistant replied:
                  </p>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                    <ReactMarkdown>{currentAIResponse}</ReactMarkdown>
                  </div>
                </CardContent>
                <CardFooter className="px-4 pb-3 pt-2 flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleDiscardInsight} className="text-sm">
                    <ThumbsDown className="h-4 w-4 mr-1.5" /> Discard
                  </Button>
                </CardFooter>
              </Card>
            )}
            {isGeneratingInsight && (
              <div className="flex items-center justify-center p-6 bg-muted/50 rounded-md">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
                <p className="text-foreground">GutCheck Assistant is analyzing your day...</p>
              </div>
            )}
            {error && isGeneratingInsight && (
              <p className="text-destructive text-sm text-center p-2">{error}</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border bg-background space-y-3">
          <Button
            onClick={handleQuestionSubmit}
            disabled={isGeneratingInsight}
            className="w-full h-auto px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 text-base"
            size="lg"
          >
            <Brain className="h-5 w-5 mr-2" />
            Get Today&apos;s Analysis & Recommendations
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/?openDashboard=true">
              <Home className="mr-2 h-4 w-4" /> Return to Dashboard
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
