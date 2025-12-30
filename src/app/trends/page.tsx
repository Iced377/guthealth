
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/config/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { TimelineEntry, LoggedFoodItem, SymptomLog, TimeRange, MacroPoint, CaloriePoint, SafetyPoint, GIPoint, SymptomFrequency, MicronutrientDetail, MicronutrientAchievement, UserProfile, FitbitLog, WeightPoint, ActivityPoint } from '@/types';
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
import LoggedSafetyTrendChart from '@/components/trends/LoggedSafetyTrendChart';
import SymptomOccurrenceChart from '@/components/trends/SymptomOccurrenceChart';
import GITrendChart from '@/components/trends/GITrendChart';
import WeightTrendChart from '@/components/trends/WeightTrendChart';
import ActivityTrendChart from '@/components/trends/ActivityTrendChart';
import MicronutrientAchievementList from '@/components/trends/MicronutrientAchievementList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, BarChart3, Award, Zap } from 'lucide-react';
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
    }
  }, [searchParams, toast, syncFitbitData]);

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
        startDate = subDays(now, 7);
        break;
      case '30D':
        startDate = subDays(now, 30);
        break;
      case '90D':
        startDate = subDays(now, 90);
        break;
      case '1Y':
        startDate = subYears(now, 1);
        break;
      case 'ALL':
      default:
        return timelineEntries;
    }

    const endDate = selectedTimeRange === '1D' ? endOfDay(now) : now;

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

  const safetyData = useMemo<SafetyPoint[]>(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food') as LoggedFoodItem[];
    return aggregateDataByDay(foodEntries, (date, items) => ({
      date,
      safe: items.filter(item => item.userFeedback === 'safe').length,
      unsafe: items.filter(item => item.userFeedback === 'unsafe').length,
      notMarked: items.filter(item => item.userFeedback === null || item.userFeedback === undefined).length,
    }));
  }, [filteredEntries]);

  const giTrendData = useMemo<GIPoint[]>(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food') as LoggedFoodItem[];
    const hourlyGiTotals: Record<number, { sum: number; count: number }> = {};

    foodEntries.forEach(entry => {
      if (entry.fodmapData?.glycemicIndexInfo?.value) {
        const hour = getHours(new Date(entry.timestamp));
        if (!hourlyGiTotals[hour]) {
          hourlyGiTotals[hour] = { sum: 0, count: 0 };
        }
        hourlyGiTotals[hour].sum += entry.fodmapData.glycemicIndexInfo.value;
        hourlyGiTotals[hour].count += 1;
      }
    });

    const result: GIPoint[] = [];
    for (let i = 0; i < 24; i++) {
      const data = hourlyGiTotals[i];
      result.push({
        hour: format(new Date(0, 0, 0, i), 'HH:mm'),
        gi: data ? data.sum / data.count : 0,
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
    const activityEntries = filteredEntries.filter(e => e.entryType === 'fitbit_data') as FitbitLog[];
    return aggregateGenericByDay(activityEntries, (date, items) => {
      // Activity is usually a daily summary, but if multiple, maybe max?
      const latest = items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      return {
        date,
        steps: latest?.steps || 0,
        burned: latest?.caloriesBurned || 0,
      };
    }).filter(p => p.steps > 0);
  }, [filteredEntries]);

  const symptomFrequencyData = useMemo<SymptomFrequency[]>(() => {
    const symptomLogs = filteredEntries.filter(e => e.entryType === 'symptom') as SymptomLog[];
    const frequencyMap: Record<string, number> = {};
    symptomLogs.forEach(log => {
      log.symptoms.forEach(symptom => {
        frequencyMap[symptom.name] = (frequencyMap[symptom.name] || 0) + 1;
      });
    });
    return Object.entries(frequencyMap).map(([name, value]) => ({ name, value }));
  }, [filteredEntries]);

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


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <ScrollArea className="flex-grow">
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">Trends Dashboard</h1>
            <Button onClick={handleConnectFitbit} disabled={authLoading} type="button">
              <Zap className="mr-2 h-4 w-4" /> Connect to Fitbit
            </Button>
          </div>
          <div className="mb-8">
            <TimeRangeToggle selectedRange={selectedTimeRange} onRangeChange={setSelectedTimeRange} />
          </div>
          {/* Removed upgrade prompt */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Daily Calorie Intake</CardTitle>
              </CardHeader>
              <CardContent>
                {calorieData.length > 0 ? <DailyCaloriesTrendChart data={calorieData} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No calorie data for this period.</p>}
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
                <CardTitle className="text-xl font-semibold text-foreground">Hourly Glycemic Index (GI) Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {giTrendData.length > 0 ? <GITrendChart data={giTrendData} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No GI data available for this period.</p>}
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Food Safety Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {safetyData.length > 0 ? <LoggedSafetyTrendChart data={safetyData} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No food safety feedback logged for this period.</p>}
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
                <CardTitle className="text-xl font-semibold text-foreground">Symptom Occurrence</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] flex items-center justify-center">
                {symptomFrequencyData.length > 0 ? <SymptomOccurrenceChart data={symptomFrequencyData} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No symptoms logged for this period.</p>}
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

