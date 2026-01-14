'use client';


import { HeroSection, ProblemSection, StorySection, FeatureGrid, SecuritySection, FinalCTA } from '@/components/about/AboutSections';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AboutPage() {
    const { user } = useAuth();

    return (
        <div className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-background text-foreground overflow-x-hidden selection:bg-primary/30 safe-area-pt">

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
