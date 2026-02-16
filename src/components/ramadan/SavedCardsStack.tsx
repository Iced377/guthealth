// src/components/ramadan/SavedCardsStack.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo, useDragControls } from 'framer-motion';
import { RamadanCard } from './RamadanCard';
import type { RamadanTip } from '@/data/ramadan-seed';

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
    const dragControls = useDragControls();
    const [stack, setStack] = useState<RamadanTip[]>(cards);
    const dismissed = useRef<RamadanTip[]>([]);

    useEffect(() => {
        setStack(cards);
        dismissed.current = [];
    }, [cards]);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
    const controls = useAnimation();

    const handleDragEnd = async (_: any, info: PanInfo) => {
        const threshold = 80;
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
            if (offset < 0) {
                await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
                x.set(0);
                controls.set({ x: 0, opacity: 1 });
                const [removed, ...rest] = stack;
                if (removed) dismissed.current.unshift(removed);
                setStack(rest);
            } else {
                x.set(0);
                controls.set({ x: 0, opacity: 1 });
                if (dismissed.current.length > 0) {
                    const [restored, ...rest] = dismissed.current;
                    dismissed.current = rest;
                    setStack(prev => [restored, ...prev]);
                }
            }
        } else {
            controls.start({ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        }
    };

    if (stack.length === 0) {
        return (
            <div className="text-white/60 text-sm text-center py-6">
                No saved cards yet.
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-sm aspect-[3/4] mx-auto">
            <motion.div
                key={stack[0].topicId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8}
                dragControls={dragControls}
                dragListener={false}
                dragDirectionLock
                onPointerDown={(e) => dragControls.start(e)}
                onDragEnd={handleDragEnd}
                style={{ x, rotate, opacity, touchAction: 'pan-y' }}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
                <RamadanCard
                    tip={stack[0]}
                    isFront={true}
                    onSave={onSave}
                    onCommit={onCommit}
                    isCommitted={isCommitted(stack[0].topicId)}
                    isSaved={isSaved(stack[0].topicId)}
                />
            </motion.div>
        </div>
    );
}
