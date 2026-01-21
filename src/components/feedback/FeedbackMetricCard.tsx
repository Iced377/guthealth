'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { ChevronLeft } from 'lucide-react';

interface FeedbackMetricCardProps {
    title: string;
    description: string;
    index: number;
    children?: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    isActive?: boolean;
    showBack?: boolean;
    onBack?: () => void;
}

export default function FeedbackMetricCard({ title, description, index, children, onClick, isActive, showBack, onBack }: FeedbackMetricCardProps) {
    return (
        <div
            className="h-screen w-full flex flex-col items-center justify-center p-6 snap-center shrink-0 relative transition-all duration-500 pt-20 pb-24"
            onClick={onClick}
        >
            <GlassCard
                className={cn(
                    "w-full max-w-sm flex flex-col items-center gap-8 p-8 bg-transparent border-0 transition-all duration-500 relative",
                    isActive ? "scale-105" : "scale-100 opacity-90"
                )}
            >
                {showBack && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onBack?.();
                        }}
                        className="absolute top-6 left-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}

                <div className="text-center mt-12">
                    <h3 className="text-3xl font-headline font-bold mb-2 text-foreground">{title}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
                </div>

                {/* Content Area (Orb) */}
                <div className="flex-1 w-full flex items-center justify-center relative pointer-events-auto">
                    {children}
                </div>
            </GlassCard>
        </div >
    );
}
