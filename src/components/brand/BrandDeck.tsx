'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Copy, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useNavVisibility } from '@/components/navigation/useNavVisibilityController';
import CoverSlide from './slides/CoverSlide';
import DesignPrinciplesSlide from './slides/DesignPrinciplesSlide';
import MissionSlide from './slides/MissionSlide';
import LogoSlide from './slides/LogoSlide';
import ColorSlide from './slides/ColorSlide';
import TypographySlide from './slides/TypographySlide';
import AnimationSlide from './slides/AnimationSlide';
import IconographySlide from './slides/IconographySlide';
import ComponentsSlide from './slides/ComponentsSlide';
import DataVisSlide from './slides/DataVisSlide';

const SLIDES = [
    { id: 'cover', component: CoverSlide, title: 'Introduction' },
    { id: 'principles', component: DesignPrinciplesSlide, title: 'Design Principles' },
    { id: 'datavis', component: DataVisSlide, title: 'Data Experience' },
    { id: 'mission', component: MissionSlide, title: 'Mission & Vision' },
    { id: 'logo', component: LogoSlide, title: 'Logo Guidelines' },
    { id: 'color', component: ColorSlide, title: 'Color Palette' },
    { id: 'typography', component: TypographySlide, title: 'Typography' },
    { id: 'animation', component: AnimationSlide, title: 'Animation & Motion' },
    { id: 'iconography', component: IconographySlide, title: 'Iconography' },
    { id: 'components', component: ComponentsSlide, title: 'UI Components' },
];

export function BrandDeck({ onClose }: { onClose?: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right
    const [showControls, setShowControls] = useState(true);
    const { toast } = useToast();
    const { setNavVisible } = useNavVisibility();

    // Drag Swipe Logic
    const swipeConfidenceThreshold = 500;
    const isDragging = useRef(false);

    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            setDirection(1);
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex(prev => prev - 1);
        }
    };

    const paginate = (newDirection: number) => {
        // "Trends" behavior: Interaction hides the chrome to focus on content.
        // Whether Next or Prev, we hide the controls to be immersive.
        setShowControls(false);
        setNavVisible(false); // Hide the Global Bottom Nav

        if (newDirection > 0) {
            handlePrev();
        } else {
            handleNext();
        }
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') paginate(-1); // ArrowRight means next slide
            if (e.key === 'ArrowLeft') paginate(1); // ArrowLeft means prev slide
            if (e.key === 'Escape' && onClose) onClose();
            // Toggle controls on Space?
            if (e.key === ' ') setShowControls(prev => !prev);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, onClose, showControls]);

    const SlideComponent = SLIDES[currentIndex].component;

    const handleExport = () => {
        const text = `BRAND GUIDELINES EXPORT\nGenerated: ${new Date().toLocaleDateString()}\n... (Full export content)`;
        navigator.clipboard.writeText(text);
        toast({
            title: "Exported to Clipboard",
            description: "Brand guidelines text is ready to paste."
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden h-[100dvh]"
        >
            {/* Top Bar - Floating with Transition */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md z-40 transition-transform duration-300 pt-safe-top",
                showControls ? "translate-y-0" : "-translate-y-full"
            )}>
                <div className="flex items-center gap-4">
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10">
                            <X className="w-5 h-5" />
                        </Button>
                    )}
                    <span className="font-mono text-sm text-white/50 hidden md:inline">SLIDE {currentIndex + 1} / {SLIDES.length}</span>
                    <span className="font-bold text-white tracking-widest uppercase text-sm md:ml-4 md:border-l md:border-white/20 md:pl-4 truncate max-w-[200px] md:max-w-none">
                        {SLIDES[currentIndex].title}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport} className="border-white/20 hover:bg-white/10 text-white/80 gap-2 hidden md:flex">
                        <Copy className="w-4 h-4" /> <span className="hidden lg:inline">Export Text</span>
                    </Button>
                </div>
            </div>

            {/* Main Slide Area */}
            <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-black to-zinc-900">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={{
                            enter: (direction: number) => ({
                                x: direction > 0 ? '100%' : '-100%',
                                opacity: 0,
                                scale: 0.95,
                                zIndex: 0
                            }),
                            center: {
                                zIndex: 1,
                                x: 0,
                                opacity: 1,
                                scale: 1
                            },
                            exit: (direction: number) => ({
                                zIndex: 0,
                                x: direction < 0 ? '100%' : '-100%',
                                opacity: 0,
                                scale: 0.95
                            })
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragStart={() => {
                            isDragging.current = true;
                        }}
                        onDragEnd={(e, { offset, velocity }) => {
                            // Delay resetting isDragging to ensure onTap doesn't fire immediately
                            setTimeout(() => { isDragging.current = false; }, 100);

                            const swipe = swipePower(offset.x, velocity.x);
                            const isDistanceSwipe = Math.abs(offset.x) > 100;

                            if (swipe < -swipeConfidenceThreshold || (isDistanceSwipe && offset.x < 0)) {
                                paginate(-1); // Next (Swipe Left)
                            } else if (swipe > swipeConfidenceThreshold || (isDistanceSwipe && offset.x > 0)) {
                                paginate(1); // Prev (Swipe Right)
                            }
                        }}
                        onTap={(event, info) => {
                            if (isDragging.current) return; // Ignore taps if we just dragged

                            // We check if the target is interactive (like a button) to avoid double-toggles
                            const target = event.target as HTMLElement;
                            if (target.closest('button') || target.closest('a') || target.closest('[data-interactive]')) {
                                return;
                            }
                            const newState = !showControls;
                            setShowControls(newState);
                            setNavVisible(newState); // Sync Global Nav
                        }}
                        className="absolute inset-0 w-full h-full flex items-center justify-center p-0 md:p-16 touch-pan-y"
                    >
                        {/* Slide Container: Added pb-safe and extra padding for obstructing content */}
                        <div className="w-full max-w-7xl h-full md:rounded-3xl bg-transparent md:bg-black/40 md:border md:border-white/5 md:backdrop-blur-xl md:shadow-2xl overflow-y-auto overflow-x-hidden relative pb-safe-bottom scroll-smooth">
                            {/* Glossy overlay (Desktop only) */}
                            <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />

                            {/* Content Wrapper with padding to prevent overlap with nav/home indicator */}
                            <div
                                className="min-h-full pb-32 pt-24 md:pt-0"
                            >
                                {/*
                                    Note: We allow pointer events to pass through so drag works on the parent.
                                */}
                                <SlideComponent />
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls - Floating Side Buttons (Hidden if showControls is false) */}
            <div className={cn(
                "absolute inset-y-0 left-4 flex items-center z-30 transition-opacity duration-300",
                showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => paginate(1)}
                    disabled={currentIndex === 0}
                    className="hidden md:flex h-12 w-12 rounded-full bg-black/50 hover:bg-white/10 border border-white/5 disabled:opacity-30 backdrop-blur-sm"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
            </div>
            <div className={cn(
                "absolute inset-y-0 right-4 flex items-center z-30 transition-opacity duration-300",
                showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => paginate(-1)}
                    disabled={currentIndex === SLIDES.length - 1}
                    className="hidden md:flex h-12 w-12 rounded-full bg-black/50 hover:bg-white/10 border border-white/5 disabled:opacity-30 backdrop-blur-sm"
                >
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </div>

            {/* Mobile Hint (Fade out?) - MOVED UP */}
            {showControls && (
                <div className="md:hidden absolute bottom-24 left-1/2 -translate-x-1/2 text-white/30 text-xs animate-pulse pointer-events-none">
                    Swipe to navigate
                </div>
            )}
        </div>
    );
}
