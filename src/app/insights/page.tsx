
'use client';

import { formatISO, addHours } from 'date-fns';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Navbar from '@/components/shared/Navbar';
import { Loader2, Brain, ThumbsDown, Home, Send, User } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import Image from 'next/image';

const TEMPORARILY_UNLOCK_ALL_FEATURES = true;
const DATA_FETCH_LIMIT_DAYS = 90;
const PREDEFINED_QUESTION = "What do you think about my food today so far and what would you recommend for the rest of today?";
const FASTING_CALORIE_THRESHOLD = 5;

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
      setError("Please log in to chat with your assistant.");
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
        setError("Could not load your profile.");
      }
    };

    fetchUserProfileData();
  }, [authUser, authLoading]);

  // [Fast Calcs omitted for brevity - kept same logic]
  const calculateMaxFastingWindow = (logs: LoggedFoodItem[]): number => {
    const fastingLogs = logs.filter(log => (log.calories || 0) >= FASTING_CALORIE_THRESHOLD);
    if (fastingLogs.length < 2) return 0;
    const sortedLogs = [...fastingLogs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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
        const lastMeal = currentDayLogs[currentDayLogs.length - 1];
        const firstMeal = nextDayLogs[0];
        const diffMs = firstMeal.timestamp.getTime() - lastMeal.timestamp.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours > maxFastHours && diffHours < 48) {
          maxFastHours = diffHours;
        }
      }
    }
    return Math.round(maxFastHours * 10) / 10;
  };

  const calculateRecentFastingWindows = (logs: LoggedFoodItem[]): { date: string, durationHours: number }[] => {
    const fastingLogs = logs.filter(log => (log.calories || 0) >= FASTING_CALORIE_THRESHOLD);
    if (fastingLogs.length < 2) return [];
    const sortedLogs = [...fastingLogs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const logsByDay: { [key: string]: LoggedFoodItem[] } = {};
    sortedLogs.forEach(log => {
      const dayKey = log.timestamp.toLocaleDateString();
      if (!logsByDay[dayKey]) logsByDay[dayKey] = [];
      logsByDay[dayKey].push(log);
    });
    const dayKeys = Object.keys(logsByDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const recentWindows: { date: string, durationHours: number }[] = [];
    for (let i = 0; i < dayKeys.length - 1; i++) {
      const currentDayLogs = logsByDay[dayKeys[i]];
      const nextDayLogs = logsByDay[dayKeys[i + 1]];
      if (currentDayLogs.length > 0 && nextDayLogs.length > 0) {
        const lastMeal = currentDayLogs[currentDayLogs.length - 1];
        const firstMeal = nextDayLogs[0];
        const diffMs = firstMeal.timestamp.getTime() - lastMeal.timestamp.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours > 4 && diffHours < 48) {
          recentWindows.push({
            date: firstMeal.timestamp.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            durationHours: Math.round(diffHours * 10) / 10
          });
        }
      }
    }
    return recentWindows.slice(-7);
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
          timestamp = new Date();
        }
        return { ...data, id: d.id, timestamp } as LoggedFoodItem;
      }).filter(item => item.timestamp);

      const fitbitLogData = fitbitLogSnapshot.docs.map(d => {
        const data = d.data();
        return { ...data, id: d.id, timestamp: (data.timestamp as Timestamp).toDate(), steps: data.steps, caloriesBurned: data.caloriesBurned };
      });

      const pedometerLogData = pedometerLogSnapshot.docs.map(d => {
        const data = d.data();
        return { ...data, id: d.id, timestamp: (data.timestamp as Timestamp).toDate(), steps: data.steps ?? 0, activeEnergy: data.activeEnergy ?? 0 };
      });

      const maxFastingWindowHours = calculateMaxFastingWindow(foodLogData);
      const recentFastingWindows = calculateRecentFastingWindows(foodLogData);

      const currentHour = now.getHours();
      let timeOfDaySegment = "Afternoon";
      if (currentHour >= 5 && currentHour < 12) timeOfDaySegment = "Morning";
      else if (currentHour >= 12 && currentHour < 17) timeOfDaySegment = "Afternoon";
      else if (currentHour >= 17 && currentHour < 22) timeOfDaySegment = "Evening";
      else timeOfDaySegment = "Late Night";

      let hoursSinceLastMeal = 0;
      let projectedFastingEndTimes = undefined;

      const significantFoodLogs = foodLogData.filter(log => (log.calories || 0) >= FASTING_CALORIE_THRESHOLD);
      if (significantFoodLogs.length > 0) {
        const sortedFood = [...significantFoodLogs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const lastMeal = sortedFood[0];
        const diffMs = now.getTime() - lastMeal.timestamp.getTime();
        hoursSinceLastMeal = Number((diffMs / (1000 * 60 * 60)).toFixed(1));

        if (hoursSinceLastMeal > 2) {
          const end16h = addHours(lastMeal.timestamp, 16);
          const endMax = addHours(lastMeal.timestamp, maxFastingWindowHours || 12);
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
        } else { timestamp = new Date(); }
        return { ...data, id: d.id, timestamp } as SymptomLog;
      }).filter(item => item.timestamp);

      const processedFoodLog = foodLogData.map(item => ({
        name: item.name,
        originalName: item.originalName,
        ingredients: item.ingredients,
        portionSize: item.portionSize,
        portionUnit: item.portionUnit,
        timestamp: item.timestamp.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
        overallFodmapRisk: item.fodmapData?.overallRisk,
        calories: item.calories ?? 0,
        protein: item.protein ?? 0,
        carbs: item.carbs ?? 0,
        fat: item.fat ?? 0,
        userFeedback: item.userFeedback,
        sourceDescription: item.sourceDescription
      }));

      const processedSymptomLog = symptomLogData.map(symptomEntry => {
        const rawLinkedIds = symptomEntry.linkedFoodItemIds;
        const finalLinkedIds = Array.isArray(rawLinkedIds) ? rawLinkedIds.filter(id => typeof id === 'string' && id.trim().length > 0) : [];
        return {
          symptoms: symptomEntry.symptoms.map(s => ({ name: s.name })),
          severity: symptomEntry.severity,
          notes: symptomEntry.notes,
          timestamp: symptomEntry.timestamp.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
          linkedFoodItemIds: finalLinkedIds.length > 0 ? finalLinkedIds : undefined,
        };
      });

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todaysLogs = foodLogData.filter(item => item.timestamp >= startOfToday);
      const dailyTotals = todaysLogs.reduce((acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const tdee = userProfile?.profile?.tdee || 2000;
      const logsByDate: { [key: string]: number } = {};
      const stepsByDate: { [key: string]: number } = {};
      foodLogData.forEach(item => {
        const dateKey = formatISO(item.timestamp, { representation: 'date' });
        if (!logsByDate[dateKey]) logsByDate[dateKey] = 0;
        logsByDate[dateKey] += (item.calories || 0);
      });
      fitbitLogData.forEach(item => {
        const dateKey = formatISO(item.timestamp, { representation: 'date' });
        if (!stepsByDate[dateKey] || item.steps > stepsByDate[dateKey]) stepsByDate[dateKey] = item.steps || 0;
      });
      pedometerLogData.forEach(item => {
        const dateKey = formatISO(item.timestamp, { representation: 'date' });
        if (!stepsByDate[dateKey] || item.steps > stepsByDate[dateKey]) stepsByDate[dateKey] = item.steps || 0;
      });
      const allDayKeys = Object.keys(logsByDate).sort();
      const recentDayKeys = allDayKeys.slice(-7);
      const totalDaysAnalyzed = recentDayKeys.length;
      let cumulativeNetCalories = 0;
      let cumulativeNetCaloriesWithGuardrail = 0;
      let daysOverCalorieTarget = 0;
      let totalCaloriesConsumedPeriod = 0;
      let optimalFluxDays = 0, grindDays = 0, sedentaryStorageDays = 0, metabolicStagnationDays = 0;
      const STEP_THRESHOLD = 7500;
      const regressionPoints: { steps: number, calories: number }[] = [];

      recentDayKeys.forEach(date => {
        const dayCals = logsByDate[date];
        const daySteps = stepsByDate[date] || 0;
        totalCaloriesConsumedPeriod += dayCals;
        cumulativeNetCalories += (tdee - dayCals);
        if (dayCals >= 800) cumulativeNetCaloriesWithGuardrail += (tdee - dayCals);
        if (dayCals > tdee) daysOverCalorieTarget++;
        if (dayCals > 0) {
          if (daySteps > 0) regressionPoints.push({ steps: daySteps, calories: dayCals });
          const isHighActivity = daySteps >= STEP_THRESHOLD;
          const isHighCalorie = dayCals >= tdee;
          if (isHighActivity && isHighCalorie) optimalFluxDays++;
          else if (isHighActivity && !isHighCalorie) grindDays++;
          else if (!isHighActivity && isHighCalorie) sedentaryStorageDays++;
          else metabolicStagnationDays++;
        }
      });

      let slope = 0;
      let slopeStrength = "None";
      if (regressionPoints.length >= 2) {
        const n = regressionPoints.length;
        const sumX = regressionPoints.reduce((acc, p) => acc + p.steps, 0);
        const sumY = regressionPoints.reduce((acc, p) => acc + p.calories, 0);
        const sumXY = regressionPoints.reduce((acc, p) => acc + (p.steps * p.calories), 0);
        const sumXX = regressionPoints.reduce((acc, p) => acc + (p.steps * p.steps), 0);
        const denominator = (n * sumXX - sumX * sumX);
        if (denominator !== 0) slope = (n * sumXY - sumX * sumY) / denominator;
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
        recentFastingWindows: recentFastingWindows,
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
          fluxZones: { optimalFluxDays, grindDays, sedentaryStorageDays, metabolicStagnationDays }
        }
      };

      const result = await getPersonalizedDietitianInsight(aiInput);
      setCurrentAIResponse(result.aiResponse);
    } catch (err: any) {
      console.error("Error getting AI insight:", err);
      setError("I'm momentarily stuck. Give me another moment?");
      setCurrentAIResponse(null);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const handleDiscardInsight = () => {
    setCurrentAIResponse(null);
    toast({ title: "Insight Discarded", description: "Response cleared." });
  };

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error && !isGeneratingInsight) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <div className="h-24 w-24 relative mb-4">
            <Image src="/smart.png" alt="Assistant" fill className="rounded-full object-cover border-4 border-muted/50 grayscale opacity-50" />
          </div>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild variant="outline">
            <Link href="/?openDashboard=true">
              <Home className="mr-2 h-4 w-4" /> Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar hideFloatingActionMenu={true} />
      <main className="flex-1 flex flex-col overflow-hidden container mx-auto px-0 sm:px-4 py-0 relative">

        {/* Header - Conversational & Fun */}
        <div className="p-4 pt-6 text-center space-y-2">
          <div className="h-20 w-20 relative mx-auto shadow-xl rounded-full ring-4 ring-background">
            <Image
              src="/smart.png"
              alt="Smart Assistant"
              fill
              className="rounded-full object-cover"
            />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Hey {userProfile?.displayName?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            I've been analyzing your logs. Tap below to see what I've got to tell you!
          </p>
        </div>

        {/* Chat Area */}
        <div
          className="flex-1 p-4 overflow-y-auto"
          ref={scrollAreaRef}
        >
          <div className="max-w-2xl mx-auto space-y-6">

            {/* AI Response Bubble */}
            {currentAIResponse && !isGeneratingInsight && (
              <div className="flex items-start gap-3 fade-in-up">
                <Avatar className="h-10 w-10 mt-1 border border-border shadow-sm shrink-0">
                  <AvatarImage src="/smart.png" className="object-cover" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 max-w-[85%]">
                  <div className="bg-secondary/10 text-foreground p-4 rounded-2xl rounded-tl-sm shadow-sm border border-border/50 text-sm leading-relaxed">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{currentAIResponse}</ReactMarkdown>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={handleDiscardInsight} className="text-xs text-muted-foreground h-auto p-1 hover:bg-transparent hover:text-destructive">
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State - Conversational */}
            {isGeneratingInsight && (
              <div className="flex items-center justify-center p-8 opacity-80">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-muted-foreground animate-pulse">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Area */}
        <div className="p-4 pb-8 bg-background/80 backdrop-blur-sm border-t border-border z-10">
          <div className="max-w-md mx-auto space-y-3">
            <Button
              onClick={handleQuestionSubmit}
              disabled={isGeneratingInsight}
              className={cn(
                "w-full h-14 rounded-full shadow-lg transition-all active:scale-95 text-lg font-medium",
                "bg-gradient-to-r from-primary to-primary/80 hover:to-primary"
              )}
            >
              Check In with Me
            </Button>

            <Button asChild variant="ghost" className="w-full text-muted-foreground btn-ghost-hover">
              <Link href="/?openDashboard=true">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
