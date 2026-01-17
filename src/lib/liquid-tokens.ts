export type LiquidMode = 'light' | 'dark';

interface LiquidTokens {
    panel: {
        base: string;
        blur: string;
        border: string;
        shadow: string;
        highlight: string;
    };
    lens: {
        base: string;
        blur: string;
        border: string;
        shadow: string;
        highlight: string;
    };
    text: {
        primary: string;
        secondary: string;
        tertiary: string;
    };
    background: {
        root: string;
        overlay: string;
    };
}

export const getLiquidTokens = (mode: LiquidMode): LiquidTokens => {
    if (mode === 'light') {
        return {
            panel: {
                // Light Mode: Lifted Glass on Bright Surface
                base: 'bg-white/80',
                blur: 'backdrop-blur-xl',
                border: 'border-black/5',
                shadow: 'shadow-[0_8px_24px_rgba(0,0,0,0.06)]',
                highlight: 'after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
            },
            lens: {
                // Light Mode: Solid-ish white pill
                base: 'bg-white/95',
                blur: 'backdrop-blur-lg',
                border: 'border-black/5',
                shadow: 'shadow-sm shadow-black/5',
                highlight: 'after:shadow-[inset_0_1px_0_0_rgba(255,255,255,1)]',
            },
            text: {
                primary: 'text-zinc-900', // High contrast
                secondary: 'text-zinc-500',
                tertiary: 'text-zinc-400',
            },
            background: {
                root: 'bg-zinc-50', // Solid off-white
                overlay: 'bg-white/60',
            },
        };
    } else {
        return {
            panel: {
                // Dark Mode: Deep Glass
                base: 'bg-black/10',
                blur: 'backdrop-blur-xl',
                border: 'border-white/10',
                shadow: 'shadow-none',
                highlight: 'after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]',
            },
            lens: {
                // Dark Mode: Translucent Pill
                base: 'bg-white/10',
                blur: 'backdrop-blur-lg',
                border: 'border-white/5',
                shadow: 'shadow-none',
                highlight: 'after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]',
            },
            text: {
                primary: 'text-white',
                secondary: 'text-white/60',
                tertiary: 'text-white/40',
            },
            background: {
                root: 'bg-black',
                overlay: 'bg-black/60',
            },
        };
    }
};
