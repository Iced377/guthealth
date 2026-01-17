'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface VideoAvatarProps {
    videoSrc?: string;
    className?: string;
}

export default function VideoAvatar({
    videoSrc = '/sign-in.mp4',
    className
}: VideoAvatarProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            // Explicitly set properties for iOS/Safari compliance
            video.muted = true;
            video.defaultMuted = true;
            video.playsInline = true;

            const handlePlay = () => {
                video.play().catch(err => {
                    console.log("Video playback failed, retrying:", err);
                    // Retry once after a short delay
                    setTimeout(() => {
                        video.play().catch(e => console.log("Retry failed:", e));
                    }, 100);
                });
            };

            // Attempt to play immediately
            handlePlay();

            // Also ensure it plays when ready
            video.addEventListener('loadedmetadata', handlePlay);
            video.addEventListener('suspend', handlePlay); // iOS low power mode wake-up

            return () => {
                video.removeEventListener('loadedmetadata', handlePlay);
                video.removeEventListener('suspend', handlePlay);
            };
        }
    }, []);

    return (
        <div className={cn("w-80 h-80 rounded-full overflow-hidden shadow-2xl border-4 border-white mb-8 bg-black shrink-0 relative", className)}>
            <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                webkit-playsinline="true" // Legacy iOS support
                preload="auto"
                // Keep the attribute to ensure initial render is correct
                onCanPlay={() => videoRef.current?.play().catch(() => { })}
            />
        </div>
    );
}
