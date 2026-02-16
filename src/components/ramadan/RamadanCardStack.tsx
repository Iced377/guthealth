// src/components/ramadan/RamadanCardStack.tsx
'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo, AnimatePresence, useDragControls } from 'framer-motion';
import { RamadanCard } from './RamadanCard';
import { RefreshCw } from 'lucide-react';
import type { RamadanTip } from '@/data/ramadan-seed';

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
    savedIds
}: RamadanCardStackProps) {

    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const scale = useTransform(x, [-200, 0, 200], [0.9, 1, 1]); // Do not scale down when swiping right (if acting as back) ? Actually let's keep it consistent
    const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 1]); // Do NOT fade out on Right Swipe if it triggers back (or maybe fade out current to reveal back?)

    // Actually, if we swipe RIGHT to go BACK, does the current card leave?
    // If the stack is [A, B, C]. View A.
    // Swipe A Left -> [B, C]. View B.
    // Now Swipe B Right -> restore A -> [A, B, C].
    // This means B stays, and A comes on top.
    // BUT the gesture is ON B.
    // So "Swiping B Right" is just a trigger. It shouldn't move B away. B should snap back.

    // Refined Opacity: Fade out only on Left (-200)
    // On Right (200), keep opacity 1 because it just snaps back.

    // Background card transforms (inverse of foreground)
    const backScale = useTransform(x, [-200, 0, 200], [1, 0.92, 1]); // Peeking card behavior
    const backOpacity = useTransform(x, [-200, 0, 200], [1, 0.6, 1]);

    const controls = useAnimation();
    const isDragging = useRef(false);
    const lastSwipeDir = useRef<'left' | 'right'>('left');

    const handleDragEnd = async (_: any, info: PanInfo) => {
        const threshold = 100;
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
            if (offset < 0) {
                // SWIPE LEFT -> NEXT (Dismiss)
                lastSwipeDir.current = 'left';
                await controls.start({
                    x: -500,
                    opacity: 0,
                    transition: { duration: 0.2 }
                });
                x.set(0);
                controls.set({ x: 0, opacity: 1 });
                removeTopCard();
            } else {
                // SWIPE RIGHT -> PREVIOUS (Rewind)
                lastSwipeDir.current = 'right';
                x.set(0);
                controls.set({ x: 0, opacity: 1 });
                if (canGoBack) {
                    restoreLastCard();
                }
            }
        } else {
            // Snap back (not enough swipe)
            controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } });
        }
        isDragging.current = false;
    };

    const handleSave = (tip: RamadanTip) => {
        saveCard(tip);
    };

    if (cards.length === 0) return (
        <div className="flex flex-col items-center justify-center h-96 text-white/50">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p>Loading Wisdom...</p>
        </div>
    );

    // New card enters from the opposite side of the swipe
    const enterX = lastSwipeDir.current === 'left' ? 40 : -40;

    return (
        <div className="relative w-full max-w-sm aspect-[3/4] mx-auto isolation-isolate perspective-1000">
            <div className="relative w-full h-full">

                {/* Back Card (Peeking) */}
                {cards.length > 1 && (
                    <motion.div
                        className="absolute inset-0 z-0"
                        style={{ scale: backScale, opacity: backOpacity, y: 18 }}
                    >
                        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-emerald-900/40 via-emerald-800/20 to-amber-900/30 blur-[18px]" />
                        <div className="absolute inset-0 rounded-[2rem] bg-black/55" />
                    </motion.div>
                )}

                {/* Front Card (Draggable) */}
                <motion.div
                    key={cards[0]?.topicId || "empty"}
                    initial={{ x: enterX, opacity: 0, scale: 0.95 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.8}
                    dragControls={dragControls}
                    dragListener={false}
                    dragDirectionLock
                    onPointerDown={(e) => dragControls.start(e)}
                    onDragStart={() => isDragging.current = true}
                    onDragEnd={handleDragEnd}
                    style={{ x, rotate, opacity, zIndex: 10, touchAction: 'pan-y' }}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing will-change-transform"
                >
                    <RamadanCard
                        tip={cards[0]}
                        isFront={true}
                        onSave={handleSave}
                        onCommit={commitGoal}
                        isCommitted={committedGoals.some(goal => goal.id === `goal-${cards[0].topicId}`)}
                        isSaved={savedIds ? savedIds.has(cards[0].topicId) : false}
                    />
                </motion.div>

            </div>

            <div className="mt-8 text-center" />
        </div>
    );
}
