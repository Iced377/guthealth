'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BottomActionBarProps {
    children: React.ReactNode;
    className?: string;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({ children, className }) => {
    return (
        <div className={cn(
            "fixed bottom-0 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-6 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] rounded-t-3xl",
            "bg-white/15 dark:bg-black/25 backdrop-blur-xl",
            "border-t border-x border-white/20 dark:border-white/10 shadow-2xl",
            className
        )}>
            {children}
        </div>
    );
};
