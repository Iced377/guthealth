import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Volume2, VolumeX, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OutroVideoProps {
    onComplete: () => void;
}

export default function OutroVideo({ onComplete }: OutroVideoProps) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(false); // Default to unmuted per user request, but browser might force it.
    // However, best practice for auto-play is start muted -> user unmutes.
    // User insisted: "play sound as well... especially on ios".
    // iOS Safari DOES NOT ALLOW unmuted autoplay without interaction.
    // We will attempt unmuted play, catch error, and show a "Tap to Unmute/Play" overlay.

    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayOverlay, setShowPlayOverlay] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const playVideo = async () => {
            try {
                video.muted = false; // Intentionally unmuted
                await video.play();
                setIsPlaying(true);
            } catch (err) {
                console.log("Autoplay with sound blocked. Showing manual play button.");
                setShowPlayOverlay(true);
                // Fallback: try muted autoplay if unmuted failed? 
                // Or just wait for user interaction to get sound.
                // Let's try muted autoplay as backup so visual is there?
                try {
                    video.muted = true;
                    await video.play();
                    setIsMuted(true);
                    setIsPlaying(true);
                    // Still show overlay to unmute?
                } catch (mutedErr) {
                    console.log("Muted autoplay also blocked.");
                }
            }
        };

        playVideo();
    }, []);

    const handleOverlayClick = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isMuted) {
            video.muted = false;
            setIsMuted(false);
        }

        if (video.paused) {
            video.play();
            setIsPlaying(true);
        }

        setShowPlayOverlay(false);
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
        setIsMuted(video.muted);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-8 w-full mx-auto relative z-50 text-center"
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

            {/* Video Container - Full Width (Landscape 16:9) */}
            <div
                className="w-full relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-black cursor-pointer group"
                onClick={handleOverlayClick}
            >
                <video
                    ref={videoRef}
                    src="/Gutcheck promo AppStore.mp4"
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                // Removed 'muted' and 'autoPlay' attributes to control via JS
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                {/* Play/Unmute Overlay for iOS/Blocked Autoplay */}
                <AnimatePresence>
                    {(showPlayOverlay || (isPlaying && isMuted)) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white animate-pulse">
                                {isMuted ? <VolumeX className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Manual Mute Toggle (Bottom Right) */}
                <button
                    onClick={toggleMute}
                    className="absolute bottom-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:bg-black/60 transition-colors z-20"
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Action Button */}
            <div className="w-full px-4 pb-8">
                <Button
                    size="lg"
                    onClick={onComplete}
                    variant="ghost"
                    className="w-full h-14 rounded-full text-lg font-bold text-primary hover:bg-primary/5 hover:scale-105 transition-transform"
                >
                    Take me to my Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </div>

        </motion.div>
    );
}
