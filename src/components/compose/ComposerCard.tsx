import { useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowUp } from 'lucide-react';
import { LiquidPressable } from '@/components/ui/LiquidPressable';

import OverrideMacrosPanel from './OverrideMacrosPanel';

interface ComposerCardProps {
    onClose: () => void;
    // New Props for Toggle
    timeMode: 'NOW' | 'EARLIER';
    onTimeModeChange: (mode: 'NOW' | 'EARLIER') => void;
    initialMacrosOverridden?: boolean;
    displayTime?: string;
}

// Lazy load toggle to avoid circular deps if needed, but direct import is fine for small components
import ComposeTimeModeToggle from './ComposeTimeModeToggle';

export default function ComposerCard({ onClose, timeMode, onTimeModeChange, initialMacrosOverridden = false, displayTime }: ComposerCardProps) {
    const { isDarkMode } = useTheme();
    const { register } = useFormContext();
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const { ref: formRef, ...restFormProps } = register('mealDescription');
    const controls = useDragControls();

    // Focus & Visibility Logic
    useEffect(() => {
        // Delay focus slightly to allow entry animation to complete/start
        const timer = setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                // Ensure caret is visible by scrolling it into view
                textareaRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
            }
        }, 400); // 400ms delay as requested (300-450ms)

        return () => clearTimeout(timer);
    }, []);

    return (
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
                height: 'auto',
                maxHeight: '100%',
                backdropFilter: "blur(32px)",
                transformOrigin: "bottom center",
                touchAction: 'pan-y'
            }}
        >
            {/* THIN FILM SHEEN OVERLAY - Subtler */}
            <div
                aria-hidden
                className={cn(
                    "pointer-events-none absolute inset-0",
                    "rounded-[32px] overflow-hidden"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/2 to-transparent" />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
            </div>

            {/* Header REMOVED as per request ("slide right or left to cancel") */}

            {/* ABSOLUTE TOGGLE REMOVED - Moved inside body */}

            {/* 2. Body (Flex Grow + Scroll) with BLENDED FIELD */}
            <div className="relative z-10 flex-1 w-full px-4 pt-6 pb-6 overflow-hidden flex flex-col">

                {/* TOGGLE: Left-aligned, distinctly above input */}
                <div className="flex justify-between items-center mb-4">
                    <ComposeTimeModeToggle
                        mode={timeMode}
                        onChange={onTimeModeChange}
                        displayTime={displayTime}
                    />
                </div>

                <div
                    className={cn(
                        "relative flex-1 w-full rounded-[24px] overflow-hidden transition-colors min-h-[120px]",
                        // Subtlest possible field background
                        isDarkMode ? "bg-white/[0.015]" : "bg-white/5"
                    )}
                >
                    <textarea
                        {...restFormProps}
                        ref={(e) => { formRef(e); textareaRef.current = e; }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                // Robustly find and submit the form by ID
                                const form = document.getElementById('compose-meal-form') as HTMLFormElement;
                                if (form) form.requestSubmit();
                            }
                        }}
                        placeholder="Start with what you ate or swipe to cancel..."
                        className={cn(
                            "relative z-10 w-full h-full bg-transparent resize-none outline-none border-0 shadow-none appearance-none",
                            "px-5 py-2 text-[20px] leading-[1.5]",
                            "placeholder:opacity-40",
                            isDarkMode ? "text-white/90 caret-[#2aac6b] placeholder:text-white/30" : "text-black/90 caret-[#2aac6b] placeholder:text-black/30"
                        )}
                        style={{ backgroundColor: 'transparent', touchAction: 'pan-y' }}
                    />
                    {/* Submit Arrow (Minimalistic) */}
                    <button
                        type="submit"
                        className={cn(
                            "absolute bottom-4 right-4 z-20 p-2 rounded-full transition-all active:scale-95",
                            isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-black"
                        )}
                        onClick={(e) => {
                            e.preventDefault();
                            const form = document.getElementById('compose-meal-form') as HTMLFormElement;
                            if (form) form.requestSubmit();
                        }}
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                </div>

                {/* 3. Macros Access */}
                <div className="mt-4">
                    <OverrideMacrosPanel initialIsOpen={initialMacrosOverridden} />
                </div>
            </div>
        </motion.div>
    );
}
