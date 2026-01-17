'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/config/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { UserProfile, TimelineEntry, LoggedFoodItem, TimeRange, CaloriePoint, WeightPoint, ActivityPoint } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { startOfDay, endOfDay, subDays, subMonths, subYears, formatISO, parseISO, getHours, format } from 'date-fns';

// Components
import GlobalTimeControl from '@/components/trends/GlobalTimeControl';
import LiquidGraphScene from '@/components/trends/LiquidGraphScene';
import DailyCaloriesTrendChart from '@/components/trends/DailyCaloriesTrendChart';
import WeightTrendChart from '@/components/trends/WeightTrendChart';
import ActivityTrendChart from '@/components/trends/ActivityTrendChart';
import CorrelationTrendChart from '@/components/trends/CorrelationTrendChart';
import DailyMacrosTrendChart from '@/components/trends/DailyMacrosTrendChart';

// Utils
import { generateCalorieInsight, generateWeightInsight, generateStepInsight, generateCorrelationInsight } from '@/utils/insights';
import { TrendsMotionControllerProvider } from '@/components/trends/useTrendsMotionController';



import { Loader2, AlertTriangle } from 'lucide-react';
import { HapticsService } from '@/lib/haptics';

export default function TrendsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isDarkMode } = useTheme();

  // State
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30D');
  const [customRange, setCustomRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined
  });
  const [error, setError] = useState<string | null>(null);
  const [macroViewMode, setMacroViewMode] = useState<'Protein' | 'Carbs' | 'Fat'>('Protein');

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      // Profile for Goals
      const userDocSnap = await getDoc(doc(db, 'users', user.uid));
      if (userDocSnap.exists()) {
        setUserProfile(userDocSnap.data() as UserProfile);
      }

      // Timeline Data
      const entriesColRef = collection(db, 'users', user.uid, 'timelineEntries');
      // Fetch reasonably far back (1Y+) to support typical ranges. 
      // For truly "ALL" or "Custom" far back, pagination would be ideal, but for now 1Y or 2Y is safe.
      const twoYearsAgo = subYears(new Date(), 2);
      const q = query(entriesColRef, orderBy('timestamp', 'desc'), where('timestamp', '>=', Timestamp.fromDate(twoYearsAgo)));

      const querySnapshot = await getDocs(q);
      const fetchedEntries = querySnapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id,
        timestamp: (docSnap.data().timestamp as Timestamp).toDate(),
      })) as TimelineEntry[];

      setTimelineEntries(fetchedEntries);
    } catch (err) {
      console.error("Trends fetch error:", err);
      setError("Could not load metrics.");
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [user, authLoading, fetchData]);

  // Filtering
  const filteredEntries = useMemo(() => {
    if (timelineEntries.length === 0) return [];
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);

    if (selectedTimeRange === 'CUSTOM') {
      if (customRange.start && customRange.end) {
        startDate = startOfDay(customRange.start);
        endDate = endOfDay(customRange.end);
      } else {
        // Fallback if custom dates not set yet, maybe default to 30D
        startDate = startOfDay(subDays(now, 30));
      }
    } else {
      switch (selectedTimeRange) {
        case '1D': startDate = startOfDay(now); break;
        case '7D': startDate = startOfDay(subDays(now, 7)); break;
        case '30D': startDate = startOfDay(subDays(now, 30)); break;
        case '90D': startDate = startOfDay(subDays(now, 90)); break;
        case '6M': startDate = startOfDay(subMonths(now, 6)); break; // 6M added
        case '1Y': startDate = startOfDay(subYears(now, 1)); break;
        case 'ALL': default: return timelineEntries;
      }
    }

    return timelineEntries.filter(entry => entry.timestamp >= startDate && entry.timestamp <= endDate);
  }, [timelineEntries, selectedTimeRange, customRange]);


  // Data Aggregation (Memoized)
  const calorieData = useMemo<CaloriePoint[]>(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food') as LoggedFoodItem[];
    const grouped: Record<string, number> = {};
    foodEntries.forEach(e => {
      // e.timestamp is Date object
      const key = formatISO(e.timestamp, { representation: 'date' });
      grouped[key] = (grouped[key] || 0) + (e.calories || 0);
    });
    return Object.entries(grouped)
      .map(([date, calories]) => ({ date, calories }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEntries]);

  const activityData = useMemo<ActivityPoint[]>(() => {
    // Collect step data from Fitbit or Pedometer
    const stepEntries = filteredEntries.filter(e =>
      (e.entryType === 'fitbit_data' || e.entryType === 'pedometer_data') &&
      ('steps' in e)
    );
    const grouped: Record<string, { steps: number; burned: number }> = {};

    stepEntries.forEach(e => {
      const entry = e as any;
      const key = formatISO(entry.timestamp, { representation: 'date' });
      if (!grouped[key]) grouped[key] = { steps: 0, burned: 0 };
      grouped[key].steps = Math.max(grouped[key].steps, (entry.steps || 0));
      grouped[key].burned = Math.max(grouped[key].burned, (entry.caloriesBurned || entry.activeEnergy || 0));
    });

    return Object.entries(grouped)
      .map(([date, val]) => ({ date, steps: val.steps, burned: val.burned }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEntries]);

  const weightData = useMemo<WeightPoint[]>(() => {
    const weights = filteredEntries.filter(e => 'weight' in e && (e as any).weight > 0);
    const map = new Map<string, WeightPoint>();
    weights.forEach(e => {
      const entry = e as any; // Safe cast
      const key = formatISO(entry.timestamp, { representation: 'date' });
      map.set(key, {
        date: key,
        weight: entry.weight!,
        fatMass: entry.fatPercent ? (entry.weight! * entry.fatPercent / 100) : undefined
      });
    });
    return Array.from(map.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEntries]);

  const macroData = useMemo(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food') as LoggedFoodItem[];
    const grouped: Record<string, { protein: number; carbs: number; fat: number }> = {};
    foodEntries.forEach(e => {
      const key = formatISO(e.timestamp, { representation: 'date' });
      if (!grouped[key]) grouped[key] = { protein: 0, carbs: 0, fat: 0 };
      grouped[key].protein += (e.protein || 0);
      grouped[key].carbs += (e.carbs || 0);
      grouped[key].fat += (e.fat || 0);
    });
    return Object.entries(grouped)
      .map(([date, macros]) => ({ date, ...macros }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEntries]);

  // Combine for Correlation (Steps vs Calories In)
  const correlationData = useMemo(() => {
    const map = new Map<string, { steps: number; calories: number; date: string }>();

    // Fill Steps
    activityData.forEach(d => {
      map.set(d.date, { steps: d.steps, calories: 0, date: d.date });
    });

    // Fill Calories
    calorieData.forEach(d => {
      if (map.has(d.date)) {
        const existing = map.get(d.date)!;
        existing.calories = d.calories;
      } else {
        map.set(d.date, { steps: 0, calories: d.calories, date: d.date });
      }
    });

    return Array.from(map.values())
      .filter(d => d.steps > 0 && d.calories > 0) // Only plot valid intersection points
      .map(d => ({ date: d.date, x: d.steps, y: d.calories }));
  }, [activityData, calorieData]);

  // Derived Insights
  const targetCalories = userProfile?.profile?.tdee || 2000;
  const calorieInsight = generateCalorieInsight(calorieData, targetCalories);
  const weightInsight = generateWeightInsight(weightData);
  const activityInsight = generateStepInsight(activityData);
  const correlationInsight = generateCorrelationInsight(correlationData);

  const macroInsight = useMemo(() => {
    if (macroData.length === 0) return "Log meals to see macro balance.";

    // Calculate average for the active macro
    const total = macroData.reduce((acc, curr) => {
      switch (macroViewMode) {
        case 'Protein': return acc + curr.protein;
        case 'Carbs': return acc + curr.carbs;
        case 'Fat': return acc + curr.fat;
      }
    }, 0);
    const avg = Math.round(total / macroData.length);

    // Context msg
    let label = "";
    switch (macroViewMode) {
      case 'Protein': label = "Avg Protein"; break;
      case 'Carbs': label = "Avg Carbs"; break;
      case 'Fat': label = "Avg Fat"; break;
    }
    return `${label}: ${avg}g`;

  }, [macroData, macroViewMode]);


  if (authLoading || isLoadingData) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return <div className="h-screen w-full flex items-center justify-center text-muted-foreground">{error}</div>;
  }


  return (
    <TrendsMotionControllerProvider>
      <div className="bg-background h-screen w-full relative">
        {/* Fixed Global Time Control */}
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none">
          <div className="pointer-events-auto">
            <GlobalTimeControl
              selectedRange={selectedTimeRange}
              onRangeChange={setSelectedTimeRange}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
          </div>
        </div>

        <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth pb-0">

          {/* Empty State */}
          {filteredEntries.length === 0 && (
            <div className="h-screen w-full flex flex-col items-center justify-center snap-center p-8 text-center bg-background">
              <p className="text-muted-foreground text-lg mb-2">No data found for this period.</p>
              <p className="text-sm text-muted-foreground/50">Try selecting a different time range or logging some meals.</p>
            </div>
          )}

          {/* SCENE 1: Calories */}
          {calorieData.length > 0 && (
            <div className="w-full h-screen shrink-0 snap-center flex items-center justify-center p-0">
              <LiquidGraphScene id="calories"
                contextLabel="Daily Calorie Intake"
                insightTitle={calorieInsight}
                description={`Your target is ${targetCalories} kcal. Keeping close to this helps maintain metabolic health.`}
              >
                <DailyCaloriesTrendChart
                  data={calorieData}
                  isDarkMode={isDarkMode}
                  targetCalories={targetCalories}
                />
              </LiquidGraphScene>
            </div>
          )}

          {/* SCENE 2: Weight */}
          {weightData.length > 0 && (
            <div className="w-full h-screen shrink-0 snap-center flex items-center justify-center p-0">
              <LiquidGraphScene id="weight"
                contextLabel="Body Weight"
                insightTitle={weightInsight}
                description="Long-term weight trends are more important than daily fluctuations."
              >
                <WeightTrendChart
                  data={weightData}
                  isDarkMode={isDarkMode}
                />
              </LiquidGraphScene>
            </div>
          )}

          {/* SCENE 3: Activity (Steps) */}
          {activityData.length > 0 && (
            <div className="w-full h-screen shrink-0 snap-center flex items-center justify-center p-0">
              <LiquidGraphScene id="activity"
                contextLabel="Movement & Activity"
                insightTitle={activityInsight}
                description="Steps are a great proxy for NEAT (Non-Exercise Activity Thermogenesis)."
              >
                <ActivityTrendChart
                  data={activityData}
                  isDarkMode={isDarkMode}
                />
              </LiquidGraphScene>
            </div>
          )}

          {/* SCENE 4: Burn vs Steps Correlation */}
          {correlationData.length > 5 && (
            <div className="w-full h-screen shrink-0 snap-center flex items-center justify-center p-0">
              <LiquidGraphScene id="correlation"
                contextLabel="Metabolic Flux"
                insightTitle={correlationInsight}
                description="See how your activity correlates with your intake. Aim for 'Optimal Flux' (High Energy, High Activity)."
              >
                <CorrelationTrendChart
                  data={correlationData}
                  isDarkMode={isDarkMode}
                />
              </LiquidGraphScene>
            </div>
          )}

          {/* SCENE 4: Macros */}
          {macroData.length > 0 && (
            <div className="w-full h-screen shrink-0 snap-center flex items-center justify-center p-0">
              <LiquidGraphScene id="macros"
                contextLabel="Macronutrient Balance"
                insightTitle={macroInsight}
                description={
                  macroViewMode === 'Protein' ? "Essential for muscle repair and satiety." :
                    macroViewMode === 'Carbs' ? "Your primary fuel source for high-intensity activity." :
                      "Vital for hormone production and nutrient absorption."
                }
              >
                <DailyMacrosTrendChart
                  data={macroData}
                  isDarkMode={isDarkMode}
                  viewMode={macroViewMode}
                  onViewChange={setMacroViewMode}
                />
              </LiquidGraphScene>
            </div>
          )}

          {/* Footer Padding/Spacer if needed, but with h-screen sections it might not be. 
              Maybe a small spacer to allow overscroll on bottom. */}
          <div className="h-[10vh] w-full snap-align-none" />
        </div>
      </div>

    </TrendsMotionControllerProvider>
  );
}
