import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useInsightsMotionController } from './useInsightsMotionController';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens, LiquidMode } from '@/lib/liquid-tokens';
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';

export function InsightCategoryStrip() {
    const {
        selectedCategory,
        setCategory,
        chromeHidden
    } = useInsightsMotionController();

    const isVisible = !chromeHidden;
    const { isDarkMode } = useTheme();
    const mode: LiquidMode = isDarkMode ? 'dark' : 'light';
    const tokens = getLiquidTokens(mode);

    // Avatar Logic
    const avatarSrc = isDarkMode ? '/coach-black.png' : '/coach-white.png';

    return (
        // Fixed Top Bar container
        <div className={cn(
            "sticky top-0 z-40 backdrop-blur-xl border-b pt-[calc(env(safe-area-inset-top)+24px)] pb-4 px-4 flex items-end justify-center h-30 transition-colors duration-300",
            mode === 'dark' ? "bg-black/60 border-white/5" : "bg-white/60 border-black/5"
        )}>
            <motion.div
                className="w-full max-w-sm grid grid-cols-2 gap-3"
                initial={false}
                animate={{
                    opacity: isVisible ? 1 : 0,
                    y: isVisible ? 0 : -20,
                    pointerEvents: isVisible ? 'auto' : 'none',
                }}
                transition={{ duration: 0.3, type: "spring", damping: 20 }}
            >
                {/* 1. Highlights Tab */}
                <LiquidPressable
                    variant="pill"
                    onClick={() => setCategory('Today')} // "Today" maps to Highlights view
                    className={cn(
                        "h-12 flex items-center justify-center gap-2 rounded-full transition-all duration-300",
                        selectedCategory === 'Today'
                            ? (mode === 'dark' ? "bg-white/10" : "bg-white")
                            : "bg-transparent opacity-60 hover:opacity-100"
                    )}
                >
                    <Sparkles className={cn("w-4 h-4", selectedCategory === 'Today' ? "text-yellow-400 fill-yellow-400" : tokens.text.secondary)} />
                    <span className={cn("font-bold text-sm", selectedCategory === 'Today' ? tokens.text.primary : tokens.text.secondary)}>
                        Highlights
                    </span>
                </LiquidPressable>

                {/* 2. Coach Tab */}
                <LiquidPressable
                    variant="pill"
                    onClick={() => setCategory('Coach')}
                    className={cn(
                        "h-12 flex items-center justify-center gap-2 rounded-full transition-all duration-300",
                        selectedCategory === 'Coach'
                            ? (mode === 'dark' ? "bg-white/10" : "bg-white")
                            : "bg-transparent opacity-60 hover:opacity-100"
                    )}
                >
                    <div className="h-6 w-6 rounded-full overflow-hidden relative shrink-0 border border-current opacity-80">
                        <Image
                            src={avatarSrc}
                            alt="Coach"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <span className={cn("font-bold text-sm", selectedCategory === 'Coach' ? tokens.text.primary : tokens.text.secondary)}>
                        Coach
                    </span>
                </LiquidPressable>

            </motion.div>

            {/* Page Dot Indicator (Top) */}
            <motion.div
                className="absolute top-[calc(env(safe-area-inset-top)+8px)] w-full flex justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    selectedCategory === 'Today' ? (mode === 'dark' ? "bg-white scale-110" : "bg-black scale-110") : (mode === 'dark' ? "bg-white/20" : "bg-black/20")
                )} />
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    selectedCategory === 'Coach' ? (mode === 'dark' ? "bg-white scale-110" : "bg-black scale-110") : (mode === 'dark' ? "bg-white/20" : "bg-black/20")
                )} />
            </motion.div>
        </div>
    );
}
