'use client';
import React from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Heart, Zap, User, Settings,
    ChevronRight, ArrowRight, MessageSquare,
    Calendar, TrendingUp, ShieldCheck
} from 'lucide-react';

export default function IconographySlide() {
    const icons = [
        { icon: Activity, name: 'Activity' },
        { icon: Heart, name: 'Health' },
        { icon: Zap, name: 'Energy' },
        { icon: TrendingUp, name: 'Trends' },
        { icon: ShieldCheck, name: 'Protection' },
        { icon: MessageSquare, name: 'Chat' },
        { icon: User, name: 'User' },
        { icon: Settings, name: 'Settings' },
        { icon: Calendar, name: 'Calendar' },
    ];

    return (
        <div className="w-full h-full p-8 md:p-12 flex flex-col">
            <div className="mb-12">
                <h2 className="text-4xl font-bold text-white mb-2">Iconography</h2>
                <p className="text-white/60">Lucide React. consistent stroke weight (2px). Rounded.</p>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-12">
                {/* Icon Grid */}
                <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8">
                    <div className="grid grid-cols-3 gap-8">
                        {icons.map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.1 }}
                                className="flex flex-col items-center gap-3 text-white/70 hover:text-primary transition-colors duration-300 cursor-pointer"
                            >
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <item.icon className="w-8 h-8" strokeWidth={1.5} />
                                </div>
                                <span className="text-xs font-mono opacity-50">{item.name}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Usage Context */}
                <div className="flex-1 space-y-8">
                    <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl">
                        <h3 className="text-primary font-bold mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 fill-primary/20" /> Active State
                        </h3>
                        <p className="text-sm text-primary/80">
                            When active, icons often take on the primary color and may have a subtle fill or glow.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl opacity-60">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5" /> Inactive State
                        </h3>
                        <p className="text-sm text-white/60">
                            Inactive icons remain neutral (white/50 or white/70) to reduce visual noise.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
