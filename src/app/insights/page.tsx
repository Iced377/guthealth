'use client';

import { InsightsMotionControllerProvider, useInsightsMotionController } from '@/components/insights/useInsightsMotionController';
import { TodayBrief } from '@/components/insights/TodayBrief';
import { InsightCategoryStrip } from '@/components/insights/InsightCategoryStrip';
import { InsightFeed } from '@/components/insights/InsightFeed';
import { CoachView } from '@/components/insights/CoachView';
import DashboardHero from '@/components/dashboard/DashboardHero';
import { calculateDailyPedometerStats } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens } from '@/lib/liquid-tokens';
import { useAuth } from '@/components/auth/AuthProvider';
import { useActionContext } from '@/contexts/ActionContext';
import { useHealthKit } from '@/lib/apple-health/hooks';
import { isSameDay, startOfDay, endOfDay, differenceInHours, subDays } from 'date-fns';

function InsightsLayout() {
  const { scrollLocked, selectedCategory, setCategory } = useInsightsMotionController();
  const { isDarkMode } = useTheme();
  const mode = isDarkMode ? 'dark' : 'light';
  const tokens = getLiquidTokens(mode);

  // Data Hooks
  const { user, userProfile } = useAuth();
  const { timelineEntries } = useActionContext();
  const { healthData } = useHealthKit();

  // --- LOGIC CORE ---

  // --- LOGIC CORE ---
  const {
    summary,
    stepsData
  } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 1. Macros (Today Only)
    const todayLogs = timelineEntries.filter(e =>
      (e.entryType === 'food' || e.entryType === 'manual_macro') &&
      e.timestamp >= todayStart && e.timestamp <= todayEnd
    );

    const summary = todayLogs.reduce((acc, curr: any) => ({
      calories: acc.calories + (curr.calories || 0),
      protein: acc.protein + (curr.protein || 0),
      carbs: acc.carbs + (curr.carbs || 0),
      fat: acc.fat + (curr.fat || 0),
      fiber: acc.fiber + (curr.fiber || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    // 2. Steps
    let stepsData = null;
    const pedometerLogs = timelineEntries.filter(e =>
      e.entryType === 'pedometer_data' && isSameDay(new Date(e.timestamp), now)
    ) as any[];

    // Use helper if logs exist, else try healthKit or mock
    if (pedometerLogs.length > 0) {
      stepsData = calculateDailyPedometerStats(pedometerLogs);
    } else if (healthData?.steps) {
      stepsData = { steps: healthData.steps } as any; // Fallback structure
    }

    return {
      summary,
      stepsData
    };
  }, [timelineEntries, healthData, userProfile]);

  // Scroll Sync Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // 1. Sync Scroll -> State (User Swipes)
  const handleScrollRaw = (e: React.UIEvent<HTMLDivElement>) => {
    // Prevent feedback loop if we are programmatically scrolling
    if (isScrollingRef.current) return;

    const el = e.currentTarget;
    const scrollLeft = el.scrollLeft;
    const width = el.offsetWidth;
    const threshold = width / 2;

    if (scrollLeft < threshold && selectedCategory !== 'Today') {
      setCategory('Today');
    } else if (scrollLeft >= threshold && selectedCategory !== 'Coach') {
      setCategory('Coach');
    }
  };

  // 2. Sync State -> Scroll (Tab Click)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const width = el.offsetWidth;
    const targetScroll = selectedCategory === 'Coach' ? width : 0;

    // Only scroll if strictly needed to avoid fighting the user
    if (Math.abs(el.scrollLeft - targetScroll) > 10) {
      isScrollingRef.current = true;
      el.scrollTo({ left: targetScroll, behavior: 'smooth' });

      // Relinquish lock after animation
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
  }, [selectedCategory]);

  return (
    <div
      className={cn(
        "min-h-[100dvh] relative overflow-hidden transition-colors duration-500",
        tokens.background.root,
        tokens.text.primary
      )}
    >
      <div className={cn(
        "fixed inset-0 pointer-events-none z-0 transition-opacity duration-500",
        isDarkMode
          ? "bg-gradient-to-br from-indigo-950/20 via-black to-black opacity-100"
          : "opacity-0"
      )} />

      {/* Sticky Tabs (Outside ScrollView to stay fixed) */}
      {/* We wrap it in a fixed/z-index div effectively */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <InsightCategoryStrip />
      </div>

      {/* Main Horizontal Scroll Container - "Heavy" Native Snap */}
      <div
        ref={scrollContainerRef}
        className="w-full h-[100dvh] overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory no-scrollbar"
        onScroll={handleScrollRaw}
        style={{
          scrollBehavior: 'smooth', // Optional, but 'smooth' in logic handles tab clicks
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Page 1: Highlights */}
        <div className="w-full flex-shrink-0 snap-center h-full overflow-y-auto pt-48 pb-32 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="w-full max-w-md mx-auto px-4 min-h-full">
            <DashboardHero
              userProfile={userProfile!}
              timelineEntries={timelineEntries}
              summary={summary}
              stepsData={stepsData}
            />
            <InsightFeed />
          </div>
        </div>

        {/* Page 2: Coach */}
        <div className="w-full flex-shrink-0 snap-center h-full overflow-y-auto pt-32 pb-32 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="w-full max-w-md mx-auto min-h-full flex flex-col items-center justify-start relative z-10">
            <CoachView />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <InsightsMotionControllerProvider>
      {/* 
                Structure:
                Provider
                  -> Layout (Scroll Container)
                  -> Fixed Overlays (Coach, Sheets, Debug) - OUTSIDE Scroll Container
                     This ensures 'fixed' is truly relative to viewport, not affected by transform/overflow of Layout.
             */}
      <InsightsLayout />

    </InsightsMotionControllerProvider>
  );
}
