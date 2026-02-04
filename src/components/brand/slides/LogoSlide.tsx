'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function LogoSlide() {
    const { toast } = useToast();
    const [showGuides, setShowGuides] = useState(false);

    return (
        <div className="w-full h-full flex flex-col p-8 md:p-12">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-4xl font-bold text-white mb-2">Logo Guidelines</h2>
                    <p className="text-white/60">Our primary identity mark. Use seamlessly.</p>
                </div>
                <button
                    onClick={() => setShowGuides(!showGuides)}
                    className="px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm"
                >
                    {showGuides ? 'Hide Guides' : 'Show Guides (x)'}
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Main Logo Display */}
                <div className="bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

                    <div className="relative p-12">
                        {/* Clear Space Guides */}
                        <AnimatePresence>
                            {showGuides && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 border border-blue-500/50 bg-blue-500/10 pointer-events-none"
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-blue-400 text-xs font-mono">1x</div>
                                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-blue-400 text-xs font-mono">1x</div>
                                    <div className="absolute inset-0 m-12 border border-dashed border-blue-500/30" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative z-10 w-64 h-64">
                            <div className="absolute inset-0 bg-primary/40 rounded-[3rem] blur-3xl animate-pulse-glow" />
                            <img src="/icon-512.png" alt="Logo" className="w-full h-full object-contain relative rounded-[2.5rem] shadow-[0_0_50px_-10px_rgba(39,174,96,0.6)]" />
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-4 text-xs font-mono text-white/30">
                        Primary Full Color
                    </div>
                </div>

                {/* Do's and Don'ts */}
                <div className="space-y-6">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-4 right-4 bg-green-500/20 text-green-300 p-1 rounded-full"><Check className="w-4 h-4" /></div>
                        <h3 className="text-green-300 font-bold mb-2">Clear Space</h3>
                        <p className="text-green-100/60 text-sm">Always maintain "1x" padding around the logo, where x is the height of the icon.</p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-4 right-4 bg-red-500/20 text-red-300 p-1 rounded-full"><X className="w-4 h-4" /></div>
                        <h3 className="text-red-300 font-bold mb-2">Incorrect Usage</h3>
                        <ul className="text-red-100/60 text-sm space-y-2 list-disc pl-4">
                            <li>Do not rotate the logo.</li>
                            <li>Do not change the colors (use only primary green or white).</li>
                            <li>Do not add drop shadows directly to the vector.</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4">
                        <h3 className="text-white font-bold">Variations</h3>
                        <div className="flex gap-4">
                            <div className="h-16 w-32 bg-white rounded flex items-center justify-center">
                                <img src="/logo-maximized.png" className="h-8 opacity-90 invert-0 brightness-0" /> {/* Simulate black */}
                            </div>
                            <div className="h-16 w-32 bg-black rounded flex items-center justify-center border border-white/20">
                                <img src="/logo-maximized.png" className="h-8 brightness-0 invert" /> {/* Simulate white */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
