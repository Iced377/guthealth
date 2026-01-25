'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { HeroSection, ProblemSection, StorySection, FeatureGrid, SecuritySection, FinalCTA } from '@/components/about/AboutSections';
import { useAuth } from '@/components/auth/AuthProvider';
import { motion } from 'framer-motion';

const MotionLink = motion(Link);

export default function AboutPage() {
    const { user } = useAuth();
    const scrollRef = React.useRef<HTMLDivElement>(null);

    return (
        <div ref={scrollRef} className="fixed inset-0 bg-background text-foreground overflow-y-auto overflow-x-hidden selection:bg-primary/30 font-body antialiased safe-area-pt scroll-smooth z-[45]">
            {/* Minimalistic Back Button */}
            <MotionLink
                href="/"
                className="fixed top-14 left-6 z-50 p-2 rounded-full bg-background/50 backdrop-blur-md border border-white/10 text-muted-foreground hover:text-foreground hover:bg-background/80 shadow-sm"
                whileTap={{ scale: 1.25 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 8 }}
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="sr-only">Back to Home</span>
            </MotionLink>

            <main>
                <HeroSection />
                <ProblemSection scrollContainerRef={scrollRef} />
                <StorySection />
                <FeatureGrid />
                <SecuritySection />
                <FinalCTA isLoggedIn={!!user} />
            </main>
        </div>
    );
}
