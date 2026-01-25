'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OutroVideoProps {
    onComplete: () => void;
}

export default function OutroVideo({ onComplete }: OutroVideoProps) {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-8 w-full max-w-md mx-auto relative z-50 px-6 text-center"
        >
            {/* Success Icon / Message */}
            <div className="space-y-2">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-green-500/30"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </motion.div>
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                    All Set!
                </h2>
                <p className="text-muted-foreground font-medium">
                    Your personal plan is ready.
                </p>
            </div>

            {/* Video Container */}
            <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-2xl relative bg-black border-4 border-white/20 ring-1 ring-black/10">
                <video
                    src="/main-dashboard.mp4"
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-0 right-0 text-white font-medium text-sm">
                    Previewing your dashboard...
                </div>
            </div>

            {/* Action Button */}
            <Button
                size="lg"
                onClick={onComplete}
                className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
            >
                Take me to my Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

        </motion.div>
    );
}
