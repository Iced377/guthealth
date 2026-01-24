'use client';

import { InsightsMotionControllerProvider, useInsightsMotionController } from '@/components/insights/useInsightsMotionController';
import { TodayBrief } from '@/components/insights/TodayBrief';
import { InsightCategoryStrip } from '@/components/insights/InsightCategoryStrip';
import { InsightFeed } from '@/components/insights/InsightFeed';
import { CoachView } from '@/components/insights/CoachView';
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
  const {
    calories,
    protein,
    hoursSinceLastMeal,
    todaySteps,
    streakDays,
    wins,
    insightText
  } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 1. Macros (Today Only)
    const todayLogs = timelineEntries.filter(e =>
      (e.entryType === 'food' || e.entryType === 'manual_macro') &&
      e.timestamp >= todayStart && e.timestamp <= todayEnd
    );

    const totals = todayLogs.reduce((acc, curr: any) => ({
      cal: acc.cal + (curr.calories || 0),
      prot: acc.prot + (curr.protein || 0)
    }), { cal: 0, prot: 0 });

    // 2. Fasting (Last Logged Meal Time)
    const lastMeal = timelineEntries.find(e =>
      (e.entryType === 'food' || e.entryType === 'manual_macro') &&
      (e as any).calories > 10 // Ignore water/coffee
    );

    let hoursSince = null;
    if (lastMeal) {
      const diff = (now.getTime() - new Date(lastMeal.timestamp).getTime()) / 36e5;
      hoursSince = parseFloat(diff.toFixed(1));
    }

    // 3. Steps Priority
    let steps = null;
    if (healthData?.steps) {
      steps = healthData.steps;
    }
    else {
      const todaySync = timelineEntries.find(e =>
        e.entryType === 'pedometer_data' && isSameDay(new Date(e.timestamp), now)
      ) as any;
      if (todaySync?.steps) steps = todaySync.steps;
    }

    // 4. Streaks
    let streak = 0;
    let checkDate = subDays(now, 1);
    if (todayLogs.length > 0) streak = 1;

    for (let i = 0; i < 30; i++) {
      const hasLog = timelineEntries.some(e =>
        (e.entryType === 'food' || e.entryType === 'manual_macro') &&
        isSameDay(new Date(e.timestamp), checkDate)
      );
      if (hasLog) {
        if (streak === 0 && i === 0 && todayLogs.length === 0) streak = 1;
        else streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // 5. Wins
    const calculatedWins: string[] = [];
    const proteinTarget = userProfile?.profile?.macros?.protein || 150;
    const stepGoal = 8000;

    if (totals.prot >= proteinTarget * 0.8) calculatedWins.push("High Protein");
    if (steps && steps >= stepGoal) calculatedWins.push("Step Goal");
    if (hoursSince && hoursSince > 12) calculatedWins.push("Intermittent Fasting");
    if (streak >= 3) calculatedWins.push(`${streak} Day Streak`);

    // 6. Insight Text
    let text = "Log your meals to unlock insights.";
    const firstName = userProfile?.displayName?.split(' ')[0] || "Friend";

    if (todayLogs.length === 0) {
      text = `Ready to fuel up, ${firstName}? Log your first meal to start the day.`;
    } else if (totals.prot >= proteinTarget) {
      text = `Crushing it! You've hit your protein goal. Muscle repair in progress.`;
    } else if (steps && steps > stepGoal) {
      text = `Great movement today! You're keeping your metabolism active.`;
    } else {
      text = `You're on track. ${todayLogs.length} meals logged. Keep consistent!`;
    }

    return {
      calories: totals.cal,
      protein: totals.prot,
      hoursSinceLastMeal: hoursSince,
      todaySteps: steps,
      streakDays: streak,
      wins: calculatedWins,
      insightText: text
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
        <div className="w-full flex-shrink-0 snap-center snap-always h-full overflow-y-auto pt-48 pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="w-full max-w-md mx-auto px-4 min-h-full">
            <TodayBrief
              userName={userProfile?.displayName?.split(' ')[0] || "User"}
              calories={calories}
              protein={protein}
              steps={todaySteps}
              hoursSinceLastMeal={hoursSinceLastMeal}
              streakDays={streakDays}
              wins={wins}
              insightText={insightText}
            />
            <InsightFeed />
          </div>
        </div>

        {/* Page 2: Coach */}
        <div className="w-full flex-shrink-0 snap-center snap-always h-full overflow-y-auto pt-48 pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="w-full max-w-md mx-auto min-h-full flex items-center justify-center">
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
