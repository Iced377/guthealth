
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { LoggedFoodItem, UserProfile, TimelineEntry, Symptom, SymptomLog, SafeFood, DailyNutritionSummary } from '@/types';
import { COMMON_SYMPTOMS } from '@/types';
import { Loader2, PlusCircle, ListChecks, Pencil, CalendarDays, Edit3, ChevronUp, Repeat, Camera, LayoutGrid, CalendarIcon } from 'lucide-react';
import { analyzeFoodItem, type AnalyzeFoodItemOutput, type FoodFODMAPProfile as DetailedFodmapProfileFromAI, type FoodFODMAPProfile } from '@/ai/flows/fodmap-detection';
import { isSimilarToSafeFoods, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
import { processMealDescription, type ProcessMealDescriptionOutput } from '@/ai/flows/process-meal-description-flow';



import GradientText from '@/components/shared/GradientText';



import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import AddFoodItemDialog, { type ManualEntryFormValues } from '@/components/food-logging/AddFoodItemDialog';
import SimplifiedAddFoodDialog, { type SimplifiedFoodLogFormValues } from '@/components/food-logging/SimplifiedAddFoodDialog';
import SymptomLoggingDialog from '@/components/food-logging/SymptomLoggingDialog';
import AddManualMacroEntryDialog, { type ManualMacroFormValues } from '@/components/food-logging/AddManualMacroEntryDialog';
import LogPreviousMealDialog from '@/components/food-logging/LogPreviousMealDialog';
import IdentifyFoodByPhotoDialog, { type IdentifiedPhotoData } from '@/components/food-logging/IdentifyFoodByPhotoDialog';
import Navbar from '@/components/shared/Navbar';
import GuestHomePage from '@/components/guest/GuestHomePage';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import PremiumDashboardSheet from '@/components/premium/PremiumDashboardSheet';
import DashboardContent from '@/components/dashboard/DashboardContent';
import LandingPageClientContent from '@/components/landing/LandingPageClientContent';
import { format } from 'date-fns';

const TEMPORARILY_UNLOCK_ALL_FEATURES = true;

const generateFallbackFodmapProfile = (foodName: string): FoodFODMAPProfile => {
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

const initialGuestProfile: UserProfile = {
  uid: 'guest-user',
  email: null,
  displayName: 'Guest User',
  safeFoods: [],
  premium: false,
};


const groupEntriesByDate = (entries: TimelineEntry[]) => {
  const grouped: Record<string, TimelineEntry[]> = {};
  entries.forEach(entry => {
    // Sort entries within the group as they are added
    const dateKey = format(new Date(entry.timestamp), "PPP"); // e.g., "Jun 10th, 2025"
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(entry);
    grouped[dateKey].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });
  return grouped;
};


export default function RootPage() {
  const { toast } = useToast();
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPathname = usePathname();

  const [userProfile, setUserProfile] = useState<UserProfile>(initialGuestProfile);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});

  const [isAddFoodDialogOpenState, setIsAddFoodDialogOpenState] = useState(false);
  const setIsAddFoodDialogOpen = (val: boolean) => {
    if (!val) setEditingItem(null); // Clear editing item when closing
    setIsAddFoodDialogOpenState(val);
  }

  const [isSimplifiedAddFoodDialogOpen, setIsSimplifiedAddFoodDialogOpen] = useState(false);
  const [isIdentifyByPhotoDialogOpen, setIsIdentifyByPhotoDialogOpen] = useState(false);
  const [isSymptomLogDialogOpen, setIsSymptomLogDialogOpen] = useState(false);
  const [isAddManualMacroDialogOpen, setIsAddManualMacroDialogOpen] = useState(false);
  const [isLogPreviousMealDialogOpen, setIsLogPreviousMealDialogOpen] = useState(false);

  // This state now holds a full Date object, which dialogs can use to initialize their date AND time.
  const [selectedLogTimestampForPreviousMeal, setSelectedLogTimestampForPreviousMeal] = useState<Date | undefined>(undefined);


  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isPremiumDashboardOpen, setIsPremiumDashboardOpen] = useState(false);

  const [lastGuestFoodItem, setLastGuestFoodItem] = useState<LoggedFoodItem | null>(null);
  const [isGuestLogFoodDialogOpen, setIsGuestLogFoodDialogOpen] = useState(false);
  const [isGuestSheetOpen, setIsGuestSheetOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<LoggedFoodItem | null>(null);

  const openSimplifiedAddFoodDialog = useCallback(() => {
    setEditingItem(null);
    setSelectedLogTimestampForPreviousMeal(undefined);
    setIsSimplifiedAddFoodDialogOpen(true);
  }, []);
  const openIdentifyByPhotoDialog = useCallback(() => {
    setEditingItem(null);
    setSelectedLogTimestampForPreviousMeal(undefined);
    setIsIdentifyByPhotoDialogOpen(true);
  }, []);
  const openSymptomLogDialog = useCallback(() => setIsSymptomLogDialogOpen(true), []);
  const openLogPreviousMealDialog = useCallback(() => {
    // Initialize with current date and time for "Log Previous Meal" flow
    setSelectedLogTimestampForPreviousMeal(new Date());
    setIsLogPreviousMealDialogOpen(true);
  }, []);


  useEffect(() => {
    const setupUserOrGuest = async () => {
      setIsDataLoading(true);
      if (authLoading) return;

      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const timelineEntriesColRef = collection(db, 'users', authUser.uid, 'timelineEntries');

        try {
          const userDocSnap = await getDoc(userDocRef);
          let currentIsPremium = false;
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            currentIsPremium = data.premium || false;
            setUserProfile({
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              safeFoods: data.safeFoods || [],
              premium: currentIsPremium,
              profile: data.profile,
            });
          } else {
            const newUserProfile: UserProfile = {
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              safeFoods: [],
              premium: false,
            };
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
            currentIsPremium = false;
          }

          let q;
          if (TEMPORARILY_UNLOCK_ALL_FEATURES || currentIsPremium) {
            q = query(timelineEntriesColRef, orderBy('timestamp', 'desc'));
          } else {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            q = query(timelineEntriesColRef, orderBy('timestamp', 'desc'), where('timestamp', '>=', Timestamp.fromDate(twoDaysAgo)));
            if (!TEMPORARILY_UNLOCK_ALL_FEATURES) {
              toast({ title: "Data Retention Notice", description: "As a free user, your data is retained for 2 days.", variant: "default", duration: 10000 });
            }
          }

          const querySnapshot = await getDocs(q);
          const fetchedEntries: TimelineEntry[] = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              ...data,
              id: docSnap.id,
              timestamp: (data.timestamp as Timestamp).toDate(),
            } as TimelineEntry;
          });
          setTimelineEntries(fetchedEntries);

        } catch (error) {
          console.error("Error loading user data from Firestore:", error);

        } finally {
          setIsDataLoading(false);
        }
      } else {
        setUserProfile(initialGuestProfile);
        setTimelineEntries([]);
        setLastGuestFoodItem(null);
        setIsDataLoading(false);
      }
    };
    setupUserOrGuest();
  }, [authUser, authLoading, toast]);


  useEffect(() => {
    if (searchParams.get('openDashboard') === 'true') {
      setIsPremiumDashboardOpen(true);
      router.replace(currentPathname, { scroll: false });
    }

    const dialogToOpen = searchParams.get('openDialog');
    if (dialogToOpen) {
      if (dialogToOpen === 'logFoodAI') {
        openSimplifiedAddFoodDialog();
      } else if (dialogToOpen === 'logPhoto') {
        openIdentifyByPhotoDialog();
      } else if (dialogToOpen === 'logSymptoms') {
        openSymptomLogDialog();
      } else if (dialogToOpen === 'logPrevious') {
        openLogPreviousMealDialog();
      }
      // Remove the query param to prevent re-triggering after dialog handled
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('openDialog');
      router.replace(`${currentPathname}?${newSearchParams.toString()}`, { scroll: false });
    }
  }, [searchParams, router, currentPathname, openSimplifiedAddFoodDialog, openIdentifyByPhotoDialog, openSymptomLogDialog, openLogPreviousMealDialog]);

  // Redirect mobile app users to signup if not authenticated
  useEffect(() => {
    // Check global Capacitor object to avoid build errors if package is missing in web environments
    const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
    if (!authLoading && !authUser && isNative) {
      router.replace('/signup');
    }
  }, [authLoading, authUser, router]);


  const addTimelineEntry = (entry: TimelineEntry) => {
    setTimelineEntries(prevEntries => [entry, ...prevEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const updateTimelineEntry = (updatedEntry: TimelineEntry) => {
    setTimelineEntries(prevEntries =>
      prevEntries.map(entry => (entry.id === updatedEntry.id ? updatedEntry : entry))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
  };

  const handleSetFoodFeedback = async (itemId: string, feedback: 'safe' | 'unsafe' | null) => {
    const itemIndex = timelineEntries.findIndex(e => e.id === itemId && (e.entryType === 'food' || e.entryType === 'manual_macro'));
    if (itemIndex === -1) return;

    const originalItem = timelineEntries[itemIndex] as LoggedFoodItem;
    const updatedItem = { ...originalItem, userFeedback: feedback };

    setTimelineEntries(prevEntries => {
      const newEntries = [...prevEntries];
      newEntries[itemIndex] = updatedItem;
      return newEntries;
    });


    if (authUser && authUser.uid !== 'guest-user') {
      const entryDocRef = doc(db, 'users', authUser.uid, 'timelineEntries', itemId);
      try {
        await updateDoc(entryDocRef, { userFeedback: feedback });
        toast({ title: "Feedback Saved", description: `Food item marked as ${feedback || 'neutral'}.` });
      } catch (error) {
        console.error("Error saving food feedback to Firestore:", error);
        setTimelineEntries(prevEntries => {
          const newEntries = [...prevEntries];
          newEntries[itemIndex] = originalItem;
          return newEntries;
        });
        toast({ title: 'Feedback Error', description: 'Could not save feedback to cloud.', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Feedback Saved (Locally)', description: `Login to save feedback permanently.` });
    }
  };

  const handleToggleFavoriteFoodItem = async (itemId: string, currentIsFavorite: boolean) => {
    const itemIndex = timelineEntries.findIndex(e => e.id === itemId && (e.entryType === 'food' || e.entryType === 'manual_macro'));
    if (itemIndex === -1) return;

    const newIsFavorite = !currentIsFavorite;
    const originalItem = timelineEntries[itemIndex] as LoggedFoodItem;
    const updatedItem = { ...originalItem, isFavorite: newIsFavorite };

    setTimelineEntries(prevEntries => {
      const newEntries = [...prevEntries];
      newEntries[itemIndex] = updatedItem;
      return newEntries;
    });

    if (authUser && authUser.uid !== 'guest-user') {
      const entryDocRef = doc(db, 'users', authUser.uid, 'timelineEntries', itemId);
      try {
        await updateDoc(entryDocRef, { isFavorite: newIsFavorite });
        toast({
          title: newIsFavorite ? "Added to Favorites" : "Removed from Favorites",
          description: `${originalItem.name} ${newIsFavorite ? 'is now a favorite.' : 'is no longer a favorite.'}`
        });
      } catch (error) {
        console.error("Error updating favorite status in Firestore:", error);
        setTimelineEntries(prevEntries => { // Revert local state on error
          const newEntries = [...prevEntries];
          newEntries[itemIndex] = originalItem;
          return newEntries;
        });
        toast({ title: 'Favorite Error', description: 'Could not update favorite status in cloud.', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Favorite Updated (Locally)', description: `Login to save favorite status permanently.` });
    }
  };


  // newTimestamp is now the precise date and time from the dialog
  const handleSubmitFoodItem = async (
    foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType' | 'calories' | 'protein' | 'carbs' | 'fat' | 'sourceDescription' | 'userFeedback' | 'macrosOverridden' | 'isFavorite'>,
    newTimestamp?: Date
  ) => {
    const currentItemId = editingItem ? editingItem.id : `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const logTimestamp = newTimestamp || new Date();

    // 1. Optimistic Update
    const optimisticItem: LoggedFoodItem = {
      ...foodItemData,
      id: currentItemId,
      timestamp: logTimestamp,
      entryType: 'food',
      fodmapData: null, // Placeholder
      userFodmapProfile: generateFallbackFodmapProfile(foodItemData.name), // Temporary fallback
      isSimilarToSafe: false,
      calories: null, protein: null, carbs: null, fat: null,
      userFeedback: editingItem ? editingItem.userFeedback : null,
      macrosOverridden: false,
      originalName: foodItemData.name,
      sourceDescription: "Manually logged",
      isFavorite: editingItem ? editingItem.isFavorite : false,
    };

    if (editingItem) {
      updateTimelineEntry(optimisticItem);
    } else {
      addTimelineEntry(optimisticItem);
    }

    // Close dialog immediately
    setIsAddFoodDialogOpen(false);
    setEditingItem(null);
    if (newTimestamp) setSelectedLogTimestampForPreviousMeal(undefined);


    // 2. Background Processing
    setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));
    let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;

    try {
      const safeFoodItemsForAnalysis = (userProfile.safeFoods && userProfile.safeFoods.length > 0)
        ? userProfile.safeFoods.map(sf => ({
          name: sf.name,
          portionSize: sf.portionSize,
          portionUnit: sf.portionUnit,
          fodmapProfile: sf.fodmapProfile,
        }))
        : undefined;

      fodmapAnalysis = await analyzeFoodItem({
        foodItem: foodItemData.name,
        ingredients: foodItemData.ingredients,
        portionSize: foodItemData.portionSize,
        portionUnit: foodItemData.portionUnit,
        userSafeFoodItems: safeFoodItemsForAnalysis, // Passed directly here
      });

      const itemFodmapProfile: DetailedFodmapProfileFromAI = fodmapAnalysis?.detailedFodmapProfile ?? generateFallbackFodmapProfile(foodItemData.name);

      const processedFoodItem: LoggedFoodItem = {
        ...optimisticItem,
        fodmapData: fodmapAnalysis ?? null,
        isSimilarToSafe: fodmapAnalysis?.similarityAnalysis?.isSimilar ?? false, // Use specific similarity output
        userFodmapProfile: itemFodmapProfile ?? null,
        calories: fodmapAnalysis?.calories ?? null,
        protein: fodmapAnalysis?.protein ?? null,
        carbs: fodmapAnalysis?.carbs ?? null,
        fat: fodmapAnalysis?.fat ?? null,
      };

      // 3. Final Update & Save
      updateTimelineEntry(processedFoodItem);

      if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = processedFoodItem;
        const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', currentItemId);
        // Use setDoc primarily to overwrite correctly with ID
        await setDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(processedFoodItem.timestamp as Date) }, { merge: true });
        // Toast is now background, maybe skip or show subtle?
        // toast({ title: "Analysis Complete", description: `${processedFoodItem.name} updated.` });
      }

    } catch (error: any) {
      console.error('AI analysis or food logging/updating failed:', error);
      toast({ title: 'Analysis Failed', description: `Could not complete analysis for ${foodItemData.name}.`, variant: 'destructive' });
      // Item remains in "Optimistic" state but without rich data. 
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
    }
  };

  const handleSubmitMealDescription = async (
    formData: SimplifiedFoodLogFormValues,
    userDidOverrideMacros: boolean,
    newTimestamp?: Date
  ) => {
    const currentItemId = editingItem ? editingItem.id : `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const logTimestamp = newTimestamp || new Date();

    // 1. Optimistic Update
    const optimisticItem: LoggedFoodItem = {
      id: currentItemId,
      name: editingItem?.name || "Processing Meal...",
      originalName: formData.mealDescription,
      ingredients: "Analyzing ingredients...",
      portionSize: "...",
      portionUnit: "",
      sourceDescription: formData.mealDescription,
      timestamp: logTimestamp,
      fodmapData: null,
      isSimilarToSafe: false,
      userFodmapProfile: generateFallbackFodmapProfile(formData.mealDescription),
      calories: userDidOverrideMacros ? formData.calories : null,
      protein: userDidOverrideMacros ? formData.protein : null,
      carbs: userDidOverrideMacros ? formData.carbs : null,
      fat: userDidOverrideMacros ? formData.fat : null,
      entryType: 'food',
      userFeedback: editingItem ? editingItem.userFeedback : null,
      macrosOverridden: userDidOverrideMacros,
      isFavorite: editingItem ? editingItem.isFavorite : false,
    };

    if (editingItem) {
      updateTimelineEntry(optimisticItem);
    } else {
      addTimelineEntry(optimisticItem);
      setIsPremiumDashboardOpen(true);
    }

    // Close dialog immediately
    setIsSimplifiedAddFoodDialogOpen(false);
    setEditingItem(null);
    if (newTimestamp) setSelectedLogTimestampForPreviousMeal(undefined);


    // 2. Background Processing
    setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));

    try {
      // Step A: Name & Portions
      const mealDescriptionOutput = await processMealDescription({ mealDescription: formData.mealDescription });

      const namedItem = {
        ...optimisticItem,
        name: mealDescriptionOutput.wittyName,
        originalName: mealDescriptionOutput.primaryFoodItemForAnalysis,
        ingredients: mealDescriptionOutput.consolidatedIngredients,
        portionSize: mealDescriptionOutput.estimatedPortionSize,
        portionUnit: mealDescriptionOutput.estimatedPortionUnit,
      };

      // Update UI with partial data (Name available)
      updateTimelineEntry(namedItem);

      // Step B: Nutrition & Similarity (Merged)
      const safeFoodItemsForAnalysis = (userProfile.safeFoods && userProfile.safeFoods.length > 0)
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

      const itemFodmapProfile = fodmapAnalysis?.detailedFodmapProfile ?? generateFallbackFodmapProfile(namedItem.name);

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

      // 3. Final Update & Save
      updateTimelineEntry(finalItem);

      if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = finalItem;
        const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', currentItemId);
        await setDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(finalItem.timestamp as Date) }, { merge: true });
      }

    } catch (error: any) {
      console.error('Full AI meal processing/updating failed:', error);
      toast({ title: 'Processing Incomplete', description: `Some analysis failed, but your meal is logged.`, variant: 'destructive' });
      // Keep whatever state we reached (e.g., just name, or just optimistic)
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
    }
  };

  // newTimestamp is now the precise date and time from the dialog (if this dialog gets time editing)
  const handleProcessAndLogPhotoIdentification = async (
    photoData: IdentifiedPhotoData,
    newTimestamp?: Date
  ) => {
    const currentItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));

    const logTimestamp = newTimestamp || new Date();

    // 1. Optimistic Update (Photo data is already "processed" enough to display)
    const optimisticItem: LoggedFoodItem = {
      name: photoData.name,
      originalName: photoData.name,
      ingredients: photoData.ingredients,
      portionSize: photoData.portionSize,
      portionUnit: photoData.portionUnit,
      id: currentItemId,
      timestamp: logTimestamp,
      fodmapData: null,
      isSimilarToSafe: false,
      userFodmapProfile: generateFallbackFodmapProfile(photoData.name),
      calories: null, protein: null, carbs: null, fat: null,
      entryType: 'food',
      userFeedback: null,
      macrosOverridden: false,
      sourceDescription: "Identified by photo",
      isFavorite: false,
    };

    addTimelineEntry(optimisticItem);
    setIsPremiumDashboardOpen(true);
    setIsIdentifyByPhotoDialogOpen(false);
    if (newTimestamp) setSelectedLogTimestampForPreviousMeal(undefined);


    // 2. Background Processing
    let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;

    try {
      const safeFoodItemsForAnalysis = (userProfile.safeFoods && userProfile.safeFoods.length > 0)
        ? userProfile.safeFoods.map(sf => ({
          name: sf.name,
          portionSize: sf.portionSize,
          portionUnit: sf.portionUnit,
          fodmapProfile: sf.fodmapProfile,
        }))
        : undefined;

      fodmapAnalysis = await analyzeFoodItem({
        foodItem: photoData.name,
        ingredients: photoData.ingredients,
        portionSize: photoData.portionSize,
        portionUnit: photoData.portionUnit,
        userSafeFoodItems: safeFoodItemsForAnalysis,
      });

      const itemFodmapProfile: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile ?? generateFallbackFodmapProfile(photoData.name);

      const processedFoodItem: LoggedFoodItem = {
        ...optimisticItem,
        fodmapData: fodmapAnalysis ?? null,
        isSimilarToSafe: fodmapAnalysis?.similarityAnalysis?.isSimilar ?? false,
        userFodmapProfile: itemFodmapProfile ?? null,
        calories: fodmapAnalysis?.calories ?? null,
        protein: fodmapAnalysis?.protein ?? null,
        carbs: fodmapAnalysis?.carbs ?? null,
        fat: fodmapAnalysis?.fat ?? null,
      };

      // 3. Final Update & Save
      updateTimelineEntry(processedFoodItem);

      if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = processedFoodItem;
        const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', currentItemId);
        await setDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(processedFoodItem.timestamp as Date) }, { merge: true });
        toast({ title: "Photo Analysis Complete", description: `${processedFoodItem.name} enriched.` });
      }

    } catch (error: any) {
      console.error('AI analysis or food logging from photo failed:', error);
      toast({ title: 'Photo Analysis Failed', description: `Detail analysis failed, but item was logged.`, variant: 'destructive' });
      // Item remains in optimistic state
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
    }
  };

  // newTimestamp is now the precise date and time from the dialog
  const handleSubmitManualMacroEntry = async (
    entryData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType' | 'ingredients' | 'portionSize' | 'portionUnit' | 'fodmapData' | 'isSimilarToSafe' | 'userFodmapProfile' | 'sourceDescription' | 'userFeedback' | 'isFavorite'> & { entryType: 'manual_macro' | 'food' },
    newTimestamp?: Date
  ) => {
    const currentItemId = editingItem ? editingItem.id : `macro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const logTimestamp = newTimestamp || new Date(); // Use precise timestamp from dialog, or now if not provided
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

    if (authUser && authUser.uid !== 'guest-user') {
      const { id, ...itemToSave } = newEntry;
      const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', currentItemId);
      try {
        if (editingItem) {
          await updateDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(newEntry.timestamp as Date) });
          toast({ title: "Manual Macros Updated", description: `${newEntry.name} updated.` });
        } else {
          await setDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(newEntry.timestamp as Date) });
          toast({ title: "Manual Macros Logged", description: `${newEntry.name} added to timeline.` });
        }
      } catch (error: any) {
        console.error("Error saving/updating manual macro entry to Firestore:", error);
        toast({ title: "Save Error", description: `Could not ${editingItem ? 'update' : 'save'} manual macro entry.`, variant: "destructive" });
        return;
      }
    } else {
      toast({ title: editingItem ? "Manual Macros Updated (Locally)" : "Manual Macros Logged (Locally)", description: `${newEntry.name} ${editingItem ? 'updated' : 'added'}. Login to save.` });
    }

    if (editingItem) {
      updateTimelineEntry(newEntry);
    } else {
      addTimelineEntry(newEntry);
      setIsPremiumDashboardOpen(true);
    }
    setIsAddManualMacroDialogOpen(false);
    setEditingItem(null);
    if (newTimestamp) setSelectedLogTimestampForPreviousMeal(undefined);
  };

  const handleEditTimelineEntry = (itemToEdit: LoggedFoodItem) => {
    setEditingItem(itemToEdit);
    //setSelectedLogTimestampForPreviousMeal(itemToEdit.timestamp); // Set initial timestamp for dialog

    if (itemToEdit.entryType === 'manual_macro') {
      setIsAddManualMacroDialogOpen(true);
    } else if (itemToEdit.entryType === 'food') {
      const isAIProcessed = itemToEdit.sourceDescription &&
        (itemToEdit.sourceDescription !== "Manually logged" &&
          itemToEdit.sourceDescription !== "Manually logged (analysis failed)");

      if (isAIProcessed || itemToEdit.sourceDescription?.startsWith("Identified by photo")) {
        setIsSimplifiedAddFoodDialogOpen(true);
      } else { // Purely manual entry
        setIsAddFoodDialogOpen(true);
      }
    }
  };


  const handleLogSymptoms = async (symptoms: Symptom[], notes?: string, severity?: number, linkedFoodItemIds?: string[]) => {
    let newSymptomLog: SymptomLog = {
      id: `sym-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symptoms,
      notes,
      severity,
      linkedFoodItemIds: linkedFoodItemIds || [],
      timestamp: new Date(),
      entryType: 'symptom',
    };

    if (authUser && authUser.uid !== 'guest-user') {
      const { id, ...logToSave } = newSymptomLog;
      try {
        const docRef = await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), {
          ...logToSave,
          timestamp: Timestamp.fromDate(newSymptomLog.timestamp)
        });
        newSymptomLog.id = docRef.id; // Update with Firestore generated ID
        toast({ title: "Symptoms Logged & Saved", description: "Your symptoms have been recorded." });
      } catch (error: any) {
        console.error("Error saving symptom log to Firestore:", error);
        toast({ title: "Symptoms Logged (Locally)", description: "Could not save to cloud. Logged locally.", variant: "destructive" });
      }
    } else {
      toast({ title: "Symptoms Logged (Locally)", description: "Login to save your symptoms." });
    }

    addTimelineEntry(newSymptomLog);
    setIsSymptomLogDialogOpen(false);
  };


  const handleRemoveTimelineEntry = async (entryId: string) => {
    const entryToRemove = timelineEntries.find(entry => entry.id === entryId);
    setTimelineEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
    setIsLoadingAi(prev => {
      const newState = { ...prev };
      delete newState[entryId];
      return newState;
    });

    if (authUser && authUser.uid !== 'guest-user') {
      try {
        await deleteDoc(doc(db, 'users', authUser.uid, 'timelineEntries', entryId));
        toast({ title: "Entry Removed", description: "The timeline entry has been deleted from cloud." });
      } catch (error) {
        console.error("Error removing timeline entry from Firestore:", error);
        if (entryToRemove) addTimelineEntry(entryToRemove); // Add back if cloud delete failed
        toast({ title: "Error Removing Entry", description: "Could not remove entry from cloud. Removed locally.", variant: "destructive" });
      }
    } else {
      toast({ title: "Entry Removed (Locally)", description: "The timeline entry has been removed locally." });
    }
  };


  const handleLogPreviousMealFlow = (logMethod: 'AI' | 'Manual' | 'Photo') => {
    // selectedLogTimestampForPreviousMeal is already set by LogPreviousMealDialog's onDateSelect
    setIsSimplifiedAddFoodDialogOpen(false);
    setIsAddFoodDialogOpen(false);
    setIsIdentifyByPhotoDialogOpen(false);
    setEditingItem(null);

    if (logMethod === 'AI') {
      openSimplifiedAddFoodDialog();
    } else if (logMethod === 'Manual') {
      setIsAddFoodDialogOpen(true);
    } else if (logMethod === 'Photo') {
      openIdentifyByPhotoDialog();
    }
    setIsLogPreviousMealDialogOpen(false); // Close this dialog after method selected
  };


  const isAnyItemLoadingAi = Object.values(isLoadingAi).some(loading => loading);

  const dailyNutritionSummary = useMemo<DailyNutritionSummary>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let totals: DailyNutritionSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    timelineEntries.forEach(entry => {
      if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
        const entryDate = new Date(entry.timestamp);
        if (entryDate >= today && entryDate < tomorrow) {
          totals.calories += entry.calories || 0;
          totals.protein += entry.protein || 0;
          totals.carbs += entry.carbs || 0;
          totals.fat += entry.fat || 0;
        }
      }
    });
    return totals;
  }, [timelineEntries]);


  const handleGuestLogFoodOpen = () => {
    setEditingItem(null);
    setIsGuestLogFoodDialogOpen(true);
  };

  const handleGuestProcessMealDescription = async (formData: SimplifiedFoodLogFormValues) => {
    const newItemId = `guest-food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));

    let mealDescriptionOutput: ProcessMealDescriptionOutput | undefined;
    let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
    let newFoodItem: LoggedFoodItem;

    try {
      mealDescriptionOutput = await processMealDescription({ mealDescription: formData.mealDescription });
      fodmapAnalysis = await analyzeFoodItem({
        foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis,
        ingredients: mealDescriptionOutput.consolidatedIngredients,
        portionSize: mealDescriptionOutput.estimatedPortionSize,
        portionUnit: mealDescriptionOutput.estimatedPortionUnit,
      });

      newFoodItem = {
        id: newItemId,
        name: mealDescriptionOutput.wittyName,
        originalName: mealDescriptionOutput.primaryFoodItemForAnalysis ?? null,
        ingredients: mealDescriptionOutput.consolidatedIngredients,
        portionSize: mealDescriptionOutput.estimatedPortionSize,
        portionUnit: mealDescriptionOutput.estimatedPortionUnit,
        sourceDescription: formData.mealDescription ?? null,
        timestamp: new Date(),
        fodmapData: fodmapAnalysis ?? null,
        isSimilarToSafe: false,
        userFodmapProfile: (fodmapAnalysis?.detailedFodmapProfile || generateFallbackFodmapProfile(mealDescriptionOutput.primaryFoodItemForAnalysis)) ?? null,
        calories: fodmapAnalysis?.calories ?? null,
        protein: fodmapAnalysis?.protein ?? null,
        carbs: fodmapAnalysis?.carbs ?? null,
        fat: fodmapAnalysis?.fat ?? null,
        entryType: 'food',
        userFeedback: null,
        macrosOverridden: false,
        isFavorite: false,
      };
      setLastGuestFoodItem(newFoodItem);
      toast({ title: "Meal Noted (Locally)", description: "Sign in with Google to save and track!" });
      setIsGuestSheetOpen(true);
    } catch (error: any) {
      console.error('Guest AI meal processing failed:', error);
      toast({ title: "Error Noting Meal", description: "Could not analyze meal.", variant: 'destructive' });
      setLastGuestFoodItem(null);
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
      setIsGuestLogFoodDialogOpen(false);
    }
  };

  const handleGuestSetFoodFeedback = (itemId: string, feedback: 'safe' | 'unsafe' | null) => {
    if (lastGuestFoodItem && lastGuestFoodItem.id === itemId) {
      setLastGuestFoodItem(prev => prev ? ({ ...prev, userFeedback: feedback }) : null);
    }
  };

  const handleGuestRemoveFoodItem = (itemId: string) => {
    if (lastGuestFoodItem && lastGuestFoodItem.id === itemId) {
      setLastGuestFoodItem(null);
      setIsGuestSheetOpen(false);
    }
  };

  const handleRepeatMeal = async (itemToRepeat: LoggedFoodItem) => {
    const newItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));
    const newTimestamp = new Date(); // Repeated meals are for "now"
    let processedFoodItem: LoggedFoodItem;
    const baseRepetitionData = {
      id: newItemId,
      timestamp: newTimestamp,
      isSimilarToSafe: false,
      userFodmapProfile: null,
      entryType: 'food' as const,
      userFeedback: null,
      macrosOverridden: itemToRepeat.macrosOverridden ?? false,
      isFavorite: itemToRepeat.isFavorite ?? false, // Carry over favorite status
    };

    try {
      let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
      let similarityOutput: FoodSimilarityOutput | undefined;
      let mealDescriptionOutput: ProcessMealDescriptionOutput | undefined;

      if (itemToRepeat.sourceDescription && !itemToRepeat.sourceDescription.startsWith("Identified by photo") && itemToRepeat.sourceDescription !== "Manually logged" && itemToRepeat.sourceDescription !== "Manually logged (analysis failed)") {
        mealDescriptionOutput = await processMealDescription({ mealDescription: itemToRepeat.sourceDescription });
        fodmapAnalysis = await analyzeFoodItem({
          foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis,
          ingredients: mealDescriptionOutput.consolidatedIngredients,
          portionSize: mealDescriptionOutput.estimatedPortionSize,
          portionUnit: mealDescriptionOutput.estimatedPortionUnit,
        });

        const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile ?? generateFallbackFodmapProfile(mealDescriptionOutput.primaryFoodItemForAnalysis);
        if (userProfile.safeFoods && userProfile.safeFoods.length > 0) {
          similarityOutput = await isSimilarToSafeFoods({
            currentFoodItem: { name: mealDescriptionOutput.primaryFoodItemForAnalysis, portionSize: mealDescriptionOutput.estimatedPortionSize, portionUnit: mealDescriptionOutput.estimatedPortionUnit, fodmapProfile: itemFodmapProfileForSimilarity },
            userSafeFoodItems: userProfile.safeFoods.map(sf => ({ ...sf, fodmapProfile: sf.fodmapProfile })),
          });
        }

        processedFoodItem = {
          ...baseRepetitionData,
          name: mealDescriptionOutput.wittyName,
          originalName: mealDescriptionOutput.primaryFoodItemForAnalysis ?? null,
          ingredients: mealDescriptionOutput.consolidatedIngredients,
          portionSize: mealDescriptionOutput.estimatedPortionSize,
          portionUnit: mealDescriptionOutput.estimatedPortionUnit,
          sourceDescription: itemToRepeat.sourceDescription ?? null,
          fodmapData: fodmapAnalysis ?? null,
          isSimilarToSafe: similarityOutput?.isSimilar ?? false,
          userFodmapProfile: itemFodmapProfileForSimilarity ?? null,
          calories: (itemToRepeat.macrosOverridden ? itemToRepeat.calories : fodmapAnalysis?.calories) ?? null,
          protein: (itemToRepeat.macrosOverridden ? itemToRepeat.protein : fodmapAnalysis?.protein) ?? null,
          carbs: (itemToRepeat.macrosOverridden ? itemToRepeat.carbs : fodmapAnalysis?.carbs) ?? null,
          fat: (itemToRepeat.macrosOverridden ? itemToRepeat.fat : fodmapAnalysis?.fat) ?? null,
        };

      } else {
        fodmapAnalysis = await analyzeFoodItem({
          foodItem: itemToRepeat.originalName || itemToRepeat.name,
          ingredients: itemToRepeat.ingredients,
          portionSize: itemToRepeat.portionSize,
          portionUnit: itemToRepeat.portionUnit,
        });

        const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile ?? generateFallbackFodmapProfile(itemToRepeat.originalName || itemToRepeat.name);
        if (userProfile.safeFoods && userProfile.safeFoods.length > 0) {
          similarityOutput = await isSimilarToSafeFoods({
            currentFoodItem: { name: itemToRepeat.originalName || itemToRepeat.name, portionSize: itemToRepeat.portionSize, portionUnit: itemToRepeat.portionUnit, fodmapProfile: itemFodmapProfileForSimilarity },
            userSafeFoodItems: userProfile.safeFoods.map(sf => ({ ...sf, fodmapProfile: sf.fodmapProfile })),
          });
        }

        processedFoodItem = {
          ...baseRepetitionData,
          name: itemToRepeat.name,
          originalName: itemToRepeat.originalName || itemToRepeat.name,
          ingredients: itemToRepeat.ingredients,
          portionSize: itemToRepeat.portionSize,
          portionUnit: itemToRepeat.portionUnit,
          sourceDescription: itemToRepeat.sourceDescription ?? null,
          fodmapData: fodmapAnalysis ?? null,
          isSimilarToSafe: similarityOutput?.isSimilar ?? false,
          userFodmapProfile: itemFodmapProfileForSimilarity ?? null,
          calories: (itemToRepeat.macrosOverridden ? itemToRepeat.calories : fodmapAnalysis?.calories) ?? null,
          protein: (itemToRepeat.macrosOverridden ? itemToRepeat.protein : fodmapAnalysis?.protein) ?? null,
          carbs: (itemToRepeat.macrosOverridden ? itemToRepeat.carbs : fodmapAnalysis?.carbs) ?? null,
          fat: (itemToRepeat.macrosOverridden ? itemToRepeat.fat : fodmapAnalysis?.fat) ?? null,
        };
      }

      if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = processedFoodItem;
        const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', newItemId);
        await setDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(processedFoodItem.timestamp as Date) });
        toast({ title: "Meal Repeated & Saved", description: `"${processedFoodItem.name}" added with fresh analysis.` });
      } else {
        toast({ title: "Meal Repeated (Locally)", description: `"${processedFoodItem.name}" added. Login to save.` });
      }
      addTimelineEntry(processedFoodItem);
    } catch (error: any) {
      console.error('Error repeating meal:', error);
      toast({ title: 'Error Repeating Meal', description: `Could not repeat the meal. Analysis might have failed.`, variant: 'destructive' });

      processedFoodItem = {
        ...baseRepetitionData,
        name: itemToRepeat.name + " (Repeat Failed)",
        originalName: itemToRepeat.originalName ?? null,
        ingredients: itemToRepeat.ingredients,
        portionSize: itemToRepeat.portionSize,
        portionUnit: itemToRepeat.portionUnit,
        sourceDescription: itemToRepeat.sourceDescription ?? null,
        fodmapData: null,
        userFodmapProfile: itemToRepeat.userFodmapProfile ?? null,
        calories: itemToRepeat.calories ?? null,
        protein: itemToRepeat.protein ?? null,
        carbs: itemToRepeat.carbs ?? null,
        fat: itemToRepeat.fat ?? null,
        macrosOverridden: itemToRepeat.macrosOverridden ?? false,
      };
      addTimelineEntry(processedFoodItem);
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
    }
  };

  const groupedTimelineEntries = useMemo(() => groupEntriesByDate(timelineEntries), [timelineEntries]);


  if (authLoading || (isDataLoading && authUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">
          {authLoading ? "Authenticating..." : "Loading your GutCheck dashboard..."}
        </p>
      </div>
    );
  }

  if (!authUser && !authLoading) {
    return (
      <>
        <GuestHomePage
          onLogFoodClick={handleGuestLogFoodOpen}
          lastLoggedItem={lastGuestFoodItem}
          isSheetOpen={isGuestSheetOpen}
          onSheetOpenChange={setIsGuestSheetOpen}
          onSetFeedback={handleGuestSetFoodFeedback}
          onRemoveItem={handleGuestRemoveFoodItem}
          isLoadingAiForItem={lastGuestFoodItem ? !!isLoadingAi[lastGuestFoodItem.id] : false}
        />
        <SimplifiedAddFoodDialog
          isOpen={isGuestLogFoodDialogOpen}
          onOpenChange={setIsGuestLogFoodDialogOpen}
          onSubmitLog={(data, userDidOverrideMacros) => handleGuestProcessMealDescription(data)}
          isGuestView={true}
          key={editingItem ? `edit-simplified-${editingItem.id}` : 'guest-new'}
        />
      </>
    );
  }

  const betaUserMessageContent = (
    <div className="mt-8 max-w-3xl mx-auto text-left sm:text-center bg-primary/5 p-6 rounded-lg border border-primary/20 shadow-sm">
      <h2 className="text-2xl font-semibold text-primary mb-4 font-headline">
        <GradientText>Hey there, GutChecker! 👋</GradientText>
      </h2>
      <p className="text-muted-foreground mb-3">
        A huge <strong className="text-foreground">thank you</strong> for joining the GutCheck beta and taking an active role in shaping its future! Your participation is incredibly valuable as we work to build the best tool to help you understand your gut.
      </p>
      <p className="text-muted-foreground mb-4">
        <strong>Here's how you can make a big impact during this beta phase:</strong>
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 pl-4 text-left">
        <li>
          <strong>Log Your Meals Consistently:</strong> Whether you use the auto-text input, snap a photo, or log manually, the more data you provide, the better our system becomes.
        </li>
        <li>
          <strong>Track Your Symptoms:</strong> Don't forget to log any symptoms you experience. This is key to finding correlations.
        </li>
        <li>
          <strong>Rate Your Reactions:</strong> Use the thumbs up/down on food cards in your dashboard to tell us if a meal felt "safe" or "unsafe" for you. This direct feedback is gold!
        </li>
        <li>
          <strong>Share Your Thoughts:</strong> See the green feedback widget? Use it! Report bugs, suggest features, or tell us what you love (or don't!).
        </li>
        <li>
          <strong>Explore & Experiment:</strong> Dive into your Trends, check out the GutCheck Assistant insights, and see what patterns emerge.
        </li>
      </ul>
      <p className="text-muted-foreground">
        We're constantly making improvements and adding new features. You can always see the latest updates and what's changed by clicking on the app version number in the top navigation bar.
      </p>
      <p className="text-muted-foreground mt-3">
        Thanks again for being on this journey with us!
      </p>
    </div>
  );


  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      <Navbar
        onOpenDashboardClick={() => setIsPremiumDashboardOpen(true)}
        onLogFoodAIClick={() => {
          setEditingItem(null);
          setSelectedLogTimestampForPreviousMeal(undefined); // For "now"
          openSimplifiedAddFoodDialog();
        }}
        onIdentifyByPhotoClick={() => {
          setEditingItem(null);
          setSelectedLogTimestampForPreviousMeal(undefined); // For "now"
          openIdentifyByPhotoDialog();
        }}
        onLogSymptomsClick={openSymptomLogDialog}
        onLogPreviousMealClick={openLogPreviousMealDialog}
      />


      <div className="flex-grow flex flex-col items-center justify-start pt-0 h-full overflow-hidden">
        {authUser ? (
          <DashboardContent
            userProfile={userProfile}
            timelineEntries={timelineEntries}
            dailyNutritionSummary={dailyNutritionSummary}
            isLoadingAi={isLoadingAi}
            onSetFeedback={handleSetFoodFeedback}
            onRemoveTimelineEntry={handleRemoveTimelineEntry}
            onLogSymptomsForFood={openSymptomLogDialog}
            onEditIngredients={handleEditTimelineEntry}
            onRepeatMeal={handleRepeatMeal}
            onToggleFavorite={handleToggleFavoriteFoodItem}
            onLogFoodAIClick={openSimplifiedAddFoodDialog}
            onIdentifyByPhotoClick={openIdentifyByPhotoDialog}
            onLogSymptomsClick={openSymptomLogDialog}
            onLogPreviousMealClick={openLogPreviousMealDialog}
            groupedTimelineEntries={groupedTimelineEntries}
          />
        ) : (
          <LandingPageClientContent
            showHeroCTAButton={false}
            betaUserMessage={betaUserMessageContent}
          />
        )}
      </div>

      {/* PremiumDashboardSheet removed as it is now inline */}



      <SimplifiedAddFoodDialog
        isOpen={isSimplifiedAddFoodDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            setSelectedLogTimestampForPreviousMeal(undefined);
          }
          setIsSimplifiedAddFoodDialogOpen(open);
        }}
        onSubmitLog={(data, userDidOverrideMacros, newDate) => handleSubmitMealDescription(data, userDidOverrideMacros, newDate)}
        isEditing={!!editingItem && editingItem.entryType === 'food'}
        initialValues={editingItem && editingItem.entryType === 'food' ?
          {
            mealDescription: editingItem.sourceDescription ||
              (editingItem.sourceDescription?.startsWith("Identified by photo")
                ? `${editingItem.originalName}. Ingredients: ${editingItem.ingredients}`
                : editingItem.originalName || ''),
            calories: editingItem.calories ?? undefined,
            protein: editingItem.protein ?? undefined,
            carbs: editingItem.carbs ?? undefined,
            fat: editingItem.fat ?? undefined
          }
          : { mealDescription: '' }}
        initialMacrosOverridden={editingItem?.macrosOverridden || false}
        initialTimestamp={editingItem?.timestamp || selectedLogTimestampForPreviousMeal}
        isGuestView={false}
        key={editingItem?.id ? `edit-simplified-${editingItem.id}` : (selectedLogTimestampForPreviousMeal ? `new-prev-simplified-${selectedLogTimestampForPreviousMeal.toISOString()}` : 'new-simplified')}
      />
      <IdentifyFoodByPhotoDialog
        isOpen={isIdentifyByPhotoDialogOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedLogTimestampForPreviousMeal(undefined);
          setIsIdentifyByPhotoDialogOpen(open);
        }}
        onFoodIdentified={(data) => handleProcessAndLogPhotoIdentification(data, selectedLogTimestampForPreviousMeal)}
      // Pass initialTimestamp to IdentifyFoodByPhotoDialog if it supports it for "Log Previous Meal"
      // For now, handleProcessAndLogPhotoIdentification uses selectedLogTimestampForPreviousMeal directly.
      />
      <AddFoodItemDialog
        isOpen={isAddFoodDialogOpenState}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            setSelectedLogTimestampForPreviousMeal(undefined);
          }
          setIsAddFoodDialogOpen(open);
        }}
        onSubmitFoodItem={(data, newDate) => handleSubmitFoodItem(data, newDate)}
        isEditing={!!editingItem && editingItem.entryType === 'food'}
        initialValues={editingItem && editingItem.entryType === 'food'
          ? { name: editingItem.name, ingredients: editingItem.ingredients, portionSize: editingItem.portionSize, portionUnit: editingItem.portionUnit }
          : undefined}
        initialTimestamp={editingItem?.timestamp || selectedLogTimestampForPreviousMeal}
        key={editingItem?.id ? `edit-manual-${editingItem.id}` : (selectedLogTimestampForPreviousMeal ? `new-prev-manual-${selectedLogTimestampForPreviousMeal.toISOString()}` : 'new-manual')}
      />
      <SymptomLoggingDialog
        isOpen={isSymptomLogDialogOpen}
        onOpenChange={setIsSymptomLogDialogOpen}
        onLogSymptoms={handleLogSymptoms}
        allSymptoms={COMMON_SYMPTOMS}
      />
      <AddManualMacroEntryDialog
        isOpen={isAddManualMacroDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            setSelectedLogTimestampForPreviousMeal(undefined);
          }
          setIsAddManualMacroDialogOpen(open);
        }}
        onSubmitEntry={(data, newDate) => handleSubmitManualMacroEntry(data, newDate)}
        isEditing={!!editingItem && editingItem.entryType === 'manual_macro'}
        initialValues={editingItem && editingItem.entryType === 'manual_macro' ?
          { calories: editingItem.calories ?? undefined, protein: editingItem.protein ?? undefined, carbs: editingItem.carbs ?? undefined, fat: editingItem.fat ?? undefined, entryName: editingItem.name }
          : undefined
        }
        initialTimestamp={editingItem?.timestamp || selectedLogTimestampForPreviousMeal}
        key={editingItem?.id ? `edit-macro-${editingItem.id}` : (selectedLogTimestampForPreviousMeal ? `new-prev-macro-${selectedLogTimestampForPreviousMeal.toISOString()}` : 'new-macro')}
      />
      <LogPreviousMealDialog
        isOpen={isLogPreviousMealDialogOpen}
        onOpenChange={setIsLogPreviousMealDialogOpen}
        onDateSelect={setSelectedLogTimestampForPreviousMeal} // Now sets full Date object
        onLogMethodSelect={handleLogPreviousMealFlow}
        currentSelectedDate={selectedLogTimestampForPreviousMeal}
      />
      {isAnyItemLoadingAi && (
        <div className="fixed bottom-20 right-4 bg-card text-card-foreground p-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Analyzing...</span>
        </div>
      )}
    </div>
  );
}
