'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useInsightsMotionController } from './useInsightsMotionController';
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import { FrostBackplate } from './LiquidPrimitive';
import { X, Send, Loader2, Copy, Check } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens, LiquidMode } from '@/lib/liquid-tokens';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useActionContext } from '@/contexts/ActionContext';
import { format, isSameDay } from 'date-fns';
import { getPersonalizedDietitianInsight, PersonalizedDietitianOutput } from '@/ai/flows/personalized-dietitian-flow';
import { calculateTrendsAnalysis } from '@/utils/insights';
import { Button } from '@/components/ui/button';
import { HapticsService } from '@/lib/haptics';

// Helper to determine time of day
const getTimeSegment = (hour: number) => {
    if (hour < 5) return 'Late Night';
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 22) return 'Evening';
    return 'Late Night';
};

export function CoachChatCapsule() {
    const { openCoach, activeSheet, activeInsightId } = useInsightsMotionController();
    const { isDarkMode } = useTheme();
    const mode: LiquidMode = isDarkMode ? 'dark' : 'light';
    const tokens = getLiquidTokens(mode);

    const isTransitioning = useInsightsMotionController().interactionMode === 'TRANSITION';
    const isVisible = !activeSheet && !isTransitioning;

    const promptText = activeInsightId
        ? "Tell me more about this"
        : "How am I doing today?";

    // Select avatar based on mode. User requested: coach-black for dark mode, coach-white for light mode.
    const avatarSrc = isDarkMode ? '/coach-black.png' : '/coach-white.png';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="coach-capsule"
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 200, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed left-0 right-0 flex justify-center z-[80] pointer-events-none" // Increased z-index to 80 to be above most layers but below Sheet (z-70? Sheet is usually higher)
                    style={{
                        bottom: 'calc(env(safe-area-inset-bottom) + 24px)'
                    }}
                >
                    <div className="pointer-events-auto relative">
                        {/* Shimmer Effect */}
                        <motion.div
                            className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                            initial={{ x: '-150%' }}
                            animate={{ x: '150%' }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                repeatDelay: 10,
                                ease: "linear"
                            }}
                        />

                        <LiquidPressable
                            variant="pill"
                            size="lg"
                            onClick={() => openCoach({ intent: activeInsightId ? 'contextual' : 'daily_checkin' })}
                            className={cn(
                                "pl-2 pr-6 py-2 h-14 shadow-2xl flex items-center gap-3 rounded-full overflow-hidden transition-colors duration-300",
                            )}
                        >
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center relative z-10 shrink-0 overflow-hidden",
                            )}>
                                <Image
                                    src={avatarSrc}
                                    alt="Coach Avatar"
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="40px"
                                />
                            </div>
                            <div className="flex flex-col items-start relative z-10 min-w-[140px]">
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest mb-0.5",
                                    mode === 'dark' ? "text-white/50" : "text-black/40"
                                )}>Coach</span>
                                <motion.span
                                    key={promptText}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "text-sm font-semibold leading-none whitespace-nowrap",
                                        tokens.text.primary
                                    )}
                                >
                                    {promptText}
                                </motion.span>
                            </div>
                        </LiquidPressable>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function CoachSessionSheet() {
    const { activeSheet, closeCoach } = useInsightsMotionController();
    const { isDarkMode } = useTheme();
    const mode: LiquidMode = isDarkMode ? 'dark' : 'light';
    const tokens = getLiquidTokens(mode);
    const isOpen = activeSheet === 'coachSession';
    const { timelineEntries, userProfile } = useActionContext();
    const bottomRef = useRef<HTMLDivElement>(null);

    // Select avatar based on mode
    const avatarSrc = isDarkMode ? '/coach-black.png' : '/coach-white.png';

    // AI State
    const [aiOutput, setAiOutput] = useState<PersonalizedDietitianOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Copy State
    const [isCopied, setIsCopied] = useState(false);



    // ... inside component ...

    const handleCopy = async () => {
        if (!aiOutput?.aiResponse) return;

        try {
            await Clipboard.write({
                string: aiOutput.aiResponse
            });
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    // 1. Prepare Data for Advanced AI
    const preparedInput = useMemo(() => {
        if (!isOpen) return null;

        const now = new Date();
        const todayEntries = timelineEntries.filter(e => isSameDay(new Date(e.timestamp), now));

        // Format Food Log for Schema
        const foodLog = timelineEntries.slice(0, 50).filter(e => e.entryType === 'food' || e.entryType === 'manual_macro').map(e => {
            const item = e as any;
            return {
                name: item.name,
                ingredients: item.ingredients || '',
                portionSize: item.portionSize || '1 serving',
                portionUnit: item.portionUnit || '',
                timestamp: format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm'),
                calories: item.calories || 0,
                protein: item.protein || 0,
                carbs: item.carbs || 0,
                fat: item.fat || 0,
            };
        });

        // Format Symptoms
        const symptomLog = timelineEntries.slice(0, 20).filter(e => e.entryType === 'symptom').map(e => {
            const item = e as any;
            return {
                symptoms: item.symptoms?.map((s: any) => ({ name: s.name })) || [],
                severity: item.severity,
                timestamp: format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm'),
            };
        });

        // Calculate Daily Totals
        const dailyTotals = todayEntries.reduce((acc, curr) => {
            if (curr.entryType === 'food' || curr.entryType === 'manual_macro') {
                const item = curr as any;
                acc.calories += item.calories || 0;
                acc.protein += item.protein || 0;
                acc.carbs += item.carbs || 0;
                acc.fat += item.fat || 0;
            }
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

        // Calculate Time Since Last Meal
        // Find last REAL meal > 5 calories (ignore water/supplements)
        const lastMeal = timelineEntries.find(e => {
            if (e.entryType === 'food') return (e.calories || 0) > 5;
            if (e.entryType === 'manual_macro') return ((e as any).calories || 0) > 5;
            return false;
        });

        const hoursSinceLastMeal = lastMeal
            ? Math.abs(now.getTime() - new Date(lastMeal.timestamp).getTime()) / 36e5
            : 0;

        // Fasting Projections
        const lastMealTime = lastMeal ? new Date(lastMeal.timestamp) : now;
        const target16h = new Date(lastMealTime.getTime() + 16 * 36e5);

        // Calculate Trends
        const trends = calculateTrendsAnalysis(timelineEntries, userProfile);

        return {
            userQuestion: "How am I doing today? Give me a full update.",
            foodLog,
            symptomLog,
            userProfile: {
                ...userProfile,
                dietaryPreferences: userProfile?.profile?.dietaryPreferences || [],
                tdee: userProfile?.profile?.tdee,
                goal: userProfile?.profile?.goal,
                currentWeight: userProfile?.profile?.weight
            },
            currentLocalTime: format(now, 'h:mm a'),
            dailyTotals,
            hoursSinceLastMeal: parseFloat(hoursSinceLastMeal.toFixed(1)),
            projectedFastingEndTimes: {
                target16h: format(target16h, 'h:mm a'),
                targetMax: format(new Date(lastMealTime.getTime() + (trends.maxFastingWindowHours || 18) * 36e5), 'h:mm a')
            },
            timeOfDaySegment: getTimeSegment(now.getHours()),
            trendsAnalysis: trends
        };

    }, [isOpen, timelineEntries, userProfile]);

    // Fetch Insights
    useEffect(() => {
        if (isOpen && !aiOutput && !isLoading && preparedInput) {
            setIsLoading(true);
            getPersonalizedDietitianInsight(preparedInput as any)
                .then(result => {
                    setAiOutput(result);
                })
                .catch(err => {
                    console.error("AI Insight Error:", err);
                    setAiOutput({ aiResponse: "I'm having trouble connecting to my brain right now." });
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, aiOutput, isLoading, preparedInput]);

    // Render Content
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-10 gap-4 opacity-50">
                    <Loader2 className={cn("h-8 w-8 animate-spin", tokens.text.primary)} />
                    <p className={cn("text-xs uppercase tracking-widest", tokens.text.tertiary)}>Analyzing Energy Flux & Trends...</p>
                </div>
            );
        }

        if (aiOutput) {
            return (
                <div className="space-y-4">
                    <div className={cn("space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 text-sm leading-relaxed whitespace-pre-wrap", tokens.text.primary)}>
                        {aiOutput.aiResponse}

                        <div className={cn("mt-4 pt-3 border-t border-dashed flex items-center justify-center", mode === 'dark' ? "border-white/10" : "border-black/5")}>
                            <p className={cn("text-[10px] font-medium text-center opacity-50 uppercase tracking-wide", tokens.text.tertiary)}>
                                Gutcheck Coach is an AI and not a doctor, Consult a professional for medical advice
                            </p>
                        </div>
                    </div>
                    {/* Copy Button */}
                    <div className="flex justify-end pt-2">
                        <LiquidPressable
                            onClick={handleCopy}
                            size="sm"
                            variant="pill"
                            className={cn(
                                "flex items-center gap-2 text-xs font-medium px-3 py-1.5 backdrop-blur-md rounded-full transition-colors",
                                mode === 'dark' ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-black"
                            )}
                        >
                            {isCopied ? (
                                <>
                                    <Check className="w-3 h-3 text-green-500" />
                                    <span className="text-green-500">Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className={cn("w-3 h-3 opacity-60")} />
                                    <span className="opacity-80">Copy Advice</span>
                                </>
                            )}
                        </LiquidPressable>
                    </div>
                </div>
            );
        }
        return null;
    };


    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        key="coach-dimmer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCoach}
                        className={cn("fixed inset-0 z-[60] backdrop-blur-sm", tokens.background.overlay)}
                    />

                    <motion.div
                        key="coach-sheet"
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className={cn(
                            "fixed bottom-0 left-0 right-0 z-[70] rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col transition-colors duration-300",
                            mode === 'dark' ? "bg-zinc-950 border-t border-white/10" : "bg-white border-t border-black/5"
                        )}
                        style={{ height: '85vh' }}
                    >
                        <div className={cn("h-1.5 w-12 rounded-full mx-auto mt-4 mb-2", mode === 'dark' ? "bg-white/20" : "bg-black/10")} />

                        <div className={cn("px-6 pb-4 flex items-center justify-between border-b", mode === 'dark' ? "border-white/5" : "border-black/5")}>
                            {/* Header Avatar and Title */}
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-md relative">
                                    <Image
                                        src={avatarSrc}
                                        alt="Coach Avatar"
                                        fill
                                        className="object-cover"
                                        priority
                                        sizes="40px"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className={cn("font-bold text-base leading-none", tokens.text.primary)}>Coach</h3>
                                    <span className={cn("text-xs", tokens.text.tertiary)}>Advanced Analysis</span>
                                </div>
                            </div>


                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <FrostBackplate className={cn(
                                        "rounded-tl-none border-indigo-500/20",
                                        mode === 'dark' ? "bg-indigo-500/10" : "bg-indigo-50"
                                    )}>
                                        {renderContent()}
                                    </FrostBackplate>
                                </div>
                            </div>
                            <div ref={bottomRef} />
                        </div>

                        {/* Footer (Removed Input, just safe area spacer if needed, or nothing) */}
                        <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
