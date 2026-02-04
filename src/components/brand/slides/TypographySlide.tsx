'use client';
import React from 'react';
import { motion } from 'framer-motion';

export default function TypographySlide() {
    return (
        <div className="w-full h-full p-8 md:p-12 flex flex-col md:flex-row gap-12">
            <div className="flex-1">
                <div className="mb-12">
                    <h2 className="text-4xl font-bold text-white mb-2">Typography</h2>
                    <p className="text-white/60">Inter. Clean, modern, highly legible.</p>
                </div>

                <div className="space-y-8">
                    <div className="group cursor-default">
                        <span className="text-xs font-mono text-white/30 mb-1 block">Headline / H1 / Bold</span>
                        <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                            Aa
                        </h1>
                        <p className="text-white/80 font-bold text-4xl mt-2">The Quick Brown Fox</p>
                    </div>

                    <div className="group cursor-default">
                        <span className="text-xs font-mono text-white/30 mb-1 block">Subhead / H3 / Semibold</span>
                        <p className="text-white/80 font-semibold text-2xl">Jumps over the lazy dog.</p>
                    </div>

                    <div className="group cursor-default">
                        <span className="text-xs font-mono text-white/30 mb-1 block">Body / P / Regular</span>
                        <p className="text-white/60 text-lg leading-relaxed max-w-md">
                            We use Inter for its excellent readability at all sizes.
                            It serves as the backbone of our UI, ensuring data is clear and accessible.
                            Keep line lengths between 50-75 characters for optimal reading comfort.
                        </p>
                    </div>

                    <div className="group cursor-default">
                        <span className="text-xs font-mono text-white/30 mb-1 block">UI / Mono / Code</span>
                        <p className="font-mono text-primary text-sm bg-primary/10 p-2 rounded w-fit">
                            import &#123; Future &#125; from 'guthealth';
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white/5 rounded-3xl p-8 border border-white/10 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

                <div>
                    <h3 className="text-2xl font-bold text-white mb-6">Type Scale</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'H1', size: 'text-5xl', weight: 'font-bold' },
                            { label: 'H2', size: 'text-4xl', weight: 'font-bold' },
                            { label: 'H3', size: 'text-3xl', weight: 'font-semibold' },
                            { label: 'H4', size: 'text-2xl', weight: 'font-semibold' },
                            { label: 'Body', size: 'text-base', weight: 'font-normal' },
                            { label: 'Small', size: 'text-sm', weight: 'font-medium' },
                            { label: 'Tiny', size: 'text-xs', weight: 'font-medium text-white/50' },
                        ].map((t, i) => (
                            <div key={i} className="flex items-baseline border-b border-white/5 pb-2 last:border-0">
                                <span className="w-16 text-mono text-xs text-white/30">{t.label}</span>
                                <span className={`${t.size} ${t.weight} text-white`}>GutHealth</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
