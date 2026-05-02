'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Activity, Scale, Utensils, Target, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { format, isSameDay } from 'date-fns';
import type { TimelineEntry, UserProfile, DailyNutritionSummary } from '@/types';
import { useNavVisibility } from '@/components/navigation/useNavVisibilityController';

interface LiveSnapshotViewProps {
    clientUserId: string;
    onClose: () => void;
}

export default function LiveSnapshotView({ clientUserId, onClose }: LiveSnapshotViewProps) {
    const { isDarkMode } = useTheme();
    const { lockNav, unlockNav, setNavVisible } = useNavVisibility();
    
    const [loading, setLoading] = useState(true);
    const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
    const [todayEntries, setTodayEntries] = useState<TimelineEntry[]>([]);

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
            try {
                // 1. Fetch Client Profile
                const userSnap = await getDoc(doc(db, 'users', clientUserId));
                if (userSnap.exists()) {
                    setClientProfile({ uid: clientUserId, ...userSnap.data() } as UserProfile);
                }

                // 2. Fetch Today's Timeline Entries
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const entriesSnap = await getDocs(
                    query(
                        collection(db, 'users', clientUserId, 'timelineEntries'),
                        where('timestamp', '>=', Timestamp.fromDate(today)),
                        orderBy('timestamp', 'desc')
                    )
                );
                
                const entries = entriesSnap.docs.map(d => ({
                    ...d.data(),
                    id: d.id,
                    timestamp: (d.data().timestamp as Timestamp).toDate()
                } as TimelineEntry));
                
                setTodayEntries(entries);
            } catch (e) {
                console.error('Failed to fetch snapshot data:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [clientUserId]);

    const stats = useMemo(() => {
        let calories = 0, protein = 0, carbs = 0, fat = 0;
        let weight: number | null = null;
        let steps = 0;

        todayEntries.forEach(entry => {
            if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
                calories += entry.calories || 0;
                protein += entry.protein || 0;
                carbs += entry.carbs || 0;
                fat += entry.fat || 0;
            } else if (entry.entryType === 'fitbit_data' && entry.weight) {
                weight = entry.weight;
            } else if (entry.entryType === 'pedometer_data') {
                steps += entry.steps || 0;
            }
        });

        return { calories, protein, carbs, fat, weight, steps };
    }, [todayEntries]);

    const targets = clientProfile?.profile?.macros || { calories: 2000, protein: 150, carbs: 200, fat: 70 };
    const targetCalories = clientProfile?.profile?.tdee || 2000;

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
                <Loader2 className="w-8 h-8 animate-spin text-[#ffc01f]" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/60 backdrop-blur-xl">
            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full bg-zinc-950/50 relative overflow-hidden border-x border-zinc-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pt-12 border-b border-zinc-800 bg-zinc-900/50">
                    <div>
                        <h2 className="text-2xl font-black text-white">Live Snapshot</h2>
                        <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-bold">Today: {format(new Date(), 'EEEE, MMM d')}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                    {/* Top Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                                    <Flame className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Calories</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-white">{Math.round(stats.calories)}</span>
                                <span className="text-xs text-zinc-500">/ {targetCalories} kcal</span>
                            </div>
                        </div>

                        <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Scale className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Weight</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-white">{stats.weight || clientProfile?.profile?.weight || '--'}</span>
                                <span className="text-xs text-zinc-500">kg</span>
                            </div>
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
                                { label: 'Fat', value: stats.fat, target: targets.fat, color: 'bg-amber-500' },
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

                    {/* Today's Logs */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Utensils className="w-5 h-5 text-emerald-400" />
                            <h3 className="font-bold text-white text-lg">Today's Timeline</h3>
                        </div>

                        <div className="space-y-3">
                            {todayEntries.length === 0 ? (
                                <div className="py-12 text-center bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
                                    <p className="text-sm text-zinc-500">No logs for today yet.</p>
                                </div>
                            ) : (
                                todayEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro').map(entry => (
                                    <div key={entry.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
                                            {(entry as any).emoji || '🍲'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-white truncate">{entry.name}</h4>
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">
                                                {format(entry.timestamp, 'h:mm a')} • {Math.round(entry.calories || 0)} kcal
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-zinc-400">P:{Math.round(entry.protein || 0)} C:{Math.round(entry.carbs || 0)} F:{Math.round(entry.fat || 0)}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
