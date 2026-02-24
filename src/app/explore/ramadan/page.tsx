'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { RamadanCardStack } from '@/components/ramadan/RamadanCardStack';
import { SavedCardsStack } from '@/components/ramadan/SavedCardsStack';
import { cn } from '@/lib/utils';
import { useRamadanCards } from '@/hooks/useRamadanCards';
import LiquidSegmentedControl from '@/components/ui/LiquidSegmentedControl';
import LiquidChartCarousel from '@/components/trends/LiquidChartCarousel';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTheme } from '@/contexts/ThemeContext';
import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

export default function RamadanComingSoonPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const [showSaved, setShowSaved] = React.useState(false);
    const [ramadanMode, setRamadanMode] = React.useState<'fasting' | 'witnessing' | 'hidden' | null>(null);
    const [showModeDialog, setShowModeDialog] = React.useState(false);
    const [ramadanDialogVideoReady, setRamadanDialogVideoReady] = React.useState(false);
    const [isNonIOSMobile, setIsNonIOSMobile] = React.useState(false);
    const {
        cards,
        removeTopCard,
        restoreLastCard,
        canGoBack,
        saveCard,
        commitGoal,
        committedGoals,
        uncommitGoal,
        toggleGoalForDate,
        getCompletionForDate,
        isLoading,
        isReady,
        savedIds,
        savedCards
    } = useRamadanCards();

    const START_OPTIONS = ['2026-02-18', '2026-02-19'] as const;
    const [selectedStart, setSelectedStart] = React.useState<(typeof START_OPTIONS)[number]>('2026-02-18');
    const RAMADAN_MODE_KEY = 'ramadan_user_mode_v1';

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = localStorage.getItem('ramadan_start_date');
            if (stored && START_OPTIONS.includes(stored as any)) {
                setSelectedStart(stored as (typeof START_OPTIONS)[number]);
            }
            const modeStored = localStorage.getItem(RAMADAN_MODE_KEY);
            if (modeStored === 'fasting' || modeStored === 'witnessing' || modeStored === 'hidden') {
                setRamadanMode(modeStored);
                setShowModeDialog(false);
            }
        } catch (e) {
            // ignore storage errors
        }
    }, []);

    React.useEffect(() => {
        if (!user) return;
        const loadStoredMode = async () => {
            try {
                const snap = await getDoc(doc(db, 'users', user.uid));
                if (snap.exists()) {
                    const data = snap.data() as any;
                    const remoteMode = data?.ramadanConfig?.status;
                    if (remoteMode === 'fasting' || remoteMode === 'witnessing' || remoteMode === 'hidden') {
                        setRamadanMode(remoteMode);
                        setShowModeDialog(false);
                        if (typeof window !== 'undefined') {
                            try {
                                localStorage.setItem(RAMADAN_MODE_KEY, remoteMode);
                            } catch (e) {
                                // ignore
                            }
                        }
                        return;
                    }
                }
                setShowModeDialog(true);
            } catch (e) {
                setShowModeDialog(true);
            }
        };
        loadStoredMode();
    }, [user]);

    React.useEffect(() => {
        if (typeof document === 'undefined') return;
        document.body.classList.add('ramadan-contrast');
        return () => {
            document.body.classList.remove('ramadan-contrast');
        };
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('ramadan_start_date', selectedStart);
        } catch (e) {
            // ignore
        }
    }, [selectedStart]);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const evaluate = () => {
            const platform = Capacitor.getPlatform?.() ?? 'web';
            const userAgent = navigator.userAgent || '';
            const isIOSDevice = /iPad|iPhone|iPod/i.test(userAgent)
                || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const isIOS = platform === 'ios' || isIOSDevice;
            const isAndroid = platform === 'android' || /Android/i.test(userAgent);
            const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
            const isMobileUA = /Mobile|Android/i.test(userAgent);
            setIsNonIOSMobile(!isIOS && isMobileViewport && (isAndroid || isMobileUA));
        };

        evaluate();
        window.addEventListener('resize', evaluate);
        return () => window.removeEventListener('resize', evaluate);
    }, []);

    const handleModeSelect = (mode: 'fasting' | 'witnessing' | 'hidden') => {
        setRamadanMode(mode);
        setShowModeDialog(false);
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(RAMADAN_MODE_KEY, mode);
            } catch (e) {
                // ignore
            }
        }
        if (user) {
            updateDoc(doc(db, 'users', user.uid), {
                ramadanConfig: {
                    status: mode
                }
            }).catch(() => {
                // Non-blocking: keep local setting if write fails
            });
        }
    };

    const RAMADAN_START = React.useMemo(() => new Date(`${selectedStart}T00:00:00`), [selectedStart]);
    const RAMADAN_DAYS = 30;

    const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

    const ramadanDates = React.useMemo(() => {
        return Array.from({ length: RAMADAN_DAYS }, (_, index) => {
            const date = new Date(RAMADAN_START);
            date.setDate(RAMADAN_START.getDate() + index);
            return date;
        });
    }, [RAMADAN_START, RAMADAN_DAYS]);
    const ramadanDateKeys = React.useMemo(() => ramadanDates.map((date) => toDateKey(date)), [ramadanDates]);

    const firstWeekday = ramadanDates[0].getDay(); // 0=Sun
    const today = React.useMemo(() => new Date(), []);
    const todayKey = toDateKey(today);
    const [selectedDateKey, setSelectedDateKey] = React.useState(todayKey);
    const activeGoals = committedGoals.filter(goal => goal.active);
    const isBeforeRamadan = today < RAMADAN_START;
    const daysUntilRamadan = Math.max(0, Math.ceil((RAMADAN_START.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    React.useEffect(() => {
        if (ramadanDateKeys.length === 0) return;
        setSelectedDateKey((current) => {
            if (ramadanDateKeys.includes(current)) {
                return current;
            }
            return ramadanDateKeys.includes(todayKey) ? todayKey : ramadanDateKeys[0];
        });
    }, [ramadanDateKeys, todayKey]);

    const shiftSelectedDate = (delta: number) => {
        const idx = ramadanDateKeys.indexOf(selectedDateKey);
        const safeIdx = idx === -1 ? 0 : idx;
        const nextIdx = Math.min(ramadanDateKeys.length - 1, Math.max(0, safeIdx + delta));
        if (nextIdx !== safeIdx) {
            setSelectedDateKey(ramadanDateKeys[nextIdx]);
        } else if (idx === -1) {
            setSelectedDateKey(ramadanDateKeys[0]);
        }
    };

    const dayIndex = Math.max(0, ramadanDateKeys.indexOf(selectedDateKey));
    const handleDayIndexChange = (idx: number) => {
        const nextKey = ramadanDateKeys[idx];
        if (nextKey) {
            setSelectedDateKey(nextKey);
        }
    };

    const DAY_WINDOW = 5;
    const dayWindowStart = React.useMemo(() => {
        if (ramadanDateKeys.length <= DAY_WINDOW) return 0;
        const maxStart = ramadanDateKeys.length - DAY_WINDOW;
        const half = Math.floor(DAY_WINDOW / 2);
        return Math.min(Math.max(dayIndex - half, 0), maxStart);
    }, [ramadanDateKeys.length, dayIndex]);
    const dayWindowKeys = React.useMemo(
        () => ramadanDateKeys.slice(dayWindowStart, dayWindowStart + DAY_WINDOW),
        [ramadanDateKeys, dayWindowStart]
    );
    const dayWindowIndex = Math.max(0, dayIndex - dayWindowStart);

    const surfaceShadow = isDarkMode
        ? "shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        : "shadow-[0_24px_60px_rgba(15,23,42,0.12)]";
    const panelSurface = isDarkMode
        ? "border-white/10 bg-black/30 backdrop-blur-xl"
        : "border-emerald-200/60 bg-white/70 backdrop-blur-xl";
    const panelItemSurface = isDarkMode
        ? "border-white/10 bg-white/5"
        : "border-emerald-200/60 bg-white/80";
    const mutedText = isDarkMode ? "text-white/60" : "text-emerald-700/70";
    const primaryText = isDarkMode ? "text-white/90" : "text-emerald-950";

    const segmentedControl = (
        <LiquidSegmentedControl
            options={[
                { id: 'all', label: 'All' },
                { id: 'saved', label: 'Saved' }
            ]}
            selected={showSaved ? 'saved' : 'all'}
            onChange={(id) => setShowSaved(id === 'saved')}
            layoutIdPrefix="ramadan-cards"
            className={cn(isNonIOSMobile && "shadow-[0_8px_20px_rgba(0,0,0,0.35)]")}
        />
    );

    return (
        <div className={cn(
            "relative h-screen w-full overflow-hidden",
            isDarkMode ? "bg-black" : "bg-[#f4f8f2]"
        )}>
            <style jsx global>{`
                .ramadan-contrast [id^='nav-item-'] span {
                    color: ${isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(10, 80, 60, 0.9)'} !important;
                }
                .ramadan-contrast [id^='nav-item-'] svg {
                    color: ${isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 80, 60, 0.9)'} !important;
                    stroke: currentColor !important;
                }
            `}</style>

            {showModeDialog && (
                <div className={cn(
                    "fixed inset-0 z-[80] flex items-center justify-center backdrop-blur-sm px-5",
                    isDarkMode ? "bg-black/45" : "bg-white/60"
                )}>
                    <div className={cn(
                        "w-full max-w-[380px] rounded-[28px] border shadow-2xl px-6 pt-6 pb-5 relative",
                        isDarkMode ? "bg-[#0E1C16]/95 border-white/10 text-white" : "bg-white/90 border-emerald-200/60 text-emerald-950"
                    )}>
                        <div className="flex items-center justify-center mb-4">
                            <div className="relative w-[150px] h-[150px] rounded-full flex items-center justify-center">
                                <div className={cn(
                                    "absolute inset-0 blur-[40px] rounded-full",
                                    isDarkMode ? "bg-emerald-400/30" : "bg-emerald-300/40"
                                )} />
                                <div className="relative z-10 w-[140px] h-[140px] rounded-full overflow-hidden border-4 border-white/10 shadow-2xl ring-1 ring-white/20">
                                    {!ramadanDialogVideoReady && (
                                        <div className={cn(
                                            "absolute inset-0 flex items-center justify-center backdrop-blur-sm",
                                            isDarkMode ? "bg-emerald-500/15" : "bg-emerald-200/60"
                                        )}>
                                            <span className={cn(
                                                "text-sm font-semibold animate-pulse",
                                                isDarkMode ? "text-emerald-100/80" : "text-emerald-900/80"
                                            )}>Ramadan</span>
                                        </div>
                                    )}
                                    <video
                                        src="/ramadan-animation.mp4?v=ramadan"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        preload="auto"
                                        poster="/ramadan-bg.png"
                                        onLoadedData={() => setRamadanDialogVideoReady(true)}
                                        className={cn(
                                            "w-full h-full object-cover object-center scale-[1.75] transition-opacity duration-300",
                                            ramadanDialogVideoReady ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-center mb-2">Ramadan Preferences</h3>
                        <p className={cn(
                            "text-sm text-center leading-relaxed mb-4",
                            isDarkMode ? "text-white/80" : "text-emerald-900/80"
                        )}>
                            Help us tailor your experience. We’ve also updated Insights and the Coach to support you during fasting (if you choose it). You can change this anytime later.
                        </p>
                        <div className="flex flex-col gap-2">
                            <motion.button
                                onClick={() => handleModeSelect('fasting')}
                                className={cn(
                                    "w-full px-4 py-3 rounded-full text-sm font-bold shadow-md",
                                    isDarkMode
                                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                        : "bg-emerald-500/80 text-emerald-950 shadow-emerald-200/60"
                                )}
                                whileTap={{ scale: 1.25 }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300, damping: 8 }}
                            >
                                I am fasting
                            </motion.button>
                            <motion.button
                                onClick={() => handleModeSelect('witnessing')}
                                className={cn(
                                    "w-full px-4 py-3 rounded-full text-sm font-bold border transition-colors",
                                    isDarkMode
                                        ? "bg-white/10 text-white/90 border-white/20 hover:bg-white/15"
                                        : "bg-white/80 text-emerald-900 border-emerald-200/70 hover:bg-white"
                                )}
                                whileTap={{ scale: 1.25 }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300, damping: 8 }}
                            >
                                I am witnessing
                            </motion.button>
                            <motion.button
                                onClick={() => handleModeSelect('hidden')}
                                className={cn(
                                    "w-full px-4 py-3 rounded-full text-sm font-bold border transition-colors",
                                    isDarkMode
                                        ? "text-white/70 border-white/10 hover:border-white/20"
                                        : "text-emerald-900/70 border-emerald-200/70 hover:border-emerald-300/80"
                                )}
                                whileTap={{ scale: 1.25 }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300, damping: 8 }}
                            >
                                Prefer not to share
                            </motion.button>
                        </div>
                    </div>
                </div>
            )}
            {/* Full Screen Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/ramadan-bg.png"
                    alt="Ramadan Background"
                    fill
                    className={cn(
                        "object-cover",
                        isDarkMode ? "" : "brightness-[1.08] saturate-[0.9]"
                    )}
                    priority
                    quality={100}
                />
                {/* Overlay for text readability */}
                <div className={cn(
                    "absolute inset-0",
                    isDarkMode
                        ? "bg-black/40 backdrop-blur-[2px]"
                        : "bg-gradient-to-b from-white/85 via-white/70 to-emerald-50/70 backdrop-blur-[1px]"
                )} />
            </div>

            {/* Content Container */}
            {/* Fixed Header */}
            <div className={cn(
                "fixed top-0 left-0 right-0 z-20 flex items-center p-4 pt-[calc(env(safe-area-inset-top)+1rem)]",
                isNonIOSMobile ? "justify-between gap-3" : ""
            )}>
                <button
                    onClick={() => router.back()}
                    className={cn(
                        "p-2 rounded-full backdrop-blur-md border transition-colors",
                        isDarkMode
                            ? "bg-black/20 text-white border-white/10 hover:bg-white/10"
                            : "bg-white/80 text-emerald-900 border-emerald-200/70 hover:bg-white"
                    )}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                {isNonIOSMobile && (
                    <div className="ml-auto">
                        {segmentedControl}
                    </div>
                )}
            </div>

            <div
                className="relative z-10 h-full w-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory scroll-smooth pb-0"
                style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none', WebkitOverflowScrolling: 'touch' }}
            >

                {/* Section 1: Wisdom Cards */}
                <section
                    className="h-screen w-full shrink-0 snap-center snap-always flex items-center justify-center p-4 relative overflow-hidden"
                    style={{ touchAction: 'pan-y' }}
                >
                    <div className={cn(
                        "w-full max-w-md mx-auto animate-in fade-in zoom-in duration-500 delay-200",
                        isNonIOSMobile && "-translate-y-6"
                    )}>
                        {!isNonIOSMobile && (
                            <div className="flex items-center justify-center mb-4">
                                {segmentedControl}
                            </div>
                        )}
                        {isReady ? (
                            showSaved ? (
                                <SavedCardsStack
                                    cards={savedCards}
                                    onSave={saveCard}
                                    onCommit={commitGoal}
                                    isCommitted={(topicId) => activeGoals.some(goal => goal.id === `goal-${topicId}`)}
                                    isSaved={(topicId) => savedIds.has(topicId)}
                                    compact={isNonIOSMobile}
                                />
                            ) : (
                                <RamadanCardStack
                                    cards={cards}
                                    removeTopCard={removeTopCard}
                                    restoreLastCard={restoreLastCard}
                                    canGoBack={canGoBack}
                                    saveCard={saveCard}
                                    commitGoal={commitGoal}
                                    committedGoals={activeGoals}
                                    isLoading={isLoading}
                                    savedIds={savedIds}
                                    compact={isNonIOSMobile}
                                />
                            )
                        ) : (
                            <div className={cn(
                                "h-[70vh] w-full rounded-[2rem] border animate-pulse",
                                isDarkMode ? "border-white/10 bg-white/5" : "border-emerald-200/60 bg-white/70"
                            )} />
                        )}
                    </div>
                    <div className={cn(
                        "absolute bottom-[96px] left-1/2 -translate-x-1/2 text-[9px] tracking-[0.18em] uppercase text-center max-w-[92vw] px-3",
                        isDarkMode ? "text-white/45" : "text-emerald-700/70"
                    )}>
                        Scroll ↓ for Goals & Calendar
                    </div>
                </section>

                {/* Section 2: Committed Goals */}
                <section
                    className="h-screen w-full shrink-0 snap-center snap-always flex items-center justify-center px-5 pb-16 relative overflow-hidden"
                    style={{ touchAction: 'pan-y' }}
                >
                    <div className="w-full max-w-md mx-auto">
                        <div className={cn(
                            "mb-4 text-lg tracking-widest uppercase font-semibold",
                            primaryText
                        )}>
                            Committed Goals
                        </div>
                        <div className={cn(
                            "rounded-3xl border backdrop-blur-xl",
                            panelSurface,
                            surfaceShadow
                        )}>
                            <LiquidChartCarousel
                                currentIndex={dayWindowIndex}
                                onIndexChange={(idx) => handleDayIndexChange(dayWindowStart + idx)}
                                showDots={false}
                                className="h-full w-full"
                            >
                                {dayWindowKeys.map((dateKey) => {
                                    const completedForDay = getCompletionForDate(dateKey);
                                    return (
                                        <div key={dateKey} className="h-full w-full flex items-center justify-center">
                                            <div className="w-full p-5">
                                                <div className={cn(
                                                    "mb-4 flex items-center justify-between text-sm font-semibold",
                                                    primaryText
                                                )}>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); shiftSelectedDate(-1); }}
                                                            className={cn(
                                                                "transition-colors",
                                                                isDarkMode ? "text-white/50 hover:text-white/80" : "text-emerald-700/70 hover:text-emerald-900"
                                                            )}
                                                        >
                                                            {'<<'}
                                                        </button>
                                                        <span>
                                                            {new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); shiftSelectedDate(1); }}
                                                            className={cn(
                                                                "transition-colors",
                                                                isDarkMode ? "text-white/50 hover:text-white/80" : "text-emerald-700/70 hover:text-emerald-900"
                                                            )}
                                                        >
                                                            {'>>'}
                                                        </button>
                                                    </div>
                                                    <div className={cn(
                                                        "text-xs font-semibold",
                                                        mutedText
                                                    )}>
                                                        {completedForDay.length}/{activeGoals.length}
                                                    </div>
                                                </div>
                                                {activeGoals.length === 0 && (
                                                    <div className={cn(
                                                        "text-sm",
                                                        mutedText
                                                    )}>
                                                        Commit a goal from a card to build your Ramadan plan.
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "space-y-3",
                                                    activeGoals.length > 5 && "max-h-[300px] overflow-y-auto pr-1"
                                                )}>
                                                    {activeGoals.map((goal) => {
                                                        const isCompleted = completedForDay.includes(goal.id);
                                                        return (
                                                            <div
                                                                key={`${dateKey}-${goal.id}`}
                                                                className={cn(
                                                                    "flex items-start justify-between gap-3 rounded-2xl border p-3",
                                                                    panelItemSurface
                                                                )}
                                                            >
                                                                <button
                                                                    onClick={() => toggleGoalForDate(dateKey, goal.id)}
                                                                    className={cn(
                                                                        "h-10 w-10 rounded-full border flex items-center justify-center transition-all",
                                                                        isCompleted
                                                                            ? "border-emerald-300/70 bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                                                                            : "border-white/20 bg-white/10 hover:bg-white/20"
                                                                    )}
                                                                    title={isCompleted ? 'Marked complete' : 'Mark complete'}
                                                                >
                                                                    <span className={cn(
                                                                        "h-4 w-4 rounded-full",
                                                                        isCompleted ? "bg-emerald-300" : (isDarkMode ? "bg-white/30" : "bg-emerald-200/70")
                                                                    )} />
                                                                </button>
                                                                <div className="flex-1">
                                                                    <div className={cn(
                                                                        "text-sm font-semibold",
                                                                        primaryText
                                                                    )}>{goal.title}</div>
                                                                    {goal.actionItem && (
                                                                        <div className={cn(
                                                                            "text-xs mt-1",
                                                                            mutedText
                                                                        )}>{goal.actionItem}</div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => uncommitGoal(goal.id)}
                                                                    className={cn(
                                                                        "text-xs transition-colors",
                                                                        isDarkMode ? "text-white/40 hover:text-white/70" : "text-emerald-700/60 hover:text-emerald-900"
                                                                    )}
                                                                >
                                                                    Uncommit
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </LiquidChartCarousel>
                        </div>
                    </div>
                </section>

                {/* Section 3: Calendar */}
                <section
                    className="h-screen w-full shrink-0 snap-center snap-always flex items-center justify-center px-5 relative overflow-hidden"
                    style={{ touchAction: 'pan-y' }}
                >
                    <div className="w-full max-w-md mx-auto">
                        <div className={cn(
                            "mb-4 text-lg tracking-widest uppercase font-semibold",
                            primaryText
                        )}>
                            Ramadan Calendar
                        </div>
                        <div className={cn(
                            "rounded-3xl border backdrop-blur-xl p-5",
                            panelSurface,
                            surfaceShadow
                        )}>
                            {isBeforeRamadan && (
                                <div className={cn(
                                    "mb-4 rounded-2xl border px-4 py-3 text-sm",
                                    isDarkMode
                                        ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
                                        : "border-emerald-200/70 bg-emerald-100/70 text-emerald-900"
                                )}>
                                    Ramadan starts on {RAMADAN_START.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. {daysUntilRamadan} days to go.
                                </div>
                            )}

                            <div className={cn(
                                "mb-4 flex flex-col gap-3 rounded-2xl border px-3 py-2",
                                panelItemSurface,
                                isDarkMode ? "text-white/80" : "text-emerald-900"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className={cn(
                                        "text-xs uppercase tracking-wider",
                                        mutedText
                                    )}>Ramadan Start</div>
                                    <div className="flex gap-1">
                                        {START_OPTIONS.map((date) => (
                                            <button
                                                key={date}
                                                onClick={() => setSelectedStart(date)}
                                                className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                                                    selectedStart === date
                                                        ? (isDarkMode ? "bg-emerald-500/30 text-emerald-100" : "bg-emerald-200/70 text-emerald-900")
                                                        : (isDarkMode ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-white/70 text-emerald-700 hover:bg-white")
                                                )}
                                            >
                                                {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className={cn(
                                "grid grid-cols-7 gap-2 mb-3 text-[11px] uppercase tracking-wider",
                                mutedText
                            )}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
                                    <div key={`${label}-${index}`} className="text-center">{label}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: firstWeekday }).map((_, index) => (
                                    <div key={`empty-${index}`} className="h-14" />
                                ))}
                                {ramadanDates.map((date) => {
                                    const key = toDateKey(date);
                                    const completedGoals = getCompletionForDate(key);
                                    const completed = completedGoals.length;
                                    const total = activeGoals.length;
                                    const isToday = key === todayKey;
                                    const isSelected = key === selectedDateKey;
                                    const dots = Math.min(total, 3);
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedDateKey(key)}
                                            className={cn(
                                                "h-14 rounded-2xl border transition-colors flex flex-col items-center justify-center gap-1",
                                                isDarkMode
                                                    ? "border-white/10 bg-white/5 hover:bg-white/10"
                                                    : "border-emerald-200/70 bg-white/80 hover:bg-white",
                                                isToday && (isDarkMode
                                                    ? "border-emerald-300/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                                                    : "border-emerald-300/80 bg-emerald-100/70 shadow-[0_0_20px_rgba(16,185,129,0.18)]"),
                                                isSelected && "ring-2 ring-emerald-300/40"
                                            )}
                                            title={total > 0 ? `${completed}/${total} completed` : 'No goals'}
                                        >
                                            <div className={cn(
                                                "text-sm font-semibold",
                                                isToday
                                                    ? (isDarkMode ? "text-emerald-200" : "text-emerald-800")
                                                    : (isDarkMode ? "text-white/80" : "text-emerald-900")
                                            )}>
                                                {date.getDate()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {total <= 3 ? (
                                                    Array.from({ length: dots }).map((_, index) => (
                                                        <span
                                                            key={`${key}-dot-${index}`}
                                                            className={cn(
                                                                "h-1.5 w-1.5 rounded-full",
                                                                index < completed
                                                                    ? "bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                                                                    : (isDarkMode ? "bg-white/25" : "bg-emerald-200/80")
                                                            )}
                                                        />
                                                    ))
                                                ) : (
                                                    <span className={cn(
                                                        "flex items-center gap-1 text-[10px]",
                                                        isDarkMode ? "text-emerald-200" : "text-emerald-800"
                                                    )}>
                                                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                                        {completed}/{total}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {activeGoals.length === 0 && (
                                <div className={cn(
                                    "mt-4 text-sm",
                                    mutedText
                                )}>
                                    Tap the goal card above to commit your first lantern.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Footer Spacer */}
                <div className="h-10" />
            </div>
        </div>
    );
}
