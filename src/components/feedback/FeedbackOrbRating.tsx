'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { impactLight } from '@/lib/haptics';

interface FeedbackOrbRatingProps {
    onRate: (rating: number) => void;
    initialRating?: number | null;
}

const ZONES = [
    { id: 4, label: "Spot on", color: "bg-emerald-500", text: "text-emerald-500" },
    { id: 3, label: "Good", color: "bg-blue-500", text: "text-blue-500" },
    { id: 2, label: "Meh", color: "bg-amber-500", text: "text-amber-500" },
    { id: 1, label: "Off", color: "bg-rose-500", text: "text-rose-500" },
];

export default function FeedbackOrbRating({ onRate, initialRating }: FeedbackOrbRatingProps) {
    const handleSelect = (id: number) => {
        onRate(id);
        impactLight();
    };

    return (
        <div className="w-full flex flex-col items-center gap-4">
            {ZONES.map((zone) => {
                const isSelected = initialRating === zone.id;
                return (
                    <motion.button
                        key={zone.id}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card clicks
                            handleSelect(zone.id);
                        }}
                        initial={false}
                        animate={{
                            scale: isSelected ? 1.05 : 1,
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "group w-full relative flex items-center justify-between p-4 rounded-xl border-0 bg-transparent transition-all duration-300"
                        )}
                    >
                        <span className={cn(
                            "text-lg font-medium transition-colors",
                            isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                        )}>
                            {zone.label}
                        </span>

                        <div className={cn(
                            "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300",
                            isSelected ? `border-${zone.color.replace('bg-', '')} ${zone.color}` : "border-white/20 bg-transparent"
                        )}>
                            {isSelected && (
                                <motion.div
                                    layoutId="selected-pip"
                                    className="w-2.5 h-2.5 bg-white rounded-full"
                                />
                            )}
                        </div>
                    </motion.button>
                );
            })}
        </div >
    );
}
