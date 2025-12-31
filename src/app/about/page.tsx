
import type { Metadata } from 'next';
import LandingPageClientContent from '@/components/landing/LandingPageClientContent';
import Navbar from '@/components/shared/Navbar';

export const metadata: Metadata = {
    title: 'About GutCheck - Track Your Gut, Transform Your Health',
    description: 'Log meal conveniently, get deep nutritional analysis, track reactions, and receive personalized insights to master your diet and well-being.',
};

import GradientText from '@/components/shared/GradientText';

const betaUserMessageContent = (
    <div className="mt-8 max-w-3xl mx-auto text-left sm:text-center bg-primary/5 p-6 rounded-lg border border-primary/20 shadow-sm">
        <h2 className="text-2xl font-semibold text-primary mb-4 font-headline">
            <GradientText>Hey there, GutChecker! 👋</GradientText>
        </h2>
        <p className="text-muted-foreground mb-3">
            A huge <strong className="text-foreground">thank you</strong> for joining the GutCheck beta and taking an active role in shaping its future! Your participation is incredibly valuable as we work to build the best tool to help you understand your gut.
        </p>
        <p className="text-muted-foreground mb-4">
            <strong>Here's how you can make a big impact during this beta phase:</strong>
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 pl-4 text-left">
            <li>
                <strong>Log Your Meals Consistently:</strong> Whether you use the AI text input, snap a photo, or log manually, the more data you provide, the better our AI becomes.
            </li>
            <li>
                <strong>Track Your Symptoms:</strong> Don't forget to log any symptoms you experience. This is key to finding correlations.
            </li>
            <li>
                <strong>Rate Your Reactions:</strong> Use the thumbs up/down on food cards in your dashboard to tell us if a meal felt "safe" or "unsafe" for you. This direct feedback is gold!
            </li>
            <li>
                <strong>Share Your Thoughts:</strong> See the green feedback widget? Use it! Report bugs, suggest features, or tell us what you love (or don't!).
            </li>
            <li>
                <strong>Explore & Experiment:</strong> Dive into your Trends, check out the AI Dietitian insights, and see what patterns emerge.
            </li>
        </ul>
        <p className="text-muted-foreground">
            We're constantly making improvements and adding new features. You can always see the latest updates and what's changed by clicking on the app version number in the top navigation bar.
        </p>
        <p className="text-muted-foreground mt-3">
            Thanks again for being on this journey with us!
        </p>
    </div>
);

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground overflow-y-auto">
            <Navbar />
            <LandingPageClientContent
                showHeroCTAButton={false}
                betaUserMessage={betaUserMessageContent}
            />
        </div>
    );
}
