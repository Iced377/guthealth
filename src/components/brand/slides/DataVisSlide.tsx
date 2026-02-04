'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Activity, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function DataVisSlide() {
    return (
        <div className="w-full p-8 md:p-12 flex flex-col">
            <div className="mb-10 text-center md:text-left">
                <h2 className="text-4xl font-bold text-white mb-2">Data Experience</h2>
                <p className="text-white/60 text-lg">Immersive. Fluid. Insight-First.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Principle 1: Immersive */}
                <div className="space-y-4 group">
                    <div className="bg-white/5 border border-white/10 rounded-3xl aspect-[4/5] relative overflow-hidden flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />

                        {/* Mock Phone Screen */}
                        <div className="w-full h-full bg-black border border-white/10 rounded-2xl relative overflow-hidden shadow-2xl flex flex-col">
                            {/* Expanded Chart State */}
                            <motion.div
                                animate={{ height: ["40%", "100%", "100%", "40%"] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                                className="w-full bg-gradient-to-b from-primary/20 to-transparent absolute bottom-0 left-0 right-0 border-t border-primary/50 backdrop-blur-sm"
                            >
                                <div className="absolute top-4 left-4">
                                    <span className="text-xs text-primary font-mono uppercase tracking-widest">Active Trend</span>
                                    <div className="text-2xl font-bold text-white">98%</div>
                                </div>
                                {/* Fake Graph Line */}
                                <svg className="absolute bottom-0 w-full h-24" preserveAspectRatio="none">
                                    <path d="M0,100 C50,80 100,0 200,50 L200,100 Z" fill="rgba(39,174,96, 0.2)" />
                                </svg>
                            </motion.div>

                            {/* Fake Content Behind */}
                            <div className="p-4 space-y-2 opacity-50">
                                <div className="h-4 w-1/2 bg-white/10 rounded" />
                                <div className="h-4 w-3/4 bg-white/10 rounded" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                            <Maximize2 className="w-5 h-5 text-primary" /> Full-Screen Immersion
                        </h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Charts are not widgets; they are destinations. Insight cards must expand to fill the entire viewport (`100dvh`) to focus the user.
                        </p>
                    </div>
                </div>

                {/* Principle 2: Fluidity */}
                <div className="space-y-4 group">
                    <div className="bg-white/5 border border-white/10 rounded-3xl aspect-[4/5] relative overflow-hidden flex items-center justify-center">
                        {/* Fluid Animation Demo */}
                        <div className="relative w-40 h-40">
                            {/* A blob morphing */}
                            <div className="absolute inset-0">
                                <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                                    <motion.path
                                        d="M 20 100 Q 100 20 180 100 T 340 100"
                                        animate={{
                                            d: [
                                                "M 20 100 Q 100 20 180 100 T 340 100",
                                                "M 20 100 Q 100 180 180 100 T 340 100",
                                                "M 20 100 Q 100 20 180 100 T 340 100"
                                            ]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        fill="none"
                                        stroke="#27AE60"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                {/* Floating Dots following curve logic (simulated) */}
                                <motion.div
                                    animate={{ y: [0, 80, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute left-[90px] top-[10px] w-4 h-4 bg-white rounded-full shadow-[0_0_15px_white]"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-blue-400" /> Organic Fluidity
                        </h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Data flows. Use spring physics for state changes. Avoid rigid linear tweens. The interface should feel like liquid glass.
                        </p>
                    </div>
                </div>

                {/* Principle 3: Signal/Noise */}
                <div className="space-y-4 group">
                    <div className="bg-white/5 border border-white/10 rounded-3xl aspect-[4/5] relative overflow-hidden flex flex-col items-center justify-center p-8 bg-[url('/grid-pattern.svg')]">

                        {/* Good Example */}
                        <div className="w-full bg-black/40 border border-green-500/50 rounded-2xl p-6 mb-4 relative overflow-hidden backdrop-blur-md">
                            <div className="absolute top-2 right-2 text-[10px] bg-green-500/20 text-green-300 px-2 rounded-full border border-green-500/20">GOOD</div>
                            <h4 className="text-white/50 text-xs uppercase tracking-widest mb-1">Recovery</h4>
                            <div className="text-4xl font-bold text-white mb-4">9.2</div>
                            {/* Minimal line */}
                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-[92%] bg-green-500" />
                            </div>
                        </div>

                        {/* Bad Example */}
                        <div className="w-full bg-black/40 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden opacity-50 grayscale">
                            <div className="absolute top-2 right-2 text-[10px] bg-red-500/20 text-red-300 px-2 rounded-full border border-red-500/20">BAD</div>
                            <div className="grid grid-cols-4 gap-2 text-[8px] text-white/30 font-mono mb-2">
                                <span>AXIS-X</span><span>AXIS-Y</span><span>GRID</span><span>LABEL</span>
                            </div>
                            <div className="border border-white/10 h-8 w-full flex items-end">
                                <div className="bg-white/20 w-1/4 h-1/2" />
                                <div className="bg-white/20 w-1/4 h-3/4 mx-1" />
                                <div className="bg-white/20 w-1/4 h-1/4" />
                            </div>
                        </div>

                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                            <EyeOff className="w-5 h-5 text-red-400" /> Minimum Viable Data
                        </h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Hide the noise. Remove grid lines, axis labels, and ticks unless actively scrubbing. Display only the **metric that matters**.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
