'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ComposerCard from './ComposerCard';
import ComposerActionBar from './ComposerActionBar';
import { useToast } from '@/hooks/use-toast';
import ComposeDateTimeSheet from './ComposeDateTimeSheet';
import { format, isToday } from 'date-fns';

// --- Types & Schema (Migrated from SimplifiedAddFoodDialog) ---

const simplifiedFoodLogSchema = z.object({
    name: z.string().optional(),
    mealDescription: z.string().min(2, { message: 'Meal description too short.' }),
    // Using strings for inputs to handle raw typing safely
    calories: z.string().optional(),
    protein: z.string().optional(),
    carbs: z.string().optional(),
    fat: z.string().optional(),
    // New internal fields for chips
    date: z.date().optional(),
    time: z.string().optional(),
});

type FormValues = z.infer<typeof simplifiedFoodLogSchema>;

export interface SimplifiedFoodLogFormValues {
    name?: string;
    mealDescription: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

interface ComposeOverlayProps {
    isOpen: boolean;
    onClose: () => void; // mapped to onOpenChange(false) parent logic usually
    onSubmitLog: (data: SimplifiedFoodLogFormValues, userDidOverrideMacros: boolean, newDate?: Date) => Promise<void>;
    isGuestView?: boolean;
    isEditing?: boolean;
    initialValues?: Partial<SimplifiedFoodLogFormValues>;
    initialMacrosOverridden?: boolean;
    initialTimestamp?: Date;
    onUpdateTime?: (newDate: Date) => Promise<void>;
}

const formatTimeToHHMM = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const combineDateAndTime = (date: Date, time: string): Date => {
    const [hours, minutesValue] = time.split(':');
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours, 10), parseInt(minutesValue, 10), 0, 0);
    return newDate;
};

import { useMobileViewport } from '@/hooks/useMobileViewport';

// ... (imports remain)

export default function ComposeOverlay({
    isOpen,
    onClose,
    onSubmitLog,
    isGuestView = false,
    isEditing = false,
    initialValues,
    initialMacrosOverridden = false,
    initialTimestamp,
    onUpdateTime,
}: ComposeOverlayProps) {
    const [mounted, setMounted] = useState(false);
    const { isDarkMode } = useTheme();
    const { toast } = useToast();
    const { keyboardHeight } = useMobileViewport();

    // Time Mode State
    const [timeMode, setTimeMode] = useState<'NOW' | 'EARLIER'>('NOW');
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Date/Time State for "Earlier"
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string>('');

    // Pre-fill "Earlier" if editing an existing timestamp
    useEffect(() => {
        if (isOpen && initialTimestamp) { // Editing logic typically implies initialTimestamp is historical or explicit
            // Simple check if it's "now" vs historical could go here, but spec says:
            // "If isEditing and initialTimestamp exists, default mode = EARLIER"
            if (isEditing) {
                setTimeMode('EARLIER');
                setSelectedDate(initialTimestamp);
                setSelectedTime(formatTimeToHHMM(initialTimestamp));
            }
        }
    }, [isOpen, isEditing, initialTimestamp]);

    // Handle Time Mode Toggle
    const handleTimeModeChange = (mode: 'NOW' | 'EARLIER') => {
        if (mode === 'EARLIER') {
            setTimeMode('EARLIER');
            // If first time opening, init defaults
            if (!selectedTime) {
                // Round to nearest 5 mins
                const now = new Date();
                const coeff = 1000 * 60 * 5;
                const rounded = new Date(Math.round(now.getTime() / coeff) * coeff);
                setSelectedDate(now);
                setSelectedTime(formatTimeToHHMM(rounded));
            }
            setIsSheetOpen(true);
        } else {
            // Revert to NOW
            setTimeMode('NOW');
            setIsSheetOpen(false);
        }
    };

    // ... form setup ...
    const methods = useForm<FormValues>({
        resolver: zodResolver(simplifiedFoodLogSchema),
        defaultValues: {
            mealDescription: '',
            name: '',
            date: new Date(),
            time: '',
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
        }
    });

    const { reset, handleSubmit } = methods;

    // ... Effects ...

    // ... Effects ...

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Reset form when opening with new initialValues
    useEffect(() => {
        if (isOpen) {
            if (initialValues) {
                reset({
                    name: initialValues.name || '',
                    mealDescription: initialValues.mealDescription || '',
                    calories: initialValues.calories?.toString() ?? '',
                    protein: initialValues.protein?.toString() ?? '',
                    carbs: initialValues.carbs?.toString() ?? '',
                    fat: initialValues.fat?.toString() ?? '',
                    date: initialTimestamp || new Date(),
                    time: initialTimestamp ? formatTimeToHHMM(initialTimestamp) : '',
                });
            } else {
                // Reset to empty for new entry
                reset({
                    mealDescription: '',
                    name: '',
                    date: new Date(),
                    time: '',
                    calories: '',
                    protein: '',
                    carbs: '',
                    fat: '',
                });
            }
        }
    }, [isOpen, initialValues, initialTimestamp, reset]);

    // Step 2: iOS Scroll Lock
    useEffect(() => {
        if (!isOpen) return;

        const scrollY = window.scrollY;
        const body = document.body;

        // Lock body position
        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.width = '100%';
        body.style.overflow = 'hidden';

        return () => {
            const top = body.style.top;
            body.style.position = '';
            body.style.top = '';
            body.style.left = '';
            body.style.right = '';
            body.style.width = '';
            body.style.overflow = '';

            const y = top ? parseInt(top.replace('-', '').replace('px', ''), 10) : 0;
            window.scrollTo(0, y);
        };
    }, [isOpen]);

    const onFormSubmit = async (data: FormValues) => {
        try {
            let finalTimestamp: Date | undefined = undefined;

            if (timeMode === 'EARLIER') {
                // Use selected retro date/time
                // Fallback to now if something is missing, but UI enforces it.
                if (selectedDate && selectedTime) {
                    finalTimestamp = combineDateAndTime(selectedDate, selectedTime);
                } else {
                    finalTimestamp = new Date();
                }
            } else {
                // NOW mode
                finalTimestamp = new Date();
            }

            const parseNumber = (val: string | undefined) => {
                if (!val || val.trim() === '') return undefined;
                const num = parseFloat(val);
                return isNaN(num) ? undefined : num;
            };

            const submittedData: SimplifiedFoodLogFormValues = {
                name: data.name,
                mealDescription: data.mealDescription,
                calories: parseNumber(data.calories),
                protein: parseNumber(data.protein),
                carbs: parseNumber(data.carbs),
                fat: parseNumber(data.fat),
            };

            const userEnteredMacros = !!(submittedData.calories || submittedData.protein || submittedData.carbs || submittedData.fat);
            const shouldOverride = userEnteredMacros || initialMacrosOverridden;

            await onSubmitLog(submittedData, shouldOverride, finalTimestamp);
            if (!isEditing) reset();
            onClose();

        } catch (error: any) {
            console.error("Error processing meal:", error);
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                // Step 1: Root with Touch Blocking
                <div
                    className="fixed inset-0 z-[9999]"
                    style={{ touchAction: 'none' }}
                    onWheel={(e) => e.preventDefault()}
                    onTouchMove={(e) => e.preventDefault()}
                >
                    {/* Backdrop: MUST capture clicks/touches */}
                    <motion.button
                        type="button"
                        aria-label="Close overlay"
                        className={cn(
                            "absolute inset-0 w-full h-full cursor-default",
                            "pointer-events-auto",
                            isDarkMode ? "bg-black/60" : "bg-black/20"
                        )}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                    />

                    {/* Glass veil: visual only */}
                    <div
                        className="absolute inset-0 pointer-events-none backdrop-blur-[22px]"
                        style={{
                            background: isDarkMode
                                ? "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.06), rgba(0,0,0,0.45) 70%)"
                                : "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.55), rgba(255,255,255,0.20) 70%)"
                        }}
                    />

                    {/* Content: MUST be pointer-events-auto to capture interactions inside, but 'none' on wrapper to let clicks pass to backdrop? 
                        Actually, if we want clicks OUTSIDE the card to hit the backdrop, this wrapper should be none, 
                        and the card itself should be auto. ComposerCard ALREADY has pointer-events-auto. 
                    */}
                    <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                        <FormProvider {...methods}>
                            <form
                                id="compose-meal-form"
                                onSubmit={handleSubmit(onFormSubmit, (errors) => {
                                    const firstError = Object.values(errors)[0];
                                    if (firstError) {
                                        toast({
                                            title: "Error",
                                            description: firstError.message?.toString() || "Please check your entry.",
                                            variant: "destructive"
                                        });
                                    }
                                })}
                                className="w-full flex items-end justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
                            >
                                {/* Step 3: Keyboard Lift */}
                                <div
                                    className="w-full flex items-end justify-center"
                                    style={{
                                        transform: `translateY(-${keyboardHeight}px)`,
                                        transition: 'transform 0.12s ease-out',
                                        willChange: 'transform',
                                    }}
                                >
                                    <ComposerCard
                                        onClose={onClose}
                                        timeMode={timeMode}
                                        onTimeModeChange={handleTimeModeChange}
                                        initialMacrosOverridden={initialMacrosOverridden}
                                        displayTime={
                                            timeMode === 'EARLIER' && selectedDate && selectedTime
                                                ? (isToday(selectedDate)
                                                    ? format(combineDateAndTime(selectedDate, selectedTime), 'p')
                                                    : `${format(selectedDate, 'MMM d')}, ${format(combineDateAndTime(selectedDate, selectedTime), 'p')}`)
                                                : undefined
                                        }
                                    />
                                </div>
                            </form>
                        </FormProvider>
                    </div>

                    {/* Date/Time Sheet Portal Layer */}
                    <ComposeDateTimeSheet
                        isOpen={isSheetOpen}
                        keyboardHeight={keyboardHeight}
                        onClose={() => {
                            setIsSheetOpen(false);
                            // If they cancel out of the sheet without saving, keep EARLIER mode?
                            // Spec says: "Cancel closes sheet WITHOUT changing previously selected date/time."
                            // Mode stays EARLIER as per "Cancel closes sheet... mode remains Earlier" verification.
                        }}
                        initialDate={selectedDate}
                        initialTime={selectedTime}
                        onSave={(date, time) => {
                            setSelectedDate(date);
                            setSelectedTime(time);
                            // Immediate update if editing
                            if (isEditing && onUpdateTime) {
                                const newTimestamp = combineDateAndTime(date, time);
                                onUpdateTime(newTimestamp);
                            }
                        }}
                    />
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
