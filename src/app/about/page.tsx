'use client';

import Navbar from '@/components/shared/Navbar';
import { HeroSection, ProblemSection, StorySection, FeatureGrid, SecuritySection, FinalCTA } from '@/components/about/AboutSections';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AboutPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
            <Navbar hideFloatingActionMenu={true} />
            <main>
                <HeroSection />
                <ProblemSection />
                <StorySection />
                <FeatureGrid />
                <SecuritySection />
                <FinalCTA isLoggedIn={!!user} />
            </main>
        </div>
    );
}
