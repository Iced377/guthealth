'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function ComponentsSlide() {
    return (
        <div className="w-full h-full p-8 md:p-12 flex flex-col">
            <div className="mb-12">
                <h2 className="text-4xl font-bold text-white mb-2">UI Components</h2>
                <p className="text-white/60">Accessible primitives styled with our design tokens.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto pb-20">

                {/* Buttons */}
                <div className="space-y-4">
                    <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest border-b border-white/10 pb-2">Buttons</h3>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-4 items-start">
                        <Button>Default Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Destructive</Button>
                    </div>
                </div>

                {/* Meal Card Anatomy */}
                <div className="space-y-4 md:col-span-2">
                    <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest border-b border-white/10 pb-2">Meal Card Anatomy</h3>
                    <div className="relative p-6 bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                        {/* The Card Itself - Recreated for Demo */}
                        <div className="relative w-full max-w-sm mx-auto bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                            <div className="absolute -bottom-6 -right-6 pointer-events-none z-0 overflow-hidden opacity-[0.1] transform rotate-12">
                                <span className="text-9xl">🥑</span>
                            </div>
                            <div className="p-4 relative z-10 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-lg font-bold text-white mb-1">Avocado Toast</div>
                                        <div className="flex gap-3 text-xs opacity-70">
                                            <span className="flex items-center gap-1 text-orange-300"><span className="w-1 h-1 bg-orange-300 rounded-full" /> 320 Cal</span>
                                            <span className="flex items-center gap-1 text-blue-300"><span className="w-1 h-1 bg-blue-300 rounded-full" /> 12g Fat</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                        <div className="w-1 h-1 bg-white rounded-full box-content border-2 border-transparent" />
                                        <div className="w-1 h-1 bg-white rounded-full mx-0.5" />
                                        <div className="w-1 h-1 bg-white rounded-full" />
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <div className="px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-wide">Low FODMAP</div>
                                    <div className="px-2 py-1 rounded bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase tracking-wide">High Fiber</div>
                                </div>
                            </div>
                        </div>

                        {/* Annotations */}
                        <div className="hidden md:block">
                            {/* Title Annotation */}
                            <div className="absolute top-[30%] left-[10%] text-xs text-white/60 flex items-center gap-2">
                                <span className="w-12 h-[1px] bg-white/20"></span> Primary Subject
                            </div>
                            {/* Macro Annotation */}
                            <div className="absolute top-[45%] left-[15%] text-xs text-white/60 flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-white/20"></span> Data Points (10px)
                            </div>
                            {/* Badge Annotation */}
                            <div className="absolute bottom-[25%] right-[10%] text-xs text-white/60 flex items-center gap-2">
                                Insight Chips <span className="w-8 h-[1px] bg-white/20"></span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-white/60">
                        <div>
                            <h4 className="text-white font-bold mb-1">1. Liquid Crystal Container</h4>
                            <p>Glassmorphic surface (`bg-card`, `backdrop-blur`). Borders should be subtle (`white/10`) to allow content to pop.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">2. Semantic Color Coding</h4>
                            <p>Macros use consistent colors (Cal=Orange, Protein=Red, Carbs=Yellow). Badges use Traffic Light logic (Green=Safe, Red=Risk).</p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">3. Background Watermark</h4>
                            <p>Large, faint icon (`opacity-5`) anchored bottom-right. Adds depth and immediate visual recognition without noise.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">4. Smart Badges</h4>
                            <p>Only appear if relevant. `flex-wrap` layout ensures they stack cleanly on mobile.</p>
                        </div>
                    </div>
                </div>

                {/* Macro Header Anatomy */}
                <div className="space-y-4 md:col-span-2">
                    <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest border-b border-white/10 pb-2">Macro Header Composition</h3>
                    <div className="relative p-6 bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                        {/* The Card - Recreated for Demo */}
                        <div className="relative w-48 mx-auto aspect-[3/2] bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 rounded-xl overflow-hidden shadow-2xl group hover:scale-105 transition-transform duration-500">
                            {/* Layer 3: Gloss */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-50 pointer-events-none mix-blend-overlay" />

                            {/* Layer 2: 3D Icon */}
                            <div className="absolute right-[-15%] top-[-15%] h-[80%] w-[80%] opacity-[0.12] blur-sm rotate-12">
                                <span className="text-9xl text-red-500">🥩</span>
                            </div>

                            {/* Layer 1: Content */}
                            <div className="relative z-10 flex flex-col h-full justify-between p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-red-100 opacity-80">Protein</div>
                                <div className="space-y-2">
                                    <div>
                                        <div className="text-3xl font-black font-headline leading-none text-red-100">142g</div>
                                        <div className="text-[9px] font-bold uppercase tracking-wide text-red-200/60">88% of target</div>
                                    </div>
                                    {/* Liquid Bar */}
                                    <div className="h-2 w-full rounded-full bg-red-950/20 shadow-inner relative overflow-hidden border-b border-white/10">
                                        <div className="h-full w-[88%] rounded-r-full bg-gradient-to-r from-red-400 to-red-500 relative">
                                            <div className="absolute top-[10%] left-0 right-0 h-[30%] bg-gradient-to-b from-white/60 to-transparent opacity-80" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Annotations */}
                        <div className="hidden md:block">
                            <div className="absolute top-[20%] right-[20%] text-xs text-white/60 flex items-center gap-2">
                                Floating 3D Icon (Blur) <span className="w-8 h-[1px] bg-white/20"></span>
                            </div>
                            <div className="absolute bottom-[25%] left-[20%] text-xs text-white/60 flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-white/20"></span> Mercury Liquid Bar
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-white/60">
                        <div>
                            <h4 className="text-white font-bold mb-1">1. The "Mercury Tube"</h4>
                            <p>Progress bars are not flat. They look like liquid mercury in a glass tube, using internal shadows (`shadow-inner`) and specular highlights.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">2. Blurred Depth Icon</h4>
                            <p>The icon sits on a separate Z-layer (`z-0`), blurred (`blur-sm`), and rotated. It creates a sense of vast space inside a small card.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">3. Hard Light Mix</h4>
                            <p>Content uses `mix-blend-hard-light` to punch through the glossy background, ensuring readability on vibrant gradients.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">4. Theme Engine</h4>
                            <p>Each macro has a strictly defined palette (Bg, Border, Text, Icon, Bar) to ensure consistency across the dashboard.</p>
                        </div>
                    </div>
                </div>

                {/* Inputs & Form Elements */}
                <div className="space-y-4">
                    <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest border-b border-white/10 pb-2">Forms</h3>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-4">
                        <Input placeholder="Default Input" />
                        <Input placeholder="Focused Input" className="border-primary ring-1 ring-primary" />
                        <div className="flex gap-2">
                            <Badge>Badge</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="outline">Outline</Badge>
                        </div>
                    </div>
                </div>

                {/* Interaction & Animation */}
                <div className="space-y-4 md:col-span-2 lg:col-span-3">
                    <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest border-b border-white/10 pb-2">Liquid Interaction</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-6">
                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                className="px-8 py-4 bg-primary text-white font-bold rounded-full text-xl shadow-[0_10px_30px_-10px_rgba(39,174,96,0.5)] active:shadow-none"
                            >
                                Exaggerated Press
                            </motion.button>
                            <div className="glass-crystal px-4 py-2 rounded-lg text-xs text-white/60 font-mono">
                                stiffness: 400, damping: 10, scale: 0.85
                            </div>
                        </div>
                        <div className="flex flex-col justify-center space-y-4">
                            <h4 className="text-xl font-bold text-white">Tactile Feedback</h4>
                            <p className="text-white/60">
                                Buttons should feel like physical objects made of rubber.
                                We use <strong>exaggerated responsiveness</strong>:
                            </p>
                            <ul className="list-disc list-inside text-white/60 space-y-2 text-sm">
                                <li><strong>Deep Press:</strong> Scale down to <span className="text-white">0.85</span> on tap to show weight.</li>
                                <li><strong>Elastic Rebound:</strong> Use low damping (<span className="text-white">10-15</span>) for a "jelly" bounce back.</li>
                                <li><strong>Haptic Match:</strong> Every visual press must be paired with a haptic tick on mobile.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
