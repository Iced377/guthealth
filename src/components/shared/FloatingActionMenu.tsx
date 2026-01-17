'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, ListChecks, CalendarDays, Utensils, Sparkles, Heart } from 'lucide-react';
// import { Button } from '@/components/ui/button'; // Unused?
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import { cn } from '@/lib/utils';

interface FloatingActionMenuProps {
    onLogFoodAIClick: () => void;
    onScanBarcodeClick: () => void; // Using this for "Photo" based on previous mapping, or should I verify? Previous "Add Entry" had "Scan Barcode" -> Camera.
    onLogSymptomsClick: () => void;
    onAddManualEntryClick: () => void; // Using this for "Recent" or "Manual"? Wait.
    onLogFavoriteClick: () => void;
    // Navbar had: Log Food (AI), Scan Barcode (Camera), Log Symptoms (ListChecks), Manual Entry (Pencil/Plus).
    // User asked for "4 sub-items".
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
    onLogFoodAIClick,
    onScanBarcodeClick,
    onLogSymptomsClick,
    onAddManualEntryClick,
    onLogFavoriteClick,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const menuVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
            transition: { staggerChildren: 0.05, staggerDirection: -1 }
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10, x: 10, scale: 0.8 },
        visible: { opacity: 1, y: 0, x: 0, scale: 1 },
    };

    return (
        <div className="relative z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={menuVariants}
                        className={cn(
                            "absolute bottom-full right-0 mb-4 flex flex-col gap-1 p-2 min-w-[200px]",
                            "bg-secondary/95 backdrop-blur-xl border border-border/40 shadow-2xl rounded-2xl"
                        )}
                    >
                        {/* Sub-Item 4: Manual/Recent */}
                        <LiquidPressable
                            variant="ghost"
                            haptic="light"
                            className="flex items-center justify-between w-full p-2 hover:bg-white/10 rounded-xl transition-colors group text-right"
                            onClick={() => { setIsOpen(false); onAddManualEntryClick(); }}
                            variants={itemVariants}
                        >
                            <span className="text-sm font-medium mr-3">Manual Entry</span>
                            <div className="h-12 w-12 rounded-full bg-background/50 flex items-center justify-center shadow-sm group-hover:bg-background/80 transition-colors">
                                <CalendarDays className="h-6 w-6" />
                            </div>
                        </LiquidPressable>

                        {/* Sub-Item 3: Symptoms */}
                        <LiquidPressable
                            variant="ghost"
                            haptic="light"
                            className="flex items-center justify-between w-full p-2 hover:bg-white/10 rounded-xl transition-colors group text-right"
                            onClick={() => { setIsOpen(false); onLogSymptomsClick(); }}
                            variants={itemVariants}
                        >
                            <span className="text-sm font-medium mr-3">Log Symptoms</span>
                            <div className="h-12 w-12 rounded-full bg-background/50 flex items-center justify-center shadow-sm group-hover:bg-background/80 transition-colors">
                                <ListChecks className="h-6 w-6" />
                            </div>
                        </LiquidPressable>

                        {/* Sub-Item 2.5: Favorites (New) */}
                        <LiquidPressable
                            variant="ghost"
                            haptic="light"
                            className="flex items-center justify-between w-full p-2 hover:bg-white/10 rounded-xl transition-colors group text-right"
                            onClick={() => { setIsOpen(false); onLogFavoriteClick(); }}
                            variants={itemVariants}
                        >
                            <span className="text-sm font-medium mr-3">From Favourites</span>
                            <div className="h-12 w-12 rounded-full bg-background/50 flex items-center justify-center shadow-sm group-hover:bg-background/80 transition-colors">
                                <Heart className="h-6 w-6 fill-red-500 text-red-500" />
                            </div>
                        </LiquidPressable>

                        {/* Sub-Item 2: Photo/Barcode */}
                        <LiquidPressable
                            variant="ghost"
                            haptic="light"
                            className="flex items-center justify-between w-full p-2 hover:bg-white/10 rounded-xl transition-colors group text-right"
                            onClick={() => { setIsOpen(false); onScanBarcodeClick(); }}
                            variants={itemVariants}
                        >
                            <span className="text-sm font-medium mr-3">Scan / Photo</span>
                            <div className="h-12 w-12 rounded-full bg-background/50 flex items-center justify-center shadow-sm group-hover:bg-background/80 transition-colors">
                                <Camera className="h-6 w-6" />
                            </div>
                        </LiquidPressable>

                        {/* Sub-Item 1: AI Log */}
                        <LiquidPressable
                            variant="ghost"
                            haptic="light"
                            className="flex items-center justify-between w-full p-2 hover:bg-white/10 rounded-xl transition-colors group text-right"
                            onClick={() => { setIsOpen(false); onLogFoodAIClick(); }}
                            variants={itemVariants}
                        >
                            <span className="text-sm font-medium mr-3">Auto Food Log</span>
                            <div className="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:bg-indigo-700 transition-colors">
                                <Sparkles className="h-6 w-6" />
                            </div>
                        </LiquidPressable>
                    </motion.div>
                )}
            </AnimatePresence>

            <LiquidPressable
                id="fab-add-button"
                variant="fab"
                haptic="medium"
                className={cn(
                    "h-20 w-20 rounded-full shadow-2xl transition-all duration-200",
                    isOpen ? "bg-red-500 hover:bg-red-600 text-white border-2 border-white" : "bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-white"
                )}
                onClick={toggleMenu}
                animate={{ rotate: isOpen ? 45 : 0 }}
            >
                {/* Icon: Plus sign AND Meal Icon? */}
                <AnimatePresence mode="wait">
                    {!isOpen ? (
                        <motion.div
                            key="closed"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            {/* Combined Icon: Utensils + Plus? Or just Plus? User asked: "The icon should be a plus sign and a meal icon." */}
                            <div className="relative">
                                <Utensils className="h-8 w-8 text-inherit" />
                                <Plus className="h-4 w-4 absolute -top-1 -right-1 bg-white text-primary rounded-full p-[1px]" strokeWidth={4} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                        >
                            <Plus className="h-10 w-10" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </LiquidPressable>
        </div>
    );
};
