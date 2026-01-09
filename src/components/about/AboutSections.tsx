'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import ScrollSection from './ScrollSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Shield, ShieldCheck, Lock, Network, FileLock2, DatabaseZap, Eye, Server, Key } from 'lucide-react';

export function HeroSection() {
    return (
        <ScrollSection className="relative z-10 pt-20">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] mb-12 flex items-center justify-center"
            >
                {/* Glowing background */}
                <div className="absolute inset-0 bg-[#41a931]/50 blur-[60px] rounded-full animate-pulse z-0" />

                {/* Circular Mask Container */}
                <div className="relative z-10 w-[280px] h-[280px] sm:w-[450px] sm:h-[450px] rounded-full overflow-hidden border-4 border-white/10 shadow-2xl ring-1 ring-white/20">
                    <video
                        src="/running .mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover object-center scale-150" // scale-150 to zoom in on avatar if needed
                    />
                    {/* Inner shadow overlay for better integration */}
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] pointer-events-none" />
                </div>
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-center font-bold text-5xl sm:text-7xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50 mb-6 font-headline"
            >
                GutCheck.
                <br />
                <span className="text-4xl sm:text-6xl text-primary">Know your body.</span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="text-xl text-muted-foreground text-center max-w-lg"
            >
                The advanced intelligence platform for your digestive health.
            </motion.p>
        </ScrollSection>
    );
}

import { Scale, FileWarning, TrendingDown } from 'lucide-react';

export function ProblemSection() {
    return (
        <ScrollSection className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">The old way is broken.</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Traditional food logging hasn't changed in years. It's demanding, vaguely accurate, and often demotivating.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ProblemCard
                        icon={FileWarning}
                        title="It's a Chore"
                        description="Manual logging is tedious. Searching huge databases and guessing portions turns a healthy habit into a full-time job."
                        delay={0}
                    />
                    <ProblemCard
                        icon={Scale}
                        title="The Scale Struggle"
                        description="Nobody brings a food scale to a restaurant. Guessing ingredients and weighing every gram is impossible in the real world."
                        delay={0.1}
                    />
                    <ProblemCard
                        icon={TrendingDown}
                        title="Zero Insight"
                        description="Great, you logged 2000 calories. Now what? Raw numbers without context or guidance won't help you reach your goals."
                        delay={0.2}
                    />
                </div>
            </div>
        </ScrollSection>
    );
}

function ProblemCard({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay }}
            className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/20 transition-colors"
        >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 text-red-500">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </motion.div>
    )
}


export function StorySection() {
    return (
        <section className="relative bg-foreground text-background py-32 px-4">
            <div className="container mx-auto max-w-5xl">
                <div className="sticky top-32 mb-20 z-10 py-6 bg-foreground/80 backdrop-blur-md rounded-3xl border border-white/10 px-8 shadow-2xl">
                    <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter">
                        Why generic AI <br />
                        <span className="opacity-50">isn't enough.</span>
                    </h2>
                </div>

                <div className="space-y-40 relative z-0">
                    <StoryCard
                        title="Chatbots don't know you."
                        subtitle="LLMs are smart, but they don't know what you ate for breakfast last Tuesday, or that dairy makes you bloated."
                        index={1}
                    />
                    <StoryCard
                        title="Diaries are just data."
                        subtitle="Writing down your food is useless if you don't have an intelligence engine to analyze the patterns."
                        index={2}
                    />
                    <StoryCard
                        title="You need Context."
                        subtitle="GutCheck combines a seamless food diary with clinical-grade intelligence. It remembers everything, so you don't have to."
                        index={3}
                        highlight
                    />
                </div>
            </div>
        </section>
    );
}

function StoryCard({ title, subtitle, index, highlight = false }: { title: string, subtitle: string, index: number, highlight?: boolean }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-20%" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className={cn(
                "min-h-[50vh] flex flex-col justify-center p-8 sm:p-12 rounded-3xl border border-white/10",
                highlight ? "bg-primary text-primary-foreground" : "bg-white/5 backdrop-blur-sm"
            )}
        >
            <span className="text-sm font-mono opacity-50 mb-4">0{index}</span>
            <h3 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">{title}</h3>
            <p className="text-xl opacity-80 leading-relaxed max-w-2xl">{subtitle}</p>
        </motion.div>
    );
}

export function FeatureGrid() {
    return (
        <div className="container mx-auto px-4 py-32 space-y-32">
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
        <div ref={ref} className={cn("flex flex-col md:flex-row items-center gap-12", align === 'right' ? 'md:flex-row-reverse' : '')}>
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
                    "flex-1 w-full max-w-[600px] rounded-2xl flex items-center justify-center relative overflow-hidden group",
                    videoSrc ? "shadow-2xl bg-transparent" : "aspect-video bg-muted/30 border border-dashed border-muted-foreground/30"
                )}
            >
                {videoSrc ? (
                    <div className="relative w-full h-[600px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none" />
                        <video
                            src={videoSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-contain"
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
        <section className="py-32 bg-muted/10 overflow-hidden">
            <div className="container mx-auto px-4 mb-16 text-center max-w-3xl">
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
                            className="snap-center shrink-0 w-[80vw] sm:w-[450px] p-8 sm:p-10 rounded-[2rem] bg-background border border-border/50 shadow-xl flex flex-col gap-6 hover:border-primary/50 transition-all duration-300 group"
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
        </section>
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
