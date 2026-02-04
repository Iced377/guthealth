'use client';
import React from 'react';
import { motion } from 'framer-motion';

export default function CoverSlide() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full animate-pulse-glow" />
            </div>

            <div className="z-10 text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >
                    <div className="w-40 h-40 mb-8 relative">
                        {/* High-fidelity icon with round edges and bleeding glow */}
                        <div className="absolute inset-0 bg-primary/40 rounded-[3rem] blur-2xl animate-pulse-glow" />
                        <img src="/icon-512.png" alt="Gutcheck Logo" className="w-full h-full object-contain relative z-10 rounded-[2.5rem] shadow-[0_0_50px_-10px_rgba(39,174,96,0.6)]" />
                    </div>

                    <h1 className="text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 mb-4">
                        GutHealth
                    </h1>
                    <div className="h-1 w-24 bg-primary rounded-full mb-6 mx-auto" />
                    <p className="text-2xl text-white/60 font-mono tracking-widest uppercase">
                        Brand Identity Guidelines
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="glass-crystal px-8 py-4 rounded-full text-sm text-white/80"
                >
                    v5.0.0 • 2026
                </motion.div>
            </div>
        </div>
    );
}
