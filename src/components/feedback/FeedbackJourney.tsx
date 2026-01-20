'use client';

import React, { useRef, useState } from 'react';
import FeedbackMetricCard from './FeedbackMetricCard';
import FeedbackOrbRating from './FeedbackOrbRating';
import { useNavVisibility } from '@/components/navigation/useNavVisibilityController';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import FeedbackFreeformCard from './FeedbackFreeformCard';
import { useFeedbackSubmission } from '@/hooks/useFeedbackSubmission';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

const METRICS = [
    { id: 'accuracy', title: "Accuracy", description: "How precise was the analysis?" },
    { id: 'convenience', title: "Convenience", description: "Was it easy to log your meal?" },
    { id: 'usability', title: "Usability / UX", description: "How did the experience feel?" },
    { id: 'speed', title: "Speed", description: "Was the app fast enough?" },
    { id: 'performance', title: "Performance", description: "Did everything work reliably?" },
];

export default function FeedbackJourney() {
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { setNavVisible } = useNavVisibility();
    const [lastScrollY, setLastScrollY] = useState(0);

    // Logic
    const { submitImprove, isSubmitting } = useFeedbackSubmission();
    // Rating State
    const [ratings, setRatings] = useState<Record<string, number | null>>({});
    const [freeform, setFreeform] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);



    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentY = e.currentTarget.scrollTop;
        if (Math.abs(currentY - lastScrollY) > 10) {
            if (currentY > lastScrollY && currentY > 50) {
                setNavVisible(false);
            } else {
                setNavVisible(true);
            }
            setLastScrollY(currentY);
        }
    };

    const handleRate = (metricId: string, rating: number) => {
        setRatings(prev => ({ ...prev, [metricId]: rating }));
    };

    const handleSubmit = async () => {
        // Validation: didInteract?
        const hasRatings = Object.values(ratings).some(r => r !== null);
        const hasText = freeform.trim().length > 0;

        if (!hasRatings && !hasText) return;

        // Construct ratings object matching type
        const ratingsData = {
            accuracy: ratings['accuracy'] || null,
            convenience: ratings['convenience'] || null,
            usability: ratings['usability'] || null,
            speed: ratings['speed'] || null,
            performance: ratings['performance'] || null,
        };

        const success = await submitImprove(ratingsData, freeform || null, true);
        if (success) {
            setIsSubmitted(true);
            setNavVisible(true); // Restore nav
        }
    };

    if (isSubmitted) {
        return (
            <div className="h-screen w-full flex items-center justify-center p-6 bg-background">
                <GlassCard className="w-full max-w-sm flex flex-col items-center p-12 bg-white/5 border-white/10 text-center">
                    <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 text-green-500">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-headline font-bold mb-4">Thank You</h3>
                    <p className="text-muted-foreground mb-8">You just helped make GutCheck better.</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                        Done
                    </button>
                </GlassCard>
            </div>
        );
    }

    return (
        <div
            ref={scrollContainerRef}
            className="h-screen w-full snap-y snap-mandatory no-scrollbar scroll-smooth overflow-y-scroll"
            onScroll={handleScroll}
        >
            <div className="">

                {METRICS.map((m, i) => (
                    <FeedbackMetricCard
                        key={m.id}
                        title={m.title}
                        description={m.description}
                        index={i}
                        onClick={() => { }} // No-op, scroll handles it
                        showBack={i === 0}
                        onBack={() => router.back()}
                    >
                        {/* We need to pass the click handler to the card, but getting the DOM element reference
                            inside the mapped loop is tricky without ref array.
                            Simpler: FeedbackMetricCard forwards the onClick event.
                        */}
                        <FeedbackOrbRating
                            initialRating={ratings[m.id]}
                            onRate={(r) => handleRate(m.id, r)}
                        />
                    </FeedbackMetricCard>
                ))}

                {/* Freeform Card */}
                <FeedbackFreeformCard
                    value={freeform}
                    onChange={setFreeform}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    canSubmit={Object.values(ratings).some(r => r !== null) || freeform.length > 0}
                />

            </div>
        </div>
    );
}
