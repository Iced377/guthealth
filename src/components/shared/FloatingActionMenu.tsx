import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, ListChecks, CalendarDays, Utensils, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionMenuProps {
    onLogFoodAIClick: () => void;
    onScanBarcodeClick: () => void; // Using this for "Photo" based on previous mapping, or should I verify? Previous "Add Entry" had "Scan Barcode" -> Camera.
    onLogSymptomsClick: () => void;
    onAddManualEntryClick: () => void; // Using this for "Recent" or "Manual"? Wait.
    // Navbar had: Log Food (AI), Scan Barcode (Camera), Log Symptoms (ListChecks), Manual Entry (Pencil/Plus).
    // User asked for "4 sub-items".
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
    onLogFoodAIClick,
    onScanBarcodeClick,
    onLogSymptomsClick,
    onAddManualEntryClick,
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
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
            {/* Container pointer-events-none allows clicking through empty space. Buttons enable pointer-events-auto */}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={menuVariants}
                        className="flex flex-col items-end gap-3 pointer-events-auto mb-2 mr-1"
                    >
                        {/* Sub-Item 4: Manual/Recent */}
                        <motion.div variants={itemVariants} className="flex items-center gap-2">
                            <span className="text-sm font-medium bg-background/90 text-foreground px-2 py-1 rounded shadow-sm backdrop-blur-sm">Manual Entry</span>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-10 w-10 rounded-full shadow-lg"
                                onClick={() => { setIsOpen(false); onAddManualEntryClick(); }}
                            >
                                <CalendarDays className="h-5 w-5" />
                            </Button>
                        </motion.div>

                        {/* Sub-Item 3: Symptoms */}
                        <motion.div variants={itemVariants} className="flex items-center gap-2">
                            <span className="text-sm font-medium bg-background/90 text-foreground px-2 py-1 rounded shadow-sm backdrop-blur-sm">Log Symptoms</span>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-10 w-10 rounded-full shadow-lg"
                                onClick={() => { setIsOpen(false); onLogSymptomsClick(); }}
                            >
                                <ListChecks className="h-5 w-5" />
                            </Button>
                        </motion.div>

                        {/* Sub-Item 2: Photo/Barcode */}
                        <motion.div variants={itemVariants} className="flex items-center gap-2">
                            <span className="text-sm font-medium bg-background/90 text-foreground px-2 py-1 rounded shadow-sm backdrop-blur-sm">Scan / Photo</span>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-10 w-10 rounded-full shadow-lg"
                                onClick={() => { setIsOpen(false); onScanBarcodeClick(); }}
                            >
                                <Camera className="h-5 w-5" />
                            </Button>
                        </motion.div>

                        {/* Sub-Item 1: AI Log (Primary Action) */}
                        <motion.div variants={itemVariants} className="flex items-center gap-2">
                            <span className="text-sm font-medium bg-background/90 text-foreground px-2 py-1 rounded shadow-sm backdrop-blur-sm">AI Food Log</span>
                            <Button
                                size="icon"
                                className="h-10 w-10 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() => { setIsOpen(false); onLogFoodAIClick(); }}
                            >
                                <Sparkles className="h-5 w-5" />
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                className={cn(
                    "h-14 w-14 rounded-full shadow-2xl flex items-center justify-center pointer-events-auto relative overflow-hidden transition-all duration-200",
                    isOpen ? "bg-red-500 hover:bg-red-600 text-white border-2 border-white" : "bg-white text-primary hover:bg-white/90 border-2 border-primary"
                )}
                onClick={toggleMenu}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
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
                                <Utensils className="h-6 w-6" />
                                <Plus className="h-3 w-3 absolute -top-1 -right-1 bg-white text-primary rounded-full p-[1px]" strokeWidth={4} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                        >
                            <Plus className="h-8 w-8" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
};
