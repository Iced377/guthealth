
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronUp } from 'lucide-react';
import GuestLastLogSheet from './GuestLastLogSheet';
import type { LoggedFoodItem } from '@/types';
import Navbar from '@/components/shared/Navbar';
import { useTheme } from '@/contexts/ThemeContext';

import {
  HeroSection,
  ProblemSection,
  StorySection,
  FeatureGrid,
  SecuritySection,
  FinalCTA
} from '@/components/about/AboutSections';

export default function GuestHomePage({
  onLogFoodClick,
  lastLoggedItem,
  isSheetOpen,
  onSheetOpenChange,
  onSetFeedback,
  onRemoveItem,
  isLoadingAiForItem,
}: {
  onLogFoodClick: () => void;
  lastLoggedItem: LoggedFoodItem | null;
  isSheetOpen: boolean;
  onSheetOpenChange: (isOpen: boolean) => void;
  onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveItem: (itemId: string) => void;
  isLoadingAiForItem: boolean;
}) {
  const { isDarkMode } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle scroll state for navbar style (using ref instead of window)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      setIsScrolled(el.scrollTop > 50);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={scrollRef}
      className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-background text-foreground overflow-x-hidden selection:bg-primary/30 flex flex-col font-body antialiased"
    >
      <Navbar isGuest={true} isScrolled={isScrolled} />

      {/* Memoized content to prevent re-renders on scroll, preserving animations and snap behavior */}
      {useMemo(() => (
        <main className="contents">
          <HeroSection />
          <ProblemSection scrollContainerRef={scrollRef} />
          <StorySection />
          <FeatureGrid />
          <SecuritySection />
          <FinalCTA isLoggedIn={false} />
        </main>
      ), [])}

      {lastLoggedItem && !isSheetOpen && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer animate-bounce z-50"
          onClick={() => onSheetOpenChange(true)}
        >
          <ChevronUp className="h-6 w-6 text-muted-foreground/70 animate-neon-chevron-pulse" />
          <span className="text-xs text-muted-foreground/70 bg-background/80 px-2 py-1 rounded-full backdrop-blur-sm">Swipe Up or Tap to View Result</span>
        </div>
      )}

      <GuestLastLogSheet
        isOpen={isSheetOpen}
        onOpenChange={onSheetOpenChange}
        lastLoggedItem={lastLoggedItem}
        onSetFeedback={onSetFeedback}
        onRemoveItem={onRemoveItem}
        isLoadingAi={isLoadingAiForItem}
      />
    </div>
  );
}
