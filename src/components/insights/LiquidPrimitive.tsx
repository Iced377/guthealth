import { HTMLMotionProps, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef, ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens, LiquidMode } from '@/lib/liquid-tokens';

interface LiquidGlassProps extends HTMLMotionProps<'div'> {
    intensity?: 'low' | 'medium' | 'high';
    children: ReactNode;
}

export const LiquidGlassPanel = forwardRef<HTMLDivElement, LiquidGlassProps>(({
    className,
    intensity = 'medium',
    children,
    ...props
}, ref) => {
    const { isDarkMode } = useTheme();
    const mode: LiquidMode = isDarkMode ? 'dark' : 'light';
    const tokens = getLiquidTokens(mode);

    return (
        <motion.div
            ref={ref}
            className={cn(
                'relative isolate overflow-hidden rounded-3xl transition-colors duration-300',
                tokens.panel.base,
                tokens.panel.blur,
                tokens.panel.border,
                tokens.panel.shadow,
                // Inner highlight via pseudo-element to avoid border conflicts
                'after:absolute after:inset-0 after:rounded-[inherit] after:pointer-events-none',
                tokens.panel.highlight,
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
});

LiquidGlassPanel.displayName = 'LiquidGlassPanel';


interface FrostBackplateProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
}

export const FrostBackplate = forwardRef<HTMLDivElement, FrostBackplateProps>(({
    className,
    children,
    ...props
}, ref) => {
    const { isDarkMode } = useTheme();
    // Frost Backplates are generally for text legibility.
    // In Light mode, they should be white/95 or just solid white to pop against the off-white bg.
    // We can reuse 'lens' tokens for backplates as they are similar "solid" surfaces in light mode.
    const mode: LiquidMode = isDarkMode ? 'dark' : 'light';
    const tokens = getLiquidTokens(mode);

    return (
        <motion.div
            ref={ref}
            className={cn(
                'relative rounded-2xl p-4 text-sm leading-relaxed transition-colors duration-300',
                // Use 'lens' tokens for the backplate base as it suits the "card" feel
                tokens.lens.base,
                tokens.lens.blur,
                tokens.lens.border,
                tokens.lens.shadow,
                tokens.text.primary,
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
});

FrostBackplate.displayName = 'FrostBackplate';
