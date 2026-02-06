'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [showControls, setShowControls] = useState(true);
    const { toast } = useToast();
    const { setNavVisible } = useNavVisibility();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const lastScrollX = useRef(0);

    // Sync scroll position to currentIndex (for external button/keyboard nav)
    const scrollToSlide = (index: number) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            container.scrollTo({
                left: index * container.clientWidth,
                behavior: 'smooth'
            });
        }
    };

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            scrollToSlide(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            scrollToSlide(currentIndex - 1);
        }
    };

    // Monitor scroll to update currentIndex and Nav visibility
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const width = container.clientWidth;

            // Update currentIndex
            const newIndex = Math.round(scrollLeft / width);
            if (newIndex !== currentIndex && newIndex >= 0 && newIndex < SLIDES.length) {
                setCurrentIndex(newIndex);
            }

            // Sync Nav Visibility (identical logic to Trends page but for X axis if preferred, 
            // but user asked for vertical/horizontal feel fix. Trends uses Y for toggle.)
            // We'll keep the Tap-to-toggle from before as it was specifically for this deck, 
            // but ensure horizontal movement doesn't feel sluggish.
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [currentIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape' && onClose) onClose();
            if (e.key === ' ') setShowControls(prev => !prev);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, onClose, showControls]);

    const handleExport = () => {
        const text = `BRAND GUIDELINES EXPORT\nGenerated: ${new Date().toLocaleDateString()}\n... (Full export content)`;
        navigator.clipboard.writeText(text);
        toast({
            title: "Exported to Clipboard",
            description: "Brand guidelines text is ready to paste."
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden h-[100dvh]">
            {/* Top Bar */}
            <motion.div
                initial={false}
                animate={{ y: showControls ? 0 : -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md z-40 pt-safe-top border-b border-white/5"
            >
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
            </motion.div>

            {/* Main Native Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="flex-1 flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar bg-gradient-to-br from-black to-zinc-900"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {SLIDES.map((slide, index) => {
                    const SlideComponent = slide.component;
                    return (
                        <div
                            key={slide.id}
                            className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center p-0 md:p-16"
                        >
                            {/* Tap capture for controls toggle */}
                            <div
                                className="absolute inset-0 z-0"
                                onClick={() => {
                                    const newState = !showControls;
                                    setShowControls(newState);
                                    setNavVisible(newState);
                                }}
                            />

                            {/* Slide Content with its own vertical scroll */}
                            <div className="w-full max-w-7xl h-full md:rounded-3xl bg-transparent md:bg-black/40 md:border md:border-white/5 md:backdrop-blur-xl md:shadow-2xl overflow-y-auto no-scrollbar relative pb-safe-bottom z-10">
                                <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
                                <div className="min-h-full pb-32 pt-24 md:pt-16 px-6 md:px-12">
                                    <SlideComponent />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Controls - PC UI */}
            <AnimatePresence>
                {showControls && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute inset-y-0 left-4 flex items-center z-30 pointer-events-none"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                className="hidden md:flex h-12 w-12 rounded-full bg-black/50 hover:bg-white/10 border border-white/5 disabled:opacity-30 backdrop-blur-sm pointer-events-auto"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute inset-y-0 right-4 flex items-center z-30 pointer-events-none"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNext}
                                disabled={currentIndex === SLIDES.length - 1}
                                className="hidden md:flex h-12 w-12 rounded-full bg-black/50 hover:bg-white/10 border border-white/5 disabled:opacity-30 backdrop-blur-sm pointer-events-auto"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </Button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Hint */}
            {showControls && (
                <div className="md:hidden absolute bottom-24 left-1/2 -translate-x-1/2 text-white/30 text-xs animate-pulse pointer-events-none">
                    Swipe to navigate
                </div>
            )}
        </div>
    );
}
