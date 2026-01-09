
'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body antialiased">
      <Navbar isGuest={true} />

      <main className="flex-grow">
        <HeroSection />
        <ProblemSection />
        <StorySection />
        <FeatureGrid />
        <SecuritySection />
        <FinalCTA isLoggedIn={false} />
      </main>

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
