'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/config/firebase';
import {
    collection,
    query,
    orderBy,
    where,
    Timestamp,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    addDoc,
    getDoc,
    deleteDoc,
    writeBatch
} from 'firebase/firestore';
import type { TimelineEntry, UserProfile, LoggedFoodItem, Symptom, SymptomLog, LoggedSymptom, PedometerLog, FitbitLog } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay } from 'date-fns';
import type { AnalyzeFoodItemOutput, FoodFODMAPProfile } from '@/ai/flows/fodmap-detection';
import { isSimilarToSafeFoods, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
import { useFitbitSync } from '@/hooks/useFitbitSync';
import type { SimplifiedFoodLogFormValues } from '@/components/food-logging/SimplifiedAddFoodDialog';
import type { IdentifiedPhotoData } from '@/components/food-logging/IdentifyFoodByPhotoDialog';
import { triggerFoodAnalysis, triggerTextFoodAnalysis, logAdminEvent, logAiPerformanceMetric, logAiTelemetryEvent } from '@/actions/food-analysis';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';


const _generateFallbackFodmapProfile = (foodName: string): FoodFODMAPProfile => {
    let hash = 0;
    for (let i = 0; i < foodName.length; i++) {
        const char = foodName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    const pseudoRandom = (seed: number) => {
        let x = Math.sin(seed) * 10000;
        return parseFloat((x - Math.floor(x)).toFixed(1)) * 2;
    };
    return {
        fructans: pseudoRandom(hash + 1),
        galactans: pseudoRandom(hash + 2),
        polyolsSorbitol: pseudoRandom(hash + 3),
        polyolsMannitol: pseudoRandom(hash + 4),
        lactose: pseudoRandom(hash + 5),
        fructose: pseudoRandom(hash + 6),
    };
};

const getFavoriteKey = (item: LoggedFoodItem) => {
    const base = (item.originalName || item.name || '').trim().toLowerCase();
    return base || item.id;
};

export interface SymptomLogTriggerContext {
    type: 'meal' | 'checkin' | 'delayed';
    mealId?: string;
    mealName?: string;
    mealTimestamp?: Date;
}

interface ActionContextType {
    // Data
    timelineEntries: TimelineEntry[];
    userProfile: UserProfile | null;
    isDataLoading: boolean;
    isLoadingAi: Record<string, boolean>;

    // Dialog States
    isSimplifiedAddFoodDialogOpen: boolean;
    openSimplifiedAddFoodDialog: () => void;
    closeSimplifiedAddFoodDialog: () => void;

    isIdentifyByPhotoDialogOpen: boolean;
    openIdentifyByPhotoDialog: () => void;
    closeIdentifyByPhotoDialog: () => void;

    isSymptomLogDialogOpen: boolean;
    symptomLogContext: SymptomLogTriggerContext | undefined;
    openSymptomLogDialog: (context?: SymptomLogTriggerContext) => void;
    closeSymptomLogDialog: () => void;

    isAddManualMacroDialogOpen: boolean;
    openAddManualMacroDialog: () => void;
    closeAddManualMacroDialog: () => void;

    isLogPreviousMealDialogOpen: boolean;
    openLogPreviousMealDialog: () => void;
    closeLogPreviousMealDialog: () => void;

    isAddFoodDialogOpen: boolean;
    openAddFoodDialog: () => void;
    closeAddFoodDialog: () => void;

    // Vitals Dialog
    isAddVitalsDialogOpen: boolean;
    vitalsDialogDate: Date; // The date we are adding/editing vitals for
    // Vitals Dialog State
    initialVitalsWeight?: number | null;
    initialVitalsSteps?: number | null;
    initialVitalsFatPercent?: number | null;
    openAddVitalsDialog: (date: Date, currentWeight?: number | null, currentSteps?: number | null, currentFat?: number | null) => void;
    closeAddVitalsDialog: () => void;
    handleLogVitals: (weight: number | null, steps: number | null, fatPercent: number | null, date: Date) => Promise<void>;

    isReleaseNotesOpen: boolean;
    openReleaseNotes: () => void;
    closeReleaseNotes: () => void;

    // Editing
    editingItem: LoggedFoodItem | null;
    setEditingItem: (item: LoggedFoodItem | null) => void;
    handleEditTimelineEntry: (item: LoggedFoodItem) => void;
    // Actions
    updateEntryTimestamp: (entryId: string, newTimestamp: Date) => Promise<void>;
    handleSubmitMealDescription: (formData: SimplifiedFoodLogFormValues, override: boolean, date?: Date) => Promise<void>;
    handleProcessAndLogPhotoIdentification: (data: IdentifiedPhotoData, date?: Date) => Promise<void>;
    handleSubmitManualMacroEntry: (data: any, date?: Date) => Promise<void>;
    handleLogSymptoms: (symptoms: LoggedSymptom[], notes?: string, severity?: number, linkedIds?: string[], experiencedAt?: Date, triggerContext?: any) => Promise<void>;
    handleSetFoodFeedback: (id: string, feedback: 'safe' | 'unsafe' | null) => Promise<void>;
    handleToggleFavoriteFoodItem: (id: string, isFav: boolean) => Promise<void>;
    handleRemoveTimelineEntry: (id: string) => Promise<void>;
    handleRepeatMeal: (item: LoggedFoodItem) => Promise<void>;
    handleSubmitClassicFoodItem: (data: any, date?: Date) => Promise<void>;

    // Previous Meal Date State
    selectedLogTimestampForPreviousMeal: Date | undefined;
    setSelectedLogTimestampForPreviousMeal: (d: Date | undefined) => void;

    lastAddedItem: { id: string, date: Date } | null;
    setLastAddedItem: (item: { id: string, date: Date } | null) => void;

    // Dashboard timeline window (iOS perf)
    setTimelineWindowAnchor: (date: Date) => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export const useActionContext = () => {
    const context = useContext(ActionContext);
    if (!context) {
        throw new Error('useActionContext must be used within an ActionProvider');
    }
    return context;
};

const initialGuestProfile: UserProfile = {
    uid: 'guest-user',
    email: null,
    displayName: 'Guest User',
    safeFoods: [],
    premium: false,
};

const TEMPORARILY_UNLOCK_ALL_FEATURES = true;
const PREMIUM_INITIAL_DAYS = 3;

export const ActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user: authUser, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const { syncFitbit } = useFitbitSync();

    // Trigger Fitbit Sync on User Load
    useEffect(() => {
        if (authUser && !authLoading) {
            // We give it a small delay to not block critical initial rendering
            const timer = setTimeout(() => {
                syncFitbit();
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [authUser, authLoading, syncFitbit]);

    const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile>(initialGuestProfile);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});

    const [isSimplifiedAddFoodDialogOpen, setIsSimplifiedAddFoodDialogOpenState] = useState(false);
    const [isIdentifyByPhotoDialogOpen, setIsIdentifyByPhotoDialogOpenState] = useState(false);
    const [isSymptomLogDialogOpen, setIsSymptomLogDialogOpenState] = useState(false);
    const [symptomLogContext, setSymptomLogContext] = useState<SymptomLogTriggerContext | undefined>(undefined);
    const [isAddManualMacroDialogOpen, setIsAddManualMacroDialogOpenState] = useState(false);
    const [isLogPreviousMealDialogOpen, setIsLogPreviousMealDialogOpenState] = useState(false);
    const [isAddFoodDialogOpen, setIsAddFoodDialogOpenState] = useState(false);
    const [isAddVitalsDialogOpen, setIsAddVitalsDialogOpenState] = useState(false);
    const [vitalsDialogDate, setVitalsDialogDate] = useState<Date>(new Date());
    const [initialVitalsWeight, setInitialVitalsWeight] = useState<number | null>(null);
    const [initialVitalsSteps, setInitialVitalsSteps] = useState<number | null>(null);
    const [initialVitalsFatPercent, setInitialVitalsFatPercent] = useState<number | null>(null);

    const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);

    const [editingItem, setEditingItem] = useState<LoggedFoodItem | null>(null);
    const [selectedLogTimestampForPreviousMeal, setSelectedLogTimestampForPreviousMeal] = useState<Date | undefined>(undefined);
    const [lastAddedItem, setLastAddedItem] = useState<{ id: string, date: Date } | null>(null);

    const pathname = usePathname();
    const isIOS = typeof window !== 'undefined' && Capacitor.getPlatform() === 'ios';
    const unsubscribeTimelineRef = useRef<null | (() => void)>(null);
    const subscribeLimitedRef = useRef<null | (() => void)>(null);
    const subscribeFullRef = useRef<null | (() => void)>(null);
    const activeTimelineModeRef = useRef<'limited' | 'full' | null>(null);
    const [timelineWindowAnchor, setTimelineWindowAnchorState] = useState<Date>(new Date());
    const timelineWindowAnchorRef = useRef<Date>(timelineWindowAnchor);

    const openAddVitalsDialog = useCallback((date: Date, currentWeight?: number | null, currentSteps?: number | null, currentFat?: number | null) => {
        setVitalsDialogDate(date);
        setInitialVitalsWeight(currentWeight ?? null);
        setInitialVitalsSteps(currentSteps ?? null);
        setInitialVitalsFatPercent(currentFat ?? null);
        setIsAddVitalsDialogOpenState(true);
    }, []);
    const closeAddVitalsDialog = useCallback(() => setIsAddVitalsDialogOpenState(false), []);

    const openSimplifiedAddFoodDialog = useCallback(() => {
        setEditingItem(null);
        setSelectedLogTimestampForPreviousMeal(undefined);
        setIsSimplifiedAddFoodDialogOpenState(true);
    }, []);
    const closeSimplifiedAddFoodDialog = useCallback(() => setIsSimplifiedAddFoodDialogOpenState(false), []);

    const openIdentifyByPhotoDialog = useCallback(() => {
        setEditingItem(null);
        setSelectedLogTimestampForPreviousMeal(undefined);
        setIsIdentifyByPhotoDialogOpenState(true);
    }, []);
    const closeIdentifyByPhotoDialog = useCallback(() => setIsIdentifyByPhotoDialogOpenState(false), []);

    const openSymptomLogDialog = useCallback((context?: SymptomLogTriggerContext) => {
        setSymptomLogContext(context);
        setIsSymptomLogDialogOpenState(true);
    }, []);
    const closeSymptomLogDialog = useCallback(() => {
        setIsSymptomLogDialogOpenState(false);
        setSymptomLogContext(undefined);
    }, []);

    const openAddManualMacroDialog = useCallback(() => setIsAddManualMacroDialogOpenState(true), []);
    const closeAddManualMacroDialog = useCallback(() => setIsAddManualMacroDialogOpenState(false), []);

    const openLogPreviousMealDialog = useCallback(() => {
        setSelectedLogTimestampForPreviousMeal(new Date());
        setIsLogPreviousMealDialogOpenState(true);
    }, []);
    const closeLogPreviousMealDialog = useCallback(() => setIsLogPreviousMealDialogOpenState(false), []);

    const openAddFoodDialog = useCallback(() => setIsAddFoodDialogOpenState(true), []);
    const closeAddFoodDialog = useCallback(() => setIsAddFoodDialogOpenState(false), []);

    const openReleaseNotes = useCallback(() => setIsReleaseNotesOpen(true), []);
    const closeReleaseNotes = useCallback(() => setIsReleaseNotesOpen(false), []);

    const setTimelineWindowAnchor = useCallback((date: Date) => {
        const normalized = new Date(date);
        normalized.setHours(12, 0, 0, 0);
        timelineWindowAnchorRef.current = normalized;
        setTimelineWindowAnchorState(normalized);
    }, []);

    const handleLogVitals = async (weight: number | null, steps: number | null, fatPercent: number | null, date: Date) => {
        // Prepare batch updates mainly for steps cleanup
        // Note: Firestore batch is good but for ActionContext we often do single writes.
        // Let's do parallel awaits for simplicity.

        // 1. WEIGHT & FAT
        if (weight !== null || fatPercent !== null) {
            console.log('--- Handle Log Vitals Debug ---');
            console.log('Input Date:', date);
            console.log('Input Weight:', weight);
            console.log('Input Fat:', fatPercent);

            // Check for existing Fitbit/Weight log for this day to preserve fatPercent or other data
            const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
            console.log('Query Window:', startOfDay.toISOString(), 'to', endOfDay.toISOString());

            const existingWeightLog = timelineEntries.find(log =>
                log.entryType === 'fitbit_data' &&
                log.timestamp >= startOfDay &&
                log.timestamp <= endOfDay
            ) as FitbitLog | undefined;

            const weightLogId = existingWeightLog ? existingWeightLog.id : `fitbit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // MERGE & BACKFILL WEIGHT LOGIC
            // If user did NOT provide weight (null), we must try to keep existing or find previous to ensure graph continuity.
            let weightToSave = weight;

            if (weightToSave === null) {
                // Case 1: Use existing log for this day
                if (existingWeightLog?.weight) {
                    weightToSave = existingWeightLog.weight;
                } else {
                    // Case 2: Backfill from most recent previous log
                    // Sort by time desc
                    const sorted = [...timelineEntries]
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

                    const previousWeightLog = sorted.find(e =>
                        e.entryType === 'fitbit_data' &&
                        ('weight' in e) &&
                        (e as any).weight > 0 &&
                        e.timestamp < startOfDay // Strictly before today
                    ) as FitbitLog | undefined;

                    if (previousWeightLog) {
                        console.log('Found Previous Weight for Backfill:', previousWeightLog.weight);
                        weightToSave = previousWeightLog.weight ?? null;
                    } else {
                        console.log('No Previous Weight Found for Backfill');
                    }
                    // Case 3: No history? Leave null (will be valid entry but no dots on weight graph, avoiding 0 dip)
                }
            }
            console.log('Final Weight To Save:', weightToSave);
            console.log('Final Fat To Save:', fatPercent ?? existingWeightLog?.fatPercent);


            // Merge with existing data if available (preserving fatPercent)
            const weightEntry: FitbitLog = {
                id: weightLogId,
                timestamp: date, // Update timestamp to now (or kept date)
                entryType: 'fitbit_data',
                weight: weightToSave ?? existingWeightLog?.weight,
                fatPercent: fatPercent ?? existingWeightLog?.fatPercent, // Update fat if provided, else keep existing
                steps: existingWeightLog?.steps ?? undefined, // Preserve existing steps in this doc if any (rare)
                caloriesBurned: existingWeightLog?.caloriesBurned ?? undefined
            };

            if (authUser) {
                await submitToFirebase(weightEntry, weightLogId);
            } else {
                if (existingWeightLog) {
                    setTimelineEntries(prev => prev.map(e => e.id === weightLogId ? weightEntry : e));
                } else {
                    setTimelineEntries(prev => [weightEntry, ...prev]);
                }
            }
        }

        // 2. STEPS
        if (steps !== null) {
            // Calculate Auto Steps for the day
            const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

            const dayPedometerLogs = timelineEntries.filter(log =>
                log.entryType === 'pedometer_data' &&
                log.timestamp >= startOfDay &&
                log.timestamp <= endOfDay
            ) as PedometerLog[];

            const autoLogs = dayPedometerLogs.filter(l => l.source !== 'manual');
            const autoSteps = autoLogs.length ? Math.max(...autoLogs.map(l => l.steps)) : 0;

            // Our target is 'steps'. Manual adjustment needed = Target - Auto.
            // If Target < Auto, we technically need negative manual steps to correct it? 
            // Or we assume manual override implies "This is the real value".
            // Adding a negative steps entry might be confusing but mathematically correct for sum.
            const manualStepsNeeded = Math.round(steps - autoSteps);

            // Cleanup old manual entries for this day to avoid accumulation
            const oldManualLogs = dayPedometerLogs.filter(l => l.source === 'manual');

            // Local cleanup
            setTimelineEntries(prev => prev.filter(p => !oldManualLogs.some(old => old.id === p.id)));

            if (authUser) {
                // Delete old manual logs from Firebase
                for (const oldLog of oldManualLogs) {
                    await deleteDoc(doc(db, 'users', authUser.uid, 'timelineEntries', oldLog.id));
                }
            }

            // Create new manual entry
            const stepsLogId = `pedometer-manual-${Date.now()}`;
            const manualTimestamp = new Date(date);
            const now = new Date();
            manualTimestamp.setHours(
                now.getHours(),
                now.getMinutes(),
                now.getSeconds(),
                now.getMilliseconds()
            );
            const stepsEntry: PedometerLog = {
                id: stepsLogId,
                timestamp: manualTimestamp,
                entryType: 'pedometer_data',
                steps: manualStepsNeeded, // Can be negative effectively
                source: 'manual',
                distance: 0, // Ignore distance for manual override
                activeEnergy: 0,
                syncedAt: now
            };

            // Add new
            if (authUser) {
                await submitToFirebase(stepsEntry, stepsLogId);
            } else {
                setTimelineEntries(prev => [stepsEntry, ...prev]);
            }
        }

        toast({ title: "Health Data Updated" });
        setIsAddVitalsDialogOpenState(false);
    };

    const handleEditTimelineEntry = useCallback((itemToEdit: LoggedFoodItem) => {
        setEditingItem(itemToEdit);
        if (itemToEdit.entryType === 'manual_macro') {
            setIsAddManualMacroDialogOpenState(true);
        } else if (itemToEdit.entryType === 'food') {
            const isAIProcessed = itemToEdit.sourceDescription &&
                (itemToEdit.sourceDescription !== "Manually logged" &&
                    itemToEdit.sourceDescription !== "Manually logged (analysis failed)");

            if (isAIProcessed || itemToEdit.sourceDescription?.startsWith("Identified by photo")) {
                setIsSimplifiedAddFoodDialogOpenState(true);
            } else {
                setIsAddFoodDialogOpenState(true);
            }
        }
    }, []);

    useEffect(() => {
        // timeline subscription is managed via unsubscribeTimelineRef
        let isCancelled = false;

        const setupData = async () => {
            setIsDataLoading(true);
            if (authLoading) return;

            if (authUser) {
                const userDocRef = doc(db, 'users', authUser.uid);
                try {
                    const userDocSnap = await getDoc(userDocRef);

                    if (isCancelled) return; // Prevent proceeding if effect cleaned up

                    let currentIsPremium = false;
                    let profileData = initialGuestProfile;

                    if (userDocSnap.exists()) {
                        const data = userDocSnap.data();
                        currentIsPremium = data.premium || false;
                        profileData = {
                            uid: authUser.uid,
                            email: authUser.email,
                            displayName: authUser.displayName,
                            safeFoods: data.safeFoods || [],
                            premium: currentIsPremium,
                            isAdmin: data.isAdmin === true,
                            profile: data.profile,
                        };
                        setUserProfile(profileData);
                    } else {
                        profileData = {
                            ...initialGuestProfile,
                            uid: authUser.uid,
                            email: authUser.email,
                            displayName: authUser.displayName,
                        };
                        await setDoc(userDocRef, profileData);
                        setUserProfile(profileData);
                    }

                    console.log('SetupData: Auth User UID:', authUser.uid);
                    console.log('SetupData: Is Premium:', currentIsPremium);

                    const timelineEntriesColRef = collection(db, 'users', authUser.uid, 'timelineEntries');
                    let q;
                    if (TEMPORARILY_UNLOCK_ALL_FEATURES || currentIsPremium) {
                        if (isIOS) {
                            const anchor = timelineWindowAnchorRef.current ?? new Date();
                            const windowStart = new Date(anchor);
                            windowStart.setDate(windowStart.getDate() - 6);
                            windowStart.setHours(0, 0, 0, 0);
                            const windowEnd = new Date(anchor);
                            windowEnd.setDate(windowEnd.getDate() + 1);
                            windowEnd.setHours(23, 59, 59, 999);
                            q = query(
                                timelineEntriesColRef,
                                orderBy('timestamp', 'desc'),
                                where('timestamp', '>=', Timestamp.fromDate(windowStart)),
                                where('timestamp', '<=', Timestamp.fromDate(windowEnd))
                            );
                        } else {
                            const initialWindowStart = new Date();
                            initialWindowStart.setDate(initialWindowStart.getDate() - PREMIUM_INITIAL_DAYS);
                            console.log(`SetupData: Premium initial window ${PREMIUM_INITIAL_DAYS} days`);
                            q = query(
                                timelineEntriesColRef,
                                orderBy('timestamp', 'desc'),
                                where('timestamp', '>=', Timestamp.fromDate(initialWindowStart))
                            );
                        }
                    } else {
                        const twoDaysAgo = new Date();
                        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                        console.log('SetupData: Querying last 2 days');
                        q = query(
                            timelineEntriesColRef,
                            orderBy('timestamp', 'desc'),
                            where('timestamp', '>=', Timestamp.fromDate(twoDaysAgo))
                        );
                    }

                    if (isCancelled) return;

                    const subscribeWithQuery = (queryRef: ReturnType<typeof query>) => {
                        if (unsubscribeTimelineRef.current) {
                            unsubscribeTimelineRef.current();
                        }
                        unsubscribeTimelineRef.current = onSnapshot(queryRef, (snapshot) => {
                            const fetchedEntries: TimelineEntry[] = snapshot.docs.map(docSnap => {
                                const data = docSnap.data();
                                return {
                                    ...data,
                                    id: docSnap.id,
                                    timestamp: (data.timestamp as Timestamp).toDate(),
                                    ...(data.favoriteLastUsedAt ? { favoriteLastUsedAt: (data.favoriteLastUsedAt as Timestamp).toDate() } : {}),
                                    ...(data.syncedAt ? { syncedAt: (data.syncedAt as Timestamp).toDate() } : {})
                                } as TimelineEntry;
                            });
                            setTimelineEntries(fetchedEntries);
                            setIsDataLoading(false);
                        }, (error) => {
                            // Ignore permission errors that happen during logout
                            if (error.code === 'permission-denied') {
                                console.log("Timeline snapshot permission denied (likely logout).");
                            } else {
                                console.error("Timeline snapshot error:", error);
                            }
                            setIsDataLoading(false);
                        });
                    };

                    subscribeLimitedRef.current = () => {
                        if (isCancelled) return;
                        if (TEMPORARILY_UNLOCK_ALL_FEATURES || currentIsPremium) {
                            if (isIOS) {
                                const anchor = timelineWindowAnchorRef.current ?? new Date();
                                const windowStart = new Date(anchor);
                                windowStart.setDate(windowStart.getDate() - 6);
                                windowStart.setHours(0, 0, 0, 0);
                                const windowEnd = new Date(anchor);
                                windowEnd.setDate(windowEnd.getDate() + 1);
                                windowEnd.setHours(23, 59, 59, 999);
                                const rollingQuery = query(
                                    timelineEntriesColRef,
                                    orderBy('timestamp', 'desc'),
                                    where('timestamp', '>=', Timestamp.fromDate(windowStart)),
                                    where('timestamp', '<=', Timestamp.fromDate(windowEnd))
                                );
                                subscribeWithQuery(rollingQuery);
                                return;
                            }
                        }
                        subscribeWithQuery(q);
                    };

                    if (TEMPORARILY_UNLOCK_ALL_FEATURES || currentIsPremium) {
                        const fullQuery = query(timelineEntriesColRef, orderBy('timestamp', 'desc'));
                        subscribeFullRef.current = () => {
                            if (isCancelled) return;
                            console.log('SetupData: Hydrating full premium history');
                            subscribeWithQuery(fullQuery);
                        };
                    } else {
                        subscribeFullRef.current = null;
                    }

                    activeTimelineModeRef.current = 'limited';
                    subscribeLimitedRef.current?.();

                } catch (error) {
                    console.error("Error setting up user data:", error);
                    setIsDataLoading(false);
                }
            } else {
                setUserProfile(initialGuestProfile);
                setTimelineEntries([]);
                setIsDataLoading(false);
                subscribeLimitedRef.current = null;
                subscribeFullRef.current = null;
                activeTimelineModeRef.current = null;
                if (unsubscribeTimelineRef.current) {
                    unsubscribeTimelineRef.current();
                    unsubscribeTimelineRef.current = null;
                }
            }
        };

        setupData();

        return () => {
            isCancelled = true;
            if (unsubscribeTimelineRef.current) {
                unsubscribeTimelineRef.current();
                unsubscribeTimelineRef.current = null;
            }
        };
    }, [authUser, authLoading]);

    useEffect(() => {
        if (!subscribeLimitedRef.current) return;

        const allowFullHistory = !isIOS
            || (pathname?.startsWith('/trends') || pathname?.startsWith('/insights') || pathname?.startsWith('/admin'));

        const nextMode: 'limited' | 'full' = (allowFullHistory && subscribeFullRef.current) ? 'full' : 'limited';
        if (activeTimelineModeRef.current === nextMode) return;

        activeTimelineModeRef.current = nextMode;
        const run = nextMode === 'full'
            ? subscribeFullRef.current
            : subscribeLimitedRef.current;

        if (!run) return;

        if (nextMode === 'full') {
            const delayMs = 3500;
            const timer = setTimeout(() => {
                if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                    (window as any).requestIdleCallback(() => run(), { timeout: 2500 });
                } else {
                    run();
                }
            }, delayMs);
            return () => clearTimeout(timer);
        }

        run();
    }, [pathname, isIOS, authUser]);

    useEffect(() => {
        if (!subscribeLimitedRef.current) return;
        if (activeTimelineModeRef.current !== 'limited') return;

        const timer = setTimeout(() => {
            subscribeLimitedRef.current?.();
        }, 200);

        return () => clearTimeout(timer);
    }, [timelineWindowAnchor]);

    // Auto-verify backfill for recent items (User Experience)
    useEffect(() => {
        if (!authUser || isDataLoading) return;

        const unverifiedItems = timelineEntries.filter(e =>
            e.entryType === 'food' &&
            (e as LoggedFoodItem).fodmapData &&
            !(e as LoggedFoodItem).verificationResult &&
            isSameDay(e.timestamp, new Date())
        ) as LoggedFoodItem[];

        unverifiedItems.forEach(item => {
            // Rate limit? Just do one at a time or all? 
            // Let's do it safely.
            (async () => {
                const { verifyFoodAnalysisFlow } = await import('@/ai/flows/verify-food-analysis');
                const fodmapAnalysis = item.fodmapData!;
                const verification = await verifyFoodAnalysisFlow({
                    foodItemName: item.name,
                    ingredients: item.ingredients,
                    portionSize: item.portionSize,
                    portionUnit: item.portionUnit,
                    claimedFodmapRisk: fodmapAnalysis.overallRisk,
                    claimedReason: fodmapAnalysis.reason,
                    claimedKetoScore: fodmapAnalysis.ketoFriendliness?.score ?? 'Unknown',
                    userId: authUser.uid,
                    entryId: item.id,
                    claimedHealthTags: {
                        isGutHealthy: fodmapAnalysis.gutBacteriaImpact?.sentiment === 'Positive'
                    },
                    macros: {
                        calories: fodmapAnalysis.calories ?? null,
                        protein: fodmapAnalysis.protein ?? null,
                        carbs: fodmapAnalysis.carbs ?? null,
                        fat: fodmapAnalysis.fat ?? null
                    }
                });
                if (verification) {
                    const docRef = doc(db, 'users', authUser.uid, 'timelineEntries', item.id);
                    setDoc(docRef, { verificationResult: verification }, { merge: true });
                }
            })().catch(e => console.error("Backfill verification failed", e));
        });
    }, [timelineEntries, authUser, isDataLoading]);

    const submitToFirebase = async (item: any, id: string, merge = true) => {
        if (authUser && authUser.uid !== 'guest-user') {
            const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', id);
            const { id: _, ...itemToSave } = item;
            await setDoc(docRefPath, {
                ...itemToSave,
                timestamp: Timestamp.fromDate(item.timestamp),
                ...(item.syncedAt ? { syncedAt: Timestamp.fromDate(item.syncedAt) } : {})
            }, { merge });
        }
    };

    const handleRemoveTimelineEntry = async (entryId: string) => {
        const entryToRemove = timelineEntries.find(entry => entry.id === entryId);

        if (authUser && authUser.uid !== 'guest-user') {
            try {
                await deleteDoc(doc(db, 'users', authUser.uid, 'timelineEntries', entryId));
                toast({ title: "Entry Removed", description: "The timeline entry has been deleted." });
            } catch (error) {
                console.error("Error removing timeline entry:", error);
                toast({ title: "Error Removing Entry", description: "Could not remove entry from cloud.", variant: "destructive" });
            }
        } else {
            setTimelineEntries(prev => prev.filter(e => e.id !== entryId));
            toast({ title: "Entry Removed (Locally)" });
        }
    };

    const handleRepeatMeal = async (itemToRepeat: LoggedFoodItem) => {
        const newItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newTimestamp = new Date();
        const shouldBumpFavorite = itemToRepeat.isFavorite === true;

        // 1. Create Optimistic Item immediately
        const optimisticItem: LoggedFoodItem = {
            id: newItemId,
            timestamp: newTimestamp,
            entryType: 'food',

            // Use existing data as "placeholder" but clear analysis-specifics if we plan to re-analyze
            // Actually, for "Repeat", the user expects the SAME data. 
            // If we re-analyze, it's to refresh it, but we can show the old data as the "optimistic" state!
            // This is even better than "Processing...".
            name: itemToRepeat.name,
            originalName: itemToRepeat.originalName,
            ingredients: itemToRepeat.ingredients,
            portionSize: itemToRepeat.portionSize,
            portionUnit: itemToRepeat.portionUnit,
            sourceDescription: itemToRepeat.sourceDescription,

            // Re-use current macros/fodmaps as placeholder? 
            // If we are re-analyzing, they might change.
            // But showing them fading/loading is nice.
            // Let's assume we want to "Copy" initially.
            calories: itemToRepeat.calories,
            protein: itemToRepeat.protein,
            carbs: itemToRepeat.carbs,
            fat: itemToRepeat.fat,

            fodmapData: itemToRepeat.fodmapData,
            isSimilarToSafe: itemToRepeat.isSimilarToSafe,
            userFodmapProfile: itemToRepeat.userFodmapProfile,

            userFeedback: null,
            macrosOverridden: itemToRepeat.macrosOverridden ?? false,
            isFavorite: false,
        };

        if (shouldBumpFavorite) {
            setTimelineEntries(prev => prev.map(entry => entry.id === itemToRepeat.id ? { ...entry, favoriteLastUsedAt: newTimestamp } : entry));
            if (authUser) {
                updateDoc(doc(db, 'users', authUser.uid, 'timelineEntries', itemToRepeat.id), {
                    favoriteLastUsedAt: Timestamp.fromDate(newTimestamp)
                }).catch(() => {
                    // Non-blocking: ignore failures to update last-used.
                });
            }
        }

        // 2. Commit Optimistic State
        setTimelineEntries(prev => [optimisticItem, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        if (authUser) await submitToFirebase(optimisticItem, newItemId);

        toast({ title: "Meal Added", description: "Analyzing for updates..." }); // Immediate feedback

        // 3. Trigger Re-analysis (Background)
        setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));

        const repeatStartTime = performance.now();
        let didAnalyzeRepeat = false;
        let repeatSuccess = true;
        try {
            let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
            let similarityOutput: FoodSimilarityOutput | undefined;
            let mealDescriptionOutput;
            let processedFoodItem;

            if (itemToRepeat.sourceDescription && !itemToRepeat.sourceDescription.startsWith("Identified by photo") && itemToRepeat.sourceDescription !== "Manually logged") {
                didAnalyzeRepeat = true;
                const { processMealDescription } = await import('@/ai/flows/process-meal-description-flow');
                const { analyzeFoodItem } = await import('@/ai/flows/fodmap-detection');

                mealDescriptionOutput = await processMealDescription({ mealDescription: itemToRepeat.sourceDescription });
                fodmapAnalysis = await analyzeFoodItem({
                    foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis,
                    ingredients: mealDescriptionOutput.consolidatedIngredients,
                    portionSize: mealDescriptionOutput.estimatedPortionSize,
                    portionUnit: mealDescriptionOutput.estimatedPortionUnit,
                });

                const itemFodmapProfile = fodmapAnalysis?.detailedFodmapProfile ?? _generateFallbackFodmapProfile(mealDescriptionOutput.primaryFoodItemForAnalysis);
                if (userProfile?.safeFoods?.length > 0) {
                    similarityOutput = await isSimilarToSafeFoods({
                        currentFoodItem: { name: mealDescriptionOutput.primaryFoodItemForAnalysis, portionSize: mealDescriptionOutput.estimatedPortionSize, portionUnit: mealDescriptionOutput.estimatedPortionUnit, fodmapProfile: itemFodmapProfile },
                        userSafeFoodItems: userProfile.safeFoods.map(sf => ({ ...sf, fodmapProfile: sf.fodmapProfile })),
                    });
                }

                processedFoodItem = {
                    ...optimisticItem, // Keep ID/Timestamp/Common fields
                    name: mealDescriptionOutput.wittyName,
                    originalName: mealDescriptionOutput.primaryFoodItemForAnalysis,
                    ingredients: mealDescriptionOutput.consolidatedIngredients,
                    portionSize: mealDescriptionOutput.estimatedPortionSize,
                    portionUnit: mealDescriptionOutput.estimatedPortionUnit,
                    // Updates
                    fodmapData: fodmapAnalysis ?? null,
                    isSimilarToSafe: similarityOutput?.isSimilar ?? false,
                    userFodmapProfile: itemFodmapProfile ?? null,
                    // Only update macros if NOT overridden by user previously?
                    // If user copied a meal with custom macros, maybe they want to keep them?
                    // Code says: "macrosOverridden: itemToRepeat.macrosOverridden"
                    // So we respect that logic below:
                    calories: (itemToRepeat.macrosOverridden ? itemToRepeat.calories : fodmapAnalysis?.calories) ?? null,
                    protein: (itemToRepeat.macrosOverridden ? itemToRepeat.protein : fodmapAnalysis?.protein) ?? null,
                    carbs: (itemToRepeat.macrosOverridden ? itemToRepeat.carbs : fodmapAnalysis?.carbs) ?? null,
                    fat: (itemToRepeat.macrosOverridden ? itemToRepeat.fat : fodmapAnalysis?.fat) ?? null,
                };
            } else {
                // Manual/Photo reused -> As is (no new analysis for now to keep it simple or maybe we should re-analyze? Keeping consistent with old logic)
                processedFoodItem = optimisticItem;
            }

            // 4. Commit Final State
            if (authUser) await submitToFirebase(processedFoodItem, newItemId);
            // Update local again to ensure consistency (e.g. if name changed)
            setTimelineEntries(prev => prev.map(e => e.id === newItemId ? processedFoodItem : e));

            if (processedFoodItem !== optimisticItem) {
                toast({ title: "Analysis Complete", description: "Meal details updated." });
            }

        } catch (e) {
            console.error(e);
            toast({ title: 'Re-analysis Failed', description: "Kept original data.", variant: 'destructive' });
            // We don't remove the item, we just keep the optimistic (original) version which is fine!
            repeatSuccess = false;
        } finally {
            setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
            if (didAnalyzeRepeat && authUser?.uid) {
                const duration = performance.now() - repeatStartTime;
                logAiPerformanceMetric({
                    flow: 'reuse',
                    durationMs: Math.round(duration),
                    success: repeatSuccess,
                    userId: authUser.uid,
                    entryId: newItemId,
                }).catch(() => { /* non-blocking */ });
            }
        }
    };

    const updateEntryTimestamp = async (entryId: string, newTimestamp: Date) => {
        // 1. Optimistic Local Update
        setTimelineEntries(prev => {
            const updated = prev.map(e => e.id === entryId ? { ...e, timestamp: newTimestamp } : e);
            return updated.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });

        // Update editingItem if it's the one being edited, to keep UI in sync
        if (editingItem && editingItem.id === entryId) {
            setEditingItem(prev => prev ? { ...prev, timestamp: newTimestamp } : null);
        }

        // 2. Firebase Update
        if (authUser && authUser.uid !== 'guest-user') {
            try {
                const docRef = doc(db, 'users', authUser.uid, 'timelineEntries', entryId);
                await setDoc(docRef, { timestamp: Timestamp.fromDate(newTimestamp) }, { merge: true });
            } catch (error) {
                console.error("Failed to update timestamp", error);
                toast({ title: "Error Updating Time", variant: "destructive" });
            }
        }
    };

    const handleSubmitMealDescription = async (
        formData: SimplifiedFoodLogFormValues,
        userDidOverrideMacros: boolean,
        newTimestamp?: Date
    ) => {
        const currentItemId = editingItem ? editingItem.id : `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const logTimestamp = newTimestamp || new Date();

        // [GUARDRAIL] Meal Limit: 12 Meals per day
        if (!editingItem && !userProfile?.isAdmin) {
            const todayMealsCount = timelineEntries.filter(e =>
                e.entryType === 'food' &&
                isSameDay(new Date(e.timestamp), logTimestamp)
            ).length;

            if (todayMealsCount >= 12) {
                toast({
                    title: "Daily Limit Reached",
                    description: "To ensure fair usage and manage AI costs, we limit logging to 12 meals per day. Please try again tomorrow.",
                    variant: "destructive"
                });
                return;
            }
        }

        // CHECK IF RE-ANALYSIS IS NEEDED
        // We skip AI if:
        // 1. We are editing an existing item AND
        // 2. The description/ingredients (source of truth) hasn't changed
        // This allows changing Time, Name, or Manual Macros without waiting for AI.
        const getEditBaselineDescription = (item: LoggedFoodItem | null): string => {
            if (!item) return "";
            if (item.sourceDescription?.startsWith("Identified by photo")) {
                return `${item.name}${item.ingredients ? `. ${item.ingredients}` : ''}`.trim();
            }
            if (item.sourceDescription?.startsWith("Manually logged")) {
                return `${item.name}${item.ingredients ? `. ${item.ingredients}` : ''}`.trim();
            }
            return (item.sourceDescription || "").trim();
        };

        const baselineDescription = getEditBaselineDescription(editingItem || null);
        const descriptionHasChanged = editingItem
            ? (formData.mealDescription.trim() !== baselineDescription)
            : true;
        const shouldSkipAnalysis = editingItem && !descriptionHasChanged;

        if (editingItem && shouldSkipAnalysis && authUser?.uid) {
            logAiTelemetryEvent({
                type: 'recalc_skipped',
                userId: authUser.uid,
                entryId: editingItem.id,
                reason: 'description_unchanged',
                meta: {
                    macrosOverridden: editingItem.macrosOverridden ?? false,
                    sourceDescription: editingItem.sourceDescription || null,
                }
            }).catch(() => { /* non-blocking */ });
        }

        const optimisticItem: LoggedFoodItem = {
            id: currentItemId,
            name: formData.name || editingItem?.name || "Processing Meal...",
            originalName: formData.mealDescription,
            ingredients: shouldSkipAnalysis ? (editingItem.ingredients || "") : "Analyzing ingredients...",
            portionSize: shouldSkipAnalysis ? (editingItem.portionSize || "...") : "...",
            portionUnit: shouldSkipAnalysis ? (editingItem.portionUnit || "") : "",
            sourceDescription: formData.mealDescription,
            timestamp: logTimestamp,

            // If skipping analysis, preserve existing data
            fodmapData: shouldSkipAnalysis ? (editingItem.fodmapData || null) : null,
            isSimilarToSafe: shouldSkipAnalysis ? (editingItem.isSimilarToSafe || false) : false,
            userFodmapProfile: shouldSkipAnalysis ? (editingItem.userFodmapProfile || null) : _generateFallbackFodmapProfile(formData.mealDescription),

            // Macro Logic:
            // If overriding -> Use form data
            // If NOT overriding -> 
            //    If Skipping Analysis -> Use original AI data (stored in fodmapData) or current values if fallback
            //    If Analyzing -> null (waiting for AI)
            calories: userDidOverrideMacros
                ? formData.calories
                : (shouldSkipAnalysis
                    ? (editingItem.fodmapData?.calories ?? editingItem.calories)
                    : (editingItem?.calories ?? null)),
            protein: userDidOverrideMacros
                ? formData.protein
                : (shouldSkipAnalysis
                    ? (editingItem.fodmapData?.protein ?? editingItem.protein)
                    : (editingItem?.protein ?? null)),
            carbs: userDidOverrideMacros
                ? formData.carbs
                : (shouldSkipAnalysis
                    ? (editingItem.fodmapData?.carbs ?? editingItem.carbs)
                    : (editingItem?.carbs ?? null)),
            fat: userDidOverrideMacros
                ? formData.fat
                : (shouldSkipAnalysis
                    ? (editingItem.fodmapData?.fat ?? editingItem.fat)
                    : (editingItem?.fat ?? null)),

            entryType: 'food',
            userFeedback: editingItem ? editingItem.userFeedback : null,
            macrosOverridden: userDidOverrideMacros,
            isFavorite: editingItem ? editingItem.isFavorite : false,
        };

        setIsSimplifiedAddFoodDialogOpenState(false);
        setEditingItem(null);
        if (newTimestamp) setSelectedLogTimestampForPreviousMeal(undefined);

        // Immediate UI Update (Optimistic) - For BOTH Auth and Guest to ensure instant sorting/update
        const updateLocalState = (items: TimelineEntry[]): TimelineEntry[] => {
            const updatedList = editingItem
                ? items.map(e => e.id === editingItem.id ? optimisticItem : e)
                : [optimisticItem, ...items];

            // Re-sort immediately so date change moves the card
            return updatedList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        };

        setTimelineEntries(prev => updateLocalState(prev));

        if (authUser) {
            await submitToFirebase(optimisticItem, currentItemId);
        }

        // IF SKIPPING ANALYSIS -> WE ARE DONE (Just toast and exit)
        if (shouldSkipAnalysis) {
            toast({ title: "Meal Updated", description: "Details updated successfully." });
            return;
        }

        // IF ANALYZING -> PROCEED AS NORMAL
        setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));
        const shouldLogOverridePersisted = !!(editingItem && descriptionHasChanged && editingItem.macrosOverridden && userDidOverrideMacros);
        if (authUser && authUser.uid !== 'guest-user') {
            // Fire-and-forget server-side analysis for resilience.
            triggerTextFoodAnalysis(
                currentItemId,
                authUser.uid,
                formData.mealDescription,
                userDidOverrideMacros,
                {
                    calories: formData.calories,
                    protein: formData.protein,
                    carbs: formData.carbs,
                    fat: formData.fat,
                },
                formData.name
            ).then((result) => {
                if (!result.success) {
                    toast({ title: 'Analysis Failed', variant: 'destructive' });
                } else if (!editingItem) {
                    toast({ title: "Analysis Complete", description: "Your meal has been analyzed." });
                } else {
                    toast({ title: "Meal Re-analyzed", description: "New ingredients processed." });
                }

                if (shouldLogOverridePersisted && authUser?.uid) {
                    logAiTelemetryEvent({
                        type: 'override_persisted_after_edit',
                        userId: authUser.uid,
                        entryId: currentItemId,
                        meta: {
                            macrosOverridden: true,
                            descriptionChanged: true,
                        }
                    }).catch(() => { /* non-blocking */ });
                }
                setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
            }).catch(e => {
                console.error("Text Analysis Error:", e);
                toast({ title: 'Analysis Failed', variant: 'destructive' });
                setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
            });

            toast({ title: "Analyzing in background", description: "You can exit the app — we'll finish processing." });
        } else {
            // Guest fallback: keep local blocking flow
            try {
                const { processMealDescription } = await import('@/ai/flows/process-meal-description-flow');
                const { analyzeFoodItem } = await import('@/ai/flows/fodmap-detection');

                const mealDescriptionOutput = await processMealDescription({ mealDescription: formData.mealDescription });

                const namedItem = {
                    ...optimisticItem,
                    name: formData.name || mealDescriptionOutput.wittyName,
                    originalName: mealDescriptionOutput.primaryFoodItemForAnalysis,
                    ingredients: mealDescriptionOutput.consolidatedIngredients,
                    portionSize: mealDescriptionOutput.estimatedPortionSize,
                    portionUnit: mealDescriptionOutput.estimatedPortionUnit,
                };

                const fodmapAnalysis = await analyzeFoodItem({
                    foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis,
                    ingredients: mealDescriptionOutput.consolidatedIngredients,
                    portionSize: mealDescriptionOutput.estimatedPortionSize,
                    portionUnit: mealDescriptionOutput.estimatedPortionUnit,
                });

                const itemFodmapProfile = fodmapAnalysis?.detailedFodmapProfile ?? _generateFallbackFodmapProfile(namedItem.name);

                const finalItem: LoggedFoodItem = {
                    ...namedItem,
                    fodmapData: fodmapAnalysis ?? null,
                    isSimilarToSafe: fodmapAnalysis?.similarityAnalysis?.isSimilar ?? false,
                    userFodmapProfile: itemFodmapProfile ?? null,
                    calories: userDidOverrideMacros ? formData.calories : (fodmapAnalysis?.calories ?? editingItem?.calories ?? null),
                    protein: userDidOverrideMacros ? formData.protein : (fodmapAnalysis?.protein ?? editingItem?.protein ?? null),
                    carbs: userDidOverrideMacros ? formData.carbs : (fodmapAnalysis?.carbs ?? editingItem?.carbs ?? null),
                    fat: userDidOverrideMacros ? formData.fat : (fodmapAnalysis?.fat ?? editingItem?.fat ?? null),
                };

                setTimelineEntries(prev => prev.map(e => e.id === currentItemId ? finalItem : e));
                if (!editingItem) toast({ title: "Analysis Complete", description: "Your meal has been analyzed." });
                else toast({ title: "Meal Re-analyzed", description: "New ingredients processed." });
            } catch (e) {
                console.error(e);
                toast({ title: 'Analysis Failed', variant: 'destructive' });
            } finally {
                setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
            }
        }
    };

    const handleProcessAndLogPhotoIdentification = async (photoData: IdentifiedPhotoData, newTimestamp?: Date) => {
        const currentItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const logTimestamp = newTimestamp || new Date();

        const optimisticItem: LoggedFoodItem = {
            id: currentItemId,
            name: photoData.name || "Analyzing Photo...",
            originalName: photoData.name || "Photo Upload",
            ingredients: photoData.ingredients || "Processing image...",
            portionSize: photoData.portionSize || "...",
            portionUnit: photoData.portionUnit || "",
            timestamp: logTimestamp,
            fodmapData: null,
            isSimilarToSafe: false,
            userFodmapProfile: _generateFallbackFodmapProfile("Photo"),
            calories: null, protein: null, carbs: null, fat: null,
            entryType: 'food',
            userFeedback: null,
            macrosOverridden: false,
            sourceDescription: "Identified by photo",
            isFavorite: false,
        };

        setIsIdentifyByPhotoDialogOpenState(false);
        if (newTimestamp) setSelectedLogTimestampForPreviousMeal(undefined);

        if (authUser) {
            await submitToFirebase(optimisticItem, currentItemId);
        } else {
            setTimelineEntries(prev => [optimisticItem, ...prev]);
        }

        setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));

        // FIRE AND FORGET - Background Analysis
        if (photoData.imageUri && authUser) {
            // FIRE AND FORGET - Background Analysis
            const startTime = performance.now();

            triggerFoodAnalysis(
                currentItemId,
                authUser.uid,
                photoData.imageUri,
                photoData.additionalContext
                // safeFoods fetched by server to keep payload small
            ).then((result) => {
                const duration = performance.now() - startTime;

                // PERFORMANCE MONITORING
                if (duration > 15000) {
                    logAdminEvent({
                        type: 'performance_issue',
                        trigger: 'photo_analysis',
                        durationMs: Math.round(duration),
                        foodName: photoData.name || "Unknown",
                        severity: 'warning',
                        user: authUser.uid
                    });
                }
                logAiPerformanceMetric({
                    flow: 'scan',
                    durationMs: Math.round(duration),
                    success: result.success,
                    userId: authUser.uid,
                    entryId: currentItemId,
                }).catch(() => { /* non-blocking */ });

                if (!result.success) {
                    console.error("Background analysis failed:", result.error);
                    toast({ title: 'Analysis Failed', description: "Could not process photo.", variant: 'destructive' });
                    logAdminEvent({
                        type: 'analysis_failure',
                        trigger: 'photo_analysis',
                        error: result.error,
                        foodName: photoData.name || "Unknown",
                        severity: 'error',
                        user: authUser.uid
                    });
                } else {
                    // Success toast is optional since UI updates automatically via snapshot, 
                    // but a subtle one is nice.
                    // toast({ title: "Analysis Complete", description: "Meal details updated." });
                }
                setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
            }).catch(e => {
                console.error("Trigger Analysis Error:", e);
                setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
                const duration = performance.now() - startTime;
                if (authUser?.uid) {
                    logAiPerformanceMetric({
                        flow: 'scan',
                        durationMs: Math.round(duration),
                        success: false,
                        userId: authUser.uid,
                        entryId: currentItemId,
                    }).catch(() => { /* non-blocking */ });
                }
            });

            // Allow user to leave immediately
            toast({ title: "Photo Uploaded", description: "Analyzing in background..." });
        } else {
            // Guest or No Image? Guest handling is local only (no server action possible)
            // or we handle guest logic differently. 
            // Current server action requires User ID.
            // Protocol: Guests utilize client-side flow (blocking) OR we enable guest access securely?
            // Since guests are local-only usually, we can keep the blocking flow FOR GUESTS.

            if (!authUser) {
                // Fallback to old Blocking Flow for Guests
                try {
                    const { identifyFoodFromImage } = await import('@/ai/flows/identify-food-from-image-flow');
                    const result = await identifyFoodFromImage({
                        imageDataUri: photoData.imageUri || "",
                        additionalContext: photoData.additionalContext,
                        userLocale: navigator.language
                    });

                    // Guest Logic Update (Local State Only)
                    // ... (We can copy the logic or just say "Sign up for background processing")
                    // For simplicity, let's keep the blocking flow restricted to `!authUser` block?
                    // Or just implement the logic here for guests.
                    // The implementation plan mainly targets Auth Users. 
                    // Let's implement blocking flow for guests here if needed, or leave as is?
                    // The requested change replaces the WHOLE block.

                    if (result.recognitionSuccess) {
                        const guestItem = {
                            ...optimisticItem,
                            name: result.identifiedFoodName || "Guest Food",
                            ingredients: result.identifiedIngredients || "",
                            portionSize: result.estimatedPortionSize || "",
                            portionUnit: result.estimatedPortionUnit || ""
                        };
                        setTimelineEntries(prev => prev.map(e => e.id === currentItemId ? guestItem : e));
                    }
                    setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
                } catch (e) {
                    setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
                }
            }
        }
    };

    const handleSubmitManualMacroEntry = async (entryData: any, newTimestamp?: Date) => {
        const currentItemId = editingItem ? editingItem.id : `macro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const logTimestamp = newTimestamp || new Date();

        const newEntry: LoggedFoodItem = {
            ...entryData,
            id: currentItemId,
            name: entryData.name || "Manual Macro Adjustment",
            timestamp: logTimestamp,
            entryType: 'manual_macro',
            ingredients: "Manual entry",
            portionSize: "1",
            portionUnit: "serving",
            userFeedback: editingItem ? editingItem.userFeedback : null,
            macrosOverridden: true,
            calories: entryData.calories ?? null,
            protein: entryData.protein ?? null,
            carbs: entryData.carbs ?? null,
            fat: entryData.fat ?? null,
            fodmapData: null,
            userFodmapProfile: null,
            isSimilarToSafe: false,
            sourceDescription: "Manual macro entry",
            isFavorite: editingItem ? editingItem.isFavorite : false,
        };

        setIsAddManualMacroDialogOpenState(false);
        setEditingItem(null);
        if (newTimestamp) setSelectedLogTimestampForPreviousMeal(undefined);

        if (authUser) {
            await submitToFirebase(newEntry, currentItemId, !editingItem);
            toast({ title: "Manual Macros Logged" });
        } else {
            setTimelineEntries(prev => [newEntry, ...prev]);
        }
    };

    const handleSubmitClassicFoodItem = async (foodData: any, newTimestamp?: Date) => {
        const currentItemId = editingItem ? editingItem.id : `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const logTimestamp = newTimestamp || new Date();

        // Analyze macros if not provided?
        // In the classic dialog, users might enter macros manually? 
        // Actually AddFoodItemDialog usually just takes Name/Ingredients/Portion.
        // If it takes macros, they are in the data.
        // Assuming basic log for now, mostly used for text-based non-AI?
        // Actually Classic usually implies Manual Entry of DETAILS.
        // Let's assume we just log it as is.

        const newEntry: LoggedFoodItem = {
            id: currentItemId,
            name: foodData.name,
            originalName: foodData.name,
            ingredients: foodData.ingredients || "",
            portionSize: foodData.portionSize || "1",
            portionUnit: foodData.portionUnit || "serving",
            timestamp: logTimestamp,
            fodmapData: null,
            isSimilarToSafe: false,
            userFodmapProfile: _generateFallbackFodmapProfile(foodData.name),
            calories: foodData.calories ?? null,
            protein: foodData.protein ?? null,
            carbs: foodData.carbs ?? null,
            fat: foodData.fat ?? null,
            entryType: 'food',
            userFeedback: editingItem ? editingItem.userFeedback : null,
            macrosOverridden: false, // Or true if manually entered?
            sourceDescription: "Manually logged",
            isFavorite: editingItem ? editingItem.isFavorite : false,
        };

        if (foodData.calories || foodData.protein) {
            newEntry.macrosOverridden = true;
        }

        setIsAddFoodDialogOpenState(false);
        setEditingItem(null);
        if (newTimestamp) setSelectedLogTimestampForPreviousMeal(undefined);

        if (authUser) {
            await submitToFirebase(newEntry, currentItemId, !editingItem);
            toast({ title: "Food Logged" });
        } else {
            setTimelineEntries(prev => [newEntry, ...prev]);
        }

        // Trigger AI Analysis for FODMAPs if possible?
        // If manually logged, maybe we still want FODMAP analysis.
        if (!newEntry.macrosOverridden || !newEntry.fodmapData) {
            setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));
            try {
                const { analyzeFoodItem } = await import('@/ai/flows/fodmap-detection');
                const safeFoodItemsForAnalysis = (userProfile?.safeFoods?.length > 0)
                    ? userProfile.safeFoods.map(sf => ({
                        name: sf.name,
                        portionSize: sf.portionSize,
                        portionUnit: sf.portionUnit,
                        fodmapProfile: sf.fodmapProfile,
                    }))
                    : undefined;

                const fodmapAnalysis = await analyzeFoodItem({
                    foodItem: newEntry.name,
                    ingredients: newEntry.ingredients,
                    portionSize: newEntry.portionSize,
                    portionUnit: newEntry.portionUnit,
                    userSafeFoodItems: safeFoodItemsForAnalysis,
                });

                const processedItem = {
                    ...newEntry,
                    fodmapData: fodmapAnalysis ?? null,
                    isSimilarToSafe: fodmapAnalysis?.similarityAnalysis?.isSimilar ?? false,
                    userFodmapProfile: fodmapAnalysis?.detailedFodmapProfile ?? _generateFallbackFodmapProfile(newEntry.name),
                    // Only update macros if NOT overridden by user
                    calories: newEntry.macrosOverridden ? newEntry.calories : (fodmapAnalysis?.calories ?? null),
                    protein: newEntry.macrosOverridden ? newEntry.protein : (fodmapAnalysis?.protein ?? null),
                    carbs: newEntry.macrosOverridden ? newEntry.carbs : (fodmapAnalysis?.carbs ?? null),
                    fat: newEntry.macrosOverridden ? newEntry.fat : (fodmapAnalysis?.fat ?? null),
                };

                if (authUser) await submitToFirebase(processedItem, currentItemId);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
            }
        }
    };

    const handleLogSymptoms = async (symptoms: LoggedSymptom[], notes?: string, severity?: number, linkedIds?: string[], experiencedAt?: Date, triggerContext?: any) => {
        const newSymptomLog: SymptomLog = {
            id: `sym-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            symptoms,
            notes,
            severity,
            linkedFoodItemIds: linkedIds || [],
            timestamp: new Date(), // Created At
            experiencedAt: experiencedAt || new Date(), // Defaults to now if not passed
            triggerContext: triggerContext || { type: 'checkin' },
            entryType: 'symptom',
            appVersion: '4.5.3' // Hardcoded or fetched from env? Let's use hardcoded or from constant for now.
        };

        setIsSymptomLogDialogOpenState(false);
        setSymptomLogContext(undefined);

        if (authUser) {
            await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), {
                ...newSymptomLog,
                timestamp: Timestamp.fromDate(newSymptomLog.timestamp),
                experiencedAt: Timestamp.fromDate(newSymptomLog.experiencedAt)
            });
            toast({ title: "Symptoms Logged" });
        } else {
            setTimelineEntries(prev => [newSymptomLog as any, ...prev]);
        }
    };

    const handleSetFoodFeedback = async (itemId: string, feedback: 'safe' | 'unsafe' | null) => {
        if (authUser) {
            await updateDoc(doc(db, 'users', authUser.uid, 'timelineEntries', itemId), { userFeedback: feedback });
        } else {
            setTimelineEntries(prev => prev.map(e => e.id === itemId ? { ...e, userFeedback: feedback } as TimelineEntry : e));
        }
    };

    const handleToggleFavoriteFoodItem = async (itemId: string, isFav: boolean) => {
        const targetEntry = timelineEntries.find(entry => entry.id === itemId);
        const targetFood = targetEntry && targetEntry.entryType === 'food' ? (targetEntry as LoggedFoodItem) : null;
        const now = new Date();

        if (authUser) {
            if (isFav && targetFood) {
                const favoriteKey = getFavoriteKey(targetFood);
                const duplicates = timelineEntries.filter(entry =>
                    entry.id !== itemId &&
                    entry.entryType === 'food' &&
                    (entry as LoggedFoodItem).isFavorite === true &&
                    getFavoriteKey(entry as LoggedFoodItem) === favoriteKey
                ) as LoggedFoodItem[];

                const batch = writeBatch(db);
                batch.update(doc(db, 'users', authUser.uid, 'timelineEntries', itemId), {
                    isFavorite: true,
                    favoriteLastUsedAt: Timestamp.fromDate(now)
                });
                duplicates.forEach(dup => {
                    batch.update(doc(db, 'users', authUser.uid, 'timelineEntries', dup.id), { isFavorite: false });
                });
                await batch.commit();
            } else if (isFav) {
                await updateDoc(doc(db, 'users', authUser.uid, 'timelineEntries', itemId), {
                    isFavorite: true,
                    favoriteLastUsedAt: Timestamp.fromDate(now)
                });
            } else {
                await updateDoc(doc(db, 'users', authUser.uid, 'timelineEntries', itemId), { isFavorite: false });
            }
        }

        if (isFav && targetFood) {
            const favoriteKey = getFavoriteKey(targetFood);
            setTimelineEntries(prev => prev.map(entry => {
                if (entry.id === itemId) {
                    return { ...entry, isFavorite: true, favoriteLastUsedAt: now } as TimelineEntry;
                }
                if (entry.entryType === 'food' &&
                    (entry as LoggedFoodItem).isFavorite === true &&
                    getFavoriteKey(entry as LoggedFoodItem) === favoriteKey
                ) {
                    return { ...entry, isFavorite: false } as TimelineEntry;
                }
                return entry;
            }));
        } else if (isFav) {
            setTimelineEntries(prev => prev.map(entry =>
                entry.id === itemId ? { ...entry, isFavorite: true, favoriteLastUsedAt: now } as TimelineEntry : entry
            ));
        } else {
            setTimelineEntries(prev => prev.map(entry =>
                entry.id === itemId ? { ...entry, isFavorite: false } as TimelineEntry : entry
            ));
        }
    };

    return (
        <ActionContext.Provider value={{
            timelineEntries,
            userProfile,
            isDataLoading,
            isLoadingAi,

            isAddVitalsDialogOpen,
            vitalsDialogDate,
            initialVitalsWeight,
            initialVitalsSteps,
            openAddVitalsDialog,
            closeAddVitalsDialog,
            handleLogVitals,

            isSimplifiedAddFoodDialogOpen,
            openSimplifiedAddFoodDialog,
            closeSimplifiedAddFoodDialog,

            isIdentifyByPhotoDialogOpen,
            openIdentifyByPhotoDialog,
            closeIdentifyByPhotoDialog,

            isSymptomLogDialogOpen,
            symptomLogContext,
            openSymptomLogDialog,
            closeSymptomLogDialog,

            isAddManualMacroDialogOpen,
            openAddManualMacroDialog,
            closeAddManualMacroDialog,

            isLogPreviousMealDialogOpen,
            openLogPreviousMealDialog,
            closeLogPreviousMealDialog,

            isAddFoodDialogOpen,
            openAddFoodDialog,
            closeAddFoodDialog,

            isReleaseNotesOpen,
            openReleaseNotes,
            closeReleaseNotes,

            editingItem,
            setEditingItem,
            handleEditTimelineEntry,

            handleSubmitMealDescription,
            handleProcessAndLogPhotoIdentification,
            handleSubmitManualMacroEntry,
            handleSubmitClassicFoodItem,
            handleLogSymptoms,
            handleSetFoodFeedback,
            handleToggleFavoriteFoodItem,
            handleRemoveTimelineEntry,
            updateEntryTimestamp,
            handleRepeatMeal,

            selectedLogTimestampForPreviousMeal,
            setSelectedLogTimestampForPreviousMeal,
            // Scroll Signal
            lastAddedItem,
            setLastAddedItem,
            setTimelineWindowAnchor,
        }}>
            {children}
        </ActionContext.Provider>
    );
};
