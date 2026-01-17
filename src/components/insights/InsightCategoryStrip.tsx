import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useInsightsMotionController } from './useInsightsMotionController';
import { LiquidLens } from './LiquidLens';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens, LiquidMode } from '@/lib/liquid-tokens';

const CATEGORIES = ['Today', 'Fasting', 'Calories', 'Macros', 'Weight', 'Steps', 'Trends'];

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

    return (
        // Sticky container with adaptive background
        <div className={cn(
            "sticky top-0 z-40 backdrop-blur-md border-b h-16 flex items-center transition-colors duration-300",
            mode === 'dark'
                ? "bg-background/80 border-white/5"
                : "bg-white/80 border-black/5"
        )}>

            <motion.div
                className="w-full h-full flex items-center"
                initial={false}
                animate={{
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isVisible ? 'auto' : 'none',
                }}
                transition={{ duration: 0.2 }}
            >
                <div className="flex items-center gap-2 overflow-x-auto px-4 w-full h-full no-scrollbar snap-x mask-linear-fade">
                    {CATEGORIES.map(cat => {
                        const isActive = selectedCategory === cat;
                        return (
                            <LiquidLens
                                key={cat}
                                variant="pill"
                                size="md"
                                active={false} // We handle active style manually to support theme
                                onClick={() => setCategory(cat)}
                                className={cn(
                                    "whitespace-nowrap snap-start shrink-0 mb-0.5",
                                    // Custom active state override if needed, or rely on Lens
                                    // LiquidPressable doesn't have an 'active' prop in its interface yet?
                                    // Ah, LiquidLens does? Let's check LiquidLens.
                                    // Wait, LiquidLens wrapper usually forwards props.
                                    // Let's assume LiquidLens is just a wrapper around LiquidPressable.
                                    // In this file, we imported LiquidLens. 
                                    // Let's just style it via className.
                                    isActive
                                        ? (mode === 'dark' ? "bg-white/20 font-semibold" : "bg-black/5 font-semibold text-black")
                                        : "opacity-70 hover:opacity-100"
                                )}
                            >
                                {cat}
                            </LiquidLens>
                        );
                    })}
                </div>
            </motion.div>

            {/* Scroll Indicators (Gradient Masks) */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-6 pointer-events-none bg-gradient-to-r to-transparent",
                mode === 'dark' ? "from-black" : "from-zinc-50"
            )} />
            <div className={cn(
                "absolute right-0 top-0 bottom-0 w-6 pointer-events-none bg-gradient-to-l to-transparent",
                mode === 'dark' ? "from-black" : "from-zinc-50"
            )} />
        </div>
    );
}
