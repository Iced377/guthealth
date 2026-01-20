'use client';

import React from 'react';
import type { LoggedFoodItem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Flame, Beef, Wheat, Droplet, MoreHorizontal,
    Heart, ThumbsUp, ThumbsDown, Trash2, ListChecks,
    Edit3, Repeat, Clock, Info, CheckCheck, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getFoodIcon } from '../food-logging/food-icons';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// import { NativeActionSheet } from '@/components/ui/native-action-sheet'; // Replaced by LiquidActionMenu
import LiquidActionMenu, { LiquidAction } from '@/components/shared/LiquidActionMenu';
import { useState } from 'react';
import FodmapIndicator from '@/components/shared/FodmapIndicator';
import GlycemicIndexIndicator from '@/components/shared/GlycemicIndexIndicator';
import DietaryFiberIndicator from '@/components/shared/DietaryFiberIndicator';

import GutBacteriaIndicator from '@/components/shared/GutBacteriaIndicator';
import KetoFriendlinessIndicator from '@/components/shared/KetoFriendlinessIndicator';

interface LiquidCrystalCardProps {
    item: LoggedFoodItem;
    onSetFeedback?: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
    onRemoveItem?: (itemId: string) => void;
    onLogSymptoms?: (foodItemId?: string) => void;
    isLoadingAi: boolean;
    onEditIngredients?: (item: LoggedFoodItem) => void;
    onRepeatMeal?: (item: LoggedFoodItem) => void;
    isGuestView?: boolean;
    onToggleFavorite?: (itemId: string, currentIsFavorite: boolean) => void;
    className?: string;
}

export default function LiquidCrystalCard({
    item,
    onSetFeedback,
    onRemoveItem,
    onLogSymptoms,
    isLoadingAi,
    onEditIngredients,
    onRepeatMeal,
    isGuestView = false,
    onToggleFavorite,
    className,
}: LiquidCrystalCardProps) {
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const handleFeedback = (newFeedback: 'safe' | 'unsafe') => {
        if (isGuestView || !onSetFeedback) return;
        onSetFeedback(item.id, item.userFeedback === newFeedback ? null : newFeedback);
    };

    const handleFavoriteToggle = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (isGuestView || !onToggleFavorite) return;
        onToggleFavorite(item.id, !!item.isFavorite);
    };

    const exactTime = format(new Date(item.timestamp), 'h:mm a');
    const FoodIcon = getFoodIcon(item.name || "Food");
    const isManualMacroEntry = item.entryType === 'manual_macro';
    const hasHealthIndicators = !isManualMacroEntry && item.fodmapData;

    // Macros Logic
    const macroParts = [];
    if (item.calories != null) macroParts.push({ icon: Flame, value: Math.round(item.calories), color: "text-orange-400" });
    if (item.protein != null) macroParts.push({ icon: Beef, value: `${Math.round(item.protein)}g`, color: "text-red-400" });
    if (item.carbs != null) macroParts.push({ icon: Wheat, value: `${Math.round(item.carbs)}g`, color: "text-yellow-400" });
    if (item.fat != null) macroParts.push({ icon: Droplet, value: `${Math.round(item.fat)}g`, color: "text-blue-400" });

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className={cn(
                    "glass-crystal relative overflow-hidden rounded-3xl border-0 h-full flex flex-col group active:scale-[0.98] transition-all cursor-pointer",
                    className
                )}>
                    {/* Animated Background Mesh (Unique per card type?) */}
                    <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none" />

                    {isLoadingAi && !isManualMacroEntry && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                    )}

                    {/* Artistic Background Icon */}
                    <div className="absolute -bottom-8 -right-8 pointer-events-none z-0 overflow-hidden opacity-[0.08] transform rotate-12 transition-transform group-hover:rotate-6 group-hover:scale-110 duration-700">
                        <FoodIcon className="w-48 h-48 text-primary" strokeWidth={1} />
                    </div>

                    <CardHeader className="px-5 py-4 relative z-10 space-y-0">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-xs font-medium text-muted-foreground/80 bg-background/30 px-2 py-0.5 rounded-full border border-white/5 backdrop-blur-md"
                                    >
                                        {exactTime}
                                    </span>
                                    {item.isFavorite && <Heart className="h-3 w-3 text-red-500 fill-red-500" />}
                                </div>

                                <div className="text-left text-xl font-bold font-headline leading-tight text-foreground/90 line-clamp-2 group-hover:text-primary transition-colors">
                                    {item.name}
                                </div>
                            </div>


                            {/* Actions Menu - Stop Propagation to prevent opening Dialog AND allow clicking inside draggable */}
                            {!isGuestView && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 -mr-2 text-muted-foreground/70 hover:text-foreground hover:bg-white/10 rounded-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsActionsOpen(true);
                                        }}
                                    >
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>

                                    <LiquidActionMenu
                                        isOpen={isActionsOpen}
                                        onClose={() => setIsActionsOpen(false)}
                                        title={`Actions for ${item.name}`}
                                        actions={[
                                            // Reuse Meal
                                            ...(onRepeatMeal ? [{
                                                label: "Reuse Meal",
                                                icon: <Repeat className="w-5 h-5" />,
                                                onClick: () => onRepeatMeal(item)
                                            }] : []),

                                            // Log Symptoms
                                            ...(onLogSymptoms ? [{
                                                label: "Log Symptoms",
                                                icon: <ListChecks className="w-5 h-5" />,
                                                onClick: () => onLogSymptoms(item.id)
                                            }] : []),

                                            // Favorite
                                            ...((!isManualMacroEntry && onToggleFavorite) ? [{
                                                label: item.isFavorite ? "Unfavorite" : "Favorite",
                                                icon: <Heart className={cn("w-5 h-5", item.isFavorite ? "fill-red-500 text-red-500" : "")} />,
                                                onClick: () => handleFavoriteToggle()
                                            }] : []),

                                            // Edit
                                            ...(onEditIngredients ? [{
                                                label: "Edit",
                                                icon: <Edit3 className="w-5 h-5" />,
                                                onClick: () => onEditIngredients(item)
                                            }] : []),

                                            // Mark Safe
                                            ...((!isManualMacroEntry && onSetFeedback) ? [{
                                                label: "Mark as Safe",
                                                icon: <ThumbsUp className={cn("w-5 h-5", item.userFeedback === 'safe' ? "fill-primary text-primary" : "")} />,
                                                onClick: () => handleFeedback('safe'),
                                                endIcon: item.userFeedback === 'safe' && <CheckCheck className="w-4 h-4 text-primary" />
                                            }] : []),

                                            // Mark Unsafe
                                            ...((!isManualMacroEntry && onSetFeedback) ? [{
                                                label: "Mark as Unsafe",
                                                icon: <ThumbsDown className={cn("w-5 h-5", item.userFeedback === 'unsafe' ? "fill-red-500 text-red-500" : "")} />,
                                                onClick: () => handleFeedback('unsafe'),
                                                endIcon: item.userFeedback === 'unsafe' && <CheckCheck className="w-4 h-4 text-red-500" />
                                            }] : []),

                                            // Delete
                                            ...(onRemoveItem ? [{
                                                label: "Delete",
                                                icon: <Trash2 className="w-5 h-5" />,
                                                variant: "destructive" as const,
                                                onClick: () => setIsDeleteAlertOpen(true)
                                            }] : [])
                                        ]}
                                    />

                                    {/* Delete Confirmation Alert */}
                                    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                                        <AlertDialogContent className="glass-crystal border-0 max-w-[320px] rounded-[20px]">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="sm:justify-between gap-2">
                                                <AlertDialogCancel className="w-full sm:w-auto mt-0 bg-transparent border border-white/20 rounded-xl h-11">Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => onRemoveItem?.(item.id)}
                                                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl h-11"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 pt-0 flex-grow flex flex-col justify-end relative z-10 gap-3">

                        {/* Macros Grid */}
                        {macroParts.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-1">
                                {macroParts.map((macro, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 bg-background/40 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5">
                                        <macro.icon className={cn("w-4 h-4", macro.color)} />
                                        <span className="text-sm font-semibold text-foreground/80">{macro.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Health Indicators (Condensed Row) */}
                        {hasHealthIndicators && (
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mask-linear-fade">
                                <div className="scale-90 origin-left"><FodmapIndicator score={item.fodmapData!.overallRisk} /></div>

                                {item.fodmapData?.glycemicIndexInfo && (
                                    <div className="scale-90 origin-left ml-[-8px]">
                                        <GlycemicIndexIndicator giInfo={item.fodmapData.glycemicIndexInfo} />
                                    </div>
                                )}

                                {item.fodmapData?.dietaryFiberInfo && (
                                    <div className="scale-90 origin-left ml-[-8px]">
                                        <DietaryFiberIndicator fiberInfo={item.fodmapData.dietaryFiberInfo} />
                                    </div>
                                )}



                                {item.fodmapData?.gutBacteriaImpact && (
                                    <div className="scale-90 origin-left ml-[-8px]">
                                        <GutBacteriaIndicator gutImpact={item.fodmapData.gutBacteriaImpact} />
                                    </div>
                                )}

                                {item.fodmapData?.ketoFriendliness && (
                                    <div className="scale-90 origin-left ml-[-8px]">
                                        <KetoFriendlinessIndicator ketoInfo={item.fodmapData.ketoFriendliness} />
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>

                    {/* Dialog: Full Detail View */}
                    <DialogContent
                        className="glass-crystal border-white/20 p-0 overflow-hidden 
                    fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 
                    w-[90vw] max-w-sm rounded-[40px] 
                    data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2
                    data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2"
                    >
                        <div className="relative h-40 bg-gradient-to-b from-primary/20 to-transparent">
                            <FoodIcon className="absolute bottom-4 right-4 w-32 h-32 text-primary opacity-20 rotate-12" />

                            <div className="absolute bottom-4 left-6">
                                <DialogTitle className="text-2xl font-bold font-headline mb-1">{item.name}</DialogTitle>
                                <p className="text-sm opacity-70 flex items-center gap-1"><Clock className="w-3 h-3" /> {exactTime}</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 bg-background/40 backdrop-blur-xl">
                            {/* Details Content similar to TimelineFoodCard but styled */}
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold opacity-70 uppercase tracking-wider">Macros</h3>
                                <div className="flex gap-4">
                                    {macroParts.map((m, i) => (
                                        <div key={i} className="flex flex-col items-center p-2 bg-white/5 rounded-xl min-w-[60px]">
                                            <m.icon className={cn("w-5 h-5 mb-1", m.color)} />
                                            <span className="font-bold">{m.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold opacity-70 uppercase tracking-wider">Ingredients</h3>
                                <p className="text-sm bg-white/5 p-3 rounded-2xl leading-relaxed">
                                    {item.ingredients || item.sourceDescription || "No details provided."}
                                </p>
                            </div>
                        </div>
                    </DialogContent>
                </Card>
            </DialogTrigger>
        </Dialog>
    );
}
