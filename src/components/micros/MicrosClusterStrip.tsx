'use client';

import React from 'react';
import { useMicrosMotionController, MicrosCluster } from './useMicrosMotionController';
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const CLUSTERS: { id: MicrosCluster; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'vitamins', label: 'Vitamins' },
    { id: 'minerals', label: 'Minerals' },
    { id: 'other', label: 'Other' },
];

export default function MicrosClusterStrip() {
    const { selectedCluster, setSelectedCluster, interactionMode } = useMicrosMotionController();
    const { isDarkMode } = useTheme();

    const isDisabled = interactionMode !== 'BROWSE';

    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
            {CLUSTERS.map((cluster) => {
                const isSelected = selectedCluster === cluster.id;

                return (
                    <LiquidPressable
                        key={cluster.id}
                        variant="pill"
                        size="sm"
                        disabled={isDisabled}
                        onClick={() => setSelectedCluster(cluster.id)}
                        className={cn(
                            "transition-all duration-300 border",
                            isSelected
                                ? "bg-white/90 text-black border-white"
                                : isDarkMode
                                    ? "bg-white/5 border-white/10 text-white/60 hover:text-white/80"
                                    : "bg-black/5 border-black/5 text-black/60 hover:text-black/80"
                        )}
                    >
                        {cluster.label}
                    </LiquidPressable>
                );
            })}
        </div>
    );
}
