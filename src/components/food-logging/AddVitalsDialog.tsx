'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowUp, Scale, Footprints, X, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- Visual Viewport Hook (Copied from ComposeOverlay) ---
function useVisualViewportMetrics() {
    const [metrics, setMetrics] = useState({
        vvHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
        vvOffsetTop: 0,
        keyboardHeight: 0,
        isKeyboardOpen: false,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateMetrics = () => {
            const vv = window.visualViewport;
            const vvHeight = vv?.height ?? window.innerHeight;
            const vvOffsetTop = vv?.offsetTop ?? 0;
            const keyboardHeight = Math.max(0, window.innerHeight - vvHeight - vvOffsetTop);
            const isKeyboardOpen = keyboardHeight > 40;

            setMetrics({
                vvHeight,
                vvOffsetTop,
                keyboardHeight,
                isKeyboardOpen,
            });
        };

        let rafId: number;
        const handleResize = () => {
            rafId = requestAnimationFrame(updateMetrics);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }
        window.addEventListener('resize', handleResize);

        updateMetrics();

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return metrics;
}

interface AddVitalsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (weight: number | null, steps: number | null, fatPercent: number | null) => Promise<void>;
    currentDate: Date;
    initialWeight?: number | null;
    initialSteps?: number | null;
    initialFatPercent?: number | null;
}

export default function AddVitalsDialog({
    isOpen,
    onOpenChange,
    onSubmit,
    currentDate,
    initialWeight,
    initialSteps,
    initialFatPercent,
}: AddVitalsDialogProps) {
    const [mounted, setMounted] = useState(false);
    const { isDarkMode } = useTheme();
    const { toast } = useToast();
    const { keyboardHeight } = useVisualViewportMetrics();

    // Form State
    const [weight, setWeight] = useState('');
    const [steps, setSteps] = useState('');
    const [fatPercent, setFatPercent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs
    const weightInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Init Values and iOS Scroll Lock
    useEffect(() => {
        if (isOpen) {
            setWeight(initialWeight?.toString() || '');
            setSteps(initialSteps?.toString() || '');

            // Auto focus weight after animation
            setTimeout(() => {
                weightInputRef.current?.focus();
            }, 400);

            // iOS Lock
            const scrollY = window.scrollY;
            const body = document.body;
            body.style.position = 'fixed';
            body.style.top = `-${scrollY}px`;
            body.style.width = '100%';
            body.style.overflow = 'hidden';

            return () => {
                const top = body.style.top;
                body.style.position = '';
                body.style.top = '';
                body.style.width = '';
                body.style.overflow = '';
                const y = top ? parseInt(top.replace('-', '').replace('px', ''), 10) : 0;
                window.scrollTo(0, y);
            };
        }
    }, [isOpen, initialWeight, initialSteps]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            const weightVal = weight ? parseFloat(weight) : null;
            const stepsVal = steps ? parseInt(steps, 10) : null;
            const fatVal = fatPercent ? parseFloat(fatPercent) : null;
            await onSubmit(isNaN(weightVal!) ? null : weightVal, isNaN(stepsVal!) ? null : stepsVal, isNaN(fatVal!) ? null : fatVal);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save vitals", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const controls = useDragControls();

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9999]"
                    style={{ touchAction: 'none' }}
                    onWheel={(e) => e.preventDefault()}
                    onTouchMove={(e) => e.preventDefault()}
                >
                    {/* Backdrop */}
                    <motion.button
                        type="button"
                        className={cn(
                            "absolute inset-0 w-full h-full cursor-default pointer-events-auto",
                            isDarkMode ? "bg-black/60" : "bg-black/20"
                        )}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={() => onOpenChange(false)}
                    />

                    {/* Glass Veil */}
                    <div
                        className="absolute inset-0 pointer-events-none backdrop-blur-[22px]"
                        style={{
                            background: isDarkMode
                                ? "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.06), rgba(0,0,0,0.45) 70%)"
                                : "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.55), rgba(255,255,255,0.20) 70%)"
                        }}
                    />

                    {/* Card Container */}
                    <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                        <div
                            className="w-full flex items-end justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
                            style={{
                                transform: `translateY(-${keyboardHeight}px)`,
                                transition: 'transform 0.12s ease-out',
                                willChange: 'transform',
                            }}
                        >
                            <motion.div
                                drag="x"
                                dragListener={false}
                                dragControls={controls}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.7}
                                onPointerDown={(e) => controls.start(e)}
                                onDragEnd={(_, info: PanInfo) => {
                                    if (Math.abs(info.offset.x) > 100) {
                                        onOpenChange(false);
                                    }
                                }}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className={cn(
                                    "w-full max-w-md pointer-events-auto relative overflow-hidden flex flex-col",
                                    "rounded-[32px]",
                                    isDarkMode
                                        ? "bg-white/[0.02] border border-white/5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]"
                                        : "bg-white/[0.12] border border-white/20 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.2)]"
                                )}
                                style={{
                                    backdropFilter: "blur(32px)",
                                    transformOrigin: "bottom center",
                                    touchAction: 'pan-y'
                                }}
                            >
                                {/* Sheen Overlay */}
                                <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[32px] overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/2 to-transparent" />
                                    <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
                                </div>

                                {/* Content Body */}
                                <div className="relative z-10 flex-1 w-full px-6 pt-6 pb-6 overflow-hidden flex flex-col gap-4">

                                    {/* Header / Date - Matching "Toggle" placement */}
                                    <div className="flex justify-between items-center mb-0">
                                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                            {currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>

                                    {/* Inputs Container */}
                                    <div className={cn(
                                        "relative w-full rounded-[24px] overflow-hidden transition-colors flex flex-col divide-y divide-white/10",
                                        isDarkMode ? "bg-white/[0.015]" : "bg-white/5"
                                    )}>

                                        {/* Weight Row */}
                                        <div className="flex items-center px-5 py-4 gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                                <Scale className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div className="flex-1">
                                                <label htmlFor="weight-input" className="sr-only">Weight</label>
                                                <input
                                                    ref={weightInputRef}
                                                    id="weight-input"
                                                    type="number"
                                                    step="0.1"
                                                    value={weight}
                                                    onChange={(e) => setWeight(e.target.value)}
                                                    placeholder="Weight (kg)"
                                                    className={cn(
                                                        "w-full bg-transparent outline-none border-0 p-0 text-[18px] font-medium placeholder:font-normal",
                                                        isDarkMode ? "text-white/90 placeholder:text-white/30" : "text-black/90 placeholder:text-black/30"
                                                    )}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') document.getElementById('steps-input')?.focus();
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Steps Row */}
                                        <div className="flex items-center px-5 py-4 gap-4">
                                            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                                <Footprints className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="flex-1">
                                                <label htmlFor="steps-input" className="sr-only">Steps</label>
                                                <input
                                                    id="steps-input"
                                                    type="number"
                                                    value={steps}
                                                    onChange={(e) => setSteps(e.target.value)}
                                                    placeholder="Steps count"
                                                    className={cn(
                                                        "w-full bg-transparent outline-none border-0 p-0 text-[18px] font-medium placeholder:font-normal",
                                                        isDarkMode ? "text-white/90 placeholder:text-white/30" : "text-black/90 placeholder:text-black/30"
                                                    )}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSubmit();
                                                    }}
                                                />
                                            </div>
                                        </div>

                                    </div>

                                    {/* Body Fat Row */}
                                    <div className="flex items-center px-5 py-4 gap-4">
                                        <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                                            <Percent className="w-5 h-5 text-yellow-500" />
                                        </div>
                                        <div className="flex-1">
                                            <label htmlFor="fat-input" className="sr-only">Body Fat %</label>
                                            <input
                                                id="fat-input"
                                                type="number"
                                                step="0.1"
                                                value={fatPercent}
                                                onChange={(e) => setFatPercent(e.target.value)}
                                                placeholder="Body Fat %"
                                                className={cn(
                                                    "w-full bg-transparent outline-none border-0 p-0 text-[18px] font-medium placeholder:font-normal",
                                                    isDarkMode ? "text-white/90 placeholder:text-white/30" : "text-black/90 placeholder:text-black/30"
                                                )}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSubmit();
                                                }}
                                            />
                                        </div>
                                    </div>

                                </div>

                                {/* Submit Arrow - Floating Bottom Right */}
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={isSubmitting}
                                    className={cn(
                                        "absolute bottom-4 right-4 z-20 p-3 rounded-full transition-all active:scale-95 shadow-lg backdrop-blur-md",
                                        isDarkMode ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-black text-white hover:bg-black/90"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ArrowUp className="w-5 h-5 stroke-[3]" />
                                    )}
                                </button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
