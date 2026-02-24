// src/components/ramadan/RamadanCardStack.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { RamadanCard } from './RamadanCard';
import { RefreshCw } from 'lucide-react';
import type { RamadanTip } from '@/data/ramadan-seed';
import LiquidChartCarousel from '@/components/trends/LiquidChartCarousel';
import { useTheme } from '@/contexts/ThemeContext';

interface RamadanCardStackProps {
    cards: RamadanTip[];
    removeTopCard: () => void;
    restoreLastCard: () => void;
    canGoBack: boolean;
    saveCard: (tip: RamadanTip) => void;
    commitGoal: (tip: RamadanTip) => void;
    committedGoals: { id: string }[];
    savedIds?: Set<string>;
    isLoading: boolean;
    compact?: boolean;
}

export function RamadanCardStack({
    cards,
    removeTopCard,
    saveCard,
    restoreLastCard,
    canGoBack,
    isLoading,
    commitGoal,
    committedGoals,
    savedIds,
    compact = false
}: RamadanCardStackProps) {
    const { isDarkMode } = useTheme();
    const [index, setIndex] = useState(0);
    const RENDER_RADIUS = 2;
    const HYDRATE_DELAY_MS = 120;
    const [hydrated, setHydrated] = useState<Set<number>>(new Set([0]));

    useEffect(() => {
        if (index > cards.length - 1) {
            setIndex(Math.max(0, cards.length - 1));
        }
    }, [cards.length, index]);

    useEffect(() => {
        if (cards.length === 0) return;
        // Always hydrate the current card immediately
        setHydrated(new Set([index]));

        const targets: number[] = [];
        for (let i = index - RENDER_RADIUS; i <= index + RENDER_RADIUS; i += 1) {
            if (i >= 0 && i < cards.length) targets.push(i);
        }

        const timer = setTimeout(() => {
            setHydrated(new Set(targets));
        }, HYDRATE_DELAY_MS);

        return () => clearTimeout(timer);
    }, [index, cards.length]);

    const handleSave = (tip: RamadanTip) => {
        saveCard(tip);
    };

    const renderDots = (total: number, current: number) => {
        const maxDots = 5;
        if (total <= 1) return null;

        const windowSize = Math.min(maxDots, total);
        const maxStart = Math.max(0, total - windowSize);
        const start = Math.min(Math.max(current - Math.floor(windowSize / 2), 0), maxStart);
        const indices = Array.from({ length: windowSize }, (_, i) => start + i);

        return (
            <div className="mt-3 flex justify-center gap-2 pointer-events-none">
                {indices.map((idx) => (
                    <div
                        key={`dot-${idx}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === current
                                ? `w-5 ${isDarkMode ? 'bg-white/90' : 'bg-emerald-700'}`
                                : `w-1.5 ${isDarkMode ? 'bg-white/40' : 'bg-emerald-300'}`
                        }`}
                    />
                ))}
            </div>
        );
    };

    if (cards.length === 0) return (
        <div className={`flex flex-col items-center justify-center h-96 ${isDarkMode ? 'text-white/50' : 'text-emerald-700/70'}`}>
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p>Loading Wisdom...</p>
        </div>
    );

    const renderCard = useMemo(() => {
        return (card: RamadanTip, idx: number) => {
            const distance = Math.abs(idx - index);
            if (distance > RENDER_RADIUS) {
                return <div className="h-full w-full" />;
            }
            if (!hydrated.has(idx)) {
                return (
                    <div className={`h-full w-full rounded-[2rem] border animate-pulse ${
                        isDarkMode ? 'border-white/10 bg-white/5' : 'border-emerald-200/60 bg-white/80'
                    }`} />
                );
            }
            return (
                <RamadanCard
                    tip={card}
                    isFront={true}
                    onSave={handleSave}
                    onCommit={commitGoal}
                    isCommitted={committedGoals.some(goal => goal.id === `goal-${card.topicId}`)}
                    isSaved={savedIds ? savedIds.has(card.topicId) : false}
                    compact={compact}
                />
            );
        };
    }, [index, hydrated, commitGoal, committedGoals, savedIds, compact]);

    return (
        <div className="relative w-full max-w-sm mx-auto">
            <div className="aspect-[3/4] isolation-isolate perspective-1000">
                <LiquidChartCarousel
                    currentIndex={index}
                    onIndexChange={setIndex}
                    showDots={false}
                    className="h-full w-full"
                >
                    {cards.map((card, idx) => (
                        <div key={card.topicId} className="h-full w-full flex items-center justify-center px-2">
                            {renderCard(card, idx)}
                        </div>
                    ))}
                </LiquidChartCarousel>
            </div>
            {renderDots(cards.length, index)}
        </div>
    );
}
