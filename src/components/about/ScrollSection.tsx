'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface ScrollSectionProps {
    children: React.ReactNode;
    className?: string;
    fullHeight?: boolean;
}

export default function ScrollSection({ children, className, fullHeight = true }: ScrollSectionProps) {
    const ref = useRef<HTMLDivElement>(null);
    return (
        <motion.section
            ref={ref}
            className={cn(
                "relative flex flex-col items-center justify-center w-full px-4 overflow-hidden snap-start snap-always",
                fullHeight ? "min-h-screen" : "py-32",
                className
            )}
        >
            {children}
        </motion.section>
    );
}
