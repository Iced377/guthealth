'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Activity, Scale, Utensils, Target, Flame, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { format, isSameDay, addDays, startOfDay, endOfDay, subDays } from 'date-fns';
import type { TimelineEntry, UserProfile } from '@/types';
import { useNavVisibility } from '@/components/navigation/useNavVisibilityController';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface LiveSnapshotViewProps {
    clientUserId: string;
    onClose: () => void;
}

function TimelineLogCard({ log }: { log: any }) {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-4 cursor-pointer hover:bg-zinc-800/80 transition-colors"
        >
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg shrink-0">
                {log.emoji || '🍲'}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className={cn("font-bold text-sm text-white", !isExpanded && "truncate")}>{log.name}</h4>
                {log.ingredients && (
                    <p className={cn("text-[10px] text-zinc-400 mt-0.5", !isExpanded && "truncate")}>{log.ingredients}</p>
                )}
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight mt-1">
                    {format(log.timestamp, 'h:mm a')} • {Math.round(log.calories || 0)} kcal
                </p>
            </div>
            <div className="text-right shrink-0">
                <div className="text-[10px] font-black text-zinc-400">P:{Math.round(log.protein || 0)} C:{Math.round(log.carbs || 0)} F:{Math.round(log.fat || 0)}</div>
            </div>
        </div>
    );
}

export default function LiveSnapshotView({ clientUserId, onClose }: LiveSnapshotViewProps) {
    const { isDarkMode } = useTheme();
    const { lockNav, unlockNav, setNavVisible } = useNavVisibility();
    
    const [loading, setLoading] = useState(true);
    const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
    const [todayEntries, setTodayEntries] = useState<TimelineEntry[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [weightTrend, setWeightTrend] = useState<{date: string, weight: number}[]>([]);

    useEffect(() => {
        lockNav('SNAPSHOT_OPEN');
        setNavVisible(false);
        return () => {
            unlockNav('SNAPSHOT_OPEN');
            setNavVisible(true);
        };
    }, [lockNav, unlockNav, setNavVisible]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Client Profile
                if (!clientProfile) {
                    const userSnap = await getDoc(doc(db, 'users', clientUserId));
                    if (userSnap.exists()) {
                        setClientProfile({ uid: clientUserId, ...userSnap.data() } as UserProfile);
                    }
                }

                // 2. Fetch Selected Day's Timeline Entries
                const dayStart = startOfDay(selectedDate);
                const dayEnd = endOfDay(selectedDate);
                
                const entriesSnap = await getDocs(
                    query(
                        collection(db, 'users', clientUserId, 'timelineEntries'),
                        where('timestamp', '>=', Timestamp.fromDate(dayStart)),
                        where('timestamp', '<=', Timestamp.fromDate(dayEnd)),
                        orderBy('timestamp', 'desc')
                    )
                );
                
                const entries = entriesSnap.docs.map(d => ({
                    ...d.data(),
                    id: d.id,
                    timestamp: (d.data().timestamp as Timestamp).toDate()
                } as TimelineEntry));
                
                setTodayEntries(entries);

                // 3. Fetch Weight Trend (last 14 days)
                if (weightTrend.length === 0) {
                    const fourteenDaysAgo = subDays(new Date(), 14);
                    const trendSnap = await getDocs(
                        query(
                            collection(db, 'users', clientUserId, 'timelineEntries'),
                            where('timestamp', '>=', Timestamp.fromDate(startOfDay(fourteenDaysAgo))),
                            orderBy('timestamp', 'asc')
                        )
                    );
                    
                    const weights: {date: string, weight: number}[] = [];
                    trendSnap.docs.forEach(d => {
                        const data = d.data();
                        if (data.entryType === 'fitbit_data' && data.weight) {
                            weights.push({
                                date: format((data.timestamp as Timestamp).toDate(), 'MMM d'),
                                weight: data.weight
                            });
                        }
                    });
                    setWeightTrend(weights);
                }

            } catch (e) {
                console.error('Failed to fetch snapshot data:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [clientUserId, selectedDate]); 

    const stats = useMemo(() => {
        let calories = 0, protein = 0, carbs = 0, fat = 0;
        let weight: number | null = null;
        let steps = 0;
        let firstMeal: Date | null = null;
        let lastMeal: Date | null = null;

        todayEntries.forEach(entry => {
            if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
                calories += entry.calories || 0;
                protein += entry.protein || 0;
                carbs += entry.carbs || 0;
                fat += entry.fat || 0;
                
                if (!lastMeal || entry.timestamp > lastMeal) lastMeal = entry.timestamp;
                if (!firstMeal || entry.timestamp < firstMeal) firstMeal = entry.timestamp;
            } else if (entry.entryType === 'fitbit_data' && entry.weight) {
                if (!weight) weight = entry.weight;
            } else if (entry.entryType === 'pedometer_data') {
                steps += entry.steps || 0;
            }
        });

        return { calories, protein, carbs, fat, weight, steps, firstMeal, lastMeal };
    }, [todayEntries]);

    const targets = clientProfile?.profile?.macros || { calories: 2000, protein: 150, carbs: 200, fat: 70 };
    const targetCalories = clientProfile?.profile?.tdee || 2000;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/60 backdrop-blur-xl">
            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full bg-zinc-950/50 relative overflow-hidden border-x border-zinc-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pt-12 border-b border-zinc-800 bg-zinc-900/50">
                    <div>
                        <h2 className="text-2xl font-black text-white">Client Snapshot</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-xs text-zinc-300 uppercase tracking-widest font-bold min-w-[120px] text-center">
                                {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
                            </span>
                            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} disabled={isSameDay(selectedDate, new Date())} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 disabled:opacity-30 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
                    {loading && todayEntries.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                        </div>
                    ) : (
                        <>
                            {/* Top Stats Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                                            <Flame className="w-3 h-3" />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cals</span>
                                    </div>
                                    <div>
                                        <span className="text-xl font-black text-white">{Math.round(stats.calories)}</span>
                                        <span className="text-[10px] text-zinc-500 block">/ {targetCalories}</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <Activity className="w-3 h-3" />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Steps</span>
                                    </div>
                                    <div>
                                        <span className="text-xl font-black text-white">{stats.steps.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-2 relative z-10">
                                        <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <Scale className="w-3 h-3" />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Weight</span>
                                    </div>
                                    <div className="relative z-10">
                                        <span className="text-xl font-black text-white">{stats.weight || clientProfile?.profile?.weight || '--'}</span>
                                        <span className="text-[10px] text-zinc-500 ml-1">kg</span>
                                    </div>
                                    {/* Tiny Weight Trend Chart Background */}
                                    {weightTrend.length > 1 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-40 pointer-events-none">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={weightTrend}>
                                                    <YAxis domain={['dataMin', 'dataMax']} hide />
                                                    <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Meal Timings */}
                            <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">Meal Window</h3>
                                        <p className="text-xs text-zinc-400">First to Last Meal</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-white">
                                        {stats.firstMeal ? format(stats.firstMeal, 'h:mm a') : '--:--'}
                                    </p>
                                    <p className="text-xs font-bold text-zinc-500">
                                        to {stats.lastMeal ? format(stats.lastMeal, 'h:mm a') : '--:--'}
                                    </p>
                                </div>
                            </div>

                            {/* Macro Progress */}
                            <div className="p-6 rounded-[2rem] bg-zinc-900 border border-zinc-800 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Target className="w-5 h-5 text-[#ffc01f]" />
                                    <h3 className="font-bold text-white text-lg">Daily Targets</h3>
                                </div>
                                
                                <div className="space-y-5">
                                    {[
                                        { label: 'Protein', value: stats.protein, target: targets.protein, color: 'bg-rose-500' },
                                        { label: 'Carbs', value: stats.carbs, target: targets.carbs, color: 'bg-blue-500' },
                                        { label: 'Fat', value: stats.fat, target: (targets as any).fat || (targets as any).fats, color: 'bg-amber-500' },
                                    ].map(macro => {
                                        const percent = Math.min(100, (macro.value / (macro.target || 1)) * 100);
                                        return (
                                            <div key={macro.label} className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                                    <span className="text-zinc-400">{macro.label}</span>
                                                    <span className="text-white">{Math.round(macro.value)}g / {macro.target}g</span>
                                                </div>
                                                <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percent}%` }}
                                                        className={cn("h-full rounded-full", macro.color)}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Timeline Logs */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Utensils className="w-5 h-5 text-emerald-400" />
                                    <h3 className="font-bold text-white text-lg">Timeline</h3>
                                </div>

                                <div className="space-y-3">
                                    {todayEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro').length === 0 ? (
                                        <div className="py-12 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
                                            <p className="text-sm text-zinc-500">No logs found for this day.</p>
                                        </div>
                                    ) : (
                                        todayEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro').map((entry) => (
                                            <TimelineLogCard key={entry.id} log={entry as any} />
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
