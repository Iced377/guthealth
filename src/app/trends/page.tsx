'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { CarouselDots } from '@/components/trends/LiquidChartCarousel';

// Utils
import { generateCalorieInsight, generateWeightInsight, generateStepInsight, generateCorrelationInsight } from '@/utils/insights';
import { TrendsMotionControllerProvider } from '@/components/trends/useTrendsMotionController';



import { Loader2, AlertTriangle } from 'lucide-react';
import { HapticsService } from '@/lib/haptics';

// Nav Control
import { useNavVisibility } from '@/components/navigation/useNavVisibilityController';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

// --- NAV REVEAL ZONE COMPONENT ---
// This is an invisible touch zone at the bottom to allow pulling the nav up
const NavRevealZone = () => {
  const { isNavVisible, setNavVisible, navLockReason } = useNavVisibility();

  // If nav is already visible, or locked, don't interfere
  if (isNavVisible || navLockReason !== 'NONE') return null;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 h-4 z-[49] cursor-grab touch-none" // z-49 to be just below nav (z-50) but above content
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        // Drag up (negative y) by some threshold
        if (info.offset.y < -18) {
          setNavVisible(true);
          // Haptic feedback
          if (navigator.vibrate) navigator.vibrate(10);
        }
      }}
    // Visual hint for debugging (remove later or make extremely subtle)
    // style={{ background: 'rgba(255,0,0,0.1)' }} 
    />
  );
};

// --- LOCKED STATE COMPONENT ---
const LockedChartCard = ({ title, description, actionText, icon }: { title: string, description: string, actionText: string, icon?: React.ReactNode }) => (
  <div className="w-full h-screen shrink-0 snap-center flex flex-col items-center justify-center p-8 relative overflow-hidden">
    {/* Visual Background */}
    <div className="absolute inset-0 opacity-5 pointer-events-none">
      <div className="absolute top-[30%] left-[20%] w-32 h-32 bg-primary blur-[80px] rounded-full" />
      <div className="absolute bottom-[30%] right-[20%] w-40 h-40 bg-blue-500 blur-[80px] rounded-full" />
    </div>

    <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 border border-white/20 shadow-xl flex items-center justify-center mb-8 rotate-3">
        <div className="w-8 h-8 text-muted-foreground">
          {icon || <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>}
        </div>
      </div>

      <h3 className="text-2xl font-bold text-foreground mb-3 font-headline">{title}</h3>
      <p className="text-muted-foreground leading-relaxed mb-8">
        {description}
      </p>

      <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase border border-primary/20">
        {actionText}
      </div>
    </div>
  </div>
);


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

  const [calorieViewIndex, setCalorieViewIndex] = useState(0); // 0 = Daily, 1 = Cumulative
  const [weightViewIndex, setWeightViewIndex] = useState(0); // 0 = Weight, 1 = Fat, 2 = Both

  const calorieDragControls = useDragControls();
  const weightDragControls = useDragControls();

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

  // Nav Control
  const { isNavVisible, setNavVisible, navLockReason } = useNavVisibility();

  // Scroll Handler
  useEffect(() => {
    // We attach to the scrollable container. Since this component renders the scrollable div,
    // we can use a ref or just find it. But wait, current implementation puts `overflow-y-scroll` on a div.
    // Let's add a ref to valid container.
  }, []); // Placeholder, will implement loop below with ref

  // Ref for scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If locked, do nothing
      if (navLockReason !== 'NONE') return;

      const currentScrollTop = container.scrollTop;
      const diff = currentScrollTop - lastScrollTop.current;

      // Thresholds
      const HIDE_THRESHOLD = 12;
      const SHOW_THRESHOLD = -12;

      if (diff > HIDE_THRESHOLD) {
        // Scrolling Down -> Hide
        setNavVisible(false);
      } else if (diff < SHOW_THRESHOLD) {
        // Scrolling Up -> Show
        setNavVisible(true);
      }

      lastScrollTop.current = currentScrollTop;
    };

    // Throttled or RAF? Browser events are often high frequency. 
    // Let's use requestAnimationFrame for basic throttling if needed, or just let it fly for now as simplified logic.
    // To avoid too many state updates, check current state? 
    // `setNavVisible` usually is stable, but we should probably debounce slightly or only call if changing.
    // For now, strict threshold logic is fine.

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [navLockReason, setNavVisible]);

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
      // useMemo receives filteredEntries which is timelineEntries (sorted DESC by default).
      // So the FIRST entry we see for a date is the LATEST one. 
      // We must NOT overwrite it with subsequent (older) entries for the same day.
      if (!map.has(key)) {
        map.set(key, {
          date: key,
          weight: entry.weight!,
          fatMass: entry.fatPercent ? (entry.weight! * entry.fatPercent / 100) : undefined
        });
      }
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
  // TODO: Update insight generators to accept view mode if needed, or just switch title here.
  const baseCalorieInsight = generateCalorieInsight(calorieData, targetCalories);
  const baseWeightInsight = generateWeightInsight(weightData);
  const activityInsight = generateStepInsight(activityData);
  const correlationInsight = generateCorrelationInsight(correlationData);

  // Dynamic Context for Calories
  const calorieContext = useMemo(() => {
    if (calorieViewIndex === 0) { // Daily
      return {
        label: "Daily Intake",
        description: `Your target is ${targetCalories} kcal. Keeping close to this helps maintain metabolic health.`
      };
    } else { // Cumulative
      return {
        label: "Cumulative Deficit",
        description: "See your total caloric balance over time. Positive slope means deficit (weight loss)."
      }
    }
  }, [calorieViewIndex, targetCalories]);

  // Dynamic Context for Weight
  const weightContext = useMemo(() => {
    const labels = ["Body Weight", "Fat Mass", "Weight & Fat"];
    const descs = [
      "Tracking weight over time helps identify real trends vs water fluctuations.",
      "Fat mass is a better health indicator than total weight.",
      "Compare total weight vs fat mass to see body composition changes."
    ];
    return {
      label: labels[weightViewIndex] || labels[0],
      description: descs[weightViewIndex] || descs[0]
    };
  }, [weightViewIndex]);


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
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none"
          initial={{ y: 0, opacity: 1 }}
          animate={{
            y: isNavVisible ? 0 : -100,
            opacity: isNavVisible ? 1 : 0
          }}
          transition={{
            duration: 0.4,
            ease: [0.32, 0.72, 0, 1] // Apple-style ease
          }}
        >
          <div className="pointer-events-auto">
            <GlobalTimeControl
              selectedRange={selectedTimeRange}
              onRangeChange={setSelectedTimeRange}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
          </div>
        </motion.div>

        <div
          ref={scrollContainerRef}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth pb-0"
        >

          {/* Empty State */}
          {filteredEntries.length === 0 && (
            <div className="h-screen w-full flex flex-col items-center justify-center snap-center p-8 text-center bg-background">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No Data Yet</h3>
              <p className="text-muted-foreground text-base max-w-[280px] leading-relaxed">
                Start logging your meals and activity. Keep going for a few days to unlock powerful trends and insights!
              </p>
            </div>
          )}

          {/* SCENE 1: Calories */}
          {(calorieData.length > 0) ? (
            <div
              className="w-full h-screen shrink-0 snap-center flex flex-col items-center justify-center p-0 relative"
              onPointerDown={(e) => calorieDragControls.start(e)}
              style={{ touchAction: "pan-y" }} // Allow vertical scroll but capture horizontal via controls
            >
              <LiquidGraphScene id="calories"
                contextLabel={calorieContext.label}
                insightTitle={baseCalorieInsight} // Optionally make this dynamic too
                description={calorieContext.description}
              >
                <DailyCaloriesTrendChart
                  data={calorieData}
                  isDarkMode={isDarkMode}
                  targetCalories={targetCalories}
                  viewModeIndex={calorieViewIndex}
                  onViewModeChange={setCalorieViewIndex}
                  dragControls={calorieDragControls}
                />
              </LiquidGraphScene>
              {/* External Dots */}
              <CarouselDots
                count={2}
                currentIndex={calorieViewIndex}
                className="mt-4"
              />
            </div>
          ) : (filteredEntries.length > 0 && (
            <LockedChartCard
              title="Calorie Trends"
              description="Visualize your daily intake and cumulative balance over time."
              actionText="Log a meal to unlock"
            />
          ))}

          {/* SCENE 2: Weight */}
          {(weightData.length > 0) ? (
            <div className="w-full h-screen shrink-0 snap-center flex flex-col items-center justify-center p-0">
              <LiquidGraphScene id="weight"
                contextLabel={weightContext.label}
                insightTitle={baseWeightInsight}
                description={weightContext.description}
              >
                <WeightTrendChart
                  data={weightData}
                  isDarkMode={isDarkMode}
                  viewModeIndex={weightViewIndex}
                  onViewModeChange={setWeightViewIndex}
                />
              </LiquidGraphScene>
              {/* External Dots */}
              <CarouselDots
                count={3}
                currentIndex={weightViewIndex}
                className="mt-4"
              />
            </div>
          ) : (filteredEntries.length > 0 && (
            <LockedChartCard
              title="Weight & Composition"
              description="Track body weight and estimated fat mass trends."
              actionText="Log weight to unlock"
            />
          ))}

          {/* SCENE 3: Activity (Steps) */}
          {(activityData.length > 0) ? (
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
          ) : (filteredEntries.length > 0 && (
            <LockedChartCard
              title="Activity Trends"
              description="Sync steps or log activity to see how you move."
              actionText="Log steps to unlock"
            />
          ))}

          {/* SCENE 4: Burn vs Steps Correlation OR Locked State */}
          {(correlationData.length > 5) ? (
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
          ) : (filteredEntries.length > 0 && (
            <LockedChartCard
              title="Metabolic Flux Insight"
              description="Unlock deep correlation analysis between your movement and calorie intake."
              actionText={`Log ${Math.max(0, 6 - correlationData.length)} more days`}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              }
            />
          ))}

          {/* SCENE 5: Macros */}
          {(macroData.length > 0) ? (
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
                  graphId="macros"
                />
              </LiquidGraphScene>
            </div>
          ) : (filteredEntries.length > 0 && (
            <LockedChartCard
              title="Macronutrient Balance"
              description="See your Protein, Carb, and Fat distribution over time."
              actionText="Log a meal to unlock"
            />
          ))}

          {/* Footer Padding/Spacer if needed, but with h-screen sections it might not be. 
              Maybe a small spacer to allow overscroll on bottom. */}
          <div className="h-[10vh] w-full snap-align-none" />
        </div>

        {/* Nav Reveal Zone */}
        <NavRevealZone />
      </div>

    </TrendsMotionControllerProvider>
  );
}
