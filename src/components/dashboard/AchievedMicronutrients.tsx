'use client';

import React, { useState } from 'react';
import { AchievedMicronutrient } from '@/types';
import { Medal, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AchievedMicronutrientsProps {
    achieved: AchievedMicronutrient[];
}

export default function AchievedMicronutrients({ achieved }: AchievedMicronutrientsProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!achieved || achieved.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                <Star className="w-6 h-6 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/60 font-medium">
                    No micronutrient targets hit yet. <br /> Eat varied whole foods!
                </p>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col w-full cursor-pointer group"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex items-center justify-between p-1">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Medal className="w-4 h-4 text-yellow-500" />
                    Top Nutrients
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{achieved.length} achieved</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-2 space-y-2 pb-1">
                            {achieved.map((micro, index) => (
                                <motion.div
                                    key={micro.name}
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center justify-between bg-white/5 dark:bg-white/5 rounded-lg p-2 border border-white/5"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                        <span className="text-sm font-medium text-foreground">{micro.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                                        {Math.round(micro.totalDV)}% DV
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
