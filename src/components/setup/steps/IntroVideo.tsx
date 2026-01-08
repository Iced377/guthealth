'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useRef, useState } from 'react';

interface IntroVideoProps {
    onComplete: () => void;
}

export default function IntroVideo({ onComplete }: IntroVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoEnded, setVideoEnded] = useState(false);

    const handleVideoEnd = () => {
        setVideoEnded(true);
    };

    const handleSkip = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
        onComplete();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center space-y-6 w-full max-w-4xl mx-auto"
        >
            <div className="w-80 h-80 rounded-full overflow-hidden shadow-2xl relative bg-black shrink-0">
                <video
                    ref={videoRef}
                    src="/user-setup.mp4"
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnd}
                />
            </div>

            <div className="flex flex-col items-center space-y-4">
                <h2 className="text-2xl font-bold text-center text-gray-800">
                    Welcome to GutCheck
                </h2>
                <p className="text-gray-500 text-center max-w-md">
                    Let's verify a few details to build your personalized functional nutrition profile.
                </p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                >
                    <Button
                        size="lg"
                        onClick={handleSkip}
                        className="group bg-[#2aac6b] hover:bg-[#25965e] text-white rounded-full px-8"
                    >
                        {videoEnded ? "Get Started" : "Skip Intro & Get Started"}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
}
