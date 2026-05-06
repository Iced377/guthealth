'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { db } from '@/config/firebase'; // Client SDK for viewing
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle, AlertTriangle, ShieldCheck, Users, MessageSquare, BrainCircuit, Star, Smartphone, Mail, Copy, Sparkles, Rocket, Timer, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ComposedChart, Line, Bar } from 'recharts';
import type { FeedbackSubmission } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BrandTab } from '@/components/admin/BrandTab';
import { AppJourneyTab } from '@/components/admin/AppJourneyTab';
import { ExpertsTab } from '@/components/admin/ExpertsTab';
import { AppleHealthSourceTotalsLog, writeIntegrationDebugFlag } from '@/lib/integration-monitoring';
import { cn } from '../../lib/utils';



interface AdminEvent {
    id: string;
    foodName?: string;
    timestamp?: any;
    flags?: string[];
    suggestedPromptImprovement?: string;
    resolved?: boolean;
    dismissed?: boolean;
    meta?: {
        claimedRisk?: string;
        ingredients?: string;
    };
    [key: string]: any;
}

interface ContactSubmission {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    createdAt: any;
}

interface PerformanceSample {
    id: string;
    ttfrMs: number;
    createdAt: Date | null;
    platform?: string;
    isNative?: boolean;
}

interface AiPerformanceMetric {
    id: string;
    flow: 'write' | 'scan' | 'reuse';
    durationMs: number;
    success: boolean;
    createdAt: Date | null;
}

interface AiTelemetryEvent {
    id: string;
    type: 'recalc_skipped' | 'override_persisted_after_edit' | 'missing_macros' | 'missing_health_tags' | 'hallucination_flagged';
    reason?: string;
    meta?: Record<string, any>;
    timestamp?: any;
}

type UiPlanItem = {
    id: string;
    title: string;
    detail: string;
    deliverable: string;
};

type UiPlanSection = {
    id: string;
    phase: string;
    title: string;
    timeline: string;
    description: string;
    items: UiPlanItem[];
};

const UI_AWARD_PLAN_STORAGE_KEY = 'admin-ui-award-plan-webview-v1';
type UiPlanBatchItem = { id: string; value: boolean };

const UI_AWARD_PLAN_AUTOCOMPLETE_BATCHES: Array<{ key: string; items: UiPlanBatchItem[] }> = [
    {
        key: 'admin-ui-award-plan-autocomplete-v1',
        items: [
            { id: 'award-bar', value: true },
            { id: 'ui-forensics', value: true },
            { id: 'data-language', value: true },
            { id: 'design-system', value: true },
            { id: 'component-rebuild', value: true },
            { id: 'ia-hierarchy', value: true },
            { id: 'chart-upgrade', value: true },
        ],
    },
    {
        key: 'admin-ui-award-plan-autocomplete-v2',
        items: [
            { id: 'chart-upgrade', value: true },
            { id: 'mode-parity', value: true },
        ],
    },
];

const UI_AWARD_PLAN_OVERRIDE_BATCHES: Array<{ key: string; items: UiPlanBatchItem[] }> = [
    {
        key: 'admin-ui-award-plan-override-v1',
        items: [{ id: 'webview-implementation', value: false }],
    },
    {
        key: 'admin-ui-award-plan-override-v2',
        items: [
            { id: 'webview-implementation', value: false },
            { id: 'interaction-pass', value: false },
        ],
    },
];

const UI_AWARD_PLAN_SECTIONS: UiPlanSection[] = [
    {
        id: 'strategy',
        phase: 'Phase 1',
        title: 'Strategy & Criteria',
        timeline: 'Week 0-1',
        description: 'Define what award-winning means and document current drift.',
        items: [
            {
                id: 'award-bar',
                title: 'Define Award Bar rubric',
                detail: 'One-page rubric for hierarchy, data clarity, interaction, and brand coherence.',
                deliverable: 'Award Bar spec with success thresholds.',
            },
            {
                id: 'ui-forensics',
                title: 'Run UI forensics audit',
                detail: 'Inventory every webview component and log inconsistencies across pages.',
                deliverable: 'Audit board + mismatch list.',
            },
        ],
    },
    {
        id: 'foundations',
        phase: 'Phase 2',
        title: 'Data Language & System',
        timeline: 'Week 1-3',
        description: 'Lock the data semantics and build a webview-only design system.',
        items: [
            {
                id: 'data-language',
                title: 'Unify data language',
                detail: 'Single color mapping for metrics and standard target/variance semantics.',
                deliverable: 'Data semantics map + color system.',
            },
            {
                id: 'design-system',
                title: 'Establish webview design system',
                detail: 'Define grid, spacing, typography, and tokens for light + dark parity.',
                deliverable: 'Token sheet + type scale.',
            },
        ],
    },
    {
        id: 'components',
        phase: 'Phase 3',
        title: 'Components & IA',
        timeline: 'Week 3-5',
        description: 'Rebuild UI components and align screen hierarchy.',
        items: [
            {
                id: 'component-rebuild',
                title: 'Rebuild core components',
                detail: 'Clarify roles for stats vs filters vs actions with full states.',
                deliverable: 'Component library with interaction states.',
            },
            {
                id: 'ia-hierarchy',
                title: 'Restructure information hierarchy',
                detail: 'Align each screen to a single narrative flow.',
                deliverable: 'IA diagrams + annotated wireframes.',
            },
        ],
    },
    {
        id: 'charts',
        phase: 'Phase 4',
        title: 'Charts & Mode Parity',
        timeline: 'Week 5-6',
        description: 'Make charts interpretable and light/dark parity exact.',
        items: [
            {
                id: 'chart-upgrade',
                title: 'Upgrade chart system',
                detail: 'Add legends, axes hints, targets, and consistent encoding.',
                deliverable: 'Chart kit + updated specs.',
            },
            {
                id: 'mode-parity',
                title: 'Light/Dark parity check',
                detail: 'Match hierarchy, contrast, and role clarity across modes.',
                deliverable: 'Parity matrix with fixes.',
            },
        ],
    },
    {
        id: 'implementation',
        phase: 'Phase 5',
        title: 'Implementation & Behavior',
        timeline: 'Week 6-7',
        description: 'Ship webview UI updates and lock interaction patterns.',
        items: [
            {
                id: 'webview-implementation',
                title: 'Webview implementation pass',
                detail: 'Apply tokens and components across all webview pages.',
                deliverable: 'Updated webview UI build.',
            },
            {
                id: 'interaction-pass',
                title: 'UX behavior & interaction pass',
                detail: 'Standardize nav states, context cues, and CTA logic.',
                deliverable: 'Interaction behavior map.',
            },
        ],
    },
    {
        id: 'polish',
        phase: 'Phase 6',
        title: 'Polish & QA',
        timeline: 'Week 8-9',
        description: 'Finalize visuals and validate against award bar.',
        items: [
            {
                id: 'visual-polish',
                title: 'Visual polish pass',
                detail: 'Tighten spacing, contrast, and micro-alignment.',
                deliverable: 'Final visual pass.',
            },
            {
                id: 'award-qa',
                title: 'Award Bar QA',
                detail: 'Score each screen and run quick external review.',
                deliverable: 'Final score report + launch greenlight.',
            },
        ],
    },
];

const buildUiPlanState = () => {
    const state: Record<string, boolean> = {};
    UI_AWARD_PLAN_SECTIONS.forEach((section) => {
        section.items.forEach((item) => {
            state[item.id] = false;
        });
    });
    return state;
};

export default function AdminDashboardPage() {
    const { userProfile, loading: authLoading, user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [activeTab, setActiveTab] = useState('journey');
    const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
    const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [acquisitionData, setAcquisitionData] = useState<{ daily: number[], cumulative: number[], labels: string[] }>({ daily: [], cumulative: [], labels: [] });
    const [allUserData, setAllUserData] = useState<{ created: Date; lastSignIn: Date | null }[]>([]);
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'ALL'>('7D');
    const [error, setError] = useState<string | null>(null);
    const [activeUserCount, setActiveUserCount] = useState(0);
    const [performanceSamples, setPerformanceSamples] = useState<PerformanceSample[]>([]);
    const [performanceAvgMs, setPerformanceAvgMs] = useState<number | null>(null);
    const [performanceSeries, setPerformanceSeries] = useState<{ label: string; avgMs: number }[]>([]);
    const [lastPerformanceSample, setLastPerformanceSample] = useState<PerformanceSample | null>(null);
    const [aiPerfMetrics, setAiPerfMetrics] = useState<AiPerformanceMetric[]>([]);
    const [aiTelemetryEvents, setAiTelemetryEvents] = useState<AiTelemetryEvent[]>([]);
    const [aiPerfFlowFilter, setAiPerfFlowFilter] = useState<'write' | 'scan' | 'both'>('both');
    const [integrationDebugEnabled, setIntegrationDebugEnabled] = useState(false);
    const [appleHealthDebugLog, setAppleHealthDebugLog] = useState<AppleHealthSourceTotalsLog | null>(null);
    const [appleHealthDebugHistory, setAppleHealthDebugHistory] = useState<AppleHealthSourceTotalsLog[]>([]);
    const [uiPlanState, setUiPlanState] = useState<Record<string, boolean>>(() => buildUiPlanState());

    useEffect(() => {
        if (!userProfile) return;
        const enabled = !!userProfile.integrationDebug?.appleHealth?.enabled;
        setIntegrationDebugEnabled(enabled);
        writeIntegrationDebugFlag(enabled);
    }, [userProfile]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = window.localStorage.getItem(UI_AWARD_PLAN_STORAGE_KEY);
            if (!stored) return;
            const parsed = JSON.parse(stored) as Record<string, boolean>;
            setUiPlanState((prev) => ({ ...prev, ...parsed }));
        } catch (error) {
            console.warn('[Admin UI Plan] Failed to load checklist state.', error);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            UI_AWARD_PLAN_AUTOCOMPLETE_BATCHES.forEach((batch) => {
                const alreadyApplied = window.localStorage.getItem(batch.key);
                if (alreadyApplied) return;
                setUiPlanState((prev) => {
                    const next = { ...prev };
                    batch.items.forEach((item) => {
                        if (item.id in next) next[item.id] = item.value;
                    });
                    return next;
                });
                window.localStorage.setItem(batch.key, new Date().toISOString());
            });

            UI_AWARD_PLAN_OVERRIDE_BATCHES.forEach((batch) => {
                const alreadyApplied = window.localStorage.getItem(batch.key);
                if (alreadyApplied) return;
                setUiPlanState((prev) => {
                    const next = { ...prev };
                    batch.items.forEach((item) => {
                        if (item.id in next) next[item.id] = item.value;
                    });
                    return next;
                });
                window.localStorage.setItem(batch.key, new Date().toISOString());
            });
        } catch (error) {
            console.warn('[Admin UI Plan] Failed to auto-complete checklist items.', error);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(UI_AWARD_PLAN_STORAGE_KEY, JSON.stringify(uiPlanState));
        } catch (error) {
            console.warn('[Admin UI Plan] Failed to save checklist state.', error);
        }
    }, [uiPlanState]);

    // Data Subscription
    useEffect(() => {
        if (!userProfile?.isAdmin) return;

        // 1. Hallucination Events
        const eventsQuery = query(
            collection(db, 'admin_events'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );
        const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdminEvent[];
            setEvents(data.filter(e => !e.dismissed && !e.resolved));
        }, (err) => {
            console.error("Hallucination Event Subscription Error:", err);
            // Don't set main error state - this is a listener-specific issue
        });

        // 2. Feedback Submissions
        const feedbackQuery = query(
            collection(db, 'feedbackSubmissions'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        const unsubFeedback = onSnapshot(feedbackQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeedbackSubmission[];
            setFeedback(data);
        }, (err) => {
            console.error("Feedback Subscription Error:", err);
        });

        // 3. Contact Submissions
        const contactQuery = query(
            collection(db, 'contact_submissions'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        const unsubContact = onSnapshot(contactQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ContactSubmission[];
            setContactSubmissions(data);
        }, (err) => {
            console.error("Contact Submission Error:", err);
        });

        // 4. App Performance Metrics
        const perfQuery = query(
            collection(db, 'app_performance_metrics'),
            orderBy('createdAt', 'desc'),
            limit(500)
        );
        const unsubPerf = onSnapshot(perfQuery, (snapshot) => {
            const data = snapshot.docs.map(docSnap => {
                const raw = docSnap.data() as any;
                const createdAt = raw.createdAt?.toDate ? raw.createdAt.toDate() : null;
                const ttfrMs = typeof raw.ttfrMs === 'number' ? raw.ttfrMs : null;
                if (ttfrMs === null) return null;
                return {
                    id: docSnap.id,
                    ttfrMs,
                    createdAt,
                    platform: raw.platform,
                    isNative: raw.isNative,
                } as PerformanceSample;
            }).filter(Boolean) as PerformanceSample[];

            setPerformanceSamples(data);
        }, (err) => {
            console.error("Performance Metrics Subscription Error:", err);
        });

        // 5. AI Performance Metrics
        const aiPerfQuery = query(
            collection(db, 'ai_performance_metrics'),
            orderBy('createdAt', 'desc'),
            limit(500)
        );
        const unsubAiPerf = onSnapshot(aiPerfQuery, (snapshot) => {
            const data = snapshot.docs.map(docSnap => {
                const raw = docSnap.data() as any;
                const createdAt = raw.createdAt?.toDate ? raw.createdAt.toDate() : null;
                if (typeof raw.durationMs !== 'number' || !raw.flow) return null;
                return {
                    id: docSnap.id,
                    flow: raw.flow,
                    durationMs: raw.durationMs,
                    success: !!raw.success,
                    createdAt,
                } as AiPerformanceMetric;
            }).filter(Boolean) as AiPerformanceMetric[];
            setAiPerfMetrics(data);
        }, (err) => {
            console.error("AI Performance Metrics Subscription Error:", err);
        });

        // 6. AI Telemetry Events
        const aiTelemetryQuery = query(
            collection(db, 'ai_telemetry_events'),
            orderBy('timestamp', 'desc'),
            limit(200)
        );
        const unsubAiTelemetry = onSnapshot(aiTelemetryQuery, (snapshot) => {
            const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as AiTelemetryEvent[];
            setAiTelemetryEvents(data);
        }, (err) => {
            console.error("AI Telemetry Subscription Error:", err);
        });

        // 4. User Acquisition (Real Data from Auth)
        const fetchAcquisition = async () => {
            setError(null);
            try {
                const { getAuthUsersAction } = await import('@/actions/admin');
                const result = await getAuthUsersAction();

                if (!result.success) {
                    console.error("Acquisition Fetch Failed:", result.error);
                    setError(`${result.error} (Debug: Project=${result.debug?.projectId || 'N/A'}, Key=${result.debug?.hasServiceKey})`);
                    return;
                }

                if (result.users) {
                    console.log("[Admin] Server returned users:", result.users.length);
                    // Debug info if 0 users
                    if (result.users.length === 0) {
                        setError(`Fetched 0 users. (Debug: Project=${result.debug?.projectId || 'N/A'}, Key=${result.debug?.hasServiceKey}). Verify project ID matches production.`);
                    }

                    const parsedUsers = result.users
                        .map(u => {
                            if (!u.creationTime) return null;
                            const created = new Date(u.creationTime);
                            if (isNaN(created.getTime())) return null;

                            let lastSignIn: Date | null = null;
                            if (u.lastSignInTime) {
                                const d = new Date(u.lastSignInTime);
                                if (!isNaN(d.getTime())) lastSignIn = d;
                            }
                            return { created, lastSignIn };
                        })
                        .filter((u): u is { created: Date; lastSignIn: Date | null } => u !== null)
                        .sort((a, b) => a.created.getTime() - b.created.getTime());

                    console.log("[Admin] Valid users parsed:", parsedUsers.length);

                    if (parsedUsers.length > 0) {
                        setAllUserData(parsedUsers);
                    } else {
                        if (result.users.length > 0) {
                            setError(`Failed to parse dates for ${result.users.length} users.`);
                        }
                        setAllUserData([]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch acquisition data:", err);
                setError(String(err));
            }
        };

        fetchAcquisition();
        setLoading(false);

        return () => {
            unsubEvents();
            unsubFeedback();
            unsubContact();
            unsubPerf();
            unsubAiPerf();
            unsubAiTelemetry();
        };
    }, [userProfile]);

    // RESTORED: Recalculate Chart Data when TimeRange or Data changes
    useEffect(() => {
        if (allUserData.length === 0) return;

        console.log(`[Admin] Aggregating ${allUserData.length} users for ${timeRange}`);

        const now = new Date();
        let daysToLookBack = 7;
        let dateFormat = 'EEE'; // Mon, Tue

        switch (timeRange) {
            case '7D': daysToLookBack = 7; dateFormat = 'EEE'; break;
            case '30D': daysToLookBack = 30; dateFormat = 'd MMM'; break;
            case '90D': daysToLookBack = 90; dateFormat = 'd MMM'; break;
            case 'ALL':
                const first = allUserData[0].created;
                const diffTime = Math.abs(now.getTime() - first.getTime());
                daysToLookBack = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                dateFormat = 'MMM yyyy';
                break;
        }

        // Calculate Active Users (users who signed in within the window)
        // If they signed in AT ALL in the window.
        const cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - daysToLookBack);

        const activeCount = allUserData.filter(u => u.lastSignIn && u.lastSignIn >= cutoffDate).length;
        setActiveUserCount(activeCount);


        const labels: string[] = [];
        const dailyCounts: number[] = [];

        const isWeekly = daysToLookBack > 45;
        const bucketCount = isWeekly ? Math.ceil(daysToLookBack / 7) : daysToLookBack;

        const buckets = Array.from({ length: bucketCount }, (_, i) => {
            const d = new Date(now);
            if (isWeekly) {
                d.setDate(d.getDate() - ((bucketCount - 1 - i) * 7));
            } else {
                d.setDate(d.getDate() - (bucketCount - 1 - i));
            }
            d.setHours(0, 0, 0, 0);
            return d;
        });

        buckets.forEach(bucketDate => {
            const nextBucket = new Date(bucketDate);
            if (isWeekly) nextBucket.setDate(bucketDate.getDate() + 7);
            else nextBucket.setDate(bucketDate.getDate() + 1);

            const count = allUserData.filter(u => u.created >= bucketDate && u.created < nextBucket).length;
            dailyCounts.push(count);
            labels.push(format(bucketDate, dateFormat));
        });

        // Cumulative
        let runningTotal = 0;
        const startOfWindow = buckets[0];
        if (startOfWindow) {
            runningTotal = allUserData.filter(u => u.created < startOfWindow).length;
        }

        const cumulativeCounts = dailyCounts.map(count => {
            runningTotal += count;
            return runningTotal;
        });

        setAcquisitionData({ daily: dailyCounts, cumulative: cumulativeCounts, labels });

    }, [allUserData, timeRange]);

    const aiPerfSummary = React.useMemo(() => {
        const flows: Array<'write' | 'scan' | 'reuse'> = ['write', 'scan', 'reuse'];
        const summary = flows.map(flow => {
            const items = aiPerfMetrics.filter(m => m.flow === flow);
            const avgMs = items.length ? Math.round(items.reduce((acc, m) => acc + m.durationMs, 0) / items.length) : null;
            const successRate = items.length ? Math.round((items.filter(m => m.success).length / items.length) * 100) : null;
            return { flow, count: items.length, avgMs, successRate };
        });
        const recalcSkipped = aiTelemetryEvents.filter(e => e.type === 'recalc_skipped').length;
        const overridePersisted = aiTelemetryEvents.filter(e => e.type === 'override_persisted_after_edit').length;
        const missingMacros = aiTelemetryEvents.filter(e => e.type === 'missing_macros').length;
        const missingHealthTags = aiTelemetryEvents.filter(e => e.type === 'missing_health_tags').length;
        const hallucinationFlagged = aiTelemetryEvents.filter(e => e.type === 'hallucination_flagged').length;
        return { summary, recalcSkipped, overridePersisted, missingMacros, missingHealthTags, hallucinationFlagged };
    }, [aiPerfMetrics, aiTelemetryEvents]);

    const aiLatencySeries = React.useMemo(() => {
        const filtered = aiPerfMetrics.filter(m => {
            if (aiPerfFlowFilter === 'both') return m.flow === 'write' || m.flow === 'scan';
            return m.flow === aiPerfFlowFilter;
        });

        const buckets: Record<string, { date: string; totalMs: number; count: number }> = {};
        filtered.forEach(metric => {
            if (!metric.createdAt) return;
            const key = format(metric.createdAt, 'yyyy-MM-dd');
            if (!buckets[key]) {
                buckets[key] = { date: key, totalMs: 0, count: 0 };
            }
            buckets[key].totalMs += metric.durationMs;
            buckets[key].count += 1;
        });

        return Object.values(buckets)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(row => ({
                label: format(new Date(row.date), 'MMM d'),
                avgMs: row.count ? Math.round(row.totalMs / row.count) : 0,
                count: row.count
            }));
    }, [aiPerfMetrics, aiPerfFlowFilter]);

    useEffect(() => {
        if (performanceSamples.length === 0) {
            setPerformanceAvgMs(null);
            setPerformanceSeries([]);
            setLastPerformanceSample(null);
            return;
        }

        const latest = [...performanceSamples].sort((a, b) => {
            const at = a.createdAt ? a.createdAt.getTime() : 0;
            const bt = b.createdAt ? b.createdAt.getTime() : 0;
            return bt - at;
        })[0];
        setLastPerformanceSample(latest || null);

        const sum = performanceSamples.reduce((acc, s) => acc + s.ttfrMs, 0);
        const avg = Math.round(sum / performanceSamples.length);
        setPerformanceAvgMs(avg);

        const days = 30;
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - (days - 1));
        start.setHours(0, 0, 0, 0);

        const buckets = new Map<string, { label: string; sum: number; count: number }>();
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const key = format(d, 'yyyy-MM-dd');
            buckets.set(key, { label: format(d, 'MMM d'), sum: 0, count: 0 });
        }

        performanceSamples.forEach(sample => {
            if (!sample.createdAt) return;
            if (sample.createdAt < start) return;
            const key = format(sample.createdAt, 'yyyy-MM-dd');
            const bucket = buckets.get(key);
            if (!bucket) return;
            bucket.sum += sample.ttfrMs;
            bucket.count += 1;
        });

        const series = Array.from(buckets.values()).map(b => ({
            label: b.label,
            avgMs: b.count ? Math.round(b.sum / b.count) : 0
        }));

        setPerformanceSeries(series);
    }, [performanceSamples]);

    const uiPlanTotalItems = UI_AWARD_PLAN_SECTIONS.reduce((acc, section) => acc + section.items.length, 0);
    const uiPlanCompletedItems = UI_AWARD_PLAN_SECTIONS.reduce(
        (acc, section) => acc + section.items.filter((item) => uiPlanState[item.id]).length,
        0
    );
    const uiPlanCompletionPct = uiPlanTotalItems ? Math.round((uiPlanCompletedItems / uiPlanTotalItems) * 100) : 0;

    const handleUiPlanToggle = (id: string, checked: boolean | 'indeterminate') => {
        setUiPlanState((prev) => ({ ...prev, [id]: Boolean(checked) }));
    };

    const handleResolve = async (id: string) => {
        await updateDoc(doc(db, 'admin_events', id), {
            resolved: true // One way transition usually? Or toggle. Let's make it strict Resolve.
        });
    };

    const handleDismiss = async (id: string) => {
        if (confirm("Dismiss this event? It will be hidden from the feed.")) {
            await updateDoc(doc(db, 'admin_events', id), {
                dismissed: true
            });
        }
    };

    const handleArchiveContact = async (id: string) => {
        if (confirm("Archive this message?")) {
            await updateDoc(doc(db, 'contact_submissions', id), {
                status: 'archived'
            });
        }
    };

    const handleIntegrationDebugToggle = async (checked: boolean) => {
        if (!user?.uid) return;
        setIntegrationDebugEnabled(checked);
        writeIntegrationDebugFlag(checked);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                'integrationDebug.appleHealth.enabled': checked,
                'integrationDebug.appleHealth.updatedAt': Timestamp.now()
            });
            toast({
                title: checked ? 'Integration monitoring enabled' : 'Integration monitoring disabled',
                description: 'Apple Health step sync will store per-source totals for this account.'
            });
        } catch (error) {
            console.error('Failed to update integration debug flag:', error);
            toast({ title: 'Failed to update setting', variant: 'destructive' });
        }
    };

    const refreshIntegrationDebugData = async () => {
        if (!user?.uid) return;
        try {
            const logsRef = collection(db, 'users', user.uid, 'integration_debug_logs');
            const logsQuery = query(logsRef, orderBy('loggedAt', 'desc'), limit(20));
            const snapshot = await getDocs(logsQuery);
            const data = snapshot.docs.map((docSnap) => {
                const raw = docSnap.data() as any;
                const loggedAt = raw.loggedAt?.toDate ? raw.loggedAt.toDate() : null;
                const timestamp = raw.timestamp || (loggedAt ? loggedAt.toISOString() : '');
                return {
                    id: docSnap.id,
                    label: raw.label,
                    timestamp,
                    rawTotal: raw.rawTotal || 0,
                    dedupedTotal: raw.dedupedTotal || 0,
                    sampleCount: raw.sampleCount || 0,
                    sources: raw.sources || [],
                } as AppleHealthSourceTotalsLog;
            });
            setAppleHealthDebugHistory(data);
            setAppleHealthDebugLog(data[0] || null);
        } catch (error) {
            console.error('Failed to refresh integration debug data:', error);
        }
    };

    const handleClearIntegrationHistory = async () => {
        if (!user?.uid) return;
        try {
            const logsRef = collection(db, 'users', user.uid, 'integration_debug_logs');
            const logsQuery = query(logsRef, orderBy('loggedAt', 'desc'), limit(50));
            const snapshot = await getDocs(logsQuery);
            await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
            setAppleHealthDebugHistory([]);
            setAppleHealthDebugLog(null);
            toast({ title: 'Integration logs cleared' });
        } catch (error) {
            console.error('Failed to clear integration logs:', error);
            toast({ title: 'Failed to clear logs', variant: 'destructive' });
        }
    };

    useEffect(() => {
        if (!user?.uid) return;
        const logsRef = collection(db, 'users', user.uid, 'integration_debug_logs');
        const logsQuery = query(logsRef, orderBy('loggedAt', 'desc'), limit(20));
        const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            const data = snapshot.docs.map((docSnap) => {
                const raw = docSnap.data() as any;
                const loggedAt = raw.loggedAt?.toDate ? raw.loggedAt.toDate() : null;
                const timestamp = raw.timestamp || (loggedAt ? loggedAt.toISOString() : '');
                return {
                    id: docSnap.id,
                    label: raw.label,
                    timestamp,
                    rawTotal: raw.rawTotal || 0,
                    dedupedTotal: raw.dedupedTotal || 0,
                    sampleCount: raw.sampleCount || 0,
                    sources: raw.sources || [],
                } as AppleHealthSourceTotalsLog;
            });
            setAppleHealthDebugHistory(data);
            setAppleHealthDebugLog(data[0] || null);
        }, (error) => {
            console.error('Integration logs subscription error:', error);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    if (authLoading || !userProfile?.isAdmin) {
        return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    // Helper for rendering charts
    const maxDaily = Math.max(...acquisitionData.daily, 5); // Avoid div by zero
    const maxCumulative = Math.max(...acquisitionData.cumulative, 10);
    const formatLogTimestamp = (value?: string, pattern: string = 'PPpp') => {
        if (!value) return 'Unknown';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Unknown';
        return format(parsed, pattern);
    };

    return (
        <div className="min-h-screen bg-black/95 text-white font-sans px-4 md:px-8 pb-96 pt-16 md:pt-8">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Admin Hub
                    </h1>
                    <p className="text-white/50">Mission Control</p>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                {/* Scrollable Tab Band */}
                <div className="w-full overflow-x-auto pb-2 scrollbar-none">
                    <TabsList className="bg-white/5 border-white/10 p-1 h-auto flex justify-start rounded-xl gap-2 w-max min-w-full">
                        <TabsTrigger value="journey" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-300 py-3 px-6 h-auto gap-2 flex-col md:flex-row items-center justify-center min-w-[100px]">
                            <Rocket className="w-5 h-5 md:w-4 md:h-4" />
                            <span>Journey</span>
                        </TabsTrigger>

                        <TabsTrigger value="ui-plan" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 py-3 px-6 h-auto gap-2 flex-col md:flex-row items-center justify-center min-w-[120px]">
                            <ListTodo className="w-5 h-5 md:w-4 md:h-4" />
                            <span>UI Plan</span>
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-200 border-0 text-[10px] px-1.5">
                                {uiPlanCompletedItems}/{uiPlanTotalItems}
                            </Badge>
                        </TabsTrigger>

                        <TabsTrigger value="ai" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 py-3 px-6 h-auto gap-2 flex-col md:flex-row items-center justify-center min-w-[100px]">
                            <BrainCircuit className="w-5 h-5 md:w-4 md:h-4" />
                            <span>AI Perf.</span>
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-0 text-[10px] px-1.5">{events.filter(e => !e.resolved).length}</Badge>
                        </TabsTrigger>

                        <TabsTrigger value="feedback" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 py-3 px-6 h-auto gap-2 flex-col md:flex-row items-center justify-center min-w-[100px]">
                            <MessageSquare className="w-5 h-5 md:w-4 md:h-4" />
                            <span>Feedback</span>
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-0 text-[10px] px-1.5">{feedback.length}</Badge>
                        </TabsTrigger>

                        <TabsTrigger value="contact" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300 py-3 px-6 h-auto gap-2 flex-col md:flex-row items-center justify-center min-w-[100px]">
                            <Mail className="w-5 h-5 md:w-4 md:h-4" />
                            <span>Contact</span>
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-0 text-[10px] px-1.5">{contactSubmissions.length}</Badge>
                        </TabsTrigger>

                        <TabsTrigger value="acquisition" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 py-3 px-6 h-auto gap-2 flex-col md:flex-row items-center justify-center min-w-[100px]">
                            <Users className="w-5 h-5 md:w-4 md:h-4" />
                            <span>Growth</span>
                        </TabsTrigger>

                        <TabsTrigger value="experts" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 py-3 px-6 h-auto gap-2 flex-col md:flex-row items-center justify-center min-w-[100px]">
                            <Star className="w-5 h-5 md:w-4 md:h-4" />
                            <span>Experts</span>
                        </TabsTrigger>

                        <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 py-3 px-6 h-auto gap-2 flex-col md:flex-row items-center justify-center min-w-[100px]">
                            <Timer className="w-5 h-5 md:w-4 md:h-4" />
                            <span>App Perf</span>
                        </TabsTrigger>

                        <TabsTrigger value="integrations" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 py-3 px-6 h-auto gap-2 flex-col md:flex-row items-center justify-center min-w-[140px]">
                            <Smartphone className="w-5 h-5 md:w-4 md:h-4" />
                            <span>Integration Monitoring</span>
                        </TabsTrigger>

                        <TabsTrigger value="brand" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300 py-3 px-6 h-auto gap-2 flex-col md:flex-row items-center justify-center min-w-[100px]">
                            <Sparkles className="w-5 h-5 md:w-4 md:h-4" />
                            <span>Brand Kit</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Journey Tab */}
                <TabsContent value="journey" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <AppJourneyTab />
                </TabsContent>

                <TabsContent value="experts" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ExpertsTab />
                </TabsContent>

                <TabsContent value="ui-plan" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-white">Award-Level UI Overhaul Plan</CardTitle>
                                    <CardDescription className="text-white/50">
                                        Tick off each step to bring light + dark webview modes to award-winning scores.
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-200 border-0">
                                    {uiPlanCompletionPct}% complete
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <span className="text-white/70">Progress</span>
                                    <span className="text-white">{uiPlanCompletedItems} / {uiPlanTotalItems} steps</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full bg-emerald-400" style={{ width: `${uiPlanCompletionPct}%` }} />
                                </div>
                                <p className="text-xs text-white/50">Scope: Webview only. Applies to both light and dark modes.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {UI_AWARD_PLAN_SECTIONS.map((section) => (
                                    <div key={section.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">{section.phase}</div>
                                                <div className="text-lg font-semibold text-white">{section.title}</div>
                                                <div className="text-xs text-white/50">{section.description}</div>
                                            </div>
                                            <Badge variant="secondary" className="bg-white/10 text-white/70 border-0 text-[10px] px-2">
                                                {section.timeline}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            {section.items.map((item) => {
                                                const isDone = uiPlanState[item.id];
                                                const checkboxId = `ui-plan-${item.id}`;
                                                return (
                                                    <div key={item.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
                                                        <Checkbox
                                                            id={checkboxId}
                                                            checked={isDone}
                                                            onCheckedChange={(checked) => handleUiPlanToggle(item.id, checked)}
                                                            className="mt-1 border-white/40 data-[state=checked]:bg-emerald-400 data-[state=checked]:text-black data-[state=checked]:border-emerald-400"
                                                        />
                                                        <div className="space-y-1">
                                                            <Label
                                                                htmlFor={checkboxId}
                                                                className={`text-sm font-medium cursor-pointer ${isDone ? 'text-white/50 line-through' : 'text-white'}`}
                                                            >
                                                                {item.title}
                                                            </Label>
                                                            <p className={`text-xs ${isDone ? 'text-white/40' : 'text-white/60'}`}>
                                                                {item.detail}
                                                            </p>
                                                            <p className="text-[11px] text-white/40">Deliverable: {item.deliverable}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Brand Tab */}
                <TabsContent value="brand" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <BrandTab onClose={() => setActiveTab('journey')} />
                </TabsContent>

                <TabsContent value="integrations" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm uppercase tracking-wider text-emerald-200">Integration Monitoring</CardTitle>
                            <CardDescription className="text-white/40">Debug step sync issues across data sources.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                <div className="space-y-1">
                                    <Label className="text-white">Log Apple Health step totals by source</Label>
                                    <p className="text-xs text-white/50">
                                        When enabled, Apple Health sync stores per-source totals and raw vs deduped steps for this account only.
                                    </p>
                                </div>
                                <Switch checked={integrationDebugEnabled} onCheckedChange={handleIntegrationDebugToggle} />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" variant="secondary" onClick={refreshIntegrationDebugData}>
                                    Refresh Data
                                </Button>
                                <Button size="sm" variant="ghost" className="text-white/60" onClick={handleClearIntegrationHistory}>
                                    Clear Logs
                                </Button>
                            </div>

                            {appleHealthDebugLog ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                            <div className="text-xs text-white/50">Last Sync</div>
                                            <div className="text-sm text-white">
                                                {formatLogTimestamp(appleHealthDebugLog.timestamp)}
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                            <div className="text-xs text-white/50">Day</div>
                                            <div className="text-sm text-white">{appleHealthDebugLog.label}</div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                            <div className="text-xs text-white/50">Samples</div>
                                            <div className="text-sm text-white">{appleHealthDebugLog.sampleCount}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                            <div className="text-xs text-white/50">Raw Total (sum of sources)</div>
                                            <div className="text-lg text-white">{appleHealthDebugLog.rawTotal.toLocaleString()} steps</div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                            <div className="text-xs text-white/50">Deduped Total (hourly max)</div>
                                            <div className="text-lg text-white">{appleHealthDebugLog.dedupedTotal.toLocaleString()} steps</div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                        <div className="text-xs uppercase tracking-wide text-white/50">Sources (Top 10)</div>
                                        <div className="mt-3 space-y-2">
                                            {appleHealthDebugLog.sources.slice(0, 10).map((source) => (
                                                <div key={source.source} className="flex items-center justify-between text-sm text-white">
                                                    <span className="truncate pr-3">{source.source}</span>
                                                    <span className="font-mono">{source.steps.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {appleHealthDebugHistory.length > 1 && (
                                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                            <div className="text-xs uppercase tracking-wide text-white/50">Recent Syncs</div>
                                            <div className="mt-3 space-y-2">
                                                {appleHealthDebugHistory.slice(0, 5).map((entry) => (
                                                    <div key={entry.id} className="flex items-center justify-between text-xs text-white/70">
                                                        <span className="truncate pr-3">
                                                            {entry.label} · {formatLogTimestamp(entry.timestamp, 'PP')}
                                                        </span>
                                                        <span className="font-mono">{entry.dedupedTotal.toLocaleString()} steps</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-xs text-white/50 border border-white/10 rounded-xl p-4">
                                    No Apple Health debug data yet. Enable the toggle and re-sync steps to capture a sample.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AI Performance Tab (God View) */}
                <TabsContent value="ai" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-x-hidden">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="min-w-0">
                                    <CardTitle className="text-sm uppercase tracking-wider text-purple-200">AI Latency + Volume</CardTitle>
                                    <CardDescription className="text-white/40">Average latency (line) and prompt count (bars)</CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant={aiPerfFlowFilter === 'write' ? 'default' : 'ghost'}
                                        className={aiPerfFlowFilter === 'write' ? 'bg-purple-500/30 text-purple-100' : 'text-white/50'}
                                        onClick={() => setAiPerfFlowFilter('write')}
                                    >
                                        Write
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={aiPerfFlowFilter === 'scan' ? 'default' : 'ghost'}
                                        className={aiPerfFlowFilter === 'scan' ? 'bg-purple-500/30 text-purple-100' : 'text-white/50'}
                                        onClick={() => setAiPerfFlowFilter('scan')}
                                    >
                                        Scan
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={aiPerfFlowFilter === 'both' ? 'default' : 'ghost'}
                                        className={aiPerfFlowFilter === 'both' ? 'bg-purple-500/30 text-purple-100' : 'text-white/50'}
                                        onClick={() => setAiPerfFlowFilter('both')}
                                    >
                                        Both
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {aiLatencySeries.length === 0 ? (
                                <div className="text-white/30 italic p-6 text-center border border-white/5 rounded-xl">No AI perf data yet.</div>
                            ) : (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={aiLatencySeries}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                            <XAxis dataKey="label" tick={{ fill: '#ffffff80', fontSize: 11 }} />
                                            <YAxis yAxisId="left" tick={{ fill: '#ffffff80', fontSize: 11 }} />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                allowDecimals={false}
                                                tickFormatter={(value) => Math.round(Number(value))}
                                                tick={{ fill: '#ffffff80', fontSize: 11 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ background: '#111', border: '1px solid #ffffff20', borderRadius: 8 }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                            <Bar yAxisId="right" dataKey="count" fill="#7c3aed55" radius={[6, 6, 0, 0]} />
                                            <Line yAxisId="left" type="monotone" dataKey="avgMs" stroke="#a855f7" strokeWidth={2} dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {aiPerfSummary.summary.map((row) => (
                            <Card key={row.flow} className="bg-white/5 border-white/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm uppercase tracking-wider text-purple-200">{row.flow} flow</CardTitle>
                                    <CardDescription className="text-white/40">AI latency + reliability</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="text-2xl font-semibold text-white">
                                        {row.avgMs !== null ? `${row.avgMs} ms` : '—'}
                                    </div>
                                    <div className="text-xs text-white/50">Samples: {row.count}</div>
                                    <div className="text-xs text-white/50">Success: {row.successRate !== null ? `${row.successRate}%` : '—'}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm uppercase tracking-wider text-purple-200">Recalc Skips</CardTitle>
                                <CardDescription className="text-white/40">Edits that skipped re-analysis</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold text-white">{aiPerfSummary.recalcSkipped}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm uppercase tracking-wider text-purple-200">Override Persist</CardTitle>
                                <CardDescription className="text-white/40">Overrides kept after edits</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold text-white">{aiPerfSummary.overridePersisted}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm uppercase tracking-wider text-purple-200">Missing Macros</CardTitle>
                                <CardDescription className="text-white/40">AI returned null macros</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold text-white">{aiPerfSummary.missingMacros}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm uppercase tracking-wider text-purple-200">Missing Health Tags</CardTitle>
                                <CardDescription className="text-white/40">Fiber/Gut/Keto tags missing</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold text-white">{aiPerfSummary.missingHealthTags}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm uppercase tracking-wider text-purple-200">Hallucinations</CardTitle>
                                <CardDescription className="text-white/40">Critic flagged issues</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold text-white">{aiPerfSummary.hallucinationFlagged}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-purple-200">AI Telemetry Feed</h2>
                    </div>
                    <div className="grid gap-3">
                        {aiTelemetryEvents.length === 0 && (
                            <div className="text-white/30 italic p-6 text-center border border-white/5 rounded-xl">No telemetry events recorded yet.</div>
                        )}
                        {aiTelemetryEvents.slice(0, 10).map(event => (
                            <Card key={event.id} className="bg-white/5 border-white/10">
                                <CardHeader className="pb-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <CardTitle className="text-sm text-white break-words">{event.type}</CardTitle>
                                        <span className="text-xs text-white/40 font-mono">
                                            {event.timestamp?.toDate ? format(event.timestamp.toDate(), 'PP p') : 'Just now'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {event.reason && <div className="text-xs text-white/60">Reason: {event.reason}</div>}
                                    {event.meta && (
                                        <div className="text-xs text-white/40 font-mono mt-2 break-all whitespace-pre-wrap">
                                            {JSON.stringify(event.meta, null, 2)}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-purple-300 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5" /> Hallucination Feed
                        </h2>
                    </div>

                    <div className="grid gap-4">
                        {events.length === 0 && <div className="text-white/30 italic p-8 text-center border border-white/5 rounded-xl">No hallucinations recorded yet.</div>}
                        {events.map(event => (
                            <Card key={event.id} className={`bg-white/5 border-white/10 ${event.resolved || event.dismissed ? 'opacity-50 hidden' : ''}`}>
                                {/* Hide resolved/dismissed to keep feed clean? Or just dim? Let's dim + filter in query properly later. For now, client filter. */}

                                <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <AlertTriangle className="text-yellow-500 w-5 h-5" />
                                        <CardTitle className="text-lg font-mono text-white break-words">
                                            {event.foodName}
                                        </CardTitle>
                                    </div>
                                    <span className="text-xs text-white/40 font-mono">
                                        {event.timestamp?.toDate ? format(event.timestamp.toDate(), 'PP p') : 'Just now'}
                                    </span>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-xs uppercase tracking-wider text-white/40 mb-2">Critic Flags</h3>
                                                <div className="flex flex-col gap-1">
                                                    {event.flags?.map((flag, i) => (
                                                        <Badge key={i} variant="destructive" className="w-fit">
                                                            {flag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* AI Coaching / Suggestion */}
                                            {event.suggestedPromptImprovement && (
                                                <div className="animate-in fade-in slide-in-from-left-2 duration-500 delay-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="text-xs uppercase tracking-wider text-purple-300 flex items-center gap-1">
                                                            <BrainCircuit className="w-3 h-3" /> Suggested Fix
                                                        </h3>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-purple-300 hover:text-white hover:bg-purple-500/20"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(event.suggestedPromptImprovement || "");
                                                                toast({ title: "Copied!", description: "Fix copied to clipboard." });
                                                            }}
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg text-sm text-purple-200">
                                                        "{event.suggestedPromptImprovement}"
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-xs uppercase tracking-wider text-white/40">Context</h3>
                                            <div className="text-sm text-white/70 font-mono bg-black/30 p-3 rounded-lg border border-white/5 h-full break-words whitespace-pre-wrap">
                                                <p><span className="text-white/30">Claim:</span> {event.meta?.claimedRisk}</p>
                                                <p><span className="text-white/30">Ingredients:</span> {event.meta?.ingredients}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-white/40 hover:text-white hover:bg-white/10"
                                            onClick={() => handleDismiss(event.id)}
                                        >
                                            Dismiss
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleResolve(event.id)}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" /> Mark Resolved
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Feedback Tab */}
                <TabsContent value="feedback" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-blue-300 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" /> User Feedback
                        </h2>
                        <Badge variant="outline" className="text-blue-200 border-blue-500/30">
                            {feedback.length} Submissions
                        </Badge>
                    </div>

                    {/* Feedback Analysis Chart & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Card className="bg-white/5 border-white/10 p-4 flex flex-col items-center justify-center relative overflow-hidden h-[340px]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50" />
                            <h3 className="text-sm font-bold text-white/50 mb-4 uppercase tracking-widest w-full text-center">Quality Metrics (Avg)</h3>

                            <div className="h-full w-full">
                                {feedback.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="90%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                            { subject: 'Speed', A: feedback.reduce((acc, f) => acc + (f.ratings?.speed || 0), 0) / (feedback.filter(f => f.ratings?.speed).length || 1), fullMark: 5 },
                                            { subject: 'Convenience', A: feedback.reduce((acc, f) => acc + (f.ratings?.convenience || 0), 0) / (feedback.filter(f => f.ratings?.convenience).length || 1), fullMark: 5 },
                                            { subject: 'Accuracy', A: feedback.reduce((acc, f) => acc + (f.ratings?.accuracy || 0), 0) / (feedback.filter(f => f.ratings?.accuracy).length || 1), fullMark: 5 },
                                            { subject: 'Usability', A: feedback.reduce((acc, f) => acc + (f.ratings?.usability || 0), 0) / (feedback.filter(f => f.ratings?.usability).length || 1), fullMark: 5 },
                                            { subject: 'Performance', A: feedback.reduce((acc, f) => acc + (f.ratings?.performance || 0), 0) / (feedback.filter(f => f.ratings?.performance).length || 1), fullMark: 5 },
                                        ]}>
                                            <PolarGrid stroke="#ffffff30" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff80', fontSize: 10 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                            <Radar
                                                name="Average"
                                                dataKey="A"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                fill="#3b82f6"
                                                fillOpacity={0.4}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-white/20 text-sm">No ratings yet</div>
                                )}
                            </div>
                        </Card>

                        <div className="grid grid-cols-2 gap-4 h-[340px]">
                            {/* Stats Cards (Mini) */}
                            {['Speed', 'Convenience', 'Accuracy', 'Usability'].map(metric => {
                                const key = metric.toLowerCase() as keyof typeof feedback[0]['ratings'];
                                const valid = feedback.filter(f => f.ratings?.[key] !== undefined && f.ratings?.[key] !== null);
                                const avg = valid.length ? (valid.reduce((a, b) => a + (Number(b.ratings?.[key]) || 0), 0) / valid.length).toFixed(1) : '-';
                                return (
                                    <Card key={metric} className="bg-white/5 border-white/10 p-4 flex flex-col justify-center items-center">
                                        <span className="text-white/40 text-xs uppercase mb-1">{metric}</span>
                                        <div className="text-2xl font-bold text-white flex items-center gap-1">
                                            {avg} <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {feedback.length === 0 && <div className="text-white/30 italic p-8 text-center border border-white/5 rounded-xl">No feedback received.</div>}
                        {feedback.map(item => (
                            <Card key={item.id} className="bg-white/5 border-white/10">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={item.type === 'bug' ? 'destructive' : item.type === 'feature' ? 'default' : 'secondary'}>
                                                {item.type}
                                            </Badge>
                                            <span className="text-xs text-white/50">
                                                v{item.appVersion} • {item.deviceContext.platform}
                                            </span>
                                        </div>
                                        <span className="text-xs text-white/40">
                                            {item.createdAt?.toDate ? format(item.createdAt.toDate(), 'PP p') : 'Just now'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {item.freeform && (
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-sm italic text-white/90">
                                            "{item.freeform}"
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {Object.entries(item.ratings || {}).map(([key, val]) => (
                                            val !== null && (
                                                <div key={key} className="flex flex-col items-center bg-black/20 p-2 rounded">
                                                    <span className="text-[10px] uppercase text-white/40">{key}</span>
                                                    <div className="flex items-center gap-1 text-yellow-400 font-bold">
                                                        {Number(val)} <Star className="w-3 h-3 fill-yellow-400" />
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Contact Messages Tab */}
                <TabsContent value="contact" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-orange-300 flex items-center gap-2">
                            <Mail className="w-5 h-5" /> Contact Submissions
                        </h2>
                        <Badge variant="outline" className="text-orange-200 border-orange-500/30">
                            {contactSubmissions.length} Messages
                        </Badge>
                    </div>

                    <div className="grid gap-4">
                        {contactSubmissions.length === 0 && <div className="text-white/30 italic p-8 text-center border border-white/5 rounded-xl">No messages yet.</div>}
                        {contactSubmissions.map(msg => (
                            <Card key={msg.id} className={`bg-white/5 border-white/10 ${msg.status === 'archived' ? 'opacity-50' : ''}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-white">{msg.subject}</CardTitle>
                                            <CardDescription className="text-white/60 flex items-center gap-2 mt-1">
                                                <span className="font-mono text-orange-200">{msg.name}</span>
                                                <span className="text-white/30">•</span>
                                                <span className="text-white/40">{msg.email}</span>
                                            </CardDescription>
                                        </div>
                                        <span className="text-xs text-white/40 font-mono">
                                            {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'PP p') : 'Just now'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 bg-black/20 rounded-lg border border-white/5 text-sm text-white/90 whitespace-pre-wrap">
                                        {msg.message}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-white/40 hover:text-white hover:bg-white/10"
                                            onClick={() => handleArchiveContact(msg.id)}
                                            disabled={msg.status === 'archived'}
                                        >
                                            {msg.status === 'archived' ? 'Archived' : 'Archive'}
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => window.open(`mailto:${msg.email}?subject=Re: ${msg.subject}`)}
                                        >
                                            <Mail className="w-4 h-4 mr-2" /> Reply
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Acquisition Tab */}
                <TabsContent value="acquisition" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-green-300 flex items-center gap-2">
                            <Users className="w-5 h-5" /> Growth & Stats
                        </h2>

                        <div className="bg-white/5 p-1 rounded-lg flex items-center gap-1 border border-white/10">
                            {(['7D', '30D', '90D', 'ALL'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${timeRange === range
                                        ? 'bg-green-500/20 text-green-300 shadow-sm border border-green-500/10'
                                        : 'text-white/40 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-200 text-sm mb-4 flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            <span>Error loading records: {error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                            <CardHeader>
                                <CardTitle className="text-4xl font-bold text-green-400">
                                    {allUserData.length}
                                </CardTitle>
                                <CardDescription className="text-green-200/50">Total Users</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                            <CardHeader>
                                <CardTitle className="text-4xl font-bold text-blue-400">
                                    +{acquisitionData.daily.reduce((a, b) => a + b, 0)}
                                </CardTitle>
                                <CardDescription className="text-blue-200/50">New ({timeRange})</CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                            <CardHeader>
                                <CardTitle className="text-4xl font-bold text-purple-400">{activeUserCount}</CardTitle>
                                <CardDescription className="text-purple-200/50">Active Users ({timeRange})</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 h-64">
                        <Card className="bg-white/5 border-white/10 p-4">
                            <h3 className="text-sm text-white/50 mb-4">New Users ({timeRange === 'ALL' || timeRange === '90D' ? 'Weekly' : 'Daily'})</h3>
                            {/* Daily Bar Chart */}
                            <div className="flex items-end justify-between h-40 gap-1 pt-4">
                                {acquisitionData.daily.length > 0 ? acquisitionData.daily.map((count, i) => (
                                    <div key={i} className="w-full bg-green-500/10 hover:bg-green-500/20 rounded-t transition-all relative group h-full flex items-end">
                                        <div
                                            style={{ height: `${Math.max(5, (count / (Math.max(...acquisitionData.daily, 1))) * 100)}%` }}
                                            className="w-full bg-green-500 rounded-t opacity-60 group-hover:opacity-100 transition-opacity relative"
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded border border-white/10 whitespace-nowrap z-50 pointer-events-none">
                                                {count} users<br />
                                                <span className="text-white/50">{acquisitionData.labels[i]}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">No data in range</div>
                                )}
                            </div>
                        </Card>
                        <Card className="bg-white/5 border-white/10 p-4">
                            <h3 className="text-sm text-white/50 mb-4">Cumulative Growth</h3>
                            {/* Cumulative Line Chart (SVG) */}
                            <div className="relative h-40 w-full overflow-hidden flex items-end">
                                {acquisitionData.cumulative.length > 0 ? (
                                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 0.5 }} />
                                                <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0 }} />
                                            </linearGradient>
                                        </defs>
                                        {/* Generate path d */}
                                        {(() => {
                                            const points = acquisitionData.cumulative.map((val, i) => {
                                                const x = (i / (acquisitionData.cumulative.length - 1)) * 100;
                                                const y = 100 - ((val / maxCumulative) * 100);
                                                return `${x} ${y}`;
                                            });
                                            const linePath = `M ${points.join(' L ')}`;
                                            const areaPath = `${linePath} L 100 100 L 0 100 Z`; // Close the loop
                                            return (
                                                <>
                                                    <path d={areaPath} fill="url(#grad)" />
                                                    <path d={linePath} stroke="#a855f7" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
                                                </>
                                            );
                                        })()}
                                    </svg>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">Loading data...</div>
                                )}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* App Performance Tab */}
                <TabsContent value="performance" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-cyan-300 flex items-center gap-2">
                                <Timer className="w-5 h-5" /> App Performance Metrics
                            </h2>
                            <p className="text-white/50 text-sm">Tracking time to first render across all sessions.</p>
                        </div>
                        <div className="text-xs text-white/40">
                            Samples: {performanceSamples.length}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-white/5 border-white/10 overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-white/80 text-sm uppercase tracking-wide">Avg Time To First Render</CardTitle>
                                <CardDescription className="text-white/40">All users & sessions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-white">
                                    {performanceAvgMs !== null ? `${performanceAvgMs} ms` : '—'}
                                </div>
                                <div className="text-white/50 text-xs mt-2">
                                    {performanceAvgMs !== null ? `${(performanceAvgMs / 1000).toFixed(2)}s` : 'No data yet'}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10 overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-white/80 text-sm uppercase tracking-wide">Native vs Web</CardTitle>
                                <CardDescription className="text-white/40">Sample distribution</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/60">Native</span>
                                    <span className="text-white font-semibold">
                                        {performanceSamples.filter(s => s.isNative).length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-2">
                                    <span className="text-white/60">Web</span>
                                    <span className="text-white font-semibold">
                                        {performanceSamples.filter(s => !s.isNative).length}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10 overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-white/80 text-sm uppercase tracking-wide">30D Trend</CardTitle>
                                <CardDescription className="text-white/40">Daily avg (ms)</CardDescription>
                            </CardHeader>
                            <CardContent className="text-white/60 text-sm">
                                {performanceSeries.length > 0 ? 'Live chart below' : 'No recent data'}
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/10 overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-white/80 text-sm uppercase tracking-wide">Last Reading</CardTitle>
                                <CardDescription className="text-white/40">Most recent TTFR sample</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    {lastPerformanceSample ? `${lastPerformanceSample.ttfrMs} ms` : '—'}
                                </div>
                                <div className="text-white/50 text-xs mt-2">
                                    {lastPerformanceSample?.createdAt ? format(lastPerformanceSample.createdAt, 'PP p') : 'No data yet'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-white/5 border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white">Average Time To First Render</CardTitle>
                            <CardDescription className="text-white/50">Rolling 30 days</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[320px]">
                            {performanceSeries.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceSeries}>
                                        <defs>
                                            <linearGradient id="ttfrGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
                                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={8} />
                                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0b0b0f', border: '1px solid #1f2937', borderRadius: '8px' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                                            formatter={(value: any) => [`${value} ms`, 'Avg TTF Render']}
                                        />
                                        <Area type="monotone" dataKey="avgMs" stroke="#22d3ee" fillOpacity={1} fill="url(#ttfrGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-white/40">No data available.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
