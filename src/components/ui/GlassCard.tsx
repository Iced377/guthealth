import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "heavy" | "floating";
    intensity?: "low" | "medium" | "high";
    interactive?: boolean;
    children: React.ReactNode;
}

export function GlassCard({
    className,
    variant = "default",
    intensity = "medium",
    interactive = false,
    children,
    ...props
}: GlassCardProps) {

    // Base glass styles
    const baseStyles = "relative overflow-hidden transition-all duration-200 border";

    // Blur intensity logic
    const blurMap = {
        low: "backdrop-blur-md",
        medium: "backdrop-blur-xl",
        high: "backdrop-blur-2xl"
    };

    // Variant styles - proper Liquid Glass material per Apple HIG
    const variants = {
        default: "bg-white/15 dark:bg-black/25 border-white/20 dark:border-white/10 shadow-sm",
        heavy: "bg-white/25 dark:bg-black/40 border-white/30 dark:border-white/15 shadow-md",
        floating: "bg-white/10 dark:bg-black/30 border-white/20 dark:border-white/10 shadow-xl"
    };

    // Interactive press animation per Apple HIG
    const interactiveStyles = interactive
        ? "cursor-pointer active:scale-[0.97] active:opacity-90 hover:bg-white/20 dark:hover:bg-black/35"
        : "";

    return (
        <div
            className={cn(
                baseStyles,
                blurMap[intensity],
                variants[variant],
                interactiveStyles,
                "rounded-2xl",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
