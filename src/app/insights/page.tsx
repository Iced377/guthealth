'use client';

import { InsightsMotionControllerProvider, useInsightsMotionController } from '@/components/insights/useInsightsMotionController';
import { TodayBrief } from '@/components/insights/TodayBrief';
import { InsightCategoryStrip } from '@/components/insights/InsightCategoryStrip';
import { InsightFeed } from '@/components/insights/InsightFeed';
import { CoachChatCapsule, CoachSessionSheet } from '@/components/insights/CoachComponents';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens } from '@/lib/liquid-tokens';

// Temporary Debug Overlay
function DebugSafeAreas() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none" onClick={() => setVisible(false)}>
      {/* Safe Area Top */}
      <div className="absolute top-0 left-0 right-0 border-b-2 border-red-500/50 bg-red-500/10 flex items-end justify-center text-[10px] text-red-200"
        style={{ height: 'env(safe-area-inset-top)' }}>
        Safe Area Top
      </div>
      {/* Safe Area Bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t-2 border-red-500/50 bg-red-500/10 flex items-start justify-center text-[10px] text-red-200"
        style={{ height: 'env(safe-area-inset-bottom)' }}>
        Safe Area Bottom
      </div>
      {/* Content Bounds Guides */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+12px)] left-0 right-0 border-t border-dashed border-yellow-500/50 text-xs text-yellow-500 px-2 leading-none pt-1">
        Start Content (+12px)
      </div>
      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+120px)] left-0 right-0 border-b border-dashed border-yellow-500/50 text-xs text-yellow-500 px-2 text-right leading-none pb-1">
        End Content (+120px)
      </div>
    </div>
  );
}

function InsightsLayout() {
  const { scrollLocked } = useInsightsMotionController();
  const { isDarkMode } = useTheme();
  const mode = isDarkMode ? 'dark' : 'light';
  const tokens = getLiquidTokens(mode);

  return (
    // Single Scroll Root using 100dvh
    <div
      className={cn(
        "min-h-[100dvh] relative overflow-x-hidden transition-colors duration-500",
        scrollLocked ? "overflow-y-hidden" : "overflow-y-auto",
        // Root Background from Tokens (Solid off-white in light, black in dark)
        tokens.background.root,
        tokens.text.primary // Default text color
      )}
      style={{
        // Explicit padding logic
        paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 120px)',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Fixed Background - Adaptive */}
      <div className={cn(
        "fixed inset-0 pointer-events-none z-0 transition-opacity duration-500",
        isDarkMode
          ? "bg-gradient-to-br from-indigo-950/20 via-black to-black opacity-100"
          : "opacity-0" // Hide dark gradient in light mode, let solid root bg show
      )} />

      {/* Content Flow */}
      <div className="relative z-10 flex flex-col w-full max-w-md mx-auto">
        <TodayBrief />
        <InsightCategoryStrip />
        <div className="h-4" />
        <InsightFeed />
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

      {/* Fixed Elements */}
      <CoachChatCapsule />
      <CoachSessionSheet />
      {/* <DebugSafeAreas /> */}

    </InsightsMotionControllerProvider>
  );
}
