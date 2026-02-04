'use client';
import React from 'react';
import { motion } from 'framer-motion';

export default function MissionSlide() {
    return (
        <div className="w-full h-full flex flex-col md:flex-row items-center justify-center p-12 gap-16 relative z-10">

            <div className="flex-1 space-y-8 text-left">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-sm font-mono text-primary tracking-widest uppercase mb-4">Our Mission</h2>
                    <p className="text-4xl md:text-5xl font-bold leading-tight text-white">
                        To empower millions to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">master their gut health</span> through AI-driven insights and radical transparency.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                >
                    <h2 className="text-sm font-mono text-primary tracking-widest uppercase mb-4 mt-12">Our Vision</h2>
                    <p className="text-2xl font-light text-white/80 leading-relaxed">
                        A world where nutrition is personalized, health is deciphered, and everyone has a "gut check" on their well-being.
                    </p>
                </motion.div>
            </div>

            <div className="flex-1 h-full flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="relative w-full aspect-square max-w-md"
                >
                    {/* Abstract visual representation of gut/brain connection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-purple-500/30 rounded-full blur-[80px] animate-pulse-glow" />
                    <div className="absolute inset-0 border border-white/10 rounded-full animate-[spin_60s_linear_infinite]" />
                    <div className="absolute inset-8 border border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse]" />

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="glass-thick p-8 rounded-2xl backdrop-blur-3xl text-center border border-white/10 shadow-2xl">
                            <span className="text-6xl font-bold text-white block">10k+</span>
                            <span className="text-sm text-white/50 uppercase tracking-widest">Lives Impacted</span>
                        </div>
                    </div>
                </motion.div>
            </div>

        </div>
    );
}
