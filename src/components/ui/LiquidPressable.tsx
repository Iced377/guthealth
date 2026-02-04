'use client';

import React, { useState } from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { impactLight, impactMedium } from '@/lib/haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens, LiquidMode } from '@/lib/liquid-tokens';

interface LiquidPressableProps extends Omit<HTMLMotionProps<'button'>, 'children' | 'onClick'> {
    children: React.ReactNode;
    variant?: 'icon' | 'pill' | 'ghost' | 'fab';
    size?: 'sm' | 'md' | 'lg';
    haptic?: 'none' | 'light' | 'medium';
    onClick?: (event?: any) => void;
    className?: string;
    disabled?: boolean;
    allowSelectionEffect?: boolean; // New prop to force selection effect
}

export const LiquidPressable = React.forwardRef<HTMLButtonElement, LiquidPressableProps>(({
    children,
    variant = 'icon',
    size = 'md',
    haptic = 'light',
    onClick,
    className,
    disabled = false,
    allowSelectionEffect = false,
    ...props
}, ref) => {
    const [isPressed, setIsPressed] = useState(false);
    const { isDarkMode } = useTheme();
    const mode: LiquidMode = isDarkMode ? 'dark' : 'light';
    const tokens = getLiquidTokens(mode);

    // Haptic trigger
    const handleTap = (event?: any) => {
        if (disabled) return;
        if (haptic === 'light') impactLight();
        if (haptic === 'medium') impactMedium();
        onClick?.(event);
    };

    // Base Styles
    const baseStyles = cn(
        'relative isolate overflow-hidden outline-none',
        'flex items-center justify-center font-medium select-none transition-all duration-300',

        // Use TOKEN base styles
        tokens.lens.base,
        tokens.lens.blur,
        tokens.lens.border,
        tokens.lens.shadow,

        // Vertical Gradient (subtle top light) - Adaptive
        // In light mode, we might want less heavy gradient
        mode === 'dark'
            ? 'bg-gradient-to-b from-white/10 to-transparent'
            : 'bg-gradient-to-b from-white to-white/50',

        // Inner Highlights/Shadows (via pseudo in tokens.lens, but we can add extra here if needed)
        // actually tokens.lens.highlight handles the inner ring.
        tokens.lens.highlight,

        // Border Radius handled by variant/size usually, but defaults:
        variant === 'icon' || variant === 'fab' ? 'rounded-full' : 'rounded-2xl',
        disabled && 'opacity-50 cursor-not-allowed grayscale'
    );

    // Size Styles
    const sizeStyles = {
        sm: variant === 'icon' || variant === 'fab' ? 'w-8 h-8' : 'px-3 py-1 text-xs',
        md: variant === 'icon' || variant === 'fab' ? 'w-10 h-10' : 'px-4 py-2 text-sm',
        lg: variant === 'icon' || variant === 'fab' ? 'w-12 h-12' : 'px-6 py-3 text-base',
    };

    // Variant Specifics
    const variantStyles = {
        icon: '',
        fab: 'shadow-xl',
        pill: '',
        ghost: 'bg-transparent shadow-none backdrop-blur-none bg-none border-none hover:bg-black/5 dark:hover:bg-white/5 after:content-none',
    };

    return (
        <motion.button
            ref={ref}
            whileTap={{ scale: disabled ? 1 : variant === 'fab' ? 1.2 : 0.94 }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: variant === 'fab' ? 8 : 15, // Damping 8 for FAB (bouncy), 15 for others
                mass: 1,
            }}
            onTapStart={() => !disabled && setIsPressed(true)}
            onTap={(event) => {
                if (!disabled) {
                    handleTap(event);
                    setIsPressed(false);
                }
            }}
            onTapCancel={() => !disabled && setIsPressed(false)}
            className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
            disabled={disabled}
            {...props}
        >
            {/* Specular Sweep Effect (Overlay) */}
            <AnimatePresence>
                {isPressed && (variant !== 'ghost' || allowSelectionEffect) && (
                    <motion.div
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: '100%', opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12"
                    />
                )}
            </AnimatePresence>

            {/* Refraction Lens Layer (Always visible but subtle) */}
            {variant !== 'ghost' && (
                <div className={cn(
                    "absolute inset-0 rounded-[inherit] pointer-events-none z-0 opacity-30 bg-gradient-to-tr",
                    mode === 'dark'
                        ? "mix-blend-overlay from-white/10 via-transparent to-black/20"
                        : "mix-blend-normal from-white via-transparent to-black/5"
                )} />
            )}

            {/* Content - Text Color from Tokens */}
            <span className={cn(
                "relative z-20 flex items-center gap-2",
                // Ghost buttons need adaptive text but not the 'lens' text color necessarily...
                // Actually generic pressables usually use primary text color.
                variant === 'ghost'
                    ? (mode === 'dark' ? 'text-white/80' : 'text-zinc-600')
                    : tokens.text.primary
            )}>
                {children}
            </span>
        </motion.button>
    );
});

LiquidPressable.displayName = "LiquidPressable";
