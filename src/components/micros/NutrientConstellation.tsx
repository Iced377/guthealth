'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { NormalizedMicronutrient } from '@/hooks/useMicronutrients';
import { useTheme } from '@/contexts/ThemeContext';
import { useMicrosMotionController } from './useMicrosMotionController';
import { cn } from '@/lib/utils';
import { LiquidPressable } from '@/components/ui/LiquidPressable';

interface NutrientConstellationProps {
    data: NormalizedMicronutrient[];
    onSelect: (id: string) => void;
}

const calculatePhyllotaxisPositions = (items: NormalizedMicronutrient[]) => {
    const spacing = 45;
    const c = 18;

    return items.map((item, i) => {
        const angle = i * 137.508 * (Math.PI / 180);
        const radius = c * Math.sqrt(i + 1);

        const xOffset = radius * Math.cos(angle);
        const yOffset = radius * Math.sin(angle);

        const seed = item.id.charCodeAt(0) % 10;
        const jitterX = (seed - 5) * 1.5;
        const jitterY = (seed - 5) * 1.5;

        const driftDuration = 20 + seed;
        const driftDelay = -seed * 2;

        return {
            ...item,
            xBase: xOffset + jitterX,
            yBase: yOffset + jitterY,
            driftDuration,
            driftDelay
        };
    });
};

export default function NutrientConstellation({ data, onSelect }: NutrientConstellationProps) {
    const { isDarkMode } = useTheme();
    const { selectedCluster, interactionMode } = useMicrosMotionController();

    // Gating
    const isBrowse = interactionMode === 'BROWSE';
    const isPaused = !isBrowse; // TRANSITION or FOCUS (visible during TRANSITION, paused)

    const filteredData = useMemo(() => {
        if (selectedCluster === 'all') return data;
        return data.filter(d => d.category === selectedCluster);
    }, [data, selectedCluster]);

    const nodes = useMemo(() => {
        return calculatePhyllotaxisPositions(filteredData);
    }, [filteredData]);

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Center Reference point: 50% 50% */}
            <div className="absolute top-1/2 left-1/2 w-0 h-0 overflow-visible">
                {/* No AnimatePresence - Stable rendering */}
                {nodes.map((node) => {
                    const driftVariant = {
                        moving: {
                            x: [node.xBase, node.xBase + 10, node.xBase - 10, node.xBase],
                            y: [node.yBase, node.yBase - 10, node.yBase + 10, node.yBase],
                            transition: {
                                duration: node.driftDuration,
                                repeat: Infinity,
                                ease: "linear",
                                delay: node.driftDelay
                            }
                        },
                        paused: {
                            x: node.xBase,
                            y: node.yBase,
                            transition: {
                                duration: 0.5,
                                ease: "easeInOut"
                            }
                        }
                    };

                    let scale = 1.0;
                    if (node.status === 'low') scale = 1.3;
                    if (node.status === 'high') scale = 1.1;
                    if (node.status === 'unknown') scale = 0.85;

                    // Z-Index hierarchy
                    const zIndex = node.status === 'unknown' ? 10 : node.status === 'ok' ? 20 : 30;
                    const Icon = node.icon;
                    const iconColor =
                        node.status === 'low' ? "text-amber-500" :
                            node.status === 'ok' ? "text-green-500" :
                                node.status === 'high' ? "text-red-500" :
                                    "text-muted-foreground";

                    return (
                        <motion.div
                            key={node.id}
                            layoutId={`nutrient-node-${node.id}`}
                            className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                            style={{ zIndex }}
                            variants={driftVariant}
                            animate={isPaused ? "paused" : "moving"}
                            initial="paused" // Start calm
                        >
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: scale, opacity: 1 }}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            >
                                <div className="pointer-events-auto">
                                    <LiquidPressable
                                        variant="icon"
                                        size="lg"
                                        className={cn(
                                            "rounded-full backdrop-blur-md shadow-sm transition-shadow duration-500",
                                            isDarkMode
                                                ? "bg-white/5 border-white/20 shadow-white/5"
                                                : "bg-white/60 border-black/5 shadow-black/5",
                                            node.status === 'low' && "shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)] border-amber-500/30",
                                            node.status === 'ok' && "shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)] border-green-500/30"
                                        )}
                                        onClick={() => onSelect(node.id)}
                                        disabled={isPaused}
                                    >
                                        <div className="flex flex-col items-center justify-center gap-0.5">
                                            <Icon className={cn("w-5 h-5 opacity-90 stroke-[2.5px]", iconColor)} />
                                            <span className={cn(
                                                "text-[9px] font-bold uppercase tracking-wider opacity-60 leading-none",
                                                isDarkMode ? "text-white" : "text-black"
                                            )}>
                                                {node.name.split(' ')[0].substring(0, 4)}
                                            </span>
                                        </div>
                                    </LiquidPressable>

                                    {node.status !== 'unknown' && node.status !== 'ok' && (
                                        <div className={cn(
                                            "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2",
                                            isDarkMode ? "border-black" : "border-white",
                                            node.status === 'low' ? "bg-amber-500" : "bg-red-500"
                                        )} />
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
