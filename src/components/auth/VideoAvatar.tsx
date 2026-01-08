'use client';

import { cn } from '@/lib/utils';

interface VideoAvatarProps {
    videoSrc?: string;
    className?: string;
}

export default function VideoAvatar({
    videoSrc = '/sign-in.mp4',
    className
}: VideoAvatarProps) {
    return (
        <div className={cn("w-80 h-80 rounded-full overflow-hidden shadow-2xl border-4 border-white mb-8 bg-black shrink-0 relative", className)}>
            <video
                src={videoSrc}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
            />
        </div>
    );
}
