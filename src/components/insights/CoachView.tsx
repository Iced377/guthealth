'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { getLiquidTokens, LiquidMode } from '@/lib/liquid-tokens';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useActionContext } from '@/contexts/ActionContext';
import { format, isSameDay, differenceInCalendarDays } from 'date-fns';
import { getPersonalizedDietitianInsight, PersonalizedDietitianOutput } from '@/ai/flows/personalized-dietitian-flow';
import { calculateTrendsAnalysis } from '@/utils/insights';
import { FrostBackplate } from './LiquidPrimitive';
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import { Loader2, Copy, Check, Send } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';
import DashboardHero from '../dashboard/DashboardHero';
import { RAMADAN_ENABLED } from '@/lib/featureFlags';



// Helper to determine time of day
const getTimeSegment = (hour: number) => {
    if (hour < 5) return 'Late Night';
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 22) return 'Evening';
    return 'Late Night';
};

export function CoachView() {
    const { isDarkMode } = useTheme();
    const mode: LiquidMode = isDarkMode ? 'dark' : 'light';
    const tokens = getLiquidTokens(mode);
    const { timelineEntries, userProfile } = useActionContext();
    const bottomRef = useRef<HTMLDivElement>(null);
    const [ramadanMode, setRamadanMode] = useState<'fasting' | 'witnessing' | 'hidden' | null>(null);

    // AI State
    const [aiOutput, setAiOutput] = useState<PersonalizedDietitianOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isAnalysisRequested, setIsAnalysisRequested] = useState(false);

    useEffect(() => {
        if (!RAMADAN_ENABLED) {
            setRamadanMode(null);
            return;
        }
        const profileMode = (userProfile as any)?.ramadanConfig?.status;
        if (profileMode === 'fasting' || profileMode === 'witnessing' || profileMode === 'hidden') {
            setRamadanMode(profileMode);
            return;
        }
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('ramadan_user_mode_v1');
            if (stored === 'fasting' || stored === 'witnessing' || stored === 'hidden') {
                setRamadanMode(stored);
                return;
            }
        }
        setRamadanMode(null);
    }, [userProfile]);

    // Prepare Data for Advanced AI (Reused from CoachSessionSheet)
    const preparedInput = useMemo(() => {
        const now = new Date();
        const todayEntries = timelineEntries.filter(e => isSameDay(new Date(e.timestamp), now));
        const ramadanStartStored = typeof window !== 'undefined'
            ? (localStorage.getItem('ramadan_start_date') || '2026-02-18')
            : '2026-02-18';
        const ramadanStartDate = new Date(`${ramadanStartStored}T00:00:00`);
        const ramadanDaysUntil = differenceInCalendarDays(ramadanStartDate, now);
        const ramadanDayNumber = ramadanDaysUntil <= 0 ? Math.abs(ramadanDaysUntil) + 1 : undefined;

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
            ramadanMode: ramadanMode || undefined,
            ramadanStartDate: ramadanStartStored,
            ramadanDaysUntil: ramadanMode ? ramadanDaysUntil : undefined,
            ramadanDayNumber: ramadanMode && ramadanDaysUntil <= 0 ? ramadanDayNumber : undefined,
            currentLocalTime: format(now, 'h:mm a'),
            currentLocalMinutes: now.getHours() * 60 + now.getMinutes(),
            dailyTotals: {
                calories: Math.round(dailyTotals.calories),
                protein: Math.round(dailyTotals.protein),
                carbs: Math.round(dailyTotals.carbs),
                fat: Math.round(dailyTotals.fat),
            },
            hoursSinceLastMeal: parseFloat(hoursSinceLastMeal.toFixed(1)),
            projectedFastingEndTimes: {
                target16h: format(target16h, 'h:mm a'),
                targetMax: format(new Date(lastMealTime.getTime() + (trends.maxFastingWindowHours || 18) * 36e5), 'h:mm a')
            },
            timeOfDaySegment: getTimeSegment(now.getHours()),
            trendsAnalysis: trends
        };

    }, [timelineEntries, userProfile, ramadanMode]);


    // Usage Limit State
    const [dailyUsageCount, setDailyUsageCount] = useState(0);
    const DAILY_LIMIT = 5;

    useEffect(() => {
        // Init usage from local storage
        const todayKey = `coach-usage-${format(new Date(), 'yyyy-MM-dd')}`;
        const stored = localStorage.getItem(todayKey);
        setDailyUsageCount(stored ? parseInt(stored) : 0);
    }, []);

    const checkAndIncrementUsage = () => {
        const todayKey = `coach-usage-${format(new Date(), 'yyyy-MM-dd')}`;
        const stored = localStorage.getItem(todayKey);
        const current = stored ? parseInt(stored) : 0;

        if (current >= DAILY_LIMIT) return false;

        const newCount = current + 1;
        localStorage.setItem(todayKey, newCount.toString());
        setDailyUsageCount(newCount);
        return true;
    };

    // Fetch Insights
    useEffect(() => {
        // Only fetch if requested, not already fetched, not loading, and we have input
        if (isAnalysisRequested && !aiOutput && !isLoading && preparedInput) {

            // Limit Check (Double check here just in case)
            // Note: We check before setting 'isAnalysisRequested' usually, but good to be safe.
            // But since 'isAnalysisRequested' triggers the UI change, we should check in handleStartSession.

            setIsLoading(true);
            getPersonalizedDietitianInsight(preparedInput as any)
                .then(result => {
                    setAiOutput(result);
                    // Usage is incremented on *Start*, assuming success isn't guaranteed? 
                    // Or should we increment only on success? Usually on *request* to prevent abuse.
                    // But here we'll increment on click for better UX feedback loop handled in click handler?
                    // Let's defer increment to the click handler to update UI instantly.
                })
                .catch(err => {
                    console.error("AI Insight Error:", err);
                    setAiOutput({ aiResponse: "I'm having trouble connecting to my brain right now." });
                })
                .finally(() => setIsLoading(false));
        }
    }, [isAnalysisRequested, aiOutput, isLoading, preparedInput]);

    const handleCopy = async () => {
        if (!aiOutput?.aiResponse) return;
        try {
            await Clipboard.write({ string: aiOutput.aiResponse });
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    const handleStartSession = () => {
        if (checkAndIncrementUsage()) {
            setIsAnalysisRequested(true);
        } else {
            // Toast or Alert for Limit
            alert("Daily Coach Limit Reached (5/5). Come back tomorrow!");
        }
    };

    const renderInlineBold = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={`b-${idx}`}>{part.slice(2, -2)}</strong>;
            }
            return <span key={`t-${idx}`}>{part}</span>;
        });
    };

    const renderMarkdownish = (text: string) => {
        const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);

        return blocks.map((block, blockIndex) => {
            const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
            const isList = lines.every((line) => line.startsWith('* ') || line.startsWith('- '));

            if (isList) {
                return (
                    <ul key={`block-${blockIndex}`} className="list-disc pl-5 space-y-2">
                        {lines.map((line, lineIndex) => {
                            const content = line.replace(/^(\*|-)\s+/, '');
                            return (
                                <li key={`li-${blockIndex}-${lineIndex}`}>
                                    {renderInlineBold(content)}
                                </li>
                            );
                        })}
                    </ul>
                );
            }

            return (
                <p key={`block-${blockIndex}`} className="mb-3 last:mb-0">
                    {renderInlineBold(block)}
                </p>
            );
        });
    };

    const renderContent = () => {
        // 1. Idle State (Video + CTA)
        if (!isAnalysisRequested) {
            return (
                <div className="flex flex-col items-center justify-center py-10 gap-8 animate-in fade-in duration-700">
                    {/* Video Avatar */}
                    <div className="relative w-48 h-48 rounded-full overflow-hidden">
                        <video
                            src="/researcher.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            className="w-full h-full object-cover scale-150" // Slight zoom to focus on character
                        />
                        {/* Inner shadow for depth */}
                        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none" />
                    </div>

                    {/* CTA Button */}
                    <div className="text-center space-y-4">
                        <h3 className={cn("text-xl font-bold", tokens.text.primary)}>
                            Ready for your report?
                        </h3>
                        <div className="flex flex-col gap-2">
                            <LiquidPressable
                                onClick={handleStartSession}
                                variant="pill"
                                size="lg"
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 font-medium text-base transition-all active:scale-95",
                                    // WhatsApp Style: Green Bubble, White Text
                                    "bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-sm",
                                    "rounded-2xl rounded-tr-sm", // Subtle "message bubble" corner
                                    dailyUsageCount >= DAILY_LIMIT && "opacity-50 grayscale cursor-not-allowed"
                                )}
                                disabled={dailyUsageCount >= DAILY_LIMIT}
                            >
                                <span>Coach, how am I doing today?</span>
                                <Send className="w-4 h-4 fill-current" />
                            </LiquidPressable>

                            {/* Minimalistic Usage Counter */}
                            <p className="text-[10px] uppercase tracking-widest opacity-40 font-mono">
                                Uses Today: {dailyUsageCount}/{DAILY_LIMIT}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        // 2. Loading State
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-70 text-center">
                    <Loader2 className={cn("h-8 w-8 animate-spin", tokens.text.primary)} />
                    <p className={cn("text-sm font-medium animate-pulse", tokens.text.secondary)}>
                        Coach is analyzing your recent meals and daily activity...
                    </p>
                    <p className={cn("text-xs uppercase tracking-widest opacity-60", tokens.text.tertiary)}>
                        Generating personalized insights
                    </p>
                </div>
            );
        }

        // 3. Result State
        if (aiOutput) {
            return (
                <div className="space-y-4">

                    <div className={cn("animate-in fade-in slide-in-from-bottom-2 duration-500 text-base leading-relaxed", tokens.text.primary)}>
                        {renderMarkdownish(aiOutput.aiResponse)}

                        <div className={cn("mt-6 py-3 px-4 border-t border-dashed flex items-center justify-center gap-2", mode === 'dark' ? "border-white/10" : "border-black/10")}>
                            <span className={cn("text-xs font-medium opacity-60 text-center", tokens.text.tertiary)}>
                                Gutcheck Coach is an AI and not a doctor, Consult a professional for medical advice
                            </span>
                        </div>
                    </div>
                    {/* Copy Button */}
                    <div className="flex justify-end pt-4">
                        <LiquidPressable
                            onClick={handleCopy}
                            size="sm"
                            variant="pill"
                            className={cn(
                                "flex items-center gap-2 text-xs font-medium px-4 py-2 backdrop-blur-md rounded-full transition-colors",
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
        return null; // Initial state or error fallback
    };

    return (
        <div className="flex flex-col gap-4 p-4 pb-32 min-h-screen">
            <div className="flex-1">
                {/* Replaced FrostBackplate with Clean Card container */}
                <div className={cn(
                    "rounded-[32px] p-8 shadow-none border-0 flex flex-col justify-center",
                    // Use standard card background logic (Dashboard Style)
                    mode === 'dark' ? "bg-zinc-900" : "bg-white"
                )}>
                    {renderContent()}
                </div>
            </div>
            <div ref={bottomRef} />
        </div>
    );
}
