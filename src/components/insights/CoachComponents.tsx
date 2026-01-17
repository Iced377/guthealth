import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useInsightsMotionController } from './useInsightsMotionController';
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import { FrostBackplate } from './LiquidPrimitive';
import { X, Send, Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens, LiquidMode } from '@/lib/liquid-tokens';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useActionContext } from '@/contexts/ActionContext';
import { format, isSameDay } from 'date-fns';
import { getPersonalizedDietitianInsight, PersonalizedDietitianOutput } from '@/ai/flows/personalized-dietitian-flow';
import { calculateTrendsAnalysis } from '@/utils/insights';

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
    // Wait, typical pattern: Black image ON white background? Or image OF black character?
    // "user coach-black for the dark mode and coad-white for the light mode."
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
                    className="fixed left-0 right-0 flex justify-center z-50 pointer-events-none"
                    style={{
                        bottom: 'calc(env(safe-area-inset-bottom) + 92px)'
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
        const lastMeal = timelineEntries.find(e => e.entryType === 'food' || e.entryType === 'manual_macro');
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
                <div className={cn("space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 text-sm leading-relaxed whitespace-pre-wrap", tokens.text.primary)}>
                    {aiOutput.aiResponse}
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

                            <LiquidPressable onClick={closeCoach} size="sm" variant="icon" className={mode === 'dark' ? "bg-white/5" : "bg-black/5"}>
                                <X className={cn("h-4 w-4", tokens.text.primary)} />
                            </LiquidPressable>
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

                        <div className={cn(
                            "p-4 pt-2 border-t backdrop-blur-xl",
                            mode === 'dark' ? "bg-black/20 border-white/5" : "bg-white/80 border-black/5"
                        )} style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ask anything..."
                                    className={cn(
                                        "w-full h-12 rounded-full pl-6 pr-12 focus:outline-none focus:ring-1 border transition-colors",
                                        mode === 'dark'
                                            ? "bg-white/5 text-white placeholder:text-white/30 focus:ring-white/20 border-white/5"
                                            : "bg-black/5 text-black placeholder:text-black/30 focus:ring-black/10 border-black/5"
                                    )}
                                />
                                <button className="absolute right-2 top-2 h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center text-white hover:bg-indigo-400 transition-colors">
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
