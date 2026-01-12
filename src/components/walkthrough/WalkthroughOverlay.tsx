'use client';

import React, { useEffect, useState } from 'react';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";

export default function WalkthroughOverlay() {
    const { isWalkthroughActive, currentStep, nextStep, prevStep, endWalkthrough, currentStepIndex, activeTopic } = useWalkthrough();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const { theme } = useTheme();
    const isMobile = useIsMobile();

    // Handle Target Highlighting
    useEffect(() => {
        if (isWalkthroughActive && currentStep?.targetId) {
            const element = document.getElementById(currentStep.targetId);
            if (element) {
                // Smart Scroll:
                // If it's a large container (like the dashboard wrapper), scroll to top ('start').
                // If it's a small target (like a button), scroll to 'center' so it's focused.
                const rect = element.getBoundingClientRect();
                const isLarge = rect.height > window.innerHeight * 0.5;

                element.scrollIntoView({
                    behavior: 'smooth',
                    block: isLarge ? 'start' : 'center',
                    inline: 'nearest' // prevents horizontal shifting if not needed
                });

                // Use a slight delay to allow scroll to finish and layout to settle
                const updateRect = () => {
                    const rect = element.getBoundingClientRect();
                    setTargetRect(rect);
                };

                updateRect();
                // Add resize and scroll listeners
                window.addEventListener('resize', updateRect);
                window.addEventListener('scroll', updateRect, { capture: true, passive: true });

                // Polling for animations (every 100ms for 1 second)
                // This accounts for Framer Motion or other layout shifts that happen after mount
                const intervalId = setInterval(updateRect, 100);
                const timeoutId = setTimeout(() => clearInterval(intervalId), 1000);

                return () => {
                    window.removeEventListener('resize', updateRect);
                    window.removeEventListener('scroll', updateRect);
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                };
            } else {
                setTargetRect(null);
            }
        } else {
            setTargetRect(null);
        }
    }, [isWalkthroughActive, currentStep]);

    if (!isWalkthroughActive || !currentStep) return null;

    const isLastStep = activeTopic && currentStepIndex === activeTopic.steps.length - 1;

    // --- RENDER CONTENT (Shared UI Logic) ---
    const renderContent = () => (
        <div className="flex flex-col gap-4">
            {/* Media */}
            {currentStep.mediaUrl && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted mt-2">
                    {currentStep.mediaType === 'video' ? (
                        <video src={currentStep.mediaUrl} autoPlay loop muted className="w-full h-full object-cover" />
                    ) : (
                        <img src={currentStep.mediaUrl} alt={currentStep.title} className="w-full h-full object-cover" />
                    )}
                </div>
            )}

            <div className="text-muted-foreground text-sm leading-relaxed">
                {currentStep.content}
            </div>

            {/* Footer / Controls */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                <div className="flex gap-1" aria-hidden="true">
                    {activeTopic?.steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "w-2 h-2 rounded-full transition-colors",
                                idx === currentStepIndex ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                        />
                    ))}
                </div>

                <div className="flex gap-2">
                    {currentStepIndex > 0 && (
                        <Button variant="outline" size="sm" onClick={prevStep} className="h-8 w-8 p-0 rounded-full">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    )}

                    <Button
                        size="sm"
                        onClick={nextStep}
                        className="h-8 px-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20"
                    >
                        {isLastStep ? "Finish" : (currentStep.actionLabel || "Next")}
                        {!isLastStep && <ChevronRight className="w-3 h-3 ml-1" />}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* 1. SPOTLIGHT LAYER (Fixed z-50) */}
            {/* We want to BLOCK interaction with the app (backdrop), but allow interaction with the Sheet/Card (z-[60]). 
                So we set pointer-events-auto on the backdrop layer. 
            */}
            <div className="fixed inset-0 z-50 pointer-events-auto">
                <AnimatePresence>
                    {targetRect && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                        >
                            <svg className="absolute inset-0 w-full h-full">
                                <defs>
                                    <mask id="highlight-mask">
                                        <rect className="w-full h-full fill-white" />
                                        <rect
                                            x={targetRect.left - 4}
                                            y={targetRect.top - 4}
                                            width={targetRect.width + 8}
                                            height={targetRect.height + 8}
                                            rx="8"
                                            className="fill-black"
                                        />
                                    </mask>
                                </defs>
                                {/* This element effectively blocks clicks because of the container's pointer-events-auto */}
                                <rect className="w-full h-full fill-black/60" mask="url(#highlight-mask)" />
                            </svg>
                            {/* Pulsing Border */}
                            <div
                                className="absolute border-2 border-primary rounded-lg box-content animate-pulse"
                                style={{
                                    top: targetRect.top - 4,
                                    left: targetRect.left - 4,
                                    width: targetRect.width + 8,
                                    height: targetRect.height + 8,
                                }}
                            />
                        </motion.div>
                    )}
                    {!targetRect && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-black/60"
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* 2. CONTENT LAYER (Z-51, Interactive) */}
            {isMobile ? (
                // --- MOBILE: Bottom Sheet ---
                // modal={false} prevents the Sheet from rendering its own dark overlay, so our Spotlight is visible.
                <Sheet open={isWalkthroughActive} modal={false} onOpenChange={(open) => !open && endWalkthrough()}>
                    <SheetContent side="bottom" className="z-[60] pb-8 pt-4" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={() => endWalkthrough()}>
                        {/* Hide default close button if we want custom control, or use it for "Skip" */}
                        <SheetHeader className="mb-2 flex flex-row items-center justify-between space-y-0">
                            <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
                                {currentStep.title}
                            </SheetTitle>
                            {/* Custom Close/Skip trigger logic handled by default close or our own button */}
                        </SheetHeader>

                        {renderContent()}
                    </SheetContent>
                </Sheet>
            ) : (
                // --- DESKTOP: Fixed Card ---
                <div className="fixed z-[60] bottom-8 right-8 w-96 max-w-[calc(100vw-4rem)]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={currentStep.id}
                        className="bg-card text-card-foreground p-6 rounded-xl border shadow-2xl"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
                                {currentStep.title}
                            </h3>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground hover:text-foreground" onClick={endWalkthrough}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        {renderContent()}
                    </motion.div>
                </div>
            )}
        </>
    );
}
