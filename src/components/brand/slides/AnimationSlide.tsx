'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnimationSlide() {
    const [replayKey, setReplayKey] = useState(0);

    const animations = [
        {
            title: 'Pulse Glow',
            desc: 'Used for attention-grabbing elements like AI insights.',
            component: (
                <div className="relative w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse-glow">
                    <div className="w-10 h-10 bg-primary rounded-full shadow-[0_0_20px_hsl(var(--primary))]" />
                </div>
            )
        },
        {
            title: 'Staggered Fade In',
            desc: 'Used for lists and cards to reduce cognitive load.',
            component: (
                <div className="space-y-2 w-48">
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2, duration: 0.5 }}
                            className="h-10 bg-white/10 rounded-lg flex items-center px-4 text-xs text-white/50"
                        >
                            Item {i}
                        </motion.div>
                    ))}
                </div>
            )
        },
        {
            title: 'Accordion',
            desc: 'Smooth height transitions for maximizing space.',
            component: (
                <AccordionDemo />
            )
        }
    ];

    const handleReplay = () => {
        setReplayKey(prev => prev + 1);
    };

    return (
        <div className="w-full h-full p-8 md:p-12 flex flex-col">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-4xl font-bold text-white mb-2">Motion & Animation</h2>
                    <p className="text-white/60">Fluid. Organic. Purposeful.</p>
                </div>
                <Button onClick={handleReplay} variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                    <RotateCcw className="w-4 h-4" /> Replay All
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1" key={replayKey}>
                {animations.map((a, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center">
                        <div className="flex-1 flex items-center justify-center w-full min-h-[200px] bg-black/20 rounded-2xl mb-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
                            {a.component}
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-2">{a.title}</h3>
                            <p className="text-sm text-white/50">{a.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AccordionDemo() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-48 bg-white/10 rounded-xl overflow-hidden cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
            <div className="p-4 flex items-center justify-between text-xs text-white font-medium">
                <span>Click me</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 text-[10px] text-white/50">
                            Smooth height animations maintain context and feel premium.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
