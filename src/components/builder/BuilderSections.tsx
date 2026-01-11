'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import ScrollSection from '@/components/about/ScrollSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Dumbbell, Code2, Medal, Award, CheckCircle2, Terminal, ArrowDown } from 'lucide-react';

// Hero: The Hook
export function BuilderHero() {
    return (
        <ScrollSection className="relative z-10 pt-20 min-h-[90vh] flex flex-col justify-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
                className="text-center max-w-4xl mx-auto space-y-8"
            >
                <div className="inline-block border border-primary/20 bg-primary/5 rounded-full px-4 py-1.5 mb-4">
                    <span className="text-xs font-mono tracking-widest text-primary uppercase">About the Builder</span>
                </div>

                <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter leading-[1.1] font-headline">
                    I didn’t build GutCheck <br className="hidden sm:block" />
                    to tell people what to eat.
                </h1>

                <p className="text-xl sm:text-3xl text-muted-foreground font-light leading-relaxed max-w-3xl mx-auto pt-4">
                    I built it because most systems <br />
                    <span className="text-foreground font-medium">don’t survive real life.</span>
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-0 right-0 flex justify-center"
            >
                <ArrowDown className="w-6 h-6 text-muted-foreground/50 animate-bounce" />
            </motion.div>
        </ScrollSection>
    );
}

// Section 1: The Expert (Health & Tech)
export function TheExpertise() {
    return (
        <section className="py-24 bg-background relative z-10">
            <div className="container mx-auto px-4 max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

                {/* Health Column */}
                <div className="space-y-6">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <Dumbbell className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">Body Transformation Specialist.</h3>
                    <div className="text-lg text-muted-foreground space-y-4 leading-relaxed">
                        <p>
                            Awarded <strong>Elite Trainer status by ISSA</strong>, specializing in senior training and muscle recovery.
                        </p>
                        <p>
                            I’ve helped many people rebuild strength, consistency, and confidence. <span className="text-foreground italic">Including myself.</span>
                        </p>
                        <p className="font-medium text-foreground border-l-2 border-primary pl-4 py-1">
                            What I’ve learned is simple: <br />
                            Sustainable change beats perfect plans.
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap pt-2 opacity-80">
                        <Badge variant="emerald">ISSA Elite Trainer</Badge>
                        <Badge variant="emerald">Senior Fitness</Badge>
                        <Badge variant="emerald">Recovery Specialist</Badge>
                    </div>
                </div>

                {/* Tech/Business Column */}
                <div className="space-y-6">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                        <Terminal className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">Technology & Business Leader.</h3>
                    <div className="text-lg text-muted-foreground space-y-4 leading-relaxed">
                        <p>
                            Alongside health, I’ve spent years in technology and business.
                        </p>
                        <p>
                            Leading complex programs. Managing P&Ls. Building and scaling products. Running marketing with <strong className="text-foreground">accountability, not hype.</strong>
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap pt-2 opacity-80">
                        <Badge variant="blue">PMP®</Badge>
                        <Badge variant="blue">Business Strategy</Badge>
                        <Badge variant="blue">Product Leadership</Badge>
                    </div>
                </div>

            </div>
        </section>
    )
}

// Section 2: The Intersection (Philosophy)
export function TheIntersection() {
    return (
        <ScrollSection className="py-32 bg-secondary/5">
            <div className="container mx-auto px-4 max-w-4xl text-center space-y-12">
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
                    I live at the intersection of <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">human behavior and systems design.</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 text-left sm:text-center">
                    <div className="space-y-2">
                        <div className="text-xl font-semibold">Step 1</div>
                        <p className="text-muted-foreground text-lg">Where discipline meets empathy.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="text-xl font-semibold">Step 2</div>
                        <p className="text-muted-foreground text-lg">Where data supports intuition.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="text-xl font-semibold">Step 3</div>
                        <p className="text-muted-foreground text-lg">Where progress is measured in months, not weeks.</p>
                    </div>
                </div>
            </div>
        </ScrollSection>
    )
}

// Section 3: The Product & Closing
export function BuilderManifesto() {
    return (
        <section className="py-32 min-h-[80vh] flex flex-col items-center justify-center">
            <div className="container mx-auto px-4 max-w-3xl space-y-16">

                {/* The 'Why' */}
                <div className="space-y-6 text-lg sm:text-xl leading-relaxed text-muted-foreground border-l-4 border-primary/20 pl-6 sm:pl-8">
                    <p>
                        <strong className="text-foreground">GutCheck reflects that philosophy.</strong>
                    </p>
                    <p>
                        It’s not an app built from theory. <br />
                        It’s built from lived experience, iteration, and respect for how people actually change.
                    </p>
                </div>

                {/* The Humble Closing */}
                <div className="space-y-8">
                    <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                        I don’t claim to have all the answers.
                    </h3>
                    <p className="text-xl sm:text-2xl text-muted-foreground font-light">
                        But I do know how to build tools that last. <br />
                        And routines that people come back to.
                    </p>
                </div>

                {/* Signature / Profile */}
                <div className="flex items-center gap-6 pt-12 border-t border-border/40">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-600 p-[2px]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center relative">
                            {/* In a real scenario, use Image component here */}
                            <span className="font-bold text-foreground">AE</span>
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-lg">Abdallah El-Izmirli</div>
                        <div className="text-sm text-muted-foreground">Founder & Builder</div>
                    </div>
                    <div className="ml-auto">
                        <Button variant="outline" className="rounded-full" asChild>
                            <Link href="/">Back to App</Link>
                        </Button>
                    </div>
                </div>

            </div>
        </section>
    );
}

// Helpers
function Badge({ children, variant = "emerald" }: { children: React.ReactNode, variant?: "emerald" | "blue" }) {
    const colorClass = variant === "emerald"
        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        : "bg-blue-500/10 text-blue-500 border-blue-500/20";

    return (
        <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", colorClass)}>
            {children}
        </span>
    );
}
