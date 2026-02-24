// src/components/ramadan/RamadanCard.tsx
'use client';

import { motion } from 'framer-motion';
import { RamadanTip } from '@/data/ramadan-seed';
import { Heart, Moon, Brain, Users, GlassWater, Utensils, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface RamadanCardProps {
    tip: RamadanTip;
    isFront: boolean;
    onSave?: (tip: RamadanTip) => void;
    onCommit?: (tip: RamadanTip) => void;
    isSaved?: boolean;
    isCommitted?: boolean;
    mode?: 'wisdom' | 'goal';
    isCompleted?: boolean;
    onToggleComplete?: () => void;
    onUncommit?: () => void;
    goalDateLabel?: string;
    compact?: boolean;
}

export function RamadanCard({
    tip,
    isFront,
    onSave,
    onCommit,
    isSaved = false,
    isCommitted = false,
    mode = 'wisdom',
    isCompleted = false,
    onToggleComplete,
    onUncommit,
    goalDateLabel,
    compact = false
}: RamadanCardProps) {
    const { isDarkMode } = useTheme();

    // Icon mapping based on category
    const getIcon = () => {
        switch (tip.category) {
            case 'Hydration': return <GlassWater className={cn("w-5 h-5", isDarkMode ? "text-blue-200" : "text-blue-700")} />;
            case 'Nutrition': return <Utensils className={cn("w-5 h-5", isDarkMode ? "text-green-200" : "text-emerald-700")} />;
            case 'Mental Resilience': return <Brain className={cn("w-5 h-5", isDarkMode ? "text-purple-200" : "text-purple-700")} />;
            case 'Community': return <Users className={cn("w-5 h-5", isDarkMode ? "text-amber-200" : "text-amber-700")} />;
            case 'Well-being': default: return <Sparkles className={cn("w-5 h-5", isDarkMode ? "text-rose-200" : "text-rose-700")} />;
        }
    };

    // Gradient mapping based on category
    const getGradient = () => {
        switch (tip.category) {
            case 'Hydration': return isDarkMode
                ? 'from-blue-900/40 to-cyan-900/40 border-blue-500/30'
                : 'from-blue-50/90 to-cyan-100/80 border-blue-200/70';
            case 'Nutrition': return isDarkMode
                ? 'from-emerald-900/40 to-green-900/40 border-emerald-500/30'
                : 'from-emerald-50/90 to-green-100/80 border-emerald-200/70';
            case 'Mental Resilience': return isDarkMode
                ? 'from-purple-900/40 to-indigo-900/40 border-purple-500/30'
                : 'from-purple-50/90 to-indigo-100/80 border-purple-200/70';
            case 'Community': return isDarkMode
                ? 'from-amber-900/40 to-orange-900/40 border-amber-500/30'
                : 'from-amber-50/90 to-orange-100/80 border-amber-200/70';
            case 'Well-being': default: return isDarkMode
                ? 'from-rose-900/40 to-pink-900/40 border-rose-500/30'
                : 'from-rose-50/90 to-pink-100/80 border-rose-200/70';
        }
    };

    return (
        <div className={cn(
            "relative w-full h-full rounded-[2rem] overflow-hidden border transition-all duration-300 shadow-none",
            isDarkMode
                ? "backdrop-blur-3xl"
                : "backdrop-blur-xl",
            getGradient(),
            "bg-gradient-to-br"
        )}>
            {/* Dynamic Background Noise/Texture */}
            <div className={cn(
                "absolute inset-0 bg-[url('/noise.png')] mix-blend-overlay pointer-events-none",
                isDarkMode ? "opacity-[0.03]" : "opacity-[0.06]"
            )} />

            {/* Content Container */}
            <div className={cn(
                "relative z-10 flex flex-col h-full pointer-events-none",
                compact ? "p-5" : "p-8"
            )}> {/* Visual only, pointer events handled by parent drag */}

                {/* Header */}
                <div className={cn("flex justify-between items-start", compact ? "mb-3" : "mb-6")}>
                    <div className={cn(
                        "flex items-center gap-2 rounded-full backdrop-blur-md border shadow-inner",
                        compact ? "px-2.5 py-1" : "px-3 py-1.5",
                        isDarkMode ? "bg-white/10 border-white/5" : "bg-white/80 border-emerald-200/70"
                    )}>
                        {getIcon()}
                        <span className={cn(
                            "text-xs font-semibold tracking-wide uppercase",
                            isDarkMode ? "text-white/90" : "text-emerald-900"
                        )}>{tip.category}</span>
                    </div>

                    {mode === 'goal' ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onUncommit?.();
                            }}
                            className={cn(
                                "text-xs transition-colors pointer-events-auto",
                                isDarkMode ? "text-white/50 hover:text-white/80" : "text-emerald-700/70 hover:text-emerald-900"
                            )}
                        >
                            Uncommit
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent drag start
                                onSave?.(tip);
                            }}
                            className={cn(
                                "rounded-full transition-colors pointer-events-auto active:scale-95 group",
                                compact ? "p-2.5" : "p-3",
                                isDarkMode ? "bg-white/5 hover:bg-white/10" : "bg-white/80 hover:bg-white"
                            )}
                        >
                            <Heart
                                className={cn(
                                    "w-6 h-6 transition-all duration-300",
                                    isSaved
                                        ? (isDarkMode ? "fill-rose-500 text-rose-500 scale-110" : "fill-rose-600 text-rose-600 scale-110")
                                        : (isDarkMode ? "text-white/60 group-hover:text-white" : "text-emerald-700 group-hover:text-emerald-900")
                                )}
                            />
                        </button>
                    )}
                </div>

                {/* Main Content */}
                <div className={cn(
                    "flex-1 flex flex-col justify-center",
                    compact ? "space-y-3" : "space-y-6"
                )}>
                    <h2 className={cn(
                        "font-bold leading-tight",
                        isDarkMode
                            ? "bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70"
                            : "text-emerald-950",
                        mode === 'goal'
                            ? (compact ? "text-xl" : "text-2xl")
                            : (compact ? "text-[21px] line-clamp-2" : "text-3xl")
                    )}>
                        {tip.title}
                    </h2>

                    <p className={cn(
                        "leading-relaxed font-medium",
                        isDarkMode ? "text-white/80" : "text-emerald-900/80",
                        mode === 'goal'
                            ? (compact ? "text-sm line-clamp-4" : "text-base line-clamp-4")
                            : (compact ? "text-[14px] line-clamp-3" : "text-lg")
                    )}>
                        {tip.content}
                    </p>
                </div>

                {/* Action Item */}
                {mode === 'goal' ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete?.();
                        }}
                        className={cn(
                            "rounded-2xl backdrop-blur-xl border text-left transition-all pointer-events-auto",
                            isDarkMode
                                ? "bg-black/20 border-white/5 hover:bg-black/30"
                                : "bg-white/85 border-emerald-200/70 hover:bg-white",
                            compact ? "mt-3 p-3.5" : "mt-8 p-5",
                            isCompleted ? "ring-2 ring-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]" : ""
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Moon className={cn("w-3 h-3", isDarkMode ? "text-emerald-400" : "text-emerald-600")} />
                            </div>
                            <div>
                                <h4 className={cn(
                                    "text-xs font-bold uppercase tracking-wider mb-1",
                                    isDarkMode ? "text-emerald-400" : "text-emerald-700"
                                )}>
                                    {isCompleted ? "Completed" : "Mark Complete"}
                                </h4>
                                <p className={cn(
                                    "leading-snug",
                                    isDarkMode ? "text-white/90" : "text-emerald-900",
                                    compact ? "text-[13px]" : "text-sm"
                                )}>
                                    {goalDateLabel ? `For ${goalDateLabel}` : 'For selected day'}
                                </p>
                            </div>
                        </div>
                    </button>
                ) : (
                    tip.actionItem && (
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCommit?.(tip);
                        }}
                        className={cn(
                            "rounded-2xl backdrop-blur-xl border text-left transition-all pointer-events-auto",
                            isDarkMode
                                ? "bg-black/20 border-white/5 hover:bg-black/30"
                                : "bg-white/85 border-emerald-200/70 hover:bg-white",
                            compact ? "mt-3 p-3.5" : "mt-8 p-5",
                            isCommitted ? "ring-2 ring-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]" : ""
                        )}
                    >
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <Moon className={cn("w-3 h-3", isDarkMode ? "text-emerald-400" : "text-emerald-600")} />
                                </div>
                                <div>
                                    <h4 className={cn(
                                        "text-xs font-bold uppercase tracking-wider mb-1",
                                        isDarkMode ? "text-emerald-400" : "text-emerald-700"
                                    )}>
                                        {isCommitted ? "Committed Goal" : "Tap to Commit"}
                                    </h4>
                                    <p className={cn(
                                        "leading-snug",
                                        isDarkMode ? "text-white/90" : "text-emerald-900",
                                        compact ? "text-[13px] line-clamp-2" : "text-sm"
                                    )}>
                                        {tip.actionItem}
                                    </p>
                                </div>
                            </div>
                        </button>
                    )
                )}
            </div>

            {/* Footer / Watermark */}
            <div className={cn(
                "absolute bottom-4 right-6 pointer-events-none",
                isDarkMode ? "opacity-20" : "opacity-15"
            )}>
                <Moon className={cn(
                    "w-32 h-32 -rotate-12",
                    isDarkMode ? "text-white" : "text-emerald-300"
                )} />
            </div>
        </div>
    );
}
