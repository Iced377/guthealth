// src/components/ramadan/RamadanCard.tsx
'use client';

import { motion } from 'framer-motion';
import { RamadanTip } from '@/data/ramadan-seed';
import { Heart, Moon, Brain, Users, GlassWater, Utensils, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    goalDateLabel
}: RamadanCardProps) {

    // Icon mapping based on category
    const getIcon = () => {
        switch (tip.category) {
            case 'Hydration': return <GlassWater className="w-5 h-5 text-blue-200" />;
            case 'Nutrition': return <Utensils className="w-5 h-5 text-green-200" />;
            case 'Mental Resilience': return <Brain className="w-5 h-5 text-purple-200" />;
            case 'Community': return <Users className="w-5 h-5 text-amber-200" />;
            case 'Well-being': default: return <Sparkles className="w-5 h-5 text-rose-200" />;
        }
    };

    // Gradient mapping based on category
    const getGradient = () => {
        switch (tip.category) {
            case 'Hydration': return 'from-blue-900/40 to-cyan-900/40 border-blue-500/30';
            case 'Nutrition': return 'from-emerald-900/40 to-green-900/40 border-emerald-500/30';
            case 'Mental Resilience': return 'from-purple-900/40 to-indigo-900/40 border-purple-500/30';
            case 'Community': return 'from-amber-900/40 to-orange-900/40 border-amber-500/30';
            case 'Well-being': default: return 'from-rose-900/40 to-pink-900/40 border-rose-500/30';
        }
    };

    return (
        <div className={cn(
            "relative w-full h-full rounded-[2rem] overflow-hidden backdrop-blur-3xl border transition-all duration-300",
            getGradient(),
            "bg-gradient-to-br"
        )}>
            {/* Dynamic Background Noise/Texture */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 p-8 flex flex-col h-full pointer-events-none"> {/* Visual only, pointer events handled by parent drag */}

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/5 shadow-inner">
                        {getIcon()}
                        <span className="text-xs font-semibold tracking-wide uppercase text-white/90">{tip.category}</span>
                    </div>

                    {mode === 'goal' ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onUncommit?.();
                            }}
                            className="text-xs text-white/50 hover:text-white/80 transition-colors pointer-events-auto"
                        >
                            Uncommit
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent drag start
                                onSave?.(tip);
                            }}
                            className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors pointer-events-auto active:scale-95 group"
                        >
                            <Heart
                                className={cn(
                                    "w-6 h-6 transition-all duration-300",
                                    isSaved ? "fill-rose-500 text-rose-500 scale-110" : "text-white/60 group-hover:text-white"
                                )}
                            />
                        </button>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col justify-center space-y-6">
                    <h2 className={cn(
                        "font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70 leading-tight",
                        mode === 'goal' ? "text-2xl" : "text-3xl"
                    )}>
                        {tip.title}
                    </h2>

                    <p className={cn(
                        "text-white/80 leading-relaxed font-medium",
                        mode === 'goal' ? "text-base line-clamp-4" : "text-lg"
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
                            "mt-8 p-5 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/5 text-left transition-all pointer-events-auto",
                            isCompleted ? "ring-2 ring-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]" : "hover:bg-black/30"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Moon className="w-3 h-3 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                                    {isCompleted ? "Completed" : "Mark Complete"}
                                </h4>
                                <p className="text-sm text-white/90 leading-snug">
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
                                "mt-8 p-5 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/5 text-left transition-all pointer-events-auto",
                                isCommitted ? "ring-2 ring-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]" : "hover:bg-black/30"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <Moon className="w-3 h-3 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                                        {isCommitted ? "Committed Goal" : "Tap to Commit"}
                                    </h4>
                                    <p className="text-sm text-white/90 leading-snug">{tip.actionItem}</p>
                                </div>
                            </div>
                        </button>
                    )
                )}
            </div>

            {/* Footer / Watermark */}
            <div className="absolute bottom-4 right-6 pointer-events-none opacity-20">
                <Moon className="w-32 h-32 -rotate-12" />
            </div>
        </div>
    );
}
