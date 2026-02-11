'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';

const PAGE_TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/favorites': 'Favorites',
    '/trends': 'Trends',

    '/insights': 'Insights',
    '/profile': 'Profile',
    '/about': 'About',
};

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

interface LiquidHeaderProps {
    className?: string;
    title?: string;
}

export default function LiquidHeader({ className, title }: LiquidHeaderProps) {
    const { user } = useAuth();
    const pathname = usePathname();

    const pageTitle = title || PAGE_TITLES[pathname] || 'GutCheck';
    const [isWideLayout, setIsWideLayout] = useState(false);

    useEffect(() => {
        const updateLayout = () => setIsWideLayout(window.innerWidth >= 1024);
        updateLayout();
        window.addEventListener('resize', updateLayout);
        return () => window.removeEventListener('resize', updateLayout);
    }, []);

    const isIOS = typeof window !== 'undefined' && Capacitor.getPlatform() === 'ios';
    const enableWebFrame = !isIOS && isWideLayout;

    return (
        <motion.header
            className={cn(
                "sticky top-0 z-40 w-full",
                "pt-[env(safe-area-inset-top)]",
                // Liquid Glass - ultra thin material
                "bg-white/60 dark:bg-black/30",
                "backdrop-blur-2xl saturate-150",
                "border-b border-white/30 dark:border-white/10",
                // Dynamic shadow
                "shadow-[0_1px_8px_rgba(0,0,0,0.04)]",
                "dark:shadow-[0_1px_8px_rgba(0,0,0,0.2)]",
                "select-none",
                className
            )}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <div className={cn("flex h-11 items-center justify-between px-4", enableWebFrame && "mx-auto w-full max-w-5xl px-6")}>
                {/* Left: Spacer for balance */}
                <div className="w-8" />

                {/* Center: Page Title */}
                <motion.h1
                    key={pageTitle}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="text-[17px] font-semibold text-foreground"
                >
                    {pageTitle}
                </motion.h1>

                {/* Right: Spacer for balance */}
                <div className="w-8" />
            </div>
        </motion.header>
    );
}
