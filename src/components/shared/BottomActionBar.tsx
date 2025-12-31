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
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-6 p-2 rounded-full",
            "bg-background/60 backdrop-blur-xl border border-border/40 shadow-2xl",
            className
        )}>
            {children}
        </div>
    );
};
