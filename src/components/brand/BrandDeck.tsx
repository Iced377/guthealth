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

const BRAND_EXPORT = {
    title: 'GutHealth Brand Guidelines',
    version: 'v5.0.0 • 2026',
    mission: 'To empower millions to master their gut health through AI-driven insights and radical transparency.',
    vision: 'A world where nutrition is personalized, health is deciphered, and everyone has a “gut check” on their well-being.',
    principles: [
        'Glassmorphism 2.0: Depth through layering with “Liquid Glass” materials.',
        'Radical Speed: Interactions feel instant; no long loading states.',
        'Tactile Feedback: Press-in/press-out behavior, no hover dependency.',
        'Premium Aesthetics: Subtle glows and noise textures.',
        'Frameless Layout: In dark mode, avoid borders; use surfaces for separation.',
        'Singular Focus: One goal, one gesture. Avoid competing navigation.',
    ],
    logo: {
        clearSpace: 'Maintain 1x padding around the mark, where x is the icon height.',
        doNot: [
            'Do not rotate the logo.',
            'Do not change the colors (use primary green or white).',
            'Do not add drop shadows directly to the vector.',
        ],
        variations: ['Primary full color', 'Black on white', 'White on black'],
    },
    colors: [
        { name: 'Primary Green', var: '--primary', hex: '#27AE60' },
        { name: 'Secondary Green', var: '--secondary', hex: '#D9F0E5' },
        { name: 'Background', var: '--background', hex: '#F7F7F7' },
        { name: 'Destructive', var: '--destructive', hex: '#EB5757' },
    ],
    charts: [
        { name: 'Chart 1', var: '--chart-1' },
        { name: 'Chart 2', var: '--chart-2' },
        { name: 'Chart 3', var: '--chart-3' },
        { name: 'Chart 4', var: '--chart-4' },
        { name: 'Chart 5', var: '--chart-5' },
    ],
    typography: {
        family: 'Inter',
        guidance: 'Keep line lengths between 50–75 characters for readability.',
        scale: [
            'H1: text-5xl / font-bold',
            'H2: text-4xl / font-bold',
            'H3: text-3xl / font-semibold',
            'H4: text-2xl / font-semibold',
            'Body: text-base / font-normal',
            'Small: text-sm / font-medium',
            'Tiny: text-xs / font-medium',
        ],
        mono: 'Use monospace for UI/code accents.',
    },
    motion: [
        'Pulse Glow: Attention-grabbing elements (AI insights).',
        'Staggered Fade In: Lists and cards to reduce cognitive load.',
        'Accordion: Smooth height transitions.',
    ],
    iconography: {
        library: 'Lucide React',
        stroke: 'Consistent stroke weight (2px), rounded.',
        active: 'Primary color; subtle fill or glow allowed.',
        inactive: 'Neutral (white/50 or white/70).',
    },
    components: [
        'Buttons: Primary, Secondary, Outline, Ghost, Destructive.',
        'Meal Card: Liquid crystal surface, semantic color coding, faint watermark, smart badges.',
        'Macro Header: Mercury liquid bar, blurred depth icon, hard-light mix, strict palette per macro.',
        'Interaction: Press scale 0.85, low damping (10–15), haptic tick on mobile.',
    ],
    dataExperience: [
        'Full-screen immersion for charts (100dvh).',
        'Organic fluidity: spring physics, avoid rigid tweens.',
        'Minimum viable data: hide grid/axes unless scrubbing; show only the key metric.',
    ],
};

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

    const handleExport = async () => {
        const generated = new Date().toLocaleDateString();
        const text = [
            `${BRAND_EXPORT.title}`,
            `Version: ${BRAND_EXPORT.version}`,
            `Generated: ${generated}`,
            '',
            'Mission',
            `- ${BRAND_EXPORT.mission}`,
            '',
            'Vision',
            `- ${BRAND_EXPORT.vision}`,
            '',
            'Design Principles',
            ...BRAND_EXPORT.principles.map(p => `- ${p}`),
            '',
            'Logo Guidelines',
            `- Clear space: ${BRAND_EXPORT.logo.clearSpace}`,
            '- Do not:',
            ...BRAND_EXPORT.logo.doNot.map(d => `  - ${d}`),
            `- Variations: ${BRAND_EXPORT.logo.variations.join(', ')}`,
            '',
            'Color Palette',
            ...BRAND_EXPORT.colors.map(c => `- ${c.name} (${c.var}): ${c.hex}`),
            '',
            'Data Visualization Colors',
            ...BRAND_EXPORT.charts.map(c => `- ${c.name} (${c.var})`),
            '',
            'Typography',
            `- Family: ${BRAND_EXPORT.typography.family}`,
            `- Guidance: ${BRAND_EXPORT.typography.guidance}`,
            `- Scale:`,
            ...BRAND_EXPORT.typography.scale.map(s => `  - ${s}`),
            `- Mono: ${BRAND_EXPORT.typography.mono}`,
            '',
            'Motion & Animation',
            ...BRAND_EXPORT.motion.map(m => `- ${m}`),
            '',
            'Iconography',
            `- Library: ${BRAND_EXPORT.iconography.library}`,
            `- Stroke: ${BRAND_EXPORT.iconography.stroke}`,
            `- Active: ${BRAND_EXPORT.iconography.active}`,
            `- Inactive: ${BRAND_EXPORT.iconography.inactive}`,
            '',
            'UI Components',
            ...BRAND_EXPORT.components.map(c => `- ${c}`),
            '',
            'Data Experience',
            ...BRAND_EXPORT.dataExperience.map(d => `- ${d}`),
            '',
        ].join('\n');
        const copyWithFallback = async () => {
            // Prefer modern clipboard API when available and secure
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            }

            // Fallback for non-secure contexts / older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '-9999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        };

        try {
            const copied = await copyWithFallback();
            if (!copied) throw new Error('copy failed');
            toast({
                title: "Exported to Clipboard",
                description: "Brand guidelines text is ready to paste."
            });
        } catch (err) {
            // As a last resort, trigger a text download so export isn't blocked
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'brand-guidelines.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({
                title: "Export Downloaded",
                description: "Clipboard access was blocked, so a text file was downloaded instead."
            });
        }
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
                    <Button variant="outline" size="sm" onClick={handleExport} className="border-white/20 hover:bg-white/10 text-white/80 gap-2 flex">
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
