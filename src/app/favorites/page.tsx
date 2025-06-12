
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { LoggedFoodItem, UserProfile, TimelineEntry, Symptom } from '@/types';
import { COMMON_SYMPTOMS } from '@/types';
import { Loader2, Heart, Home, PlusCircle, Camera, ListChecks, CalendarDays } from 'lucide-react';
import { analyzeFoodItem, type AnalyzeFoodItemOutput, type FoodFODMAPProfile as DetailedFodmapProfileFromAI } from '@/ai/flows/fodmap-detection';
import { isSimilarToSafeFoods, type FoodFODMAPProfile, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
import { processMealDescription, type ProcessMealDescriptionOutput } from '@/ai/flows/process-meal-description-flow';

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
  deleteDoc,
  Timestamp,
  query,
  orderBy,
  where,
  getDocs,
} from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import AddFoodItemDialog, { type ManualEntryFormValues } from '@/components/food-logging/AddFoodItemDialog';
import SimplifiedAddFoodDialog, { type SimplifiedFoodLogFormValues } from '@/components/food-logging/SimplifiedAddFoodDialog';
import SymptomLoggingDialog from '@/components/food-logging/SymptomLoggingDialog';
import AddManualMacroEntryDialog, { type ManualMacroFormValues } from '@/components/food-logging/AddManualMacroEntryDialog';
import IdentifyFoodByPhotoDialog, { type IdentifiedPhotoData } from '@/components/food-logging/IdentifyFoodByPhotoDialog';
import Navbar from '@/components/shared/Navbar';
import TimelineFoodCard from '@/components/food-logging/TimelineFoodCard';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  return { fructans: pseudoRandom(hash + 1), galactans: pseudoRandom(hash + 2), polyolsSorbitol: pseudoRandom(hash + 3), polyolsMannitol: pseudoRandom(hash + 4), lactose: pseudoRandom(hash + 5), fructose: pseudoRandom(hash + 6) };
};

export default function FavoritesPage() {
  const { toast } = useToast();
  const { user: authUser, loading: authLoading } = useAuth();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [favoriteItems, setFavoriteItems] = useState<LoggedFoodItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<LoggedFoodItem | null>(null);
  
  // Dialog states
  const [isAddFoodDialogOpenState, setIsAddFoodDialogOpenState] = useState(false);
  const [isSimplifiedAddFoodDialogOpen, setIsSimplifiedAddFoodDialogOpen] = useState(false);
  const [isIdentifyByPhotoDialogOpen, setIsIdentifyByPhotoDialogOpen] = useState(false); // Needed for edit/repeat
  const [isSymptomLogDialogOpen, setIsSymptomLogDialogOpen] = useState(false);
  const [isAddManualMacroDialogOpen, setIsAddManualMacroDialogOpen] = useState(false);
  const [selectedLogTimestampForPreviousMeal, setSelectedLogTimestampForPreviousMeal] = useState<Date | undefined>(undefined); // For date/time editing
  const [contextualFoodItemIdForSymptomLog, setContextualFoodItemIdForSymptomLog] = useState<string | undefined>(undefined);


  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      setIsLoadingData(false);
      setError("Please log in to view your favorites.");
      return;
    }

    const fetchFavorites = async () => {
      setIsLoadingData(true);
      setError(null);
      try {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
          // Should not happen if user is authenticated, but handle defensively
           setUserProfile({ uid: authUser.uid, email: authUser.email, displayName: authUser.displayName, safeFoods: [], premium: false });
        }

        const timelineEntriesColRef = collection(db, 'users', authUser.uid, 'timelineEntries');
        const q = query(
          timelineEntriesColRef,
          where('isFavorite', '==', true),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedFavorites = querySnapshot.docs
          .map(docSnap => {
            const data = docSnap.data();
            return {
              ...data,
              id: docSnap.id,
              timestamp: (data.timestamp as Timestamp).toDate(),
            } as LoggedFoodItem; // Assuming only LoggedFoodItem can be favorited
          })
          .filter(item => item.entryType === 'food' || item.entryType === 'manual_macro'); // Ensure correct type

        setFavoriteItems(fetchedFavorites);
      } catch (err: any) {
        console.error("Error fetching favorite items:", err);
        setError("Could not load your favorite items. Please try again later.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchFavorites();
  }, [authUser, authLoading]);

  const handleToggleFavorite = async (itemId: string, currentIsFavorite: boolean) => {
    if (!authUser) return;
    const newIsFavorite = !currentIsFavorite;
    const entryDocRef = doc(db, 'users', authUser.uid, 'timelineEntries', itemId);
    try {
      await updateDoc(entryDocRef, { isFavorite: newIsFavorite });
      if (newIsFavorite) {
        // This case should not happen from favorites page, but handle defensively
        toast({ title: "Added to Favorites", description: "Item marked as favorite."});
      } else {
        setFavoriteItems(prev => prev.filter(item => item.id !== itemId));
        toast({ title: "Removed from Favorites", description: "Item unmarked as favorite."});
      }
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast({ title: "Error", description: "Could not update favorite status.", variant: "destructive"});
    }
  };

  const handleRemoveTimelineEntry = async (entryId: string) => {
    if (!authUser) return;
    const entryDocRef = doc(db, 'users', authUser.uid, 'timelineEntries', entryId);
    try {
      await deleteDoc(entryDocRef);
      setFavoriteItems(prev => prev.filter(item => item.id !== entryId));
      toast({ title: "Item Removed", description: "Favorite item has been deleted." });
    } catch (error) {
      console.error("Error removing favorite item:", error);
      toast({ title: "Error", description: "Could not remove favorite item.", variant: "destructive" });
    }
  };
  
  const handleSetFoodFeedback = async (itemId: string, feedback: 'safe' | 'unsafe' | null) => {
    if (!authUser) return;
    const entryDocRef = doc(db, 'users', authUser.uid, 'timelineEntries', itemId);
    try {
        await updateDoc(entryDocRef, { userFeedback: feedback });
        setFavoriteItems(prevItems => 
            prevItems.map(item => item.id === itemId ? { ...item, userFeedback: feedback } : item)
        );
        toast({ title: "Feedback Saved", description: `Food item marked as ${feedback || 'neutral'}.` });
    } catch (error) {
        console.error("Error saving food feedback to Firestore:", error);
        toast({ title: 'Feedback Error', description: 'Could not save feedback.', variant: 'destructive' });
    }
  };

  const handleLogSymptoms = async (symptoms: Symptom[], notes?: string, severity?: number, linkedFoodItemIds?: string[]) => {
    if (!authUser) return;
    let newSymptomLog = {
      symptoms, notes, severity,
      linkedFoodItemIds: linkedFoodItemIds || [],
      timestamp: Timestamp.now(), // Firestore Timestamp for new log
      entryType: 'symptom' as 'symptom',
    };
    try {
        await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), newSymptomLog);
        toast({ title: "Symptoms Logged", description: "Your symptoms have been recorded." });
    } catch (error: any) {
        toast({ title: "Symptom Log Error", description: "Could not save symptoms.", variant: "destructive" });
    }
    setIsSymptomLogDialogOpen(false);
  };

  const openSymptomLogDialogWithContext = (foodItemId?: string) => {
    setContextualFoodItemIdForSymptomLog(foodItemId);
    setIsSymptomLogDialogOpen(true);
  };

  // Edit and Repeat meal handlers (simplified, but functional with dialogs)
  const handleEditTimelineEntry = (itemToEdit: LoggedFoodItem) => {
    setEditingItem(itemToEdit);
    setSelectedLogTimestampForPreviousMeal(itemToEdit.timestamp); // Set initial timestamp for dialog

    if (itemToEdit.entryType === 'manual_macro') {
      setIsAddManualMacroDialogOpen(true);
    } else if (itemToEdit.entryType === 'food') {
      const isAIProcessed = itemToEdit.sourceDescription && 
                           (itemToEdit.sourceDescription !== "Manually logged" && 
                            itemToEdit.sourceDescription !== "Manually logged (analysis failed)");
      if (isAIProcessed || itemToEdit.sourceDescription?.startsWith("Identified by photo")) {
        setIsSimplifiedAddFoodDialogOpen(true);
      } else { 
        setIsAddFoodDialogOpenState(true);
      }
    }
  };

  const handleSubmitFoodItem = async (foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType' | 'calories' | 'protein' | 'carbs' | 'fat' | 'sourceDescription' | 'userFeedback' | 'macrosOverridden' | 'isFavorite'>, newTimestamp?: Date) => {
    if (!authUser || !editingItem) return;
    const currentItemId = editingItem.id;
    setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));
    const logTimestamp = newTimestamp || editingItem.timestamp;

    try {
      const fodmapAnalysis = await analyzeFoodItem({ foodItem: foodItemData.name, ingredients: foodItemData.ingredients, portionSize: foodItemData.portionSize, portionUnit: foodItemData.portionUnit });
      const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile ?? generateFallbackFodmapProfile(foodItemData.name);
      let isSimilar = false;
      if (userProfile?.safeFoods && userProfile.safeFoods.length > 0) {
        const similarityOutput = await isSimilarToSafeFoods({
          currentFoodItem: { name: foodItemData.name, portionSize: foodItemData.portionSize, portionUnit: foodItemData.portionUnit, fodmapProfile: itemFodmapProfileForSimilarity },
          userSafeFoodItems: userProfile.safeFoods.map(sf => ({ ...sf, fodmapProfile: sf.fodmapProfile! })),
        });
        isSimilar = similarityOutput?.isSimilar ?? false;
      }

      const updatedFoodItem: LoggedFoodItem = {
        ...editingItem,
        ...foodItemData,
        timestamp: logTimestamp,
        fodmapData: fodmapAnalysis ?? null,
        isSimilarToSafe: isSimilar,
        userFodmapProfile: itemFodmapProfileForSimilarity,
        calories: fodmapAnalysis?.calories ?? null,
        protein: fodmapAnalysis?.protein ?? null,
        carbs: fodmapAnalysis?.carbs ?? null,
        fat: fodmapAnalysis?.fat ?? null,
        entryType: 'food',
        macrosOverridden: false, 
        originalName: foodItemData.name,
        sourceDescription: "Manually logged",
      };

      const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', currentItemId);
      await updateDoc(docRefPath, { ...updatedFoodItem, timestamp: Timestamp.fromDate(logTimestamp) });
      setFavoriteItems(prev => prev.map(item => item.id === currentItemId ? updatedFoodItem : item));
      toast({ title: "Favorite Updated", description: `${updatedFoodItem.name} updated.` });
      setIsAddFoodDialogOpenState(false);
      setEditingItem(null);
    } catch (error) {
      toast({ title: 'Error Updating Favorite', description: 'Could not update food item.', variant: 'destructive' });
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
    }
  };

  const handleSubmitMealDescription = async (formData: SimplifiedFoodLogFormValues, userDidOverrideMacros: boolean, newTimestamp?: Date) => {
    if (!authUser || !editingItem) return;
    const currentItemId = editingItem.id;
    setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));
    const logTimestamp = newTimestamp || editingItem.timestamp;

    try {
      const mealDescriptionOutput = await processMealDescription({ mealDescription: formData.mealDescription });
      const fodmapAnalysis = await analyzeFoodItem({ foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis, ingredients: mealDescriptionOutput.consolidatedIngredients, portionSize: mealDescriptionOutput.estimatedPortionSize, portionUnit: mealDescriptionOutput.estimatedPortionUnit });
      const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile ?? generateFallbackFodmapProfile(mealDescriptionOutput.primaryFoodItemForAnalysis);
      let isSimilar = false;
      if (userProfile?.safeFoods && userProfile.safeFoods.length > 0) {
         const similarityOutput = await isSimilarToSafeFoods({
          currentFoodItem: { name: mealDescriptionOutput.primaryFoodItemForAnalysis, portionSize: mealDescriptionOutput.estimatedPortionSize, portionUnit: mealDescriptionOutput.estimatedPortionUnit, fodmapProfile: itemFodmapProfileForSimilarity },
          userSafeFoodItems: userProfile.safeFoods.map(sf => ({ ...sf, fodmapProfile: sf.fodmapProfile! })),
        });
        isSimilar = similarityOutput?.isSimilar ?? false;
      }
      
      const updatedFoodItem: LoggedFoodItem = {
        ...editingItem,
        name: mealDescriptionOutput.wittyName,
        originalName: mealDescriptionOutput.primaryFoodItemForAnalysis,
        ingredients: mealDescriptionOutput.consolidatedIngredients,
        portionSize: mealDescriptionOutput.estimatedPortionSize,
        portionUnit: mealDescriptionOutput.estimatedPortionUnit,
        sourceDescription: formData.mealDescription,
        timestamp: logTimestamp,
        fodmapData: fodmapAnalysis ?? null,
        isSimilarToSafe: isSimilar,
        userFodmapProfile: itemFodmapProfileForSimilarity,
        calories: userDidOverrideMacros ? formData.calories : (fodmapAnalysis?.calories ?? null),
        protein: userDidOverrideMacros ? formData.protein : (fodmapAnalysis?.protein ?? null),
        carbs: userDidOverrideMacros ? formData.carbs : (fodmapAnalysis?.carbs ?? null),
        fat: userDidOverrideMacros ? formData.fat : (fodmapAnalysis?.fat ?? null),
        macrosOverridden: userDidOverrideMacros,
      };
      
      const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', currentItemId);
      await updateDoc(docRefPath, { ...updatedFoodItem, timestamp: Timestamp.fromDate(logTimestamp) });
      setFavoriteItems(prev => prev.map(item => item.id === currentItemId ? updatedFoodItem : item));
      toast({ title: "Favorite Updated", description: `${updatedFoodItem.name} updated with new AI insights.` });
      setIsSimplifiedAddFoodDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast({ title: 'Error Updating Favorite', description: 'Could not update meal via AI.', variant: 'destructive' });
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
    }
  };
  
  const handleSubmitManualMacroEntry = async (entryData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType' | 'ingredients' | 'portionSize' | 'portionUnit' | 'fodmapData' | 'isSimilarToSafe' | 'userFodmapProfile' | 'sourceDescription' | 'userFeedback' | 'isFavorite'> & { entryType: 'manual_macro' | 'food' }, newTimestamp?: Date) => {
    if (!authUser || !editingItem) return;
    const currentItemId = editingItem.id;
    const logTimestamp = newTimestamp || editingItem.timestamp;
    const updatedEntry: LoggedFoodItem = {
      ...editingItem,
      ...entryData,
      id: currentItemId,
      timestamp: logTimestamp,
      entryType: 'manual_macro',
      macrosOverridden: true,
    };

    const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', currentItemId);
    try {
        await updateDoc(docRefPath, { ...updatedEntry, timestamp: Timestamp.fromDate(logTimestamp) });
        setFavoriteItems(prev => prev.map(item => item.id === currentItemId ? updatedEntry : item));
        toast({ title: "Manual Macros Updated", description: `${updatedEntry.name} updated.` });
        setIsAddManualMacroDialogOpen(false);
        setEditingItem(null);
    } catch (error) {
        toast({ title: "Save Error", description: 'Could not update manual macro entry.', variant: "destructive" });
    }
  };

  const handleRepeatMeal = async (itemToRepeat: LoggedFoodItem) => {
    if(!authUser || !userProfile) return;
    const newItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));
    const newTimestamp = new Date();
    let processedFoodItem: LoggedFoodItem;

    try {
      // Re-analyze the meal as if it's new
      let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
      let similarityOutput: FoodSimilarityOutput | undefined;
      let mealDescriptionOutput: ProcessMealDescriptionOutput | undefined;

      const baseRepetitionData = {
        id: newItemId,
        timestamp: newTimestamp,
        isSimilarToSafe: false, 
        userFodmapProfile: null, 
        entryType: 'food' as 'food',
        userFeedback: null, 
        macrosOverridden: itemToRepeat.macrosOverridden ?? false,
        isFavorite: false, // New repeated meals are not favorited by default
      };
      
      if (itemToRepeat.sourceDescription && !itemToRepeat.sourceDescription.startsWith("Identified by photo") && itemToRepeat.sourceDescription !== "Manually logged" && itemToRepeat.sourceDescription !== "Manually logged (analysis failed)") {
        mealDescriptionOutput = await processMealDescription({ mealDescription: itemToRepeat.sourceDescription });
        fodmapAnalysis = await analyzeFoodItem({ foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis, ingredients: mealDescriptionOutput.consolidatedIngredients, portionSize: mealDescriptionOutput.estimatedPortionSize, portionUnit: mealDescriptionOutput.estimatedPortionUnit });
        const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile ?? generateFallbackFodmapProfile(mealDescriptionOutput.primaryFoodItemForAnalysis);
        if (userProfile.safeFoods && userProfile.safeFoods.length > 0) {
          similarityOutput = await isSimilarToSafeFoods({
            currentFoodItem: { name: mealDescriptionOutput.primaryFoodItemForAnalysis, portionSize: mealDescriptionOutput.estimatedPortionSize, portionUnit: mealDescriptionOutput.estimatedPortionUnit, fodmapProfile: itemFodmapProfileForSimilarity },
            userSafeFoodItems: userProfile.safeFoods.map(sf => ({ ...sf, fodmapProfile: sf.fodmapProfile! })),
          });
        }
        processedFoodItem = { ...baseRepetitionData, name: mealDescriptionOutput.wittyName, originalName: mealDescriptionOutput.primaryFoodItemForAnalysis, ingredients: mealDescriptionOutput.consolidatedIngredients, portionSize: mealDescriptionOutput.estimatedPortionSize, portionUnit: mealDescriptionOutput.estimatedPortionUnit, sourceDescription: itemToRepeat.sourceDescription, fodmapData: fodmapAnalysis ?? null, isSimilarToSafe: similarityOutput?.isSimilar ?? false, userFodmapProfile: itemFodmapProfileForSimilarity, calories: (itemToRepeat.macrosOverridden ? itemToRepeat.calories : fodmapAnalysis?.calories) ?? null, protein: (itemToRepeat.macrosOverridden ? itemToRepeat.protein : fodmapAnalysis?.protein) ?? null, carbs: (itemToRepeat.macrosOverridden ? itemToRepeat.carbs : fodmapAnalysis?.carbs) ?? null, fat: (itemToRepeat.macrosOverridden ? itemToRepeat.fat : fodmapAnalysis?.fat) ?? null };
      } else { 
        fodmapAnalysis = await analyzeFoodItem({ foodItem: itemToRepeat.originalName || itemToRepeat.name, ingredients: itemToRepeat.ingredients, portionSize: itemToRepeat.portionSize, portionUnit: itemToRepeat.portionUnit });
        const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile ?? generateFallbackFodmapProfile(itemToRepeat.originalName || itemToRepeat.name);
        if (userProfile.safeFoods && userProfile.safeFoods.length > 0) {
          similarityOutput = await isSimilarToSafeFoods({
            currentFoodItem: { name: itemToRepeat.originalName || itemToRepeat.name, portionSize: itemToRepeat.portionSize, portionUnit: itemToRepeat.portionUnit, fodmapProfile: itemFodmapProfileForSimilarity },
            userSafeFoodItems: userProfile.safeFoods.map(sf => ({ ...sf, fodmapProfile: sf.fodmapProfile! })),
          });
        }
        processedFoodItem = { ...baseRepetitionData, name: itemToRepeat.name, originalName: itemToRepeat.originalName || itemToRepeat.name, ingredients: itemToRepeat.ingredients, portionSize: itemToRepeat.portionSize, portionUnit: itemToRepeat.portionUnit, sourceDescription: itemToRepeat.sourceDescription, fodmapData: fodmapAnalysis ?? null, isSimilarToSafe: similarityOutput?.isSimilar ?? false, userFodmapProfile: itemFodmapProfileForSimilarity, calories: (itemToRepeat.macrosOverridden ? itemToRepeat.calories : fodmapAnalysis?.calories) ?? null, protein: (itemToRepeat.macrosOverridden ? itemToRepeat.protein : fodmapAnalysis?.protein) ?? null, carbs: (itemToRepeat.macrosOverridden ? itemToRepeat.carbs : fodmapAnalysis?.carbs) ?? null, fat: (itemToRepeat.macrosOverridden ? itemToRepeat.fat : fodmapAnalysis?.fat) ?? null };
      }

      const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', newItemId);
      await setDoc(docRefPath, { ... (({ id, ...rest }) => rest)(processedFoodItem), timestamp: Timestamp.fromDate(newTimestamp) }); // Save to Firestore
      // Add to general timeline (page.tsx), not directly to favorites. User can favorite it from timeline.
      toast({ title: "Meal Repeated & Logged", description: `"${processedFoodItem.name}" added to your main timeline.` });
    } catch (error) {
      toast({ title: 'Error Repeating Meal', variant: 'destructive' });
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
    }
  };


  if (authLoading || isLoadingData) {
    return <FavoritesLoading />;
  }

  if (error) {
    return <FavoritesError error={{ name: "FetchError", message: error, digest: undefined }} reset={() => window.location.reload()} />;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Heart className="mr-3 h-8 w-8 text-primary fill-primary/70" /> Your Favorite Meals
          </h1>
          <Button asChild variant="outline">
            <Link href="/?openDashboard=true">
              <Home className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        {favoriteItems.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground">No Favorites Yet</h2>
            <p className="text-muted-foreground">
              Mark meals as favorites from your dashboard to see them here.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-10rem)]"> {/* Adjust height as needed */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8 pr-3">
              {favoriteItems.map((item, index) => (
                 <div
                    key={item.id}
                    className="card-reveal-animation"
                    style={{ animationDelay: `${index * 0.07}s` }}
                  >
                    <TimelineFoodCard
                      item={item}
                      onSetFeedback={handleSetFoodFeedback}
                      onRemoveItem={handleRemoveTimelineEntry}
                      onLogSymptoms={() => openSymptomLogDialogWithContext(item.id)}
                      isLoadingAi={!!isLoadingAi[item.id]}
                      onEditIngredients={handleEditTimelineEntry}
                      onRepeatMeal={handleRepeatMeal}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>

      {/* Dialogs for editing, etc. */}
      <SimplifiedAddFoodDialog
        isOpen={isSimplifiedAddFoodDialogOpen}
        onOpenChange={(open) => { if (!open) setEditingItem(null); setIsSimplifiedAddFoodDialogOpen(open); }}
        onSubmitLog={handleSubmitMealDescription}
        isEditing={!!editingItem && editingItem.entryType === 'food'}
        initialValues={editingItem && editingItem.entryType === 'food' ? { mealDescription: editingItem.sourceDescription || editingItem.originalName || '', calories: editingItem.calories ?? undefined, protein: editingItem.protein ?? undefined, carbs: editingItem.carbs ?? undefined, fat: editingItem.fat ?? undefined } : { mealDescription: '' }}
        initialMacrosOverridden={editingItem?.macrosOverridden || false}
        initialTimestamp={editingItem?.timestamp || selectedLogTimestampForPreviousMeal}
        key={editingItem?.id ? `edit-fav-simplified-${editingItem.id}` : 'new-fav-simplified'}
      />
      <AddFoodItemDialog
        isOpen={isAddFoodDialogOpenState}
        onOpenChange={(open) => { if (!open) setEditingItem(null); setIsAddFoodDialogOpenState(open); }}
        onSubmitFoodItem={handleSubmitFoodItem}
        isEditing={!!editingItem && editingItem.entryType === 'food'}
        initialValues={editingItem && editingItem.entryType === 'food' ? { name: editingItem.name, ingredients: editingItem.ingredients, portionSize: editingItem.portionSize, portionUnit: editingItem.portionUnit } : undefined}
        initialTimestamp={editingItem?.timestamp || selectedLogTimestampForPreviousMeal}
        key={editingItem?.id ? `edit-fav-manual-${editingItem.id}` : 'new-fav-manual'}
      />
      <AddManualMacroEntryDialog
        isOpen={isAddManualMacroDialogOpen}
        onOpenChange={(open) => { if (!open) setEditingItem(null); setIsAddManualMacroDialogOpen(open); }}
        onSubmitEntry={handleSubmitManualMacroEntry}
        isEditing={!!editingItem && editingItem.entryType === 'manual_macro'}
        initialValues={editingItem && editingItem.entryType === 'manual_macro' ? { calories: editingItem.calories ?? undefined, protein: editingItem.protein ?? undefined, carbs: editingItem.carbs ?? undefined, fat: editingItem.fat ?? undefined, entryName: editingItem.name } : undefined }
        initialTimestamp={editingItem?.timestamp || selectedLogTimestampForPreviousMeal}
        key={editingItem?.id ? `edit-fav-macro-${editingItem.id}` : 'new-fav-macro'}
      />
      <SymptomLoggingDialog
        isOpen={isSymptomLogDialogOpen}
        onOpenChange={setIsSymptomLogDialogOpen}
        onLogSymptoms={(symptoms, notes, severity) => handleLogSymptoms(symptoms, notes, severity, contextualFoodItemIdForSymptomLog ? [contextualFoodItemIdForSymptomLog] : undefined)}
        allSymptoms={COMMON_SYMPTOMS}
        context={contextualFoodItemIdForSymptomLog ? { foodItemIds: [contextualFoodItemIdForSymptomLog] } : undefined}
      />
      {/* IdentifyFoodByPhotoDialog might not be directly needed for editing favorites unless we allow changing the source type. For now, not included here. */}

    </div>
  );
}

// Temporary Loading/Error components for the Favorites page
function FavoritesLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">Loading Your Favorites...</p>
      </div>
    </div>
  );
}

interface FavoritesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
function FavoritesError({ error, reset }: FavoritesErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
        <Heart className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-4 text-foreground">Oops! Something went wrong.</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          We encountered an error while trying to load your favorite meals. Please try again.
        </p>
        {error?.message && <p className="text-sm text-destructive mb-4">Error: {error.message}</p>}
        <Button
          onClick={() => reset()}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
