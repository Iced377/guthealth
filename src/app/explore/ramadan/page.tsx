'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export default function RamadanComingSoonPage() {
    const router = useRouter();

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black">
            {/* Full Screen Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/ramadan-bg.png"
                    alt="Ramadan Background"
                    fill
                    className="object-cover"
                    priority
                    quality={100}
                />
                {/* Overlay for text readability */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <div className="p-4 pt-12 flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>

                {/* Center Message */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="space-y-2 animate-in fade-in zoom-in duration-700">
                        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight drop-shadow-2xl">
                            Ramadan Hub
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 font-medium tracking-wide drop-shadow-lg">
                            Coming Soon, Inshallah!
                        </p>
                    </div>
                </div>

                {/* Footer Spacer */}
                <div className="h-32" />
            </div>
        </div>
    );
}
