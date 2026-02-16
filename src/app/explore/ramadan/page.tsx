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
import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function RamadanComingSoonPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [showSaved, setShowSaved] = React.useState(false);
    const [ramadanMode, setRamadanMode] = React.useState<'fasting' | 'witnessing' | 'hidden' | null>(null);
    const [showModeDialog, setShowModeDialog] = React.useState(false);
    const [ramadanDialogVideoReady, setRamadanDialogVideoReady] = React.useState(false);
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

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black">
            <style jsx global>{`
                .ramadan-contrast [id^='nav-item-'] span {
                    color: rgba(255, 255, 255, 0.85) !important;
                }
                .ramadan-contrast [id^='nav-item-'] svg {
                    color: rgba(255, 255, 255, 0.9) !important;
                    stroke: currentColor !important;
                }
            `}</style>

            {showModeDialog && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 backdrop-blur-sm px-5">
                    <div className="w-full max-w-[380px] rounded-[28px] bg-[#0E1C16]/95 border border-white/10 shadow-2xl px-6 pt-6 pb-5 text-white relative">
                        <div className="flex items-center justify-center mb-4">
                            <div className="relative w-[150px] h-[150px] rounded-full flex items-center justify-center">
                                <div className="absolute inset-0 bg-emerald-400/30 blur-[40px] rounded-full" />
                                <div className="relative z-10 w-[140px] h-[140px] rounded-full overflow-hidden border-4 border-white/10 shadow-2xl ring-1 ring-white/20">
                                    {!ramadanDialogVideoReady && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/15 backdrop-blur-sm">
                                            <span className="text-emerald-100/80 text-sm font-semibold animate-pulse">Ramadan</span>
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
                        <p className="text-sm text-white/80 text-center leading-relaxed mb-4">
                            Help us tailor your experience. We’ve also updated Insights and the Coach to support you during fasting (if you choose it). You can change this anytime later.
                        </p>
                        <div className="flex flex-col gap-2">
                            <motion.button
                                onClick={() => handleModeSelect('fasting')}
                                className="w-full px-4 py-3 rounded-full text-sm font-bold bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                whileTap={{ scale: 1.25 }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300, damping: 8 }}
                            >
                                I am fasting
                            </motion.button>
                            <motion.button
                                onClick={() => handleModeSelect('witnessing')}
                                className="w-full px-4 py-3 rounded-full text-sm font-bold bg-white/10 text-white/90 border border-white/20 hover:bg-white/15"
                                whileTap={{ scale: 1.25 }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300, damping: 8 }}
                            >
                                I am witnessing
                            </motion.button>
                            <motion.button
                                onClick={() => handleModeSelect('hidden')}
                                className="w-full px-4 py-3 rounded-full text-sm font-bold text-white/70 border border-white/10 hover:border-white/20"
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
                    className="object-cover"
                    priority
                    quality={100}
                />
                {/* Overlay for text readability */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            </div>

            {/* Content Container */}
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-20 flex items-center p-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
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
                    <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in duration-500 delay-200">
                        <div className="flex items-center justify-center mb-4">
                            <LiquidSegmentedControl
                                options={[
                                    { id: 'all', label: 'All' },
                                    { id: 'saved', label: 'Saved' }
                                ]}
                                selected={showSaved ? 'saved' : 'all'}
                                onChange={(id) => setShowSaved(id === 'saved')}
                                layoutIdPrefix="ramadan-cards"
                            />
                        </div>
                        {isReady ? (
                            showSaved ? (
                                <SavedCardsStack
                                    cards={savedCards}
                                    onSave={saveCard}
                                    onCommit={commitGoal}
                                    isCommitted={(topicId) => activeGoals.some(goal => goal.id === `goal-${topicId}`)}
                                    isSaved={(topicId) => savedIds.has(topicId)}
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
                                />
                            )
                        ) : (
                            <div className="h-[70vh] w-full rounded-[2rem] border border-white/10 bg-white/5 animate-pulse" />
                        )}
                    </div>
                    <div className="absolute bottom-[96px] left-1/2 -translate-x-1/2 text-white/45 text-[9px] tracking-[0.18em] uppercase text-center max-w-[92vw] px-3">
                        Scroll ↓ for Goals & Calendar
                    </div>
                </section>

                {/* Section 2: Committed Goals */}
                <section
                    className="h-screen w-full shrink-0 snap-center snap-always flex items-center justify-center px-5 pb-16 relative overflow-hidden"
                    style={{ touchAction: 'pan-y' }}
                >
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-4 text-white/90 text-lg tracking-widest uppercase font-semibold">
                            Committed Goals
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
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
                                                <div className="mb-4 flex items-center justify-between text-white/90 text-sm font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); shiftSelectedDate(-1); }}
                                                            className="text-white/50 hover:text-white/80"
                                                        >
                                                            {'<<'}
                                                        </button>
                                                        <span>
                                                            {new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); shiftSelectedDate(1); }}
                                                            className="text-white/50 hover:text-white/80"
                                                        >
                                                            {'>>'}
                                                        </button>
                                                    </div>
                                                    <div className="text-white/60 text-xs font-semibold">
                                                        {completedForDay.length}/{activeGoals.length}
                                                    </div>
                                                </div>
                                                {activeGoals.length === 0 && (
                                                    <div className="text-white/50 text-sm">
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
                                                                className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
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
                                                                        isCompleted ? "bg-emerald-300" : "bg-white/30"
                                                                    )} />
                                                                </button>
                                                                <div className="flex-1">
                                                                    <div className="text-white/90 text-sm font-semibold">{goal.title}</div>
                                                                    {goal.actionItem && (
                                                                        <div className="text-white/60 text-xs mt-1">{goal.actionItem}</div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => uncommitGoal(goal.id)}
                                                                    className="text-xs text-white/40 hover:text-white/70"
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
                        <div className="mb-4 text-white/90 text-lg tracking-widest uppercase font-semibold">
                            Ramadan Calendar
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                            {isBeforeRamadan && (
                                <div className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                                    Ramadan starts on {RAMADAN_START.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. {daysUntilRamadan} days to go.
                                </div>
                            )}

                            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs uppercase tracking-wider text-white/60">Ramadan Start</div>
                                    <div className="flex gap-1">
                                        {START_OPTIONS.map((date) => (
                                            <button
                                                key={date}
                                                onClick={() => setSelectedStart(date)}
                                                className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                                                    selectedStart === date
                                                        ? "bg-emerald-500/30 text-emerald-100"
                                                        : "bg-white/5 text-white/60 hover:bg-white/10"
                                                )}
                                            >
                                                {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-2 mb-3 text-white/50 text-[11px] uppercase tracking-wider">
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
                                                "h-14 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-1",
                                                isToday && "border-emerald-300/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
                                                isSelected && "ring-2 ring-emerald-300/40"
                                            )}
                                            title={total > 0 ? `${completed}/${total} completed` : 'No goals'}
                                        >
                                            <div className={cn(
                                                "text-sm font-semibold",
                                                isToday ? "text-emerald-200" : "text-white/80"
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
                                                                    : "bg-white/25"
                                                            )}
                                                        />
                                                    ))
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[10px] text-emerald-200">
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
                                <div className="mt-4 text-white/50 text-sm">
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
