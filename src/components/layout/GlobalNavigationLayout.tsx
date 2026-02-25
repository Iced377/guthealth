'use client';

import React, { useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { ActionProvider, useActionContext } from '@/contexts/ActionContext';
import { useAuth } from '@/components/auth/AuthProvider';
import LiquidNavigation from '@/components/navigation/LiquidNavigation';
import { COMMON_SYMPTOMS, LoggedFoodItem } from '@/types';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { NavVisibilityProvider } from '@/components/navigation/useNavVisibilityController';
import AdminNavVisibilityController from '@/components/navigation/AdminNavVisibilityController';

import { usePushNotifications } from '@/hooks/usePushNotifications';

const ComposeOverlay = dynamic(() => import('@/components/compose/ComposeOverlay'), { ssr: false });
const IdentifyFoodByPhotoDialog = dynamic(() => import('@/components/food-logging/IdentifyFoodByPhotoDialog'), { ssr: false });
const SymptomLoggingDialog = dynamic(() => import('@/components/food-logging/SymptomLoggingDialog'), { ssr: false });
const LogPreviousMealDialog = dynamic(() => import('@/components/food-logging/LogPreviousMealDialog'), { ssr: false });
const AddManualMacroEntryDialog = dynamic(() => import('@/components/food-logging/AddManualMacroEntryDialog'), { ssr: false });
const AddFoodItemDialog = dynamic(() => import('@/components/food-logging/AddFoodItemDialog'), { ssr: false });
const AddVitalsDialog = dynamic(() => import('@/components/food-logging/AddVitalsDialog'), { ssr: false });
const ReleaseNotesSheet = dynamic(() => import('@/components/shared/ReleaseNotesSheet'), { ssr: false });
const ReuseMealMenu = dynamic(() => import('@/components/navigation/ReuseMealMenu'), { ssr: false });

const NavigationAndDialogs = () => {
    // Initialize Push Notifications
    usePushNotifications();

    const pathname = usePathname();
    const router = useRouter();
    const { startWalkthrough } = useWalkthrough();

    const {
        isSimplifiedAddFoodDialogOpen, closeSimplifiedAddFoodDialog, openSimplifiedAddFoodDialog,
        isIdentifyByPhotoDialogOpen, closeIdentifyByPhotoDialog, openIdentifyByPhotoDialog,
        isSymptomLogDialogOpen, closeSymptomLogDialog, openSymptomLogDialog, symptomLogContext,
        isLogPreviousMealDialogOpen, closeLogPreviousMealDialog, openLogPreviousMealDialog,
        isAddManualMacroDialogOpen, closeAddManualMacroDialog, openAddManualMacroDialog,
        isAddFoodDialogOpen, closeAddFoodDialog,
        isReleaseNotesOpen, closeReleaseNotes, openReleaseNotes,

        isAddVitalsDialogOpen, closeAddVitalsDialog, handleLogVitals, vitalsDialogDate,
        initialVitalsWeight, initialVitalsSteps,

        handleSubmitMealDescription,
        handleProcessAndLogPhotoIdentification,
        handleSubmitManualMacroEntry,
        handleSubmitClassicFoodItem,
        handleLogSymptoms,

        editingItem,
        setEditingItem,
        selectedLogTimestampForPreviousMeal,
        setSelectedLogTimestampForPreviousMeal,

        lastAddedItem,
        setLastAddedItem,

        timelineEntries, // Expose timelineEntries to filter favorites
        handleRepeatMeal, // Expose repeat meal action
        updateEntryTimestamp,

        userProfile
    } = useActionContext();

    const { user, loading: authLoading, userProfile: authUserProfile } = useAuth();

    // Hoisted Photo Scan Logic
    const scanInputRef = useRef<HTMLInputElement>(null);
    const [selectedScanFile, setSelectedScanFile] = useState<File | null>(null);

    const handleScanClick = () => {
        // Trigger native file picker directly
        scanInputRef.current?.click();
    };

    const handleScanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedScanFile(file);
            openIdentifyByPhotoDialog();
        }
        // Reset input
        if (e.target) e.target.value = '';
    };

    // Reuse Menu State
    const [isReuseMenuOpen, setIsReuseMenuOpen] = useState(false);

    // Get Favorites
    const getFavoriteSortTime = (item: LoggedFoodItem) => {
        const value = item.favoriteLastUsedAt ?? item.timestamp;
        if (value instanceof Date) return value.getTime();
        if (value && typeof value === 'object' && 'toDate' in (value as any)) {
            return (value as any).toDate().getTime();
        }
        return new Date(value as any).getTime();
    };

    const favoriteMeals = useMemo(() => (
        [...timelineEntries.filter((entry): entry is LoggedFoodItem =>
            entry.entryType === 'food' && (entry as LoggedFoodItem).isFavorite === true
        )].sort((a, b) =>
            getFavoriteSortTime(b) - getFavoriteSortTime(a)
        )
    ), [timelineEntries]);

    // Note: timelineEntries contains TimelineEntry which is a union. We filter for food items that are favorites.


    const isExcluded =
        (!user && !authLoading) || // Exclude only once auth is resolved
        pathname?.startsWith('/login') ||
        pathname?.startsWith('/signup') ||
        pathname === '/about' ||
        pathname?.startsWith('/setup') ||
        pathname?.startsWith('/privacy') ||
        pathname?.startsWith('/terms') ||
        pathname?.startsWith('/support');

    return (
        <>
            {/* Hidden Input for Native Scan Trigger */}
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={scanInputRef}
                onChange={handleScanFileChange}
            />

            {!isExcluded && (
                <LiquidNavigation
                    onWriteClick={openSimplifiedAddFoodDialog}
                    onScanClick={handleScanClick}
                    // Trigger Reuse Menu instead of direct navigation
                    onReuseClick={() => setIsReuseMenuOpen(true)}
                    onSymptomsClick={() => openSymptomLogDialog({ type: 'checkin' })}

                    onAppTourClick={() => startWalkthrough('welcome')}
                    onVersionClick={openReleaseNotes}
                    isReleaseNotesOpen={isReleaseNotesOpen}
                    isAdmin={authUserProfile?.isAdmin ?? userProfile?.isAdmin ?? false}
                />
            )}

            {/* Reuse Meal Menu */}
            <ReuseMealMenu
                isOpen={isReuseMenuOpen}
                onClose={() => setIsReuseMenuOpen(false)}
                favorites={favoriteMeals}
                onSelectMeal={(item) => {
                    handleRepeatMeal(item);
                    setIsReuseMenuOpen(false);
                }}
                onOpenFavorites={() => {
                    setIsReuseMenuOpen(false);
                    router.push('/favorites');
                }}
            />

            {/* Global Dialogs */}
            <ComposeOverlay
                isOpen={isSimplifiedAddFoodDialogOpen}
                onClose={() => {
                    setEditingItem(null);
                    setSelectedLogTimestampForPreviousMeal(undefined);
                    closeSimplifiedAddFoodDialog();
                }}
                onSubmitLog={(data, override, date) => handleSubmitMealDescription(data, override, date)}
                isEditing={!!editingItem && editingItem.entryType === 'food'}
                initialValues={editingItem && editingItem.entryType === 'food' ?
                    {
                        mealDescription: (editingItem.sourceDescription && editingItem.sourceDescription !== "Identified by photo")
                            ? editingItem.sourceDescription
                            : `${editingItem.name}${editingItem.ingredients ? `. ${editingItem.ingredients}` : ''}`,
                        calories: editingItem.calories ?? undefined,
                        protein: editingItem.protein ?? undefined,
                        carbs: editingItem.carbs ?? undefined,
                        fat: editingItem.fat ?? undefined
                    }
                    : { mealDescription: '' }}
                initialMacrosOverridden={editingItem?.macrosOverridden || false}
                initialTimestamp={editingItem?.timestamp || selectedLogTimestampForPreviousMeal}
                onUpdateTime={async (newDate) => {
                    if (editingItem && editingItem.entryType === 'food') {
                        await updateEntryTimestamp(editingItem.id, newDate);
                    }
                }}

                isGuestView={!userProfile || userProfile.uid === 'guest-user'}
                // Keep keys to force remount on state change if needed, though ComposeOverlay handles its own resetting
                key={editingItem?.id ? `edit-compose-${editingItem.id}` : (selectedLogTimestampForPreviousMeal ? `new-prev-compose-${selectedLogTimestampForPreviousMeal.toISOString()}` : 'new-compose')}
            />

            <IdentifyFoodByPhotoDialog
                isOpen={isIdentifyByPhotoDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedLogTimestampForPreviousMeal(undefined);
                        setSelectedScanFile(null); // Clear file when dialog closes
                    }
                    if (open) openIdentifyByPhotoDialog(); else closeIdentifyByPhotoDialog();
                }}
                onFoodIdentified={(data) => handleProcessAndLogPhotoIdentification(data, selectedLogTimestampForPreviousMeal)}
                initialFile={selectedScanFile}
            />

            <AddFoodItemDialog
                isOpen={isAddFoodDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingItem(null);
                        setSelectedLogTimestampForPreviousMeal(undefined);
                    }
                    if (!open) closeAddFoodDialog();
                }}
                onSubmitFoodItem={(data, date) => handleSubmitClassicFoodItem(data, date)}
                isEditing={!!editingItem && editingItem.entryType === 'food'}
                initialValues={editingItem && editingItem.entryType === 'food'
                    ? { name: editingItem.name, ingredients: editingItem.ingredients, portionSize: editingItem.portionSize, portionUnit: editingItem.portionUnit }
                    : undefined}
                initialTimestamp={editingItem?.timestamp || selectedLogTimestampForPreviousMeal}
                key={editingItem?.id ? `edit-manual-${editingItem.id}` : (selectedLogTimestampForPreviousMeal ? `new-prev-manual-${selectedLogTimestampForPreviousMeal.toISOString()}` : 'new-manual')}
            />

            <SymptomLoggingDialog
                isOpen={isSymptomLogDialogOpen}
                onOpenChange={(open) => open ? openSymptomLogDialog() : closeSymptomLogDialog()}
                onLogSymptoms={handleLogSymptoms}
                allSymptoms={COMMON_SYMPTOMS}
                context={symptomLogContext}
            />

            <AddManualMacroEntryDialog
                isOpen={isAddManualMacroDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingItem(null);
                        setSelectedLogTimestampForPreviousMeal(undefined);
                    }
                    if (!open) closeAddManualMacroDialog();
                }}
                onSubmitEntry={handleSubmitManualMacroEntry}
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
                onOpenChange={(open) => open ? openLogPreviousMealDialog() : closeLogPreviousMealDialog()}
                onDateSelect={setSelectedLogTimestampForPreviousMeal}
                onLogMethodSelect={(method) => {
                    // Mapping methods
                    closeLogPreviousMealDialog();
                    if (method === 'AI') openSimplifiedAddFoodDialog();
                    if (method === 'Photo') openIdentifyByPhotoDialog();
                    if (method === 'Manual') openAddManualMacroDialog(); // or openAddFoodDialog?
                }}
                currentSelectedDate={selectedLogTimestampForPreviousMeal}
            />

            <AddVitalsDialog
                isOpen={isAddVitalsDialogOpen}
                onOpenChange={(open) => !open && closeAddVitalsDialog()}
                onSubmit={(w, s, f) => handleLogVitals(w, s, f, vitalsDialogDate)}
                currentDate={vitalsDialogDate}
                initialWeight={initialVitalsWeight}
                initialSteps={initialVitalsSteps}
                initialFatPercent={useActionContext().initialVitalsFatPercent}
            />

            <ReleaseNotesSheet
                isOpen={isReleaseNotesOpen}
                onClose={closeReleaseNotes}
            />
        </>
    );
};

export const GlobalNavigationLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <ActionProvider>
            <NavVisibilityProvider>
                {children}
                <AdminNavVisibilityController />
                <NavigationAndDialogs />
            </NavVisibilityProvider>
        </ActionProvider>
    );
};
