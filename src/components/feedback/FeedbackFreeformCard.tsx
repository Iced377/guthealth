'use client';

import React, { useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FeedbackFreeformCardProps {
    value: string;
    onChange: (val: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    canSubmit: boolean;
}

export default function FeedbackFreeformCard({ value, onChange, onSubmit, isSubmitting, canSubmit }: FeedbackFreeformCardProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center p-6 snap-center shrink-0 relative pt-20 pb-24">
            <GlassCard className="w-full max-w-sm aspect-[3/4] flex flex-col p-8 bg-white/5 border-white/10">
                <div className="text-center mt-6 mb-8">
                    <h3 className="text-3xl font-headline font-bold mb-2 text-foreground">Anything else?</h3>
                    <p className="text-muted-foreground text-lg">Detailed thoughts help us the most.</p>
                </div>

                <div className="flex-1 relative w-full mb-8">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="It would be awesome if..."
                        className={cn(
                            "w-full h-full bg-white/5 rounded-xl border border-white/10 p-4 text-base resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50"
                        )}
                    // Gating: Should we allow typing even if not "Focused"? 
                    // Yes, typing requires tap anyway.
                    />
                </div>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className={cn(
                        "w-full py-4 rounded-xl font-semibold text-lg transition-all",
                        canSubmit
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                            : "bg-transparent text-muted-foreground border border-white/10 hover:bg-white/5 opacity-70 hover:opacity-100" // Clickable 'ghost' style for skipping
                    )}
                >
                    {isSubmitting ? "Sending..." : (canSubmit ? "Submit Feedback" : "Nothing to submit")}
                </motion.button>
            </GlassCard>
        </div>
    );
}
