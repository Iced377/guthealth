'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HapticsService, ImpactStyle } from '@/lib/haptics';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import LiquidSegmentedControl from '@/components/ui/LiquidSegmentedControl';
import { useInsightsMotionController } from './useInsightsMotionController';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens, LiquidMode } from '@/lib/liquid-tokens';

export function InsightCategoryStrip() {
    const {
        selectedCategory,
        setCategory,
        chromeHidden
    } = useInsightsMotionController();

    const { scrollY } = useScroll();
    const { isDarkMode } = useTheme();
    const mode = isDarkMode ? 'dark' : 'light';
    const tokens = getLiquidTokens(mode);

    // Visibility Logic (Hide when chromeHidden is true, e.g. expanded chart)
    const isVisible = !chromeHidden;

    // View State: 'expanded' | 'compact' (Auto-collapse on scroll)
    const [viewState, setViewState] = useState<'expanded' | 'compact'>('expanded');
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest < 10) {
            if (viewState !== 'expanded') setViewState('expanded');
            return;
        }

        const diff = latest - (scrollY.getPrevious() || 0);
        if (Math.abs(diff) > 5) {
            if (viewState !== 'compact') setViewState('compact');
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => {
                setViewState('expanded');
            }, 600);
        }
    });

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    const handleSelect = (id: string) => {
        HapticsService.impact(ImpactStyle.Light);
        setCategory(id);
    };

    // Options for Segmented Control
    const OPTIONS = [
        { id: 'Coach', label: 'Coach' },
        { id: 'Today', label: 'Highlights' }
    ];

    // Avatar Logic
    const avatarSrc = isDarkMode ? '/coach-black.png' : '/coach-white.png';

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none pt-[calc(env(safe-area-inset-top)+1rem)]"
            initial={{ y: -100, opacity: 0 }}
            animate={{
                y: isVisible ? 0 : -100,
                opacity: isVisible ? 1 : 0
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <motion.div
                layoutId="insight-control-pill"
                className={cn(
                    "pointer-events-auto backdrop-blur-3xl backdrop-saturate-200 border shadow-lg rounded-full overflow-hidden transition-all duration-500 ease-[0.23,1,0.32,1] relative insight-tab",
                    isDarkMode
                        ? "bg-black/5 border-white/10"
                        : "bg-white/5 border-black/5",
                    viewState === 'expanded' ? "p-1.5" : "px-4 py-2"
                )}
                onClick={() => {
                    if (viewState === 'compact') {
                        HapticsService.selection();
                        setViewState('expanded');
                    }
                }}
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {viewState === 'expanded' ? (
                        <motion.div
                            key="expanded-content"
                            initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                            className="flex items-center gap-1"
                        >
                            <LiquidSegmentedControl
                                options={OPTIONS}
                                selected={selectedCategory}
                                onChange={handleSelect}
                                layoutIdPrefix="insight-nav"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="compact-content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2"
                        >
                            {selectedCategory === 'Coach' ? (
                                <div className="h-4 w-4 rounded-full overflow-hidden relative border border-current opacity-80">
                                    <Image src={avatarSrc} alt="Coach" fill className="object-cover" />
                                </div>
                            ) : (
                                <Sparkles className={cn("w-3.5 h-3.5", tokens.text.secondary)} />
                            )}

                            <span className={cn("text-sm font-semibold tracking-wide", tokens.text.primary)}>
                                {selectedCategory === 'Today' ? 'Highlights' : 'Coach'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
