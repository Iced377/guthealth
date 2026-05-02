'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import GradientText from '@/components/shared/GradientText';
import DashboardContent from '@/components/dashboard/DashboardContent';
import LiquidHeader from '@/components/navigation/LiquidHeader';
import { useAuth } from '@/components/auth/AuthProvider';
import { useActionContext } from '@/contexts/ActionContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import type { TimelineEntry, DailyNutritionSummary } from '@/types';
import { Capacitor } from '@capacitor/core';
import ExpertAssignmentPrompt from '@/components/dashboard/ExpertAssignmentPrompt';

// Helper
const groupEntriesByDate = (entries: TimelineEntry[]) => {
  const grouped: Record<string, TimelineEntry[]> = {};
  entries.forEach(entry => {
    const dateKey = format(new Date(entry.timestamp), "PPP");
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(entry);
    grouped[dateKey].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });
  return grouped;
};

const LandingPage = dynamic(() => import('@/components/guest/LandingPage'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-background" />
});

export default function RootPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const {
    timelineEntries,
    userProfile,
    isDataLoading,
    isLoadingAi,
    openSimplifiedAddFoodDialog,
    openIdentifyByPhotoDialog,
    openSymptomLogDialog,
    openLogPreviousMealDialog,
    handleSetFoodFeedback,
    handleRemoveTimelineEntry,
    handleEditTimelineEntry,
    handleRepeatMeal,
    handleToggleFavoriteFoodItem,
    handleUpdateExpertPromptStatus,
  } = useActionContext();

  const [isPremiumDashboardOpen, setIsPremiumDashboardOpen] = useState(false);
  const [isGuestSheetOpen, setIsGuestSheetOpen] = useState(false);
  const [isExpertPromptOpen, setIsExpertPromptOpen] = useState(false);

  // Dashboard Date State (Hoisted for Header)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isWideLayout, setIsWideLayout] = useState(false);

  useEffect(() => {
    const updateLayout = () => setIsWideLayout(window.innerWidth >= 1024);
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const isIOS = typeof window !== 'undefined' && Capacitor.getPlatform() === 'ios';
  const enableWebBento = !isIOS && isWideLayout;

  // Guest Logic: Open Sheet when a NEW item is added to timeline (length increases)
  const [prevTimelineLength, setPrevTimelineLength] = useState(0);

  useEffect(() => {
    if (!authUser && timelineEntries.length > prevTimelineLength) {
      setIsGuestSheetOpen(true);
    }
    setPrevTimelineLength(timelineEntries.length);
  }, [timelineEntries, authUser, prevTimelineLength]);

  // Expert Prompt Logic
  useEffect(() => {
    if (!isDataLoading && userProfile && authUser) {
      // Only show if never answered
      if (!userProfile.profile?.expertPromptStatus) {
        // Small delay to let initial animation finish
        const timer = setTimeout(() => {
          setIsExpertPromptOpen(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isDataLoading, userProfile, authUser]);

  const dashboardEntries = useMemo(() => timelineEntries, [timelineEntries]);

  const dailyNutritionSummary = useMemo<DailyNutritionSummary>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let totals: DailyNutritionSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    dashboardEntries.forEach(entry => {
      if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
        const entryDate = new Date(entry.timestamp);
        if (entryDate >= today && entryDate < tomorrow) {
          totals.calories += entry.calories || 0;
          totals.protein += entry.protein || 0;
          totals.carbs += entry.carbs || 0;
          totals.fat += entry.fat || 0;
        }
      }
    });
    return totals;
  }, [dashboardEntries]);

  const groupedTimelineEntries = useMemo(() => groupEntriesByDate(dashboardEntries), [dashboardEntries]);

  const betaUserMessageContent = (
    <div className="mt-8 max-w-3xl mx-auto text-left sm:text-center bg-primary/5 p-6 rounded-lg border border-primary/20 shadow-sm">
      <h2 className="text-2xl font-semibold text-primary mb-4 font-headline">
        <GradientText>Hey there, GutChecker! 👋</GradientText>
      </h2>
      <p className="text-muted-foreground mb-3">
        A huge <strong className="text-foreground">thank you</strong> for joining the GutCheck beta and taking an active role in shaping its future! Your participation is incredibly valuable as we work to build the best tool to help you understand your gut.
      </p>
      <p className="text-muted-foreground mb-4">
        <strong>Here's how you can make a big impact during this beta phase:</strong>
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 pl-4 text-left">
        <li>
          <strong>Log Your Meals Consistently:</strong> Whether you use the auto-text input, snap a photo, or log manually, the more data you provide, the better our system becomes.
        </li>
        <li>
          <strong>Track Your Symptoms:</strong> Don't forget to log any symptoms you experience. This is key to finding correlations.
        </li>
        <li>
          <strong>Rate Your Reactions:</strong> Use the thumbs up/down on food cards in your dashboard to tell us if a meal felt "safe" or "unsafe" for you. This direct feedback is gold!
        </li>
        <li>
          <strong>Share Your Thoughts:</strong> See the green feedback widget? Use it! Report bugs, suggest features, or tell us what you love (or don't!).
        </li>
        <li>
          <strong>Explore & Experiment:</strong> Dive into your Trends, check out the GutCheck Assistant insights, and see what patterns emerge.
        </li>
      </ul>
      <p className="text-muted-foreground">
        We're constantly making improvements and adding new features. You can always see the latest updates and what's changed by clicking on the app version number in the top navigation bar.
      </p>
      <p className="text-muted-foreground mt-3">
        Thanks again for being on this journey with us!
      </p>
    </div>
  );

  // Removed blocking loader to prevent double-loading screen. 
  // AuthProvider handles initial auth load. Data loading will be handled by UI skeletons.
  // Removed blocking loader to prevent double-loading screen. 
  // AuthProvider handles initial auth load. Data loading will be handled by UI skeletons.
  // if (authLoading) return null; - REMOVED to prevent white screen. AuthProvider handles protection.

  if (!authUser && !authLoading) {
    return (
      <LandingPage />
    );
  }

  return (
    <div
      className={enableWebBento
        ? "min-h-screen flex flex-col text-foreground webview-root"
        : "min-h-screen flex flex-col bg-background text-foreground"}
      data-web-bento={enableWebBento ? "true" : undefined}
    >
      {!enableWebBento && <LiquidHeader title={format(currentDate, 'EEEE, MMM d')} />}

      <div id="dashboard-container" className={enableWebBento ? "relative z-10 flex-grow flex flex-col items-center justify-start pb-24" : "flex-grow flex flex-col items-center justify-start pb-24"}>
        <DashboardContent
          userProfile={userProfile!}
          isLoading={isDataLoading}
          timelineEntries={dashboardEntries}
          dailyNutritionSummary={dailyNutritionSummary}
          isLoadingAi={isLoadingAi}
          onSetFeedback={handleSetFoodFeedback}
          onRemoveTimelineEntry={handleRemoveTimelineEntry}
          onLogSymptomsForFood={(foodItemId) => openSymptomLogDialog({ type: 'meal', mealId: foodItemId })}
          onEditIngredients={handleEditTimelineEntry}
          onRepeatMeal={handleRepeatMeal}
          onToggleFavorite={handleToggleFavoriteFoodItem}
          onLogFoodAIClick={openSimplifiedAddFoodDialog}
          onIdentifyByPhotoClick={openIdentifyByPhotoDialog}
          onLogSymptomsClick={openSymptomLogDialog}
          onLogPreviousMealClick={openLogPreviousMealDialog}
          groupedTimelineEntries={groupedTimelineEntries}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
      </div>

      <ExpertAssignmentPrompt 
        isOpen={isExpertPromptOpen}
        onClose={() => setIsExpertPromptOpen(false)}
        onAccept={async () => {
          await handleUpdateExpertPromptStatus('accepted');
          setIsExpertPromptOpen(false);
          router.push('/expert');
        }}
        onLater={async () => {
          await handleUpdateExpertPromptStatus('later');
          setIsExpertPromptOpen(false);
        }}
      />
    </div>
  );
}
