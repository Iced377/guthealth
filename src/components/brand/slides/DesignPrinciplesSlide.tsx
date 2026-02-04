'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, MousePointer, Sparkles, Maximize, Compass, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function DesignPrinciplesSlide() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const principles = [
        {
            icon: Layers,
            title: 'Glassmorphism 2.0',
            description: 'Depth through layering. We use "Liquid Glass" materials to create hierarchy without clutter.',
        },
        {
            icon: Zap,
            title: 'Radical Speed',
            description: 'Interactions feel instant. No loading spinner lasts longer than necessary.',
        },
        {
            icon: MousePointer,
            title: 'Tactile Feedback',
            description: 'Physical by default. Elements compress on touch ("Press In") and spring back on release ("Press Out"). No hover states.',
        },
        {
            icon: Sparkles,
            title: 'Premium Aesthetics',
            description: 'Invest in the pixels. Subtle glows and noise textures make the app feel premium.',
        },
        {
            icon: Maximize,
            title: 'Frameless Layout',
            description: 'Dark Mode means NO BORDERS. Define cards by their surface color (bg-white/5), not by strokes or highlights. The container should disappear.',
        },
        {
            icon: Compass,
            title: 'Singular Focus',
            description: 'One goal, one gesture. Never combine competing navigation (e.g., Arrows + Swipe). Reduce variables.',
        }
    ];

    return (
        <div className="w-full h-full p-8 md:p-12 flex flex-col">
            <div className="mb-12">
                <h2 className="text-4xl font-bold text-white mb-2">Design Principles</h2>
                <p className="text-white/60 text-lg">The core values shaping our visual language.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pb-20">
                {principles.map((p, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="relative group h-full"
                    >
                        <div className={cn(
                            "h-full p-6 rounded-2xl border border-white/5 bg-black/20 transition-all duration-500 overflow-hidden relative flex flex-col",
                            hoveredIndex === i ? "border-primary/50 bg-white/5" : ""
                        )}>
                            {/* Visual Effect Backgrounds */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none",
                                hoveredIndex === i ? "opacity-100" : ""
                            )}>
                                {i === 0 && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/40 blur-[50px] rounded-full" />}
                                {i === 3 && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />}
                                {i === 4 && <div className="absolute inset-0 bg-white/5" />}
                            </div>

                            <div className="mb-4 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                <p.icon className="w-5 h-5" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
                            <p className="text-white/60 text-sm leading-relaxed mb-6 flex-1">{p.description}</p>

                            {/* Live Micro-Demo Area */}
                            <div className="mt-auto h-24 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden">
                                {i === 0 && <div className="glass-regular px-4 py-2 rounded-lg text-white/80 text-xs shadow-lg backdrop-blur-md">Glass Card</div>}

                                {i === 1 && (
                                    <div className="flex gap-2">
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-2 h-2 rounded-full bg-primary" />
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-2 h-2 rounded-full bg-primary" />
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-2 h-2 rounded-full bg-primary" />
                                    </div>
                                )}

                                {i === 2 && (
                                    <button className="bg-white/10 px-4 py-2 rounded text-xs text-white hover:scale-95 transition-transform active:scale-90">Press Me</button>
                                )}

                                {i === 3 && <Sparkles className="text-yellow-300 w-6 h-6 animate-pulse" />}

                                {i === 4 && (
                                    <div className="w-full h-full flex items-center justify-center p-4 gap-4">
                                        {/* Demo: Border vs No Border */}
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <div className="w-12 h-10 rounded border border-white/50 bg-black/50" />
                                            <span className="text-[8px] text-white/50 line-through">Border</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-white/20" />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-10 rounded border-0 bg-white/10" />
                                            <span className="text-[8px] text-primary">Surface</span>
                                        </div>
                                    </div>
                                )}

                                {i === 5 && (
                                    <div className="flex items-center gap-4 text-xs font-mono">
                                        <div className="flex flex-col items-center opacity-30">
                                            <div className="flex gap-1 mb-1"><div className="w-2 h-2 border border-white" /> <div className="w-2 h-2 bg-white" /></div>
                                            <span className="line-through decoration-red-500">Dual</span>
                                        </div>
                                        <div className="h-8 w-[1px] bg-white/20" />
                                        <div className="flex flex-col items-center text-primary">
                                            <div className="w-4 h-4 border-b-2 border-r-2 border-primary rotate-45 mb-1" />
                                            <span>Solo</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
