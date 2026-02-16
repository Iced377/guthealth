// src/components/ramadan/SavedCardsStack.tsx
'use client';

import { useEffect, useState } from 'react';
import { RamadanCard } from './RamadanCard';
import type { RamadanTip } from '@/data/ramadan-seed';
import LiquidChartCarousel from '@/components/trends/LiquidChartCarousel';

interface SavedCardsStackProps {
    cards: RamadanTip[];
    onSave: (tip: RamadanTip) => void;
    onCommit: (tip: RamadanTip) => void;
    isCommitted: (topicId: string) => boolean;
    isSaved: (topicId: string) => boolean;
}

export function SavedCardsStack({
    cards,
    onSave,
    onCommit,
    isCommitted,
    isSaved
}: SavedCardsStackProps) {
    const [stack, setStack] = useState<RamadanTip[]>(cards);
    const [index, setIndex] = useState(0);

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
                        key={`saved-dot-${idx}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === current ? 'w-5 bg-white/90' : 'w-1.5 bg-white/40'
                        }`}
                    />
                ))}
            </div>
        );
    };

    useEffect(() => {
        setStack(cards);
        setIndex((prev) => Math.max(0, Math.min(prev, cards.length - 1)));
    }, [cards]);

    if (stack.length === 0) {
        return (
            <div className="text-white/60 text-sm text-center py-6">
                No saved cards yet.
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-sm mx-auto">
            <div className="aspect-[3/4]">
                <LiquidChartCarousel
                    currentIndex={index}
                    onIndexChange={setIndex}
                    showDots={false}
                    className="h-full w-full"
                >
                    {stack.map((card) => (
                        <div key={card.topicId} className="h-full w-full flex items-center justify-center px-2">
                            <RamadanCard
                                tip={card}
                                isFront={true}
                                onSave={onSave}
                                onCommit={onCommit}
                                isCommitted={isCommitted(card.topicId)}
                                isSaved={isSaved(card.topicId)}
                            />
                        </div>
                    ))}
                </LiquidChartCarousel>
            </div>
            {renderDots(stack.length, index)}
        </div>
    );
}
