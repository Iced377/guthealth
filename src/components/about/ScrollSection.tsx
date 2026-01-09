'use client';

import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface ScrollSectionProps {
    children: React.ReactNode;
    className?: string;
    fullHeight?: boolean;
}

export default function ScrollSection({ children, className, fullHeight = true }: ScrollSectionProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);

    return (
        <motion.section
            ref={ref}
            style={{ opacity, scale }}
            className={cn(
                "relative flex flex-col items-center justify-center w-full px-4 overflow-hidden",
                fullHeight ? "min-h-screen" : "py-32",
                className
            )}
        >
            {children}
        </motion.section>
    );
}
