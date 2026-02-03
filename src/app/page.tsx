'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link'; // Keep if used in Beta Message? No, Beta Message uses HTML tags in previous code.
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import GradientText from '@/components/shared/GradientText';
import Navbar from '@/components/shared/Navbar';
import GuestHomePage from '@/components/guest/GuestHomePage';
import DashboardContent from '@/components/dashboard/DashboardContent';
import LandingPageClientContent from '@/components/landing/LandingPageClientContent';
import LiquidHeader from '@/components/navigation/LiquidHeader';
import { useAuth } from '@/components/auth/AuthProvider';
import { useActionContext } from '@/contexts/ActionContext';
import type { TimelineEntry, DailyNutritionSummary } from '@/types';

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

export default function RootPage() {
  const { user: authUser, loading: authLoading } = useAuth();
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
  } = useActionContext();

  const [isPremiumDashboardOpen, setIsPremiumDashboardOpen] = useState(false);
  const [isGuestSheetOpen, setIsGuestSheetOpen] = useState(false);

  // Dashboard Date State (Hoisted for Header)
  const [currentDate, setCurrentDate] = useState(new Date());

  // Guest Logic: Open Sheet when a NEW item is added to timeline (length increases)
  const [prevTimelineLength, setPrevTimelineLength] = useState(0);

  useEffect(() => {
    if (!authUser && timelineEntries.length > prevTimelineLength) {
      setIsGuestSheetOpen(true);
    }
    setPrevTimelineLength(timelineEntries.length);
  }, [timelineEntries, authUser, prevTimelineLength]);

  const dailyNutritionSummary = useMemo<DailyNutritionSummary>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let totals: DailyNutritionSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    timelineEntries.forEach(entry => {
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
  }, [timelineEntries]);

  const groupedTimelineEntries = useMemo(() => groupEntriesByDate(timelineEntries), [timelineEntries]);

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
      <LandingPageStructure />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <LiquidHeader title={format(currentDate, 'EEEE, MMM d')} />

      <div id="dashboard-container" className="flex-grow flex flex-col items-center justify-start pb-24">
        <DashboardContent
          userProfile={userProfile!}
          isLoading={isDataLoading}
          timelineEntries={timelineEntries}
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
    </div>
  );
}

// --- LANDING PAGE REFRACTOR ---
import { HeroSection, ProblemSection, StorySection, FeatureGrid, SecuritySection, FinalCTA } from '@/components/about/AboutSections';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { version } from '../../package.json'; // Ensure this path is correct based on project structure

const MotionLink = motion.create(Link);

function LandingPageStructure() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;

      const currentScrollY = scrollRef.current.scrollTop;
      const isScrollingUp = currentScrollY < lastScrollY.current;
      const isAtTop = currentScrollY < 50; // Always show at very top

      if (isAtTop || isScrollingUp) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div ref={scrollRef} className="fixed inset-0 bg-background text-foreground overflow-y-auto overflow-x-hidden selection:bg-primary/30 font-body antialiased safe-area-pt scroll-smooth z-[45]">
      {/* Version Display (Top Left) */}
      <div className="fixed top-14 left-6 z-50 pointer-events-none opacity-50 text-xs font-mono text-muted-foreground">
        v{version}
      </div>

      {/* Floating Action Buttons (Top Right) */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed top-14 right-6 z-50 flex flex-col items-end gap-3"
          >
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-background/50 backdrop-blur-md border border-white/10 text-sm font-medium text-foreground hover:bg-background/80 shadow-sm flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              Start / Login
              <LogIn className="w-4 h-4" />
            </Link>

            <Link
              href="/support"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors px-2"
            >
              Need Help?
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <HeroSection />
        <ProblemSection scrollContainerRef={scrollRef} />
        <StorySection />
        <FeatureGrid />
        <SecuritySection />
        <FinalCTA isLoggedIn={false} />
      </main>
    </div>
  );
}
