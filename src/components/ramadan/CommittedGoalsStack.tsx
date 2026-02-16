// src/components/ramadan/CommittedGoalsStack.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { RamadanCard } from './RamadanCard';
import type { RamadanTip } from '@/data/ramadan-seed';

interface CommittedGoal {
    id: string;
    title: string;
    actionItem?: string;
    category: RamadanTip['category'];
}

interface CommittedGoalsStackProps {
    goals: CommittedGoal[];
    selectedDateLabel: string;
    isCompleted: (goalId: string) => boolean;
    onToggleComplete: (goalId: string) => void;
    onUncommit: (goalId: string) => void;
}

export function CommittedGoalsStack({
    goals,
    selectedDateLabel,
    isCompleted,
    onToggleComplete,
    onUncommit
}: CommittedGoalsStackProps) {
    const [stack, setStack] = useState<CommittedGoal[]>(goals);
    const dismissed = useRef<CommittedGoal[]>([]);

    useEffect(() => {
        setStack(goals);
        dismissed.current = [];
    }, [goals]);

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
                const [removed, ...rest] = stack;
                if (removed) {
                    dismissed.current.unshift(removed);
                }
                setStack(rest);
                x.set(0);
                controls.start({ x: 0, opacity: 1, transition: { duration: 0 } });
            } else {
                if (dismissed.current.length > 0) {
                    const [restored, ...rest] = dismissed.current;
                    dismissed.current = rest;
                    setStack(prev => [restored, ...prev]);
                } else {
                    controls.start({ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });
                }
            }
        } else {
            controls.start({ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        }
    };

    if (stack.length === 0) {
        return (
            <div className="text-white/50 text-sm">
                No committed goals yet.
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-sm aspect-[3/4] mx-auto">
            {stack.length > 1 && (
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 rounded-[2rem] bg-black/35" />
                </div>
            )}

            <motion.div
                key={stack[0].id}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.05}
                onDragEnd={handleDragEnd}
                style={{ x, rotate, opacity }}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                whileTap={{ scale: 1.02 }}
            >
                <RamadanCard
                    tip={{
                        topicId: stack[0].id,
                        title: stack[0].title,
                        content: stack[0].actionItem || 'Committed goal for Ramadan.',
                        category: stack[0].category,
                        source: 'seed'
                    }}
                    isFront={true}
                    mode="goal"
                    isCompleted={isCompleted(stack[0].id)}
                    onToggleComplete={() => onToggleComplete(stack[0].id)}
                    onUncommit={() => onUncommit(stack[0].id)}
                    goalDateLabel={selectedDateLabel}
                />
            </motion.div>
        </div>
    );
}
