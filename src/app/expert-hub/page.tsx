'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, orderBy, Timestamp, limit } from 'firebase/firestore';
import { Loader2, ChevronRight, MessageSquare, FileBarChart, UserCircle, Activity, FileText, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import ExpertNotesDialog from '@/components/expert/ExpertNotesDialog';
import LiveSnapshotView from '@/components/expert/LiveSnapshotView';
import type { ExpertClientRelationship, FoodRealityCapture, FoodRealityReport, TimelineEntry } from '@/types';

interface ClientView {
    relationship: ExpertClientRelationship;
    displayName: string;
    email: string;
    avatarUrl?: string;
    captures: FoodRealityCapture[];
    reports: FoodRealityReport[];
}

export default function ExpertHubPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { isDarkMode } = useTheme();

    const [loading, setLoading] = useState(true);
    const [expertId, setExpertId] = useState<string | null>(null);
    const [clients, setClients] = useState<ClientView[]>([]);
    const [selectedClient, setSelectedClient] = useState<ClientView | null>(null);
    const [notesOpen, setNotesOpen] = useState(false);
    const [notesClientId, setNotesClientId] = useState<string | null>(null);
    const [snapshotOpen, setSnapshotOpen] = useState(false);
    const [snapshotClientId, setSnapshotClientId] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchExpertData = async () => {
            try {
                // 1. Resolve expert identity
                const linkSnap = await getDoc(doc(db, 'expertUserLinks', user.uid));
                if (!linkSnap.exists()) {
                    setLoading(false);
                    return; // Not an expert
                }
                const myExpertId = linkSnap.data().expertId;
                setExpertId(myExpertId);

                // 2. Fetch active relationships
                const relsSnap = await getDocs(
                    query(
                        collection(db, 'expertClientRelationships'),
                        where('expertId', '==', myExpertId),
                        where('status', '==', 'active'),
                        where('consentStatus', '==', 'granted')
                    )
                );

                const relationships = relsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ExpertClientRelationship));

                // 3. For each client, fetch profile + captures + reports
                const clientViews: ClientView[] = [];
                for (const rel of relationships) {
                    try {
                        const userSnap = await getDoc(doc(db, 'users', rel.clientUserId));
                        const userData = userSnap.data() || {};

                        // Fetch captures
                        const capturesSnap = await getDocs(
                            query(
                                collection(db, 'foodRealityCaptures'),
                                where('userId', '==', rel.clientUserId),
                                where('sharedWithExpert', '==', true),
                                orderBy('createdAt', 'desc'),
                                limit(5)
                            )
                        );
                        const captures = capturesSnap.docs.map(d => ({ id: d.id, ...d.data() } as FoodRealityCapture));

                        // Fetch reports
                        const reportsSnap = await getDocs(
                            query(
                                collection(db, 'foodRealityReports'),
                                where('userId', '==', rel.clientUserId),
                                where('sharedWithExpert', '==', true),
                                orderBy('createdAt', 'desc'),
                                limit(5)
                            )
                        );
                        const reports = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() } as FoodRealityReport));

                        clientViews.push({
                            relationship: rel,
                            displayName: userData.displayName || 'User',
                            email: userData.email || '',
                            avatarUrl: userData.photoURL,
                            captures,
                            reports,
                        });
                    } catch (e) {
                        console.error(`Failed to fetch client ${rel.clientUserId}:`, e);
                    }
                }

                setClients(clientViews);
            } catch (e) {
                console.error('Expert Hub fetch error:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchExpertData();
    }, [user, authLoading, router, expertId]);

    const handleGenerateReport = async (capture: FoodRealityCapture) => {
        if (!expertId) return;
        
        try {
            setLoading(true);
            
            // 1. Fetch data for the capture window
            const start = new Date(capture.startDate);
            const end = new Date(capture.endDate);
            end.setHours(23, 59, 59, 999);

            const entriesSnap = await getDocs(
                query(
                    collection(db, 'users', capture.userId, 'timelineEntries'),
                    where('timestamp', '>=', Timestamp.fromDate(start)),
                    where('timestamp', '<=', Timestamp.fromDate(end))
                )
            );

            const entries = entriesSnap.docs.map(d => d.data() as TimelineEntry);
            
            // 2. Simple aggregation
            let totalCals = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
            const daysCount = 3; // Captures are always 3 days

            entries.forEach(e => {
                if (e.entryType === 'food' || e.entryType === 'manual_macro') {
                    totalCals += e.calories || 0;
                    totalProtein += e.protein || 0;
                    totalCarbs += e.carbs || 0;
                    totalFat += e.fat || 0;
                }
            });

            const newReport: Partial<FoodRealityReport> = {
                captureId: capture.id,
                userId: capture.userId,
                expertId: expertId,
                relationshipId: `${expertId}_${capture.userId}`,
                createdAt: Timestamp.now(),
                averageCalories: Math.round(totalCals / daysCount),
                averageProtein: Math.round(totalProtein / daysCount),
                averageCarbs: Math.round(totalCarbs / daysCount),
                averageFat: Math.round(totalFat / daysCount),
                loggingConfidence: 'High',
                sharedWithExpert: true,
                userFriendlySummary: "This report provides a 3-day average snapshot of the client's intake.",
            };

            await setDoc(doc(collection(db, 'foodRealityReports')), newReport);
            
            // Refresh data
            window.location.reload();
        } catch (e) {
            console.error('Failed to generate report:', e);
        } finally {
            setLoading(false);
        }
    };


    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!expertId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <h1 className="text-2xl font-black mb-2">Expert Hub</h1>
                    <p className="text-muted-foreground">You are not registered as an expert.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("min-h-screen pb-28", isDarkMode ? "bg-[#0a0a0a]" : "bg-zinc-50")}>
            {/* Header */}
            <div className="pt-14 px-6 pb-6">
                <h1 className="text-3xl font-black tracking-tight">Expert Hub</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {clients.length} {clients.length === 1 ? 'client' : 'clients'} sharing data with you.
                </p>
            </div>

            {/* Client list */}
            <div className="px-4 space-y-3">
                <AnimatePresence>
                    {clients.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <UserCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm">No clients have shared data with you yet.</p>
                        </motion.div>
                    )}

                    {clients.map((client, i) => (
                        <motion.div
                            key={client.relationship.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={cn(
                                "rounded-3xl overflow-hidden border transition-all duration-200",
                                isDarkMode
                                    ? "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                                    : "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm"
                            )}
                        >
                            {/* Client header */}
                            <div
                                className="p-4 flex items-center gap-4 cursor-pointer"
                                onClick={() => setSelectedClient(selectedClient?.relationship.id === client.relationship.id ? null : client)}
                            >
                                {client.avatarUrl ? (
                                    <img src={client.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                                        {client.displayName.charAt(0)}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base truncate">{client.displayName}</h3>
                                    <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                                            Active
                                        </span>
                                        {client.captures.length > 0 && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                                                {client.captures.length} capture{client.captures.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ChevronRight className={cn(
                                    "w-5 h-5 text-muted-foreground/40 transition-transform duration-200",
                                    selectedClient?.relationship.id === client.relationship.id ? "rotate-90" : ""
                                )} />
                            </div>

                            {/* Expanded detail */}
                            <AnimatePresence>
                                {selectedClient?.relationship.id === client.relationship.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className={cn(
                                            "px-4 pb-4 pt-1 border-t space-y-3",
                                            isDarkMode ? "border-zinc-800" : "border-zinc-100"
                                        )}>
                                            {/* Shared categories */}
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold mb-1.5">Shared Data</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {client.relationship.consentedDataCategories.map(cat => (
                                                        <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 dark:bg-white/5 text-muted-foreground font-medium">
                                                            {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Captures */}
                                            {client.captures.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold mb-1.5">Food Reality Captures</p>
                                                    {client.captures.map(cap => (
                                                        <React.Fragment key={cap.id}>
                                                            <div className={cn(
                                                                "flex items-center justify-between p-2 rounded-xl mb-1",
                                                                isDarkMode ? "bg-zinc-800/60" : "bg-zinc-100"
                                                            )}>
                                                                <div>
                                                                    <p className="text-xs font-semibold">{cap.startDate} → {cap.endDate}</p>
                                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter leading-none">3-Day Analysis Window</p>
                                                                    <p className="text-[10px] text-muted-foreground mt-0.5">Source: {cap.source === 'recent_logs' ? 'Recent Logs' : 'Fresh Capture'}</p>
                                                                </div>
                                                                <span className={cn(
                                                                    "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                                                    cap.status === 'completed' ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                                                                )}>
                                                                    {cap.status}
                                                                </span>
                                                            </div>
                                                            {cap.status === 'completed' && !client.reports.find(r => r.captureId === cap.id) && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleGenerateReport(cap); }}
                                                                    className="mt-2 mb-4 w-full py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                    Generate Report for this window
                                                                </button>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            )}

                                         {/* Reports List */}
                                         {client.reports.length > 0 && (
                                             <div>
                                                 <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold mb-1.5 mt-4">Reports Generated</p>
                                                 {client.reports.map(report => (
                                                     <div key={report.id} className={cn(
                                                         "flex items-center justify-between p-3 rounded-xl mb-1",
                                                         isDarkMode ? "bg-zinc-800/60" : "bg-zinc-100"
                                                     )}>
                                                         <div className="flex items-center gap-3">
                                                             <div className="w-8 h-8 rounded-lg bg-[#ffc01f]/10 flex items-center justify-center text-[#ffc01f]">
                                                                 <FileText className="w-4 h-4" />
                                                             </div>
                                                             <div>
                                                                 <p className="text-xs font-bold text-white">Report #{report.id.slice(0, 4)}</p>
                                                                 <p className="text-[10px] text-zinc-500">Created: {report.createdAt instanceof Timestamp ? report.createdAt.toDate().toLocaleDateString() : 'Recent'}</p>
                                                             </div>
                                                         </div>
                                                         <div className="text-right">
                                                             <p className="text-xs font-black text-[#ffc01f]">{report.averageCalories} kcal/day</p>
                                                             <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-tighter">Average Intake</p>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         )}

                                            {/* Action buttons - Aligned like Discover/Ramadan menu */}
                                            <div className="flex flex-wrap justify-center gap-x-5 gap-y-4 pt-6 px-2 border-t border-white/5 max-w-[380px] mx-auto">
                                                <button
                                                    onClick={() => { setNotesClientId(client.relationship.clientUserId); setNotesOpen(true); }}
                                                    className="flex flex-col items-center gap-2 group min-w-[64px]"
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-active:scale-95 shadow-lg shadow-black/10",
                                                        isDarkMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
                                                    )}>
                                                        <MessageSquare className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Notes</span>
                                                </button>

                                                <button
                                                    onClick={() => { setSnapshotClientId(client.relationship.clientUserId); setSnapshotOpen(true); }}
                                                    className="flex flex-col items-center gap-2 group min-w-[64px]"
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-active:scale-95 shadow-lg shadow-emerald-500/10",
                                                        "bg-emerald-500/10 text-emerald-400"
                                                    )}>
                                                        <Activity className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-tight">Snapshot</span>
                                                </button>

                                                <button
                                                    className="flex flex-col items-center gap-2 group min-w-[64px]"
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-active:scale-95 shadow-lg shadow-yellow-500/10",
                                                        "bg-[#ffc01f]/10 text-[#ffc01f]"
                                                    )}>
                                                        <FileBarChart className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-[#ffc01f]/70 uppercase tracking-tight text-center leading-tight">Reports</span>
                                                </button>

                                                <button
                                                    className="flex flex-col items-center gap-2 group min-w-[64px] opacity-40 grayscale"
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-active:scale-95 shadow-lg shadow-black/10",
                                                        isDarkMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
                                                    )}>
                                                        <ChevronRight className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Profile</span>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Live Snapshot Dialog */}
            {snapshotOpen && snapshotClientId && (
                <LiveSnapshotView
                    clientUserId={snapshotClientId}
                    onClose={() => { setSnapshotOpen(false); setSnapshotClientId(null); }}
                />
            )}

            {/* Notes Dialog */}
            {notesOpen && notesClientId && expertId && (
                <ExpertNotesDialog
                    expertId={expertId}
                    clientUserId={notesClientId}
                    relationshipId={`${expertId}_${notesClientId}`}
                    onClose={() => { setNotesOpen(false); setNotesClientId(null); }}
                />
            )}
        </div>
    );
}
