'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ActionProvider, useActionContext } from '@/contexts/ActionContext';
import { useAuth } from '@/components/auth/AuthProvider';
import LiquidNavigation from '@/components/navigation/LiquidNavigation';
import SimplifiedAddFoodDialog from '@/components/food-logging/SimplifiedAddFoodDialog';
import IdentifyFoodByPhotoDialog from '@/components/food-logging/IdentifyFoodByPhotoDialog';
import SymptomLoggingDialog from '@/components/food-logging/SymptomLoggingDialog';
import LogPreviousMealDialog from '@/components/food-logging/LogPreviousMealDialog';
import AddManualMacroEntryDialog from '@/components/food-logging/AddManualMacroEntryDialog';
import AddFoodItemDialog from '@/components/food-logging/AddFoodItemDialog';
import { COMMON_SYMPTOMS } from '@/types';
import { useWalkthrough } from '@/contexts/WalkthroughContext';

const NavigationAndDialogs = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { startWalkthrough } = useWalkthrough();

    const {
        isSimplifiedAddFoodDialogOpen, closeSimplifiedAddFoodDialog, openSimplifiedAddFoodDialog,
        isIdentifyByPhotoDialogOpen, closeIdentifyByPhotoDialog, openIdentifyByPhotoDialog,
        isSymptomLogDialogOpen, closeSymptomLogDialog, openSymptomLogDialog,
        isLogPreviousMealDialogOpen, closeLogPreviousMealDialog, openLogPreviousMealDialog,
        isAddManualMacroDialogOpen, closeAddManualMacroDialog, openAddManualMacroDialog,
        isAddFoodDialogOpen, closeAddFoodDialog,
        isReleaseNotesOpen, closeReleaseNotes, openReleaseNotes,

        handleSubmitMealDescription,
        handleProcessAndLogPhotoIdentification,
        handleSubmitManualMacroEntry,
        handleSubmitClassicFoodItem,
        handleLogSymptoms,

        editingItem,
        setEditingItem,
        selectedLogTimestampForPreviousMeal,
        setSelectedLogTimestampForPreviousMeal,

        userProfile
    } = useActionContext();

    const { user } = useAuth();

    const isExcluded =
        !user || // Exclude for non-users
        pathname?.startsWith('/login') ||
        pathname?.startsWith('/signup') ||
        pathname === '/about' ||
        pathname?.startsWith('/setup') ||
        pathname?.startsWith('/privacy') ||
        pathname?.startsWith('/terms');

    return (
        <>
            {!isExcluded && (
                <LiquidNavigation
                    onWriteClick={openSimplifiedAddFoodDialog}
                    onScanClick={openIdentifyByPhotoDialog}
                    // Map reuse to favorites navigation as requested
                    onReuseClick={() => router.push('/favorites')}
                    onFeedbackClick={openSymptomLogDialog}
                    onAppTourClick={() => startWalkthrough('welcome')}
                    onVersionClick={openReleaseNotes}
                    isAdmin={userProfile?.isAdmin ?? false}
                />
            )}

            {/* Global Dialogs */}
            <SimplifiedAddFoodDialog
                isOpen={isSimplifiedAddFoodDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingItem(null);
                        setSelectedLogTimestampForPreviousMeal(undefined);
                    }
                    if (open) openSimplifiedAddFoodDialog(); else closeSimplifiedAddFoodDialog();
                }}
                onSubmitLog={(data, override, date) => handleSubmitMealDescription(data, override, date)}
                isEditing={!!editingItem && editingItem.entryType === 'food'}
                initialValues={editingItem && editingItem.entryType === 'food' ?
                    {
                        mealDescription: editingItem.sourceDescription ||
                            (editingItem.sourceDescription?.startsWith("Identified by photo")
                                ? `${editingItem.originalName || editingItem.name}${editingItem.ingredients ? `. Ingredients: ${editingItem.ingredients}` : ''}`
                                : editingItem.originalName || editingItem.name || ''),
                        calories: editingItem.calories ?? undefined,
                        protein: editingItem.protein ?? undefined,
                        carbs: editingItem.carbs ?? undefined,
                        fat: editingItem.fat ?? undefined
                    }
                    : { mealDescription: '' }}
                initialMacrosOverridden={editingItem?.macrosOverridden || false}
                initialTimestamp={editingItem?.timestamp || selectedLogTimestampForPreviousMeal}
                isGuestView={!userProfile || userProfile.uid === 'guest-user'}
                key={editingItem?.id ? `edit-simplified-${editingItem.id}` : (selectedLogTimestampForPreviousMeal ? `new-prev-simplified-${selectedLogTimestampForPreviousMeal.toISOString()}` : 'new-simplified')}
            />

            <IdentifyFoodByPhotoDialog
                isOpen={isIdentifyByPhotoDialogOpen}
                onOpenChange={(open) => {
                    if (!open) setSelectedLogTimestampForPreviousMeal(undefined);
                    if (open) openIdentifyByPhotoDialog(); else closeIdentifyByPhotoDialog();
                }}
                onFoodIdentified={(data) => handleProcessAndLogPhotoIdentification(data, selectedLogTimestampForPreviousMeal)}
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
        </>
    );
};

export const GlobalNavigationLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <ActionProvider>
            {children}
            <NavigationAndDialogs />
        </ActionProvider>
    );
};
