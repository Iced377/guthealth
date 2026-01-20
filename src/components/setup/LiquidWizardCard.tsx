'use client';

import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface LiquidWizardCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    showSwipeHint?: boolean;
}

export default function LiquidWizardCard({
    children,
    className,
    title,
    description,
    icon,
    showSwipeHint = true
}: LiquidWizardCardProps) {
    const { isDarkMode } = useTheme();

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "w-full max-w-sm h-[600px] rounded-[40px] relative overflow-hidden flex flex-col items-center p-8 text-center transition-all duration-500",
                    isDarkMode
                        ? "bg-white/[0.05] border border-white/10 shadow-2xl"
                        : "bg-white/60 border border-white/40 shadow-xl shadow-indigo-500/10",
                    className
                )}
                style={{
                    backdropFilter: "blur(30px)",
                    WebkitBackdropFilter: "blur(30px)",
                }}
            >
                {/* Header Section */}
                {(title || icon) && (
                    <div className="flex flex-col items-start justify-start w-full px-2 mb-6 shrink-0 relative z-20">
                        {/* Icon only if provided - User requested removal from some headlines, so we make it optional and separate */}
                        {icon && (
                            <div className={cn(
                                "w-16 h-16 shrink-0 rounded-full flex items-center justify-center shadow-lg glass-icon mb-4",
                                isDarkMode ? "bg-white/5 text-white/90" : "bg-white/80 text-indigo-600"
                            )}>
                                {icon}
                            </div>
                        )}
                        <div className="text-left w-full">
                            {title && <h2 className="text-[3.2rem] font-black font-headline tracking-tighter leading-[0.9] mb-2 drop-shadow-sm">{title}</h2>}
                            {description && (
                                <p className="text-base text-muted-foreground leading-snug opacity-80 font-medium max-w-[90%]">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Content Body (Flex-1 to fill space) */}
                <div className="flex-1 w-full flex flex-col justify-center min-h-0">
                    {children}
                </div>

                {/* Swipe Hint */}
                {showSwipeHint && (
                    <div className="absolute bottom-8 flex items-center gap-1 text-muted-foreground/40 text-[10px] font-bold uppercase tracking-widest animate-pulse pointer-events-none">
                        Swipe <ChevronRight className="w-3 h-3" />
                    </div>
                )}
            </motion.div>
        </div>
    );
}
