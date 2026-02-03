import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface OverrideMacrosPanelProps {
    initialIsOpen?: boolean;
}

export default function OverrideMacrosPanel({ initialIsOpen = false }: OverrideMacrosPanelProps) {
    const { isDarkMode } = useTheme();
    const { register, watch, setValue } = useFormContext();

    // We can use a form field for the toggle state or local state. 
    // Since it affects submission logic (override vs auto), it's good to track.
    // Let's assume the parent form handles the 'override' boolean logic via presence of values or an explicit field.
    // In SimplifiedAddFoodDialog, `userWantsToOverrideMacros` was separate state.
    // Let's make it a form field `isMacroOverrideEnabled` or just use local state and implied values.
    // User requested: "When expanded, show macro inputs... Keep it hidden unless toggled on."

    // We'll use a local state for visual expansion, but sync it with a hidden form field 
    // or just let the presence of values dictate? 
    // Safest matches old logic: explicit boolean.
    // Let's assume we register specific fields.

    const [isOpen, setIsOpen] = useState(initialIsOpen);

    // Colors
    const inputClass = cn(
        "w-full h-11 px-2 rounded-xl text-base text-center transition-all outline-none border",
        isDarkMode
            ? "bg-white/5 border-white/10 focus:border-white/20 placeholder:text-white/20"
            : "bg-white/50 border-black/5 focus:border-black/10 placeholder:text-black/30"
    );

    const labelClass = "text-[10px] font-medium opacity-50 uppercase tracking-wider mb-1.5 block ml-1";

    return (
        <div className="w-full px-6 py-2 overflow-hidden">
            {/* Toggle Row */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 text-xs font-medium transition-colors mb-2",
                    isOpen ? (isDarkMode ? "text-white" : "text-black") : "opacity-50 hover:opacity-100"
                )}
            >
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
                <span>Override Macros</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }} // ios curve
                        className="overflow-hidden"
                    >
                        <div className={cn(
                            "grid grid-cols-4 gap-3 p-4 rounded-2xl border mb-2",
                            isDarkMode ? "bg-white/5 border-white/5" : "bg-white/40 border-black/5"
                        )}>
                            {/* Calories */}
                            <div>
                                <label className={labelClass}>Cals</label>
                                <input
                                    type="number"
                                    step="any"
                                    {...register('calories')}
                                    placeholder="0"
                                    className={inputClass}
                                />
                            </div>

                            {/* Protein */}
                            <div>
                                <label className={labelClass}>Prot</label>
                                <input
                                    type="number"
                                    step="any"
                                    {...register('protein')}
                                    placeholder="0g"
                                    className={inputClass}
                                />
                            </div>

                            {/* Carbs */}
                            <div>
                                <label className={labelClass}>Carb</label>
                                <input
                                    type="number"
                                    step="any"
                                    {...register('carbs')}
                                    placeholder="0g"
                                    className={inputClass}
                                />
                            </div>

                            {/* Fat */}
                            <div>
                                <label className={labelClass}>Fat</label>
                                <input
                                    type="number"
                                    step="any"
                                    {...register('fat')}
                                    placeholder="0g"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Helper Text */}
                        <div className="flex items-start gap-2 px-1 mb-4">
                            <Info className="w-3 h-3 mt-0.5 opacity-40 shrink-0" />
                            <p className="text-[10px] opacity-40 leading-tight">
                                Values entered here will be used instead of the AI estimate.
                                Leave strictly empty to use AI.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
