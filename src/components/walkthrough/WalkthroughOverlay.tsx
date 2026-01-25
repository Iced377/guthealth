'use client';
import { LiquidPressable } from '@/components/ui/LiquidPressable';

import React, { useEffect, useState } from 'react';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useMotionTemplate } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
    const isMobile = useIsMobile();

    // Custom Motion Value for Reveal Animation (0% -> 150%)
    const revealProgress = useMotionValue(0);
    const revealRadius = useTransform(revealProgress, [0, 100], ["0%", "150%"]);
    const maskImage = useMotionTemplate`radial-gradient(circle at center, transparent ${revealRadius}, black ${revealRadius})`;



    // Handle Target Highlighting & Special Step Logic
    useEffect(() => {
        if (isWalkthroughActive) {

            // Special Handler for Dashboard Reveal Steps (1 & 2)
            if (currentStep?.id === 'welcome-1' || currentStep?.id === 'welcome-2') {
                // Force Scroll to Top for both steps
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.getElementById('dashboard-container')?.scrollTo({ top: 0, behavior: 'smooth' });

                if (currentStep.id === 'welcome-1') {
                    // Step 1: Full Frost (Hide Dashboard)
                    revealProgress.set(0);
                } else {
                    // Step 2: Animate Reveal
                    revealProgress.set(0);
                    animate(revealProgress, 100, { duration: 2.5, ease: "easeInOut" });
                }
            }



            if (currentStep?.targetId) {
                const element = document.getElementById(currentStep.targetId);
                if (element) {
                    // Smart Scroll logic...
                    const rect = element.getBoundingClientRect();
                    const isLarge = rect.height > window.innerHeight * 0.5;

                    // Skip standard scroll for welcome-1/2 as we forced it above
                    // Also skip for tour-meal-card steps as they are fixed/centered and scrolling causes layout shifts
                    if (currentStep.id !== 'welcome-1' && currentStep.id !== 'welcome-2' && !currentStep.id.startsWith('tour-meal-card')) {
                        element.scrollIntoView({
                            behavior: 'smooth',
                            block: isLarge ? 'start' : 'center',
                            inline: 'nearest'
                        });
                    }

                    const updateRect = () => {
                        let rect = element.getBoundingClientRect();

                        // FIX: For Macros row, the container is full width, but content is narrow.
                        // We want the arrow to point to the CONTENT end, not the container end.
                        if (currentStep.id === 'tour-meal-card-macros' && element.lastElementChild) {
                            const lastChildRect = element.lastElementChild.getBoundingClientRect();
                            // Create a new DOMRect-like object that combines container top/height with content right edge
                            rect = {
                                ...rect.toJSON(),
                                right: lastChildRect.right,
                                width: lastChildRect.right - rect.left
                            } as DOMRect;
                        }

                        setTargetRect(rect);
                    };

                    updateRect();
                    // ... listeners
                    window.addEventListener('resize', updateRect);
                    window.addEventListener('scroll', updateRect, { capture: true, passive: true });
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
        } else {
            setTargetRect(null);
        }
    }, [isWalkthroughActive, currentStep]);

    if (!isWalkthroughActive || !currentStep) return null;

    const isLastStep = activeTopic && currentStepIndex === activeTopic.steps.length - 1;

    // --- RENDER CONTENT (Shared UI Logic) ---
    const renderContent = () => (
        <div className="flex flex-col gap-4 relative">

            {/* Main Layout: Image Left, Text Right */}
            <div className="flex flex-row items-center gap-4">

                {/* Left: Frameless Guide Image */}
                <div className="w-1/3 max-w-[100px] shrink-0 relative flex items-center justify-center h-24">
                    {/* We use a negative margin or absolute positioning if we want it to 'break out', 
                       but standard flex is safer for 'seamless' blending within the padding. 
                       User said 'frameless', so object-contain with no border/radius. */}
                    <img
                        src="/info-gut.png"
                        alt="Guide"
                        className="w-full h-full object-contain scale-[1.8] drop-shadow-lg origin-center -translate-x-6"
                        style={{
                            // Optional: Adjust blend mode if needed, but transparent PNG is best
                            // mixBlendMode: isDarkMode ? 'lighten' : 'normal' 
                        }}
                    />
                </div>

                {/* Right: Content */}
                <div className="flex-1 flex flex-col gap-2">
                    {/* Title moved here for better flow? Or keep in Header? 
                         If Sheet has Header, we might duplicate. 
                         Let's keep Title in Header for accessible semantics usually, 
                         but for "Tour" look, having it here might be better. 
                         However, SheetHeader is rendered separate. Let's just render body text here. */}
                    <div className="text-foreground font-bold text-lg leading-tight">
                        {currentStep.title}
                    </div>
                    <div className="text-muted-foreground text-sm leading-relaxed">
                        {currentStep.content}
                    </div>
                </div>
            </div>

            {/* Optional Media (Video/Image) specific to step, rendered BELOW the intro? 
                Or replacing the guide? 
                User said "on the left of the text... use info-gut.png". 
                I'll assume info-gut replaces the generic media slot for standard text steps. 
                If there is SPECIAL media (like a video demo), maybe that goes below? */}
            {currentStep.mediaUrl && currentStep.mediaType === 'video' && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted mt-2 shadow-inner border border-border/10">
                    <video src={currentStep.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                </div>
            )}


            {/* Footer / Controls */}
            <div className="flex items-center justify-between mt-2 pt-0">
                <div className="flex gap-1" aria-hidden="true">
                    {activeTopic?.steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                idx === currentStepIndex ? "bg-primary w-4" : "bg-muted-foreground/30"
                            )}
                        />
                    ))}
                </div>

                <div className="flex gap-2">
                    {currentStepIndex > 0 && (
                        <motion.button
                            onClick={prevStep}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            whileTap={{ scale: 1.25 }}
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                            Back
                        </motion.button>
                    )}

                    <motion.button
                        onClick={nextStep}
                        className="rounded-full bg-primary text-primary-foreground font-bold px-6 py-2 shadow-md shadow-primary/20 hover:bg-primary/90"
                        whileTap={{ scale: 1.25 }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 8 }} // Bouncy!
                    >
                        {isLastStep ? "Finish" : (currentStep.actionLabel || "Next")}
                    </motion.button>
                </div>
            </div>
        </div>
    );

    // --- Z-INDEX STRUCTURE ---
    const Z_LAYERS = {
        BACKDROP: 'z-[120]',
        CONTENT: 'z-[130]', // Must be above BACKDROP
    };

    // Helper: Determine backdrop style
    const getBackdropStyle = () => {
        // Special case: Meal Card Tour & Welcome 4 (Feedback) used the "Frost" look
        // We preserve this aesthetic but NOW we will apply the mask.
        const FROST_STEPS = ['tour-meal-card-intro', 'tour-meal-card-macros', 'tour-meal-card-indicators', 'tour-meal-card-actions', 'tour-navbar-options', 'welcome-4'];
        const isFrost = FROST_STEPS.includes(currentStep?.id || '');

        // Special case: "Actions" step should have "clear" frosting (no blur/bg) but keep lock
        if (currentStep?.id === 'tour-meal-card-actions') {
            return "bg-transparent backdrop-blur-none";
        }

        return isFrost
            ? "bg-white/5 backdrop-blur-[2px]" // Extremely subtle frost
            : "bg-black/60";
    };

    return (
        <>
            {/* 1. SPOTLIGHT LAYER */}
            {/* We want to BLOCK interaction with the app (backdrop), but allow interaction with the Sheet/Card. 
                So we set pointer-events-auto on the backdrop layer. 
            */}
            <div className={`fixed inset-0 ${Z_LAYERS.BACKDROP} pointer-events-none`}>

                <AnimatePresence>
                    {(currentStep?.id === 'welcome-1' || currentStep?.id === 'welcome-2') ? (
                        /* 1. Dashboard Frozen Reveal (Circle) - Unchanged Special Logic */
                        <motion.div
                            key="reveal-layer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/30 backdrop-blur-xl"
                            style={{
                                maskImage,
                                WebkitMaskImage: maskImage
                            }}
                        />
                    ) : (
                        /* Standard Spotlight (Grid, Meal Cards, etc.) */
                        /* Whether "Dark" or "Frost", we use the SAME masking logic now. */
                        <motion.div
                            key="spotlight-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn("absolute inset-0", getBackdropStyle())}
                        >
                            {targetRect ? (
                                /* 
                                   GEOMETRIC 4-DIV STRATEGY (PHYSICAL HOLE):
                                   We render 4 explicit divs (Top, Bottom, Left, Right) around the target.
                                   The center is physically empty (no DOM element), guaranteeing the "hole" is:
                                   1. Visually transparent (no backdrop-filter)
                                   2. Interactive (clicks pass through because pointer-events-none is on container)
                                */
                                <>
                                    {/* Top Block */}
                                    <div
                                        className={cn("absolute left-0 right-0 top-0 pointer-events-auto", getBackdropStyle())}
                                        style={{ height: targetRect.top }}
                                    />
                                    {/* Bottom Block */}
                                    <div
                                        className={cn("absolute left-0 right-0 bottom-0 pointer-events-auto", getBackdropStyle())}
                                        style={{ height: window.innerHeight - targetRect.bottom }}
                                    />
                                    {/* Left Block (Between top/bottom) */}
                                    <div
                                        className={cn("absolute left-0 pointer-events-auto", getBackdropStyle())}
                                        style={{
                                            top: targetRect.top,
                                            height: targetRect.height,
                                            width: targetRect.left
                                        }}
                                    />
                                    {/* Right Block (Between top/bottom) */}
                                    <div
                                        className={cn("absolute right-0 pointer-events-auto", getBackdropStyle())}
                                        style={{
                                            top: targetRect.top,
                                            height: targetRect.height,
                                            left: targetRect.right // explicit left prevents width calc issues
                                        }}
                                    />

                                    {/* Visual Border Sibling (Visible on top of the 'hole') */}
                                    <div
                                        className="absolute border-2 border-primary rounded-lg box-content animate-pulse pointer-events-none"
                                        style={{
                                            top: targetRect.top - 4,
                                            left: targetRect.left - 4,
                                            width: targetRect.width + 8,
                                            height: targetRect.height + 8,
                                            zIndex: 125
                                        }}
                                    />
                                </>
                            ) : (
                                /* No Target - Full Overlay */
                                <div className={cn("absolute inset-0", getBackdropStyle())} />
                            )}

                            {/* Visual Border Sibling (Visible on top of the 'hole') */}
                            {targetRect && (
                                <div
                                    className="absolute border-2 border-primary rounded-lg box-content animate-pulse pointer-events-none"
                                    style={{
                                        top: targetRect.top - 4,
                                        left: targetRect.left - 4,
                                        width: targetRect.width + 8,
                                        height: targetRect.height + 8,
                                        zIndex: 125
                                    }}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 1.5. POINTER LAYER (Z-125) */}
            <div className={`fixed inset-0 z-[125] pointer-events-none overflow-hidden`} >
                {/* Animated Arrow Pointer for Macros/Indicators */}
                <AnimatePresence>
                    {targetRect && (['tour-meal-card-macros', 'tour-meal-card-indicators'].includes(currentStep?.id || '')) && (
                        <motion.div
                            key="arrow-pointer"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{
                                opacity: 1,
                                x: 0,
                                top: targetRect.top + (targetRect.height / 2) - 12, // Center vertically (24px icon / 2)
                                left: targetRect.right + 10
                            }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="absolute text-primary"
                            style={{
                                pointerEvents: 'none',
                                // Initial position fallback if animate doesn't fire immediately
                                top: targetRect.top + (targetRect.height / 2) - 12,
                                left: targetRect.right + 10
                            }}
                        >
                            <ArrowLeft className="w-8 h-8 drop-shadow-lg fill-current stroke-[3]" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 2. CONTENT LAYER (Z-130, Interactive - Must be above Backdrop z-120) */}
            {currentStep.customType === 'avatar-modal' ? (
                // --- SPECIAL AVATAR MODAL ---
                <div className={`fixed inset-0 ${Z_LAYERS.CONTENT} flex items-center justify-center p-4`}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-8 text-center max-w-sm w-full"
                    >
                        {/* Glowing effect container */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/50 blur-[60px] rounded-full animate-pulse" />
                            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl ring-1 ring-white/30">
                                <video
                                    src={currentStep.mediaUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    preload="auto"
                                    className="w-full h-full object-cover object-center scale-150"
                                />
                                {/* Inner shadow overlay */}
                                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10 w-full">
                            <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
                                {currentStep.title}
                            </h2>
                            <motion.button
                                onClick={endWalkthrough}
                                className="w-full h-14 text-lg rounded-full bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 hover:bg-primary/90"
                                whileTap={{ scale: 1.25 }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300, damping: 8 }}
                            >
                                {currentStep.actionLabel || "Take me to my Dashboard"}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            ) : isMobile ? (
                // --- MOBILE: Top/Bottom Sheet ---
                <Sheet open={isWalkthroughActive} modal={false} onOpenChange={(open) => !open && endWalkthrough()}>
                    <SheetContent
                        side={currentStep.position === 'top' ? "top" : "bottom"}
                        className={cn(
                            Z_LAYERS.CONTENT, "pb-8 pt-4",
                            // Hide default Shadcn Close button (it's usually the last child, absolute positioned)
                            "[&>button]:hidden",
                            // Add extra top padding if top-sheet to avoid status bar/notch overlap issues if needed
                            currentStep.position === 'top' && "pt-20"
                        )}
                        onInteractOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={() => endWalkthrough}
                    >
                        {/* Custom Animated Close Button for Mobile (Wrapped in div to evade [&>button]:hidden) */}
                        <div className={cn("absolute right-4 z-50", currentStep.position === 'top' ? "top-20" : "top-4")}>
                            <motion.button
                                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/20 focus:outline-none focus:ring-0"
                                onClick={endWalkthrough}
                                whileTap={{ scale: 1.3 }}
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        <SheetHeader className="mb-0 hidden">
                            <SheetTitle className="text-xl font-bold">
                                {currentStep.title}
                            </SheetTitle>
                        </SheetHeader>

                        {renderContent()}
                    </SheetContent>
                </Sheet>
            ) : (
                // --- DESKTOP: Fixed Card with Dynamic Position ---
                <div className={cn(
                    "fixed", Z_LAYERS.CONTENT, "w-96 max-w-[calc(100vw-4rem)] transition-all duration-500 ease-in-out",
                    // Dynamic Positioning Logic
                    currentStep.position === 'center' && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                    currentStep.position === 'top' && "top-24 right-8", // Below navbar
                    (currentStep.position === 'bottom' || !currentStep.position) && "bottom-8 right-8",
                    currentStep.position === 'left' && "bottom-8 left-8", // Rarely used but good fallback
                    currentStep.position === 'right' && "bottom-8 right-8"
                )}>
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
                            <motion.button
                                className="h-8 w-8 -mr-2 -mt-2 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/20 focus:outline-none focus:ring-0"
                                onClick={endWalkthrough}
                                whileTap={{ scale: 1.3 }}
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>
                        {renderContent()}
                    </motion.div>
                </div>
            )}
        </>
    );
}
