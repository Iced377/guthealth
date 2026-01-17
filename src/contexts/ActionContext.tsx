'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    deleteDoc
} from 'firebase/firestore';
import type { TimelineEntry, UserProfile, LoggedFoodItem, Symptom, SymptomLog } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { analyzeFoodItem, type AnalyzeFoodItemOutput, type FoodFODMAPProfile } from '@/ai/flows/fodmap-detection';
import { processMealDescription } from '@/ai/flows/process-meal-description-flow';
import { isSimilarToSafeFoods, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
import type { SimplifiedFoodLogFormValues } from '@/components/food-logging/SimplifiedAddFoodDialog';
import type { IdentifiedPhotoData } from '@/components/food-logging/IdentifyFoodByPhotoDialog';
import { generateFallbackFodmapProfile } from '@/lib/utils';

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
    openSymptomLogDialog: () => void;
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

    isReleaseNotesOpen: boolean;
    openReleaseNotes: () => void;
    closeReleaseNotes: () => void;

    // Editing
    editingItem: LoggedFoodItem | null;
    setEditingItem: (item: LoggedFoodItem | null) => void;
    handleEditTimelineEntry: (item: LoggedFoodItem) => void;

    // Actions
    handleSubmitMealDescription: (formData: SimplifiedFoodLogFormValues, override: boolean, date?: Date) => Promise<void>;
    handleProcessAndLogPhotoIdentification: (data: IdentifiedPhotoData, date?: Date) => Promise<void>;
    handleSubmitManualMacroEntry: (data: any, date?: Date) => Promise<void>;
    handleLogSymptoms: (symptoms: Symptom[], notes?: string, severity?: number, linkedIds?: string[]) => Promise<void>;
    handleSetFoodFeedback: (id: string, feedback: 'safe' | 'unsafe' | null) => Promise<void>;
    handleToggleFavoriteFoodItem: (id: string, isFav: boolean) => Promise<void>;
    handleRemoveTimelineEntry: (id: string) => Promise<void>;
    handleRepeatMeal: (item: LoggedFoodItem) => Promise<void>;
    handleSubmitClassicFoodItem: (data: any, date?: Date) => Promise<void>;

    // Previous Meal Date State
    selectedLogTimestampForPreviousMeal: Date | undefined;
    setSelectedLogTimestampForPreviousMeal: (d: Date | undefined) => void;
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

export const ActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user: authUser, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile>(initialGuestProfile);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});

    const [isSimplifiedAddFoodDialogOpen, setIsSimplifiedAddFoodDialogOpenState] = useState(false);
    const [isIdentifyByPhotoDialogOpen, setIsIdentifyByPhotoDialogOpenState] = useState(false);
    const [isSymptomLogDialogOpen, setIsSymptomLogDialogOpenState] = useState(false);
    const [isAddManualMacroDialogOpen, setIsAddManualMacroDialogOpenState] = useState(false);
    const [isLogPreviousMealDialogOpen, setIsLogPreviousMealDialogOpenState] = useState(false);
    const [isAddFoodDialogOpen, setIsAddFoodDialogOpenState] = useState(false);
    const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);

    const [editingItem, setEditingItem] = useState<LoggedFoodItem | null>(null);
    const [selectedLogTimestampForPreviousMeal, setSelectedLogTimestampForPreviousMeal] = useState<Date | undefined>(undefined);

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

    const openSymptomLogDialog = useCallback(() => setIsSymptomLogDialogOpenState(true), []);
    const closeSymptomLogDialog = useCallback(() => setIsSymptomLogDialogOpenState(false), []);

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
        let unsubscribeTimeline: () => void;

        const setupData = async () => {
            setIsDataLoading(true);
            if (authLoading) return;

            if (authUser) {
                const userDocRef = doc(db, 'users', authUser.uid);
                try {
                    const userDocSnap = await getDoc(userDocRef);
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

                    const timelineEntriesColRef = collection(db, 'users', authUser.uid, 'timelineEntries');
                    let q;
                    if (TEMPORARILY_UNLOCK_ALL_FEATURES || currentIsPremium) {
                        q = query(timelineEntriesColRef, orderBy('timestamp', 'desc'));
                    } else {
                        const twoDaysAgo = new Date();
                        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                        q = query(timelineEntriesColRef, orderBy('timestamp', 'desc'), where('timestamp', '>=', Timestamp.fromDate(twoDaysAgo)));
                    }

                    unsubscribeTimeline = onSnapshot(q, (snapshot) => {
                        const fetchedEntries: TimelineEntry[] = snapshot.docs.map(docSnap => {
                            const data = docSnap.data();
                            return {
                                ...data,
                                id: docSnap.id,
                                timestamp: (data.timestamp as Timestamp).toDate(),
                            } as TimelineEntry;
                        });
                        setTimelineEntries(fetchedEntries);
                        setIsDataLoading(false);
                    }, (error) => {
                        console.error("Timeline snapshot error:", error);
                        setIsDataLoading(false);
                    });

                } catch (error) {
                    console.error("Error setting up user data:", error);
                    setIsDataLoading(false);
                }
            } else {
                setUserProfile(initialGuestProfile);
                setTimelineEntries([]);
                setIsDataLoading(false);
            }
        };

        setupData();

        return () => {
            if (unsubscribeTimeline) unsubscribeTimeline();
        };
    }, [authUser, authLoading]);

    const submitToFirebase = async (item: any, id: string, merge = true) => {
        if (authUser && authUser.uid !== 'guest-user') {
            const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', id);
            const { id: _, ...itemToSave } = item;
            await setDoc(docRefPath, {
                ...itemToSave,
                timestamp: Timestamp.fromDate(item.timestamp)
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
        setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));

        const baseData = {
            id: newItemId,
            timestamp: newTimestamp,
            isSimilarToSafe: false,
            userFodmapProfile: null,
            entryType: 'food' as const,
            userFeedback: null,
            macrosOverridden: itemToRepeat.macrosOverridden ?? false,
            isFavorite: itemToRepeat.isFavorite ?? false,
        };

        try {
            let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
            let similarityOutput: FoodSimilarityOutput | undefined;
            let mealDescriptionOutput;
            let processedFoodItem;

            if (itemToRepeat.sourceDescription && !itemToRepeat.sourceDescription.startsWith("Identified by photo") && itemToRepeat.sourceDescription !== "Manually logged") {
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
                    ...baseData,
                    name: mealDescriptionOutput.wittyName,
                    originalName: mealDescriptionOutput.primaryFoodItemForAnalysis,
                    ingredients: mealDescriptionOutput.consolidatedIngredients,
                    portionSize: mealDescriptionOutput.estimatedPortionSize,
                    portionUnit: mealDescriptionOutput.estimatedPortionUnit,
                    sourceDescription: itemToRepeat.sourceDescription,
                    fodmapData: fodmapAnalysis ?? null,
                    isSimilarToSafe: similarityOutput?.isSimilar ?? false,
                    userFodmapProfile: itemFodmapProfile ?? null,
                    calories: (itemToRepeat.macrosOverridden ? itemToRepeat.calories : fodmapAnalysis?.calories) ?? null,
                    protein: (itemToRepeat.macrosOverridden ? itemToRepeat.protein : fodmapAnalysis?.protein) ?? null,
                    carbs: (itemToRepeat.macrosOverridden ? itemToRepeat.carbs : fodmapAnalysis?.carbs) ?? null,
                    fat: (itemToRepeat.macrosOverridden ? itemToRepeat.fat : fodmapAnalysis?.fat) ?? null,
                };
            } else {
                // Simplified repeat for manual/other
                processedFoodItem = {
                    ...baseData,
                    ...itemToRepeat,
                    id: newItemId,
                    timestamp: newTimestamp,
                };
                // Ideally we re-analyze manual too but keeping it simple as "Copy"
            }

            if (authUser) await submitToFirebase(processedFoodItem, newItemId);
            else setTimelineEntries(prev => [processedFoodItem as any, ...prev]);

            toast({ title: "Meal Repeated", description: `"${processedFoodItem.name}" added.` });

        } catch (e) {
            console.error(e);
            toast({ title: 'Error Repeating Meal', variant: 'destructive' });
        } finally {
            setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
        }
    };

    const handleSubmitMealDescription = async (
        formData: SimplifiedFoodLogFormValues,
        userDidOverrideMacros: boolean,
        newTimestamp?: Date
    ) => {
        const currentItemId = editingItem ? editingItem.id : `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const logTimestamp = newTimestamp || new Date();

        const optimisticItem: LoggedFoodItem = {
            id: currentItemId,
            name: formData.name || editingItem?.name || "Processing Meal...",
            originalName: formData.mealDescription,
            ingredients: "Analyzing ingredients...",
            portionSize: "...",
            portionUnit: "",
            sourceDescription: formData.mealDescription,
            timestamp: logTimestamp,
            fodmapData: null,
            isSimilarToSafe: false,
            userFodmapProfile: _generateFallbackFodmapProfile(formData.mealDescription),
            calories: userDidOverrideMacros ? formData.calories : null,
            protein: userDidOverrideMacros ? formData.protein : null,
            carbs: userDidOverrideMacros ? formData.carbs : null,
            fat: userDidOverrideMacros ? formData.fat : null,
            entryType: 'food',
            userFeedback: editingItem ? editingItem.userFeedback : null,
            macrosOverridden: userDidOverrideMacros,
            isFavorite: editingItem ? editingItem.isFavorite : false,
        };

        setIsSimplifiedAddFoodDialogOpenState(false);
        setEditingItem(null);
        if (newTimestamp) setSelectedLogTimestampForPreviousMeal(undefined);

        if (!authUser) {
            setTimelineEntries(prev => [optimisticItem, ...prev]);
        } else {
            await submitToFirebase(optimisticItem, currentItemId);
        }

        setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));
        try {
            const mealDescriptionOutput = await processMealDescription({ mealDescription: formData.mealDescription });

            const namedItem = {
                ...optimisticItem,
                name: formData.name || mealDescriptionOutput.wittyName,
                originalName: mealDescriptionOutput.primaryFoodItemForAnalysis,
                ingredients: mealDescriptionOutput.consolidatedIngredients,
                portionSize: mealDescriptionOutput.estimatedPortionSize,
                portionUnit: mealDescriptionOutput.estimatedPortionUnit,
            };

            if (authUser) await submitToFirebase(namedItem, currentItemId);

            const safeFoodItemsForAnalysis = (userProfile?.safeFoods?.length > 0)
                ? userProfile.safeFoods.map(sf => ({
                    name: sf.name,
                    portionSize: sf.portionSize,
                    portionUnit: sf.portionUnit,
                    fodmapProfile: sf.fodmapProfile,
                }))
                : undefined;

            const fodmapAnalysis = await analyzeFoodItem({
                foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis,
                ingredients: mealDescriptionOutput.consolidatedIngredients,
                portionSize: mealDescriptionOutput.estimatedPortionSize,
                portionUnit: mealDescriptionOutput.estimatedPortionUnit,
                userSafeFoodItems: safeFoodItemsForAnalysis,
            });

            const itemFodmapProfile = fodmapAnalysis?.detailedFodmapProfile ?? _generateFallbackFodmapProfile(namedItem.name);

            const finalItem: LoggedFoodItem = {
                ...namedItem,
                fodmapData: fodmapAnalysis ?? null,
                isSimilarToSafe: fodmapAnalysis?.similarityAnalysis?.isSimilar ?? false,
                userFodmapProfile: itemFodmapProfile ?? null,
                calories: userDidOverrideMacros ? formData.calories : (fodmapAnalysis?.calories ?? null),
                protein: userDidOverrideMacros ? formData.protein : (fodmapAnalysis?.protein ?? null),
                carbs: userDidOverrideMacros ? formData.carbs : (fodmapAnalysis?.carbs ?? null),
                fat: userDidOverrideMacros ? formData.fat : (fodmapAnalysis?.fat ?? null),
            };

            if (authUser) await submitToFirebase(finalItem, currentItemId);

        } catch (e) {
            console.error(e);
            toast({ title: 'Analysis Failed', variant: 'destructive' });
        } finally {
            setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
        }
    };

    const handleProcessAndLogPhotoIdentification = async (photoData: IdentifiedPhotoData, newTimestamp?: Date) => {
        const currentItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const logTimestamp = newTimestamp || new Date();

        const optimisticItem: LoggedFoodItem = {
            id: currentItemId,
            name: photoData.name,
            originalName: photoData.name,
            ingredients: photoData.ingredients,
            portionSize: photoData.portionSize,
            portionUnit: photoData.portionUnit,
            timestamp: logTimestamp,
            fodmapData: null,
            isSimilarToSafe: false,
            userFodmapProfile: _generateFallbackFodmapProfile(photoData.name),
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
        try {
            const safeFoodItemsForAnalysis = (userProfile?.safeFoods?.length > 0)
                ? userProfile.safeFoods.map(sf => ({
                    name: sf.name,
                    portionSize: sf.portionSize,
                    portionUnit: sf.portionUnit,
                    fodmapProfile: sf.fodmapProfile,
                }))
                : undefined;

            const fodmapAnalysis = await analyzeFoodItem({
                foodItem: photoData.name,
                ingredients: photoData.ingredients,
                portionSize: photoData.portionSize,
                portionUnit: photoData.portionUnit,
                userSafeFoodItems: safeFoodItemsForAnalysis,
            });

            const processedItem = {
                ...optimisticItem,
                fodmapData: fodmapAnalysis ?? null,
                isSimilarToSafe: fodmapAnalysis?.similarityAnalysis?.isSimilar ?? false,
                userFodmapProfile: fodmapAnalysis?.detailedFodmapProfile ?? _generateFallbackFodmapProfile(photoData.name),
                calories: fodmapAnalysis?.calories ?? null,
                protein: fodmapAnalysis?.protein ?? null,
                carbs: fodmapAnalysis?.carbs ?? null,
                fat: fodmapAnalysis?.fat ?? null,
            };

            if (authUser) await submitToFirebase(processedItem, currentItemId);

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
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

    const handleLogSymptoms = async (symptoms: Symptom[], notes?: string, severity?: number, linkedIds?: string[]) => {
        const newSymptomLog: SymptomLog = {
            id: `sym-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            symptoms,
            notes,
            severity,
            linkedFoodItemIds: linkedIds || [],
            timestamp: new Date(),
            entryType: 'symptom'
        };

        setIsSymptomLogDialogOpenState(false);

        if (authUser) {
            await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), {
                ...newSymptomLog,
                timestamp: Timestamp.fromDate(newSymptomLog.timestamp)
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
        if (authUser) {
            await updateDoc(doc(db, 'users', authUser.uid, 'timelineEntries', itemId), { isFavorite: isFav });
        } else {
            setTimelineEntries(prev => prev.map(e => e.id === itemId ? { ...e, isFavorite: isFav } as TimelineEntry : e));
        }
    };

    return (
        <ActionContext.Provider value={{
            timelineEntries,
            userProfile,
            isDataLoading,
            isLoadingAi,

            isSimplifiedAddFoodDialogOpen,
            openSimplifiedAddFoodDialog,
            closeSimplifiedAddFoodDialog,

            isIdentifyByPhotoDialogOpen,
            openIdentifyByPhotoDialog,
            closeIdentifyByPhotoDialog,

            isSymptomLogDialogOpen,
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
            handleSubmitMealDescription,
            handleProcessAndLogPhotoIdentification,
            handleSubmitManualMacroEntry,
            handleSubmitClassicFoodItem,
            handleLogSymptoms,
            handleLogSymptoms,
            handleSetFoodFeedback,
            handleToggleFavoriteFoodItem,
            handleRemoveTimelineEntry,
            handleRepeatMeal,

            selectedLogTimestampForPreviousMeal,
            setSelectedLogTimestampForPreviousMeal,
        }}>
            {children}
        </ActionContext.Provider>
    );
};
