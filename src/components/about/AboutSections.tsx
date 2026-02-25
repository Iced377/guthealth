'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import ScrollSection from './ScrollSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Shield, ShieldCheck, Lock, Network, FileLock2, DatabaseZap, Eye, Server, Key } from 'lucide-react';

export function HeroSection({ scrollContainerRef }: { scrollContainerRef?: React.RefObject<HTMLElement> }) {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        container: scrollContainerRef,
        offset: ["start start", "end end"],
    });

    const heroY = useTransform(scrollYProgress, [0, 0.6], [0, -12]);
    const heroTitleScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.94]);
    const heroTitleY = useTransform(scrollYProgress, [0, 0.6], [0, -16]);
    const heroCopyOpacity = useTransform(scrollYProgress, [0, 0.55, 0.7], [1, 0.6, 0]);
    const heroCopyY = useTransform(scrollYProgress, [0, 0.7], [0, -8]);
    const heroMobileOpacity = useTransform(scrollYProgress, [0.4, 0.6], [1, 0]);
    const heroMobileY = useTransform(scrollYProgress, [0.4, 0.6], [0, -24]);
    const featuresOpacity = useTransform(scrollYProgress, [0.46, 0.72], [0, 1]);
    const featuresY = useTransform(scrollYProgress, [0.46, 0.72], [14, 0]);
    const featureLabelOpacity = useTransform(scrollYProgress, [0.46, 0.64], [0, 1]);
    const featureLabelY = useTransform(scrollYProgress, [0.46, 0.64], [12, 0]);
    const featureLabelX = useTransform(scrollYProgress, [0.46, 0.64], [-26, 0]);

    const feature1Opacity = useTransform(scrollYProgress, [0.54, 0.66], [0, 1]);
    const feature1Y = useTransform(scrollYProgress, [0.54, 0.66], [16, 0]);
    const feature1X = useTransform(scrollYProgress, [0.54, 0.66], [-28, 0]);
    const feature2Opacity = useTransform(scrollYProgress, [0.58, 0.7], [0, 1]);
    const feature2Y = useTransform(scrollYProgress, [0.58, 0.7], [16, 0]);
    const feature2X = useTransform(scrollYProgress, [0.58, 0.7], [-18, 0]);
    const feature3Opacity = useTransform(scrollYProgress, [0.62, 0.74], [0, 1]);
    const feature3Y = useTransform(scrollYProgress, [0.62, 0.74], [16, 0]);
    const feature3X = useTransform(scrollYProgress, [0.62, 0.74], [-34, 0]);
    const feature4Opacity = useTransform(scrollYProgress, [0.66, 0.78], [0, 1]);
    const feature4Y = useTransform(scrollYProgress, [0.66, 0.78], [16, 0]);
    const feature4X = useTransform(scrollYProgress, [0.66, 0.78], [-22, 0]);
    const feature5Opacity = useTransform(scrollYProgress, [0.7, 0.82], [0, 1]);
    const feature5Y = useTransform(scrollYProgress, [0.7, 0.82], [16, 0]);
    const feature5X = useTransform(scrollYProgress, [0.7, 0.82], [-30, 0]);
    const feature6Opacity = useTransform(scrollYProgress, [0.74, 0.86], [0, 1]);
    const feature6Y = useTransform(scrollYProgress, [0.74, 0.86], [16, 0]);
    const feature6X = useTransform(scrollYProgress, [0.74, 0.86], [-20, 0]);

    const appleOpacity = useTransform(scrollYProgress, [0.78, 0.9], [0, 1]);
    const appleY = useTransform(scrollYProgress, [0.78, 0.9], [16, 0]);
    const appleScale = useTransform(scrollYProgress, [0.78, 0.9], [0.92, 1]);
    const rightStatementOpacity = useTransform(scrollYProgress, [0.84, 0.96], [0, 1]);
    const rightStatementY = useTransform(scrollYProgress, [0.84, 0.96], [18, 0]);
    const rightStatementX = useTransform(scrollYProgress, [0.84, 0.96], [40, 0]);
    const proofOpacity = useTransform(scrollYProgress, [0, 0.38, 0.48, 0.6], [1, 1, 1, 0]);
    const proofY = useTransform(scrollYProgress, [0, 0.6], [0, -18]);
    const proofScale = useTransform(scrollYProgress, [0.48, 0.6], [1, 0.96]);
    const proofBlur = useTransform(scrollYProgress, [0.48, 0.6], ["blur(0px)", "blur(8px)"]);
    const proofCard1X = useTransform(scrollYProgress, [0.48, 0.6], [0, -30]);
    const proofCard1Y = useTransform(scrollYProgress, [0.48, 0.6], [0, -16]);
    const proofCard2X = useTransform(scrollYProgress, [0.48, 0.6], [0, 24]);
    const proofCard2Y = useTransform(scrollYProgress, [0.48, 0.6], [0, -20]);
    const proofCard3X = useTransform(scrollYProgress, [0.48, 0.6], [0, 18]);
    const proofCard3Y = useTransform(scrollYProgress, [0.48, 0.6], [0, 18]);

    return (
        <section ref={heroRef} className="relative h-[200vh] w-full snap-start snap-always landing-snap z-50 isolate">
            <div className="sticky top-0 h-screen w-full flex items-start lg:items-center justify-center px-6 pt-[calc(env(safe-area-inset-top)+96px)] lg:pt-0 z-50">
                <div className="absolute inset-0 -z-10">
                    <video
                        src="/gutcheck-lp-bg.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/75" />
                </div>

                <motion.div
                    style={{ opacity: proofOpacity, y: proofY, scale: proofScale, filter: proofBlur }}
                    className="absolute inset-0 pointer-events-none hidden lg:block z-10"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                        style={{ x: proofCard1X, y: proofCard1Y }}
                        className="absolute left-[5%] top-[16%] max-w-sm rounded-3xl bg-white/95 text-slate-900 shadow-2xl p-5"
                    >
                        <div className="text-sm font-semibold tracking-widest text-slate-700">★★★★★</div>
                        <div className="text-lg font-semibold mt-2">Smart, Simple and Helpful</div>
                        <div className="text-xs text-slate-500 mt-1">Feb 17, 2026 · Zaid Barakat</div>
                        <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                            Gut Check is honestly one of the most useful health apps I’ve tried. It actually helps connect the dots between what I eat and how I feel.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 28, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.55, duration: 0.8, ease: "easeOut" }}
                        style={{ x: proofCard2X, y: proofCard2Y }}
                        className="absolute right-[6%] top-[20%] max-w-xs rounded-3xl bg-white/95 text-slate-900 shadow-2xl p-5"
                    >
                        <div className="text-sm font-semibold tracking-widest text-slate-700">★★★★★</div>
                        <div className="text-lg font-semibold mt-2">Best UX ever</div>
                        <div className="text-xs text-slate-500 mt-1">Feb 17, 2026 · mordorozzo</div>
                        <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                            Super easy to use and natively integrated with Apple devices. Strongly suggested.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 32, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                        style={{ x: proofCard3X, y: proofCard3Y }}
                        className="absolute right-[10%] bottom-[12%] max-w-sm rounded-3xl bg-white/95 text-slate-900 shadow-2xl p-5"
                    >
                        <div className="text-sm font-semibold tracking-widest text-slate-700">★★★★★</div>
                        <div className="text-lg font-semibold mt-2">Outstanding</div>
                        <div className="text-xs text-slate-500 mt-1">Feb 16, 2026 · Elias Nahas</div>
                        <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                            Finally a smart tracker that covers everything in one place.
                        </p>
                    </motion.div>
                </motion.div>

                {/* Desktop hero */}
                <motion.div
                    style={{ y: heroY }}
                    className="relative z-20 hidden lg:flex flex-col items-center text-center"
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        style={{ scale: heroTitleScale, y: heroTitleY }}
                        className="text-center font-bold text-6xl sm:text-8xl lg:text-9xl tracking-tighter text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.7)] mb-6 font-headline"
                    >
                        GutCheck.
                        <br />
                        <span className="text-4xl sm:text-6xl lg:text-7xl text-emerald-300 drop-shadow-[0_12px_35px_rgba(0,0,0,0.6)]">Know your body.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        style={{ opacity: heroCopyOpacity, y: heroCopyY }}
                        className="text-xl text-white/85 text-center max-w-lg drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
                    >
                        The advanced intelligence platform for your digestive health.
                    </motion.p>
                </motion.div>

                {/* Mobile hero (separate to avoid overlap with features) */}
                <motion.div
                    style={{ opacity: heroMobileOpacity, y: heroMobileY }}
                    className="relative z-20 flex lg:hidden flex-col items-center text-center w-full max-w-sm"
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.7 }}
                        className="text-center font-bold text-4xl sm:text-5xl tracking-tight text-white drop-shadow-[0_18px_40px_rgba(0,0,0,0.7)] mb-4 font-headline"
                    >
                        GutCheck.
                        <br />
                        <span className="text-3xl sm:text-4xl text-emerald-300 drop-shadow-[0_12px_30px_rgba(0,0,0,0.6)]">Know your body.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.7 }}
                        className="text-base sm:text-lg text-white/85 text-center max-w-xs drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
                    >
                        The advanced intelligence platform for your digestive health.
                    </motion.p>

                    <motion.div
                        style={{ opacity: proofOpacity, y: proofY, scale: proofScale, filter: proofBlur }}
                        className="mt-6 w-full space-y-3 pointer-events-none"
                    >
                        <div className="rounded-3xl bg-white/95 text-slate-900 shadow-2xl p-4">
                            <div className="text-xs font-semibold tracking-widest text-slate-700">★★★★★</div>
                            <div className="text-base font-semibold mt-1">Smart, Simple and Helpful</div>
                            <div className="text-[11px] text-slate-500 mt-1">Feb 17, 2026 · Zaid Barakat</div>
                            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                                Gut Check is honestly one of the most useful health apps I’ve tried.
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white/95 text-slate-900 shadow-2xl p-4">
                            <div className="text-xs font-semibold tracking-widest text-slate-700">★★★★★</div>
                            <div className="text-base font-semibold mt-1">Best UX ever</div>
                            <div className="text-[11px] text-slate-500 mt-1">Feb 17, 2026 · mordorozzo</div>
                            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                                Super easy to use and natively integrated with Apple devices.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    style={{ opacity: featuresOpacity, y: featuresY }}
                    className="absolute inset-0 pointer-events-none z-20"
                >
                    <div className="hidden lg:block">
                        <motion.div style={{ opacity: featureLabelOpacity, y: featureLabelY, x: featureLabelX }} className="absolute left-[5%] top-[14%] text-white">
                            <div className="absolute -inset-6 -z-10 rounded-full bg-black/40 blur-3xl" />
                            <h3 className="text-xl font-semibold tracking-tight text-emerald-300 drop-shadow-[0_18px_40px_rgba(0,0,0,0.8)]">
                                Gutcheck Helps You Track:
                            </h3>
                        </motion.div>

                        <motion.div style={{ opacity: feature1Opacity, y: feature1Y, x: feature1X }} className="absolute left-[5%] top-[26%] text-white text-lg font-semibold drop-shadow-[0_16px_35px_rgba(0,0,0,0.8)]">
                            ★ Macros
                        </motion.div>
                        <motion.div style={{ opacity: feature2Opacity, y: feature2Y, x: feature2X }} className="absolute left-[9%] top-[36%] text-white text-lg font-semibold drop-shadow-[0_16px_35px_rgba(0,0,0,0.8)]">
                            ★ Fiber
                        </motion.div>
                        <motion.div style={{ opacity: feature3Opacity, y: feature3Y, x: feature3X }} className="absolute left-[3%] top-[46%] text-white text-lg font-semibold drop-shadow-[0_16px_35px_rgba(0,0,0,0.8)]">
                            ★ FODMAP
                        </motion.div>
                        <motion.div style={{ opacity: feature4Opacity, y: feature4Y, x: feature4X }} className="absolute left-[10%] top-[56%] text-white text-lg font-semibold drop-shadow-[0_16px_35px_rgba(0,0,0,0.8)]">
                            ★ KETO
                        </motion.div>
                        <motion.div style={{ opacity: feature5Opacity, y: feature5Y, x: feature5X }} className="absolute left-[4%] top-[68%] text-white text-lg font-semibold drop-shadow-[0_16px_35px_rgba(0,0,0,0.8)]">
                            ★ Glycemic Index
                        </motion.div>
                        <motion.div style={{ opacity: feature6Opacity, y: feature6Y, x: feature6X }} className="absolute left-[12%] top-[80%] text-white text-lg font-semibold drop-shadow-[0_16px_35px_rgba(0,0,0,0.8)]">
                            ★ Intermittent Fast & More
                        </motion.div>

                        <motion.div style={{ opacity: appleOpacity, y: appleY, scale: appleScale }} className="absolute left-1/2 bottom-[16%] -translate-x-1/2 text-white">
                            <div className="absolute -inset-6 -z-10 rounded-full bg-black/40 blur-3xl" />
                            <div className="flex flex-col items-center gap-2 text-lg font-semibold drop-shadow-[0_14px_30px_rgba(0,0,0,0.8)]">
                                <Image src="/Apple Store DL.png" alt="Apple Health" width={180} height={56} className="h-auto w-44" style={{ height: "auto" }} />
                                <span>Works with Apple Health</span>
                            </div>
                        </motion.div>

                        <motion.div style={{ opacity: rightStatementOpacity, y: rightStatementY, x: rightStatementX }} className="absolute right-[4%] top-[14%] max-w-[320px] text-white text-right">
                            <div className="absolute -inset-6 -z-10 rounded-full bg-black/40 blur-3xl" />
                            <h3 className="text-2xl font-semibold leading-tight drop-shadow-[0_18px_40px_rgba(0,0,0,0.8)]">
                                Simply Describe your Meal or Snap it,
                                and GutCheck will do the rest
                            </h3>
                        </motion.div>
                    </div>

                    <div className="lg:hidden absolute inset-x-0 top-[48%] pb-[max(env(safe-area-inset-bottom),16px)] flex flex-col items-center gap-4 px-6 text-center text-white">
                        <motion.div style={{ opacity: featureLabelOpacity, y: featureLabelY }}>
                            <h3 className="text-2xl font-semibold text-emerald-300 drop-shadow-[0_12px_30px_rgba(0,0,0,0.8)]">
                                Gutcheck Helps You Track:
                            </h3>
                        </motion.div>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 text-base font-semibold drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                            <motion.div style={{ opacity: feature1Opacity, y: feature1Y }}>★ Macros</motion.div>
                            <motion.div style={{ opacity: feature2Opacity, y: feature2Y }}>★ Fiber</motion.div>
                            <motion.div style={{ opacity: feature3Opacity, y: feature3Y }}>★ FODMAP</motion.div>
                            <motion.div style={{ opacity: feature4Opacity, y: feature4Y }}>★ KETO</motion.div>
                            <motion.div style={{ opacity: feature5Opacity, y: feature5Y }}>★ Glycemic Index</motion.div>
                            <motion.div style={{ opacity: feature6Opacity, y: feature6Y }}>★ Intermittent Fast & More</motion.div>
                        </div>
                        <motion.div style={{ opacity: appleOpacity, y: appleY }} className="flex flex-col items-center gap-1.5 text-sm font-semibold drop-shadow-[0_12px_25px_rgba(0,0,0,0.8)]">
                            <Image src="/Apple Store DL.png" alt="Apple Health" width={160} height={52} className="h-auto w-40" style={{ height: "auto" }} />
                            <span>Works with Apple Health</span>
                        </motion.div>
                        <motion.div style={{ opacity: rightStatementOpacity, y: rightStatementY }} className="text-lg font-semibold drop-shadow-[0_14px_30px_rgba(0,0,0,0.8)] max-w-xs">
                            Simply Describe your Meal or Snap it, and GutCheck will do the rest
                        </motion.div>
                    </div>
                </motion.div>
            </div>
            <div className="h-screen snap-start snap-always landing-snap" aria-hidden="true" />
        </section>
    );
}

import { Scale, FileWarning, TrendingDown } from 'lucide-react';

export function ProblemSection({ scrollContainerRef }: { scrollContainerRef?: React.RefObject<HTMLElement> }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        container: scrollContainerRef,
        offset: ["start start", "end end"]
    });

    // Reveal timings for 3 cards
    const opacity1 = useTransform(scrollYProgress, [0.05, 0.2], [0, 1]);
    const y1 = useTransform(scrollYProgress, [0.05, 0.2], [50, 0]);

    const opacity2 = useTransform(scrollYProgress, [0.3, 0.45], [0, 1]);
    const y2 = useTransform(scrollYProgress, [0.3, 0.45], [50, 0]);

    const opacity3 = useTransform(scrollYProgress, [0.55, 0.7], [0, 1]);
    const y3 = useTransform(scrollYProgress, [0.55, 0.7], [50, 0]);

    return (
        <section ref={containerRef} className="relative h-[300vh] bg-background z-0 snap-start snap-always landing-snap">
            <div className="sticky top-0 h-screen w-full flex flex-col items-center pt-16 sm:pt-24 px-4 overflow-hidden z-0">
                {/* Header (Always Visible) - Compacted */}
                <div className="text-center mb-4 sm:mb-8 space-y-3 max-w-3xl shrink-0 bg-background/95 backdrop-blur-xl border border-white/10 p-5 sm:p-6 rounded-[2rem] shadow-2xl z-0 landing-card landing-wide">
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">The old way is broken.</h2>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed hidden sm:block">
                        Traditional food logging hasn't changed in years. It's demanding, vaguely accurate, and often demotivating.
                    </p>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed sm:hidden">
                        Traditional food logging is tedious and demotivating.
                    </p>
                </div>

                {/* Cards Container - Compacted Spacing */}
                <div className="w-full max-w-md flex flex-col gap-3 sm:gap-4 relative z-10 pb-4 landing-wide">
                    <motion.div style={{ opacity: opacity1, y: y1 }} className="shrink-0">
                        <StaticProblemCard
                            icon={FileWarning}
                            title="It's a Chore"
                            description="Manual logging is tedious. Searching huge databases and guessing portions turns a healthy habit into a full-time job."
                        />
                    </motion.div>

                    <motion.div style={{ opacity: opacity2, y: y2 }} className="shrink-0">
                        <StaticProblemCard
                            icon={Scale}
                            title="The Scale Struggle"
                            description="Nobody brings a food scale to a restaurant. Guessing ingredients and weighing every gram is impossible in the real world."
                        />
                    </motion.div>

                    <motion.div style={{ opacity: opacity3, y: y3 }} className="shrink-0">
                        <StaticProblemCard
                            icon={TrendingDown}
                            title="Zero Insight"
                            description="Great, you logged 2000 calories. Now what? Raw numbers without context or guidance won't help you reach your goals."
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// Simplified Card Component - More Compact
function StaticProblemCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-lg flex items-start gap-4 hover:border-primary/20 transition-colors landing-card">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 text-red-500 mt-0.5">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
                <h3 className="text-lg sm:text-xl font-bold mb-1.5">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                    {description}
                </p>
            </div>
        </div>
    )
}




export function StorySection() {
    return (
        <section className="relative bg-foreground text-background py-24 px-4 snap-start snap-always landing-snap">
            <div className="container mx-auto max-w-sm sm:max-w-md relative landing-wide">
                {/* Sticky Header */}
                <div className="sticky top-24 z-10 mb-8 py-6 bg-foreground/80 backdrop-blur-md rounded-3xl border border-white/10 px-8 shadow-2xl snap-start snap-always landing-card">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter">
                        Why generic AI <br />
                        <span className="opacity-50">isn't enough.</span>
                    </h2>
                </div>

                {/* Stacking Cards */}
                <div className="space-y-[80vh] pb-[50vh]">
                    <StoryCard
                        title="GenAI doesn't know you."
                        subtitle="LLMs are smart, but they don't know what you ate for breakfast last Tuesday, or that dairy makes you bloated."
                        index={1}
                        stickyTop="top-64"
                    />
                    <StoryCard
                        title="Diaries are just data."
                        subtitle="Writing down your food is useless if you don't have an intelligence engine to analyze the patterns."
                        index={2}
                        stickyTop="top-72"
                    />
                    <StoryCard
                        title="You need Context."
                        subtitle="GutCheck combines a seamless food diary with purposeful intelligence. It remembers everything, so you don't have to."
                        index={3}
                        highlight
                        stickyTop="top-[14rem]"
                    />
                </div>
            </div>
        </section>
    );
}

function StoryCard({ title, subtitle, index, highlight = false, stickyTop }: { title: string, subtitle: string, index: number, highlight?: boolean, stickyTop: string }) {
    return (
        <div className={cn(
            "sticky min-h-[50vh] flex flex-col justify-start pt-12 p-8 rounded-3xl border border-white/10 shadow-2xl transition-transform origin-top snap-start snap-always landing-card",
            highlight ? "bg-primary text-primary-foreground" : "bg-[#1A1A1A] text-slate-100",
            stickyTop
        )}>
            <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-mono opacity-50">0{index}</span>
            </div>

            <h3 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight leading-tight">{title}</h3>
            <p className="text-2xl sm:text-3xl opacity-90 leading-relaxed">{subtitle}</p>
        </div>
    );
}

export function FeatureGrid() {
    return (
        <div className="container mx-auto px-4 py-32 space-y-32 snap-start snap-always landing-snap landing-wide">
            <FeatureItem
                title="Journaling with a Purpose."
                description="The most convenient way to keep your diary. Whether you snap a photo or just talk to it, GutCheck captures your meals effortlessly. It's not just logging; it's building a complete picture of your nutritional intake."
                videoSrc="/log-food-by-photo.mp4"
                align="left"
            />
            <FeatureItem
                title="Your Health Command Center."
                description="See everything at a glance. Your daily meal indicators and timeline are beautifully organized in one place. Just the metrics that matter for your journey."
                videoSrc="/main-dashboard.mp4"
                align="right"
            />
            <FeatureItem
                title="Contextual Intelligence."
                description="We don't just force AI on you. We use it to connect the dots. GutCheck remembers your history to give you personalized, relevant advice. It understands your unique context, from dietary restrictions to specific health goals."
                videoSrc="/insights.mp4"
                align="left"
            />
            <FeatureItem
                title="Visualize Your Progress."
                description="Spot patterns you'd otherwise miss. Our powerful trend analysis helps you correlate what you eat with how you feel over time. Understand your body's long-term rhythms and make data-driven decisions for your health."
                videoSrc="/trends.mp4"
                align="right"
            />
        </div>
    );
}

function FeatureItem({ title, description, placeholder, videoSrc, align }: { title: string, description: string, placeholder?: string, videoSrc?: string, align: 'left' | 'right' }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
            <div ref={ref} className={cn("flex flex-col md:flex-row items-center gap-12 landing-wide", align === 'right' ? 'md:flex-row-reverse' : '')}>
            <motion.div
                initial={{ opacity: 0, x: align === 'left' ? -50 : 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8 }}
                className="flex-1 space-y-6"
            >
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">{title}</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">{description}</p>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={cn(
                    "flex-1 w-full max-w-[600px] rounded-2xl flex items-center justify-center relative overflow-hidden group landing-card",
                    videoSrc ? "shadow-2xl bg-transparent" : "aspect-video bg-muted/30 border border-dashed border-muted-foreground/30"
                )}
            >
                {videoSrc ? (
                    <div className="relative w-full aspect-square h-auto">
                        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none" />
                        <video
                            src={videoSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            className="w-full h-full object-cover rounded-2xl"
                        />
                    </div>
                ) : (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5" />
                        <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest text-center px-4 relative z-10">
                            {placeholder}
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export function SecuritySection() {
    const securityItems = [
        {
            title: "Latest reCAPTCHA v3",
            description: "We use Google's advanced reCAPTCHA to protect our app from spam and abuse without interrupting your experience.",
            Icon: ShieldCheck,
        },
        {
            title: "Google Authentication",
            description: "Secure user management powered by Google's robust authentication system, ensuring your account access is safe.",
            Icon: Lock,
        },
        {
            title: "SSL/TLS Encryption",
            description: "All data transmitted between your device and our servers is encrypted using industry-standard SSL/TLS protocols.",
            Icon: Key,
        },
        {
            title: "Firebase App Check",
            description: "App Check helps protect our backend resources from abuse by ensuring requests originate from your authentic app instances.",
            Icon: ShieldCheck,
        },
        {
            title: "Premium & Secure DNS",
            description: "Utilizing premium DNS services with enhanced security features like DDoS protection and DNSSEC for resilient and secure access.",
            Icon: Network,
        },
        {
            title: "Firestore Security Rules",
            description: "Robust server-side rules strictly control data access, ensuring you can only access your own information.",
            Icon: FileLock2,
        },
        {
            title: "Principle of Least Privilege",
            description: "Our systems are designed to ensure components only have access to the resources necessary for their function.",
            Icon: DatabaseZap,
        },
        {
            title: "Secure Cloud Infrastructure",
            description: "Leveraging Google Cloud Platform's secure and reliable infrastructure for hosting and data storage.",
            Icon: Server,
        },
        {
            title: "Total Privacy Control",
            description: "Your data is yours. Export it or delete it entirely at any time. We are transparent about what we store.",
            Icon: Eye,
        }
    ];

    return (
        <ScrollSection className="bg-muted/10">
            <div className="container mx-auto px-4 mb-16 text-center max-w-3xl landing-wide">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Shield className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Security First.</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                    Your health data is personal. We treat it that way.
                </p>
            </div>

            {/* Focused Carousel Container */}
            <div className="relative w-full overflow-x-auto pb-12 pt-4 snap-x snap-mandatory scrollbar-hide">
                <div className="flex px-[10vw] sm:px-[30vw] space-x-6 w-max">
                    {securityItems.map((item, index) => (
                        <div
                            key={index}
                            className="snap-center shrink-0 w-[80vw] sm:w-[450px] p-8 sm:p-10 rounded-[2rem] bg-background border border-border/50 shadow-xl flex flex-col gap-6 hover:border-primary/50 transition-all duration-300 group landing-card"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <item.Icon className="w-7 h-7 text-primary" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed text-lg">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4 mt-20 text-center space-y-4">
                <p className="text-muted-foreground/60 text-sm max-w-2xl mx-auto border-t border-border/20 pt-8">
                    &copy; 2026 GutCheck. All Rights Reserved. This app is a non-commercial project intended for informational purposes only and not a substitute for professional medical advice.
                </p>
                <div className="flex justify-center gap-4 text-xs text-muted-foreground/50">
                    <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Notice</Link>
                    <span>•</span>
                    <Link href="/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
                </div>
            </div>
        </ScrollSection>
    );
}

export function FinalCTA({ isLoggedIn }: { isLoggedIn?: boolean }) {
    return (
        <ScrollSection className="pb-40">
            <h2 className="text-5xl sm:text-7xl font-bold text-center mb-12 tracking-tighter">
                Ready to listen
                <br />
                <span className="text-primary">to your body?</span>
            </h2>
            <Button size="lg" className="h-16 px-12 text-xl rounded-full shadow-2xl hover:scale-105 transition-transform" asChild>
                <Link href={isLoggedIn ? "/?openDashboard=true" : "/login"}>
                    {isLoggedIn ? "Start Your Food Diary Today" : "Start Your Journey"}
                </Link>
            </Button>
        </ScrollSection>
    );
}
