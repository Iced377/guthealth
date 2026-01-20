'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion, PanInfo, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
// We don't import ComposerCard directly because it's tied to FormContext and specific props. We'll replicate the style.

const feedbackSchema = z.object({
    text: z.string().min(3, { message: 'Please provide a bit more detail.' }),
});

type FormValues = z.infer<typeof feedbackSchema>;

interface FeedbackComposeOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (text: string) => Promise<void>;
    title: string;
    placeholder: string;
}

export default function FeedbackComposeOverlay({
    isOpen,
    onClose,
    onSubmit,
    title,
    placeholder
}: FeedbackComposeOverlayProps) {
    const { isDarkMode } = useTheme();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const controls = useDragControls();

    const { register, handleSubmit, reset, setFocus, formState: { isValid } } = useForm<FormValues>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: { text: '' }
    });

    useEffect(() => {
        if (isOpen) {
            // Slight delay to allow animation before focus
            const timer = setTimeout(() => {
                setFocus('text');
                // Scroll caret into view
                if (textareaRef.current) {
                    textareaRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
                }
            }, 400);

            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            return () => clearTimeout(timer);
        } else {
            reset();
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
    }, [isOpen, setFocus, reset]);

    const onFormSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        await onSubmit(data.text);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-end justify-center"
                    style={{ touchAction: 'none' }}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className={cn(
                            "absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
                        )}
                    />

                    {/* Card Container - Floating Bottom */}
                    <motion.div
                        drag="x"
                        dragListener={false}
                        dragControls={controls}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.7}
                        onPointerDown={(e) => controls.start(e)}
                        onDragEnd={(_, info: PanInfo) => {
                            if (Math.abs(info.offset.x) > 100) {
                                onClose();
                            }
                        }}
                        initial={{ opacity: 0, scale: 0.9, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 100 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={cn(
                            "pointer-events-auto relative w-full max-w-md mb-[calc(env(safe-area-inset-bottom)+20px)] mx-4",
                            "flex flex-col overflow-hidden rounded-[32px]",
                            isDarkMode
                                ? "bg-[#1C1C1E]/90 border border-white/5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]"
                                : "bg-white/50 border border-white/20 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.2)]"
                        )}
                        style={{
                            backdropFilter: "blur(100px)",
                            transformOrigin: "bottom center",
                        }}
                    >
                        {/* THIN FILM SHEEN */}
                        <div className="absolute inset-0 pointer-events-none rounded-[32px] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/2 to-transparent" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
                        </div>

                        {/* Form Body */}
                        <form
                            onSubmit={handleSubmit(onFormSubmit)}
                            className="relative z-10 flex flex-col p-5 gap-4"
                        >
                            {/* Header / Title as label */}
                            <div className="px-1 pt-1 opacity-60 text-xs font-semibold tracking-wider uppercase">
                                {title}
                            </div>

                            {/* Input Field */}
                            <div
                                className={cn(
                                    "relative w-full rounded-[24px] overflow-hidden transition-colors min-h-[140px]",
                                    isDarkMode ? "bg-black/20" : "bg-black/5"
                                )}
                            >
                                <textarea
                                    {...register('text')}
                                    ref={(e) => {
                                        register('text').ref(e);
                                        textareaRef.current = e;
                                    }}
                                    placeholder={placeholder}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit(onFormSubmit)();
                                        }
                                    }}
                                    className={cn(
                                        "w-full h-full bg-transparent resize-none outline-none border-0 shadow-none appearance-none",
                                        "p-5 text-[18px] leading-relaxed",
                                        "placeholder:opacity-40",
                                        isDarkMode ? "text-white/90 caret-primary placeholder:text-white/30" : "text-black/90 caret-primary placeholder:text-black/30"
                                    )}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs text-muted-foreground opacity-50">Swipe to close</span>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    disabled={!isValid || isSubmitting}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all text-sm",
                                        isValid
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "bg-white/5 text-muted-foreground cursor-not-allowed opacity-50"
                                    )}
                                >
                                    {isSubmitting ? "Sending..." : <>Send <Send className="w-4 h-4" /></>}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
