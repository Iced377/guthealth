import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { LiquidPressable } from '@/components/ui/LiquidPressable'; // Reuse existing pressable if compatible, or build custom lens

// We will build a specific "Lens" wrapper around LiquidPressable or separate if semantics differ.
// Plan says "Shared button/chip primitive". LiquidPressable is perfect for this.
// Exporting a configured version for semantic clarity.

interface LiquidLensProps extends React.ComponentProps<typeof LiquidPressable> {
    active?: boolean;
}

export const LiquidLens = forwardRef<HTMLButtonElement, LiquidLensProps>(({
    className,
    active,
    children,
    variant = 'pill', // Default to pill for lenses
    ...props
}, ref) => {
    return (
        <LiquidPressable
            ref={ref}
            variant={variant}
            className={cn(
                'transition-colors duration-300',
                active ? 'bg-white/20 border-white/20' : 'bg-white/5 border-white/5',
                className
            )}
            {...props}
        >
            {children}
        </LiquidPressable>
    );
});

LiquidLens.displayName = 'LiquidLens';
