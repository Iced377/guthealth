
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/config/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { TimelineEntry, LoggedFoodItem, SymptomLog, TimeRange, MacroPoint, CaloriePoint, SafetyPoint, GIPoint, HourlyCaloriePoint, HourlyMealCountPoint, SymptomFrequency, MicronutrientDetail, MicronutrientAchievement, UserProfile, FitbitLog, WeightPoint, ActivityPoint, PedometerLog } from '@/types';
import { COMMON_SYMPTOMS } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MouseEvent, useCallback } from 'react';

import Navbar from '@/components/shared/Navbar';
import TimeRangeToggle from '@/components/trends/TimeRangeToggle';
import DailyMacrosTrendChart from '@/components/trends/DailyMacrosTrendChart';
import DailyCaloriesTrendChart from '@/components/trends/DailyCaloriesTrendChart';
import CumulativeCalorieChangeChart from '@/components/trends/CumulativeCalorieChangeChart';
import LoggedSafetyTrendChart from '@/components/trends/LoggedSafetyTrendChart';
import SymptomOccurrenceChart from '@/components/trends/SymptomOccurrenceChart';
import GITrendChart from '@/components/trends/GITrendChart';
import HourlyCaloriesChart from '@/components/trends/HourlyCaloriesChart';
import HourlyMealCountChart from '@/components/trends/HourlyMealCountChart';
import WeightTrendChart from '@/components/trends/WeightTrendChart';
import ActivityTrendChart from '@/components/trends/ActivityTrendChart';
import MicronutrientAchievementList from '@/components/trends/MicronutrientAchievementList';
import PedometerImportDialog from '@/components/trends/PedometerImportDialog';
import CaloriesStepsCorrelationChart, { CorrelationPoint } from '@/components/trends/CaloriesStepsCorrelationChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, BarChart3, Award, Zap, Bug } from 'lucide-react';
import { subDays, subMonths, subYears, formatISO, startOfDay, endOfDay, parseISO, getHours, format } from 'date-fns';
import { useSearchParams } from 'next/navigation';

// --- TEMPORARY FEATURE UNLOCK FLAG ---
const TEMPORARILY_UNLOCK_ALL_FEATURES = true; // Kept true as per previous state
// --- END TEMPORARY FEATURE UNLOCK FLAG ---

export default function TrendsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isDarkMode } = useTheme(); // Removed currentTheme as it's no longer used for charts
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30D');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    setError(null);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      let isPremium = false;
      if (userDocSnap.exists()) {
        const profileData = userDocSnap.data() as UserProfile;
        setUserProfile(profileData);
        isPremium = profileData.premium || false;
      } else {
        setUserProfile({ uid: user.uid, email: user.email, displayName: user.displayName, safeFoods: [], premium: false });
      }

      const entriesColRef = collection(db, 'users', user.uid, 'timelineEntries');
      let q;

      if (TEMPORARILY_UNLOCK_ALL_FEATURES || isPremium) {
        q = query(entriesColRef, orderBy('timestamp', 'desc'));
      } else {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        q = query(entriesColRef, orderBy('timestamp', 'desc'), where('timestamp', '>=', Timestamp.fromDate(twoDaysAgo)));
      }

      const querySnapshot = await getDocs(q);
      const fetchedEntries: TimelineEntry[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          timestamp: (data.timestamp as Timestamp).toDate(),
        } as TimelineEntry;
      });
      setTimelineEntries(fetchedEntries);
    } catch (err: any) {
      console.error("Error fetching timeline data for trends:", err);
      setError("Could not load your data for trend analysis. Please try again later.");
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoadingData(false);
      return;
    }
    fetchData();
  }, [user, authLoading, fetchData]);

  const syncFitbitData = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      toast({
        title: 'Syncing Fitbit...',
        description: 'Fetching your weight and activity data.',
      });

      const res = await fetch('/api/fitbit/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (!res.ok) throw new Error("Sync failed");

      toast({
        title: 'Sync Complete!',
        description: 'Your dashboard has been updated.',
        variant: 'default'
      });
      fetchData(); // Reload data
    } catch (err) {
      console.error("Fitbit sync error:", err);
      toast({
        title: 'Sync Error',
        description: 'Could not fetch Fitbit data.',
        variant: 'destructive'
      });
    }
  }, [user, toast, fetchData]);

  useEffect(() => {
    const fitbitStatus = searchParams.get('fitbit');
    if (fitbitStatus === 'success') {
      toast({
        title: 'Fitbit Connected!',
        description: 'Your Fitbit account has been successfully linked.',
        variant: 'default',
      });
      // Trigger sync automatically
      syncFitbitData();
    } else if (fitbitStatus === 'error') {
      const message = searchParams.get('message');
      toast({
        title: 'Fitbit Connection Failed',
        description: message ? `Error: ${decodeURIComponent(message)}` : 'There was a problem linking your Fitbit account. Please try again.',
        variant: 'destructive',
      });
    } else if (user) {
      // Auto-sync on load (incremental, handled by API rate limiting)
      // We only trigger this if we think user IS connected. 
      // We don't verify connection state client-side cheaply without profile fetch, 
      // but `syncFitbitData` handles 404 gracefully?
      // Let's rely on syncFitbitData to fail silently or we can assume if they visited this page they might want data.
      // Better: Only auto-sync if we have *some* fitbit data logic or just try it.
      // For now, attempting silent background sync.
      syncFitbitDataWithoutToast();
    }
  }, [searchParams, toast, syncFitbitData, user]);

  const syncFitbitDataWithoutToast = useCallback(async () => {
    // Background sync - no blocking UI, no success toast (unless new data?), no error toast (fail silent)
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/fitbit/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      // After silent sync, reload data
      fetchData();
    } catch (e) {
      // Silent fail
      console.warn("Background fitbit sync failed/skipped", e);
    }
  }, [user, fetchData]);

  const handleDebugSync = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch('/api/fitbit/debug', {
        method: 'POST',
        body: JSON.stringify({ idToken, clientTimezone })
      });
      const data = await res.json();
      console.log("DEBUG RESPONSE:", data);
      alert(JSON.stringify(data, null, 2)); // Simple alert for immediate visibility
    } catch (e) {
      alert("Debug failed");
    }
  };

  const handleConnectFitbit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/fitbit/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Fitbit connection');
      }

      const { url } = await response.json();
      console.log("Redirecting to Fitbit URL:", url);
      window.location.href = url;
    } catch (error) {
      console.error("Error connecting to Fitbit:", error);
      alert(`Debug Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: 'Connection Error',
        description: `Failed to start Fitbit connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';


  const filteredEntries = useMemo(() => {
    if (timelineEntries.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (selectedTimeRange) {
      case '1D':
        startDate = startOfDay(now);
        break;
      case '7D':
        startDate = startOfDay(subDays(now, 7));
        break;
      case '30D':
        startDate = startOfDay(subDays(now, 30));
        break;
      case '90D':
        startDate = startOfDay(subDays(now, 90));
        break;
      case '1Y':
        startDate = startOfDay(subYears(now, 1));
        break;
      case 'ALL':
      default:
        return timelineEntries;
    }

    const endDate = endOfDay(now);

    return timelineEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, [timelineEntries, selectedTimeRange]);


  const aggregateDataByDay = <T extends { calories?: number | null; protein?: number | null; carbs?: number | null; fat?: number | null; userFeedback?: 'safe' | 'unsafe' | null }>(
    entries: (LoggedFoodItem & T)[],
    mapper: (date: string, itemsOnDate: (LoggedFoodItem & T)[]) => any
  ) => {
    const groupedByDay: Record<string, (LoggedFoodItem & T)[]> = {};
    entries.forEach(entry => {
      if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
        const dayKey = formatISO(new Date(entry.timestamp), { representation: 'date' });
        if (!groupedByDay[dayKey]) {
          groupedByDay[dayKey] = [];
        }
        groupedByDay[dayKey].push(entry);
      }
    });

    const sortedDays = Object.keys(groupedByDay).sort((a, b) => parseISO(a).getTime() - parseISO(b).getTime());
    return sortedDays.map(dayKey => mapper(dayKey, groupedByDay[dayKey]));
  };

  const macroData = useMemo<MacroPoint[]>(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro') as LoggedFoodItem[];
    return aggregateDataByDay(foodEntries, (date, items) => ({
      date,
      protein: items.reduce((sum, item) => sum + (item.protein ?? 0), 0),
      carbs: items.reduce((sum, item) => sum + (item.carbs ?? 0), 0),
      fat: items.reduce((sum, item) => sum + (item.fat ?? 0), 0),
    }));
  }, [filteredEntries]);



  const calorieData = useMemo<CaloriePoint[]>(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro') as LoggedFoodItem[];
    return aggregateDataByDay(foodEntries, (date, items) => ({
      date,
      calories: items.reduce((sum, item) => sum + (item.calories ?? 0), 0),
    }));
  }, [filteredEntries]);










  const hourlyCaloriesTrendData = useMemo<HourlyCaloriePoint[]>(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro') as LoggedFoodItem[];
    const hourlyCaloriesTotals: Record<number, { sum: number; count: number }> = {};

    foodEntries.forEach(entry => {
      if (entry.calories && entry.calories > 0) {
        const hour = getHours(new Date(entry.timestamp));
        if (!hourlyCaloriesTotals[hour]) {
          hourlyCaloriesTotals[hour] = { sum: 0, count: 0 };
        }
        hourlyCaloriesTotals[hour].sum += entry.calories;
        hourlyCaloriesTotals[hour].count += 1;
      }
    });

    const result: HourlyCaloriePoint[] = [];
    for (let i = 0; i < 24; i++) {
      const data = hourlyCaloriesTotals[i];
      // Note: We are calculating Average Calories per logged entry for that hour.
      // Alternatively, it could be Sum of calories for that hour across all days (Total Volume per hour),
      // OR Average Daily Calories for that hour (Total / Number of Days in Range).
      // The user request says "y axis shows average calories consumed on that error. use Hourly Glycemic Index (GI) Trend for reference as it would follow the same logic for averaging".
      // GI Trend averages the GI value of the food items.
      // So here we should likely average the calories of the food items logged at that hour.
      // i.e. "When I eat at 2pm, my meals average 500 calories".
      result.push({
        hour: format(new Date(0, 0, 0, i), 'HH:mm'),
        calories: data ? Math.round(data.sum / data.count) : 0,
      });
    }
    return result;
  }, [filteredEntries]);

  const hourlyMealCountData = useMemo<HourlyMealCountPoint[]>(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food') as LoggedFoodItem[];
    const hourlyCounts: Record<number, number> = {};

    foodEntries.forEach(entry => {
      const hour = getHours(new Date(entry.timestamp));
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    const result: HourlyMealCountPoint[] = [];
    for (let i = 0; i < 24; i++) {
      result.push({
        hour: format(new Date(0, 0, 0, i), 'HH:mm'),
        count: hourlyCounts[i] || 0,
      });
    }
    return result;
  }, [filteredEntries]);


  const aggregateGenericByDay = <T extends { timestamp: Date }>(
    entries: T[],
    mapper: (date: string, itemsOnDate: T[]) => any
  ) => {
    const groupedByDay: Record<string, T[]> = {};
    entries.forEach(entry => {
      const dayKey = formatISO(new Date(entry.timestamp), { representation: 'date' });
      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = [];
      }
      groupedByDay[dayKey].push(entry);
    });

    const sortedDays = Object.keys(groupedByDay).sort((a, b) => parseISO(a).getTime() - parseISO(b).getTime());
    return sortedDays.map(dayKey => mapper(dayKey, groupedByDay[dayKey]));
  };

  const weightData = useMemo<WeightPoint[]>(() => {
    const weightEntries = filteredEntries.filter(e => e.entryType === 'fitbit_data') as FitbitLog[];
    return aggregateGenericByDay(weightEntries, (date, items) => {
      const latest = items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      const weight = latest?.weight || 0;
      const fatPercent = latest?.fatPercent;
      const fatMass = (weight && fatPercent) ? (weight * fatPercent / 100) : undefined;
      return {
        date,
        weight,
        fatPercent,
        fatMass
      };
    }).filter(p => p.weight > 0); // Only show days experienced weight
  }, [filteredEntries]);



  const activityData = useMemo<ActivityPoint[]>(() => {
    // Combine Fitbit and Pedometer data
    const activityEntries = filteredEntries.filter(e => e.entryType === 'fitbit_data' || e.entryType === 'pedometer_data') as (FitbitLog | PedometerLog)[];

    return aggregateGenericByDay(activityEntries, (date, items) => {
      // If we have both fitbit and pedometer for same day, we might prioritize one or sum?
      // Typically users use one main source. If both exist, Pedometer++ might be duplicate of Health data.
      // But here user is manually importing.
      // Let's sum them if they are from different sources? Or take max?
      // Safer to take max steps found for the day to avoid double counting if Pedometer++ export overlaps with Fitbit.
      // Or if they are distinct sources, sum?
      // Let's assume distinct and try to merge intelligently. 
      // Actually, simplest logic: Take the entry with highest steps count for the day.
      const maxStepsEntry = items.sort((a, b) => (b.steps || 0) - (a.steps || 0))[0];

      const caloriesBurned = (maxStepsEntry as FitbitLog).caloriesBurned || (maxStepsEntry as PedometerLog).activeEnergy || 0;

      return {
        date,
        steps: maxStepsEntry?.steps || 0,
        burned: caloriesBurned,
      };
    }).filter(p => p.steps > 0);
  }, [filteredEntries]);

  const correlationData = useMemo<CorrelationPoint[]>(() => {
    // Map by date for fast lookup
    const caloriesByDate = new Map(calorieData.map(d => [d.date, d.calories]));

    return activityData.reduce((acc, activity) => {
      const calories = caloriesByDate.get(activity.date);
      if (calories && calories > 0 && activity.steps > 0) {
        acc.push({
          date: activity.date,
          steps: activity.steps,
          calories: calories
        });
      }
      return acc;
    }, [] as CorrelationPoint[]);
  }, [activityData, calorieData]);




  const micronutrientAchievementData = useMemo<MicronutrientAchievement[]>(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro') as LoggedFoodItem[];
    const dailyMicronutrientTotals: Record<string, Record<string, { dv: number, iconName?: string }>> = {};

    foodEntries.forEach(entry => {
      const dayKey = formatISO(new Date(entry.timestamp), { representation: 'date' });
      if (!dailyMicronutrientTotals[dayKey]) {
        dailyMicronutrientTotals[dayKey] = {};
      }

      const microsInfo = entry.fodmapData?.micronutrientsInfo;
      if (microsInfo) {
        const allMicros: MicronutrientDetail[] = [];
        if (microsInfo.notable) allMicros.push(...microsInfo.notable);
        if (microsInfo.fullList) allMicros.push(...microsInfo.fullList);

        allMicros.forEach(micro => {
          if (micro.dailyValuePercent !== undefined) {
            if (!dailyMicronutrientTotals[dayKey][micro.name]) {
              dailyMicronutrientTotals[dayKey][micro.name] = { dv: 0, iconName: micro.iconName };
            }
            dailyMicronutrientTotals[dayKey][micro.name].dv += micro.dailyValuePercent;
            if (micro.iconName && !dailyMicronutrientTotals[dayKey][micro.name].iconName) {
              dailyMicronutrientTotals[dayKey][micro.name].iconName = micro.iconName;
            }
          }
        });
      }
    });

    const achievementCounts: Record<string, { achievedDays: number, iconName?: string }> = {};
    Object.values(dailyMicronutrientTotals).forEach(dayData => {
      Object.entries(dayData).forEach(([nutrientName, data]) => {
        if (data.dv >= 100) {
          if (!achievementCounts[nutrientName]) {
            achievementCounts[nutrientName] = { achievedDays: 0, iconName: data.iconName };
          }
          achievementCounts[nutrientName].achievedDays += 1;
          if (data.iconName && !achievementCounts[nutrientName].iconName) {
            achievementCounts[nutrientName].iconName = data.iconName;
          }
        }
      });
    });

    return Object.entries(achievementCounts)
      .map(([name, data]) => ({ name, achievedDays: data.achievedDays, iconName: data.iconName }))
      .sort((a, b) => b.achievedDays - a.achievedDays);
  }, [filteredEntries]);




  if (authLoading || isLoadingData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-foreground">Loading trends...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to view your trends.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-foreground">Error Loading Trends</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (timelineEntries.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-8 text-center">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2 text-foreground">Trends Dashboard</h1>
          <p className="text-muted-foreground">
            Not enough data yet. Start logging your meals and symptoms to see your trends over time!
            {!TEMPORARILY_UNLOCK_ALL_FEATURES && !userProfile?.premium && " (Free users: trends based on last 2 days of data)"}
          </p>
          <div className="mt-12 text-center">
            <Button asChild variant="outline">
              <Link href="/?openDashboard=true">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Use profile TDEE or default
  const targetCalories = userProfile?.profile?.tdee || 2000;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <ScrollArea className="flex-grow">
        <main className="container mx-auto px-4 py-8 pb-32">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-foreground">Trends Dashboard</h1>
            <div className="flex flex-wrap gap-2 items-center">
              <Button onClick={handleConnectFitbit} disabled={authLoading} type="button" size="sm">
                <Zap className="mr-2 h-4 w-4" /> Connect Fitbit
              </Button>
              <PedometerImportDialog />
            </div>
          </div>
          <div className="mb-8">
            <TimeRangeToggle selectedRange={selectedTimeRange} onRangeChange={setSelectedTimeRange} />
          </div>
          {/* Removed upgrade prompt */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Daily Calorie Intake</CardTitle>
                <p className="text-sm text-muted-foreground">Target: {targetCalories} kcal/day</p>
              </CardHeader>
              <CardContent>
                {calorieData.length > 0 ? (
                  <DailyCaloriesTrendChart
                    data={calorieData}
                    isDarkMode={isDarkMode}
                    targetCalories={targetCalories}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No calorie data for this period.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Cumulative Net Calorie Change</CardTitle>
                <p className="text-sm text-muted-foreground">Running balance vs. Target</p>
              </CardHeader>
              <CardContent>
                {calorieData.length > 0 ? (
                  <CumulativeCalorieChangeChart
                    data={calorieData}
                    isDarkMode={isDarkMode}
                    targetCalories={targetCalories}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">No calorie data to calculate change.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Daily Macronutrient Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {macroData.length > 0 ? <DailyMacrosTrendChart data={macroData} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No macronutrient data for this period.</p>}
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Body Weight Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {weightData.length > 0 ? <WeightTrendChart data={weightData} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No weight data (Sync Fitbit to see).</p>}
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Daily Activity (Steps)</CardTitle>
              </CardHeader>
              <CardContent>
                {activityData.length > 0 ? <ActivityTrendChart data={activityData} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No activity data (Sync Fitbit to see).</p>}
              </CardContent>
            </Card>


            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Hourly Average Calories</CardTitle>
              </CardHeader>
              <CardContent>
                {hourlyCaloriesTrendData.length > 0 ? <HourlyCaloriesChart data={hourlyCaloriesTrendData} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No calorie data available for this period.</p>}
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Meal Timing Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {hourlyMealCountData.length > 0 ? <HourlyMealCountChart data={hourlyMealCountData} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No meal data available for this period (Count: {hourlyMealCountData.length}).</p>}
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Calories vs. Steps Correlation</CardTitle>
              </CardHeader>
              <CardContent>
                {correlationData.length > 0 ? <CaloriesStepsCorrelationChart data={correlationData} isDarkMode={isDarkMode} targetCalories={targetCalories} /> : <p className="text-muted-foreground text-center py-8">Not enough overlapping data (Steps + Calories) to show correlation.</p>}
              </CardContent>
            </Card>



            <Card className="bg-card shadow-lg border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                  <Award className="mr-2 h-6 w-6 text-yellow-500" /> Micronutrient Target Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MicronutrientAchievementList data={micronutrientAchievementData} />
              </CardContent>
            </Card>
          </div>
          <div className="mt-12 text-center">
            <Button asChild variant="outline">
              <Link href="/?openDashboard=true">Return to Dashboard</Link>
            </Button>
          </div>

        </main>
      </ScrollArea>
    </div>
  );
}

const getPathname = () => {
  if (typeof window !== "undefined") {
    return window.location.pathname;
  }
  return "";
};

