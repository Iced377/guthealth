
'use client';

import type { LoggedFoodItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FodmapIndicator from '@/components/shared/FodmapIndicator';
import GlycemicIndexIndicator from '@/components/shared/GlycemicIndexIndicator';
import DietaryFiberIndicator from '@/components/shared/DietaryFiberIndicator';
import MicronutrientsIndicator from '@/components/shared/MicronutrientsIndicator';
import GutBacteriaIndicator from '@/components/shared/GutBacteriaIndicator';
import KetoFriendlinessIndicator from '@/components/shared/KetoFriendlinessIndicator';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Trash2, ListChecks, Loader2, Flame, Beef, Wheat, Droplet, Edit3, CheckCheck, PencilLine, Sparkles, Leaf, Users, Activity, Repeat, MessageSquareText, Info, AlertCircle, Heart, ChevronsUpDown, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TimelineFoodCardProps {
  item: LoggedFoodItem;
  onSetFeedback?: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveItem?: (itemId: string) => void;
  onLogSymptoms?: (foodItemId?: string) => void;
  isLoadingAi: boolean;
  onEditIngredients?: (item: LoggedFoodItem) => void;
  onRepeatMeal?: (item: LoggedFoodItem) => void;
  isGuestView?: boolean;
  onToggleFavorite?: (itemId: string, currentIsFavorite: boolean) => void;
}

export default function TimelineFoodCard({
  item,
  onSetFeedback,
  onRemoveItem,
  onLogSymptoms,
  isLoadingAi,
  onEditIngredients,
  onRepeatMeal,
  isGuestView = false,
  onToggleFavorite,
}: TimelineFoodCardProps) {

  const handleFeedback = (newFeedback: 'safe' | 'unsafe') => {
    if (isGuestView || !onSetFeedback) return;
    if (item.userFeedback === newFeedback) {
      onSetFeedback(item.id, null);
    } else {
      onSetFeedback(item.id, newFeedback);
    }
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuestView || !onToggleFavorite) return;
    onToggleFavorite(item.id, !!item.isFavorite);
  };

  const timestampDate = new Date(item.timestamp);
  const timeAgo = formatDistanceToNow(timestampDate, { addSuffix: true });
  const exactTime = format(timestampDate, 'PP p');

  const macroParts: string[] = [];
  if (item.calories != null) macroParts.push(`Cal: ${Math.round(item.calories)}`);
  if (item.protein != null) macroParts.push(`P: ${Math.round(item.protein)}g`);
  if (item.carbs != null) macroParts.push(`C: ${Math.round(item.carbs)}g`);
  if (item.fat != null) macroParts.push(`F: ${Math.round(item.fat)}g`);

  const isManualMacroEntry = item.entryType === 'manual_macro';

  const cardClasses = cn(
    "mb-4 shadow-lg hover:shadow-xl transition-shadow duration-200 relative overflow-hidden",
    "bg-card text-card-foreground border-border"
  );

  const detectedAllergens = item.fodmapData?.detectedAllergens;
  const hasLogDetails = !isManualMacroEntry && (item.originalName && item.originalName !== item.name || item.sourceDescription);
  const hasHealthIndicators = !isManualMacroEntry && item.fodmapData;

  const iconButtonClass = "h-7 w-7 text-primary-foreground opacity-70 hover:opacity-100 hover:bg-white/10";

  return (
    <Dialog>
      <Card className={cardClasses}>
        {isLoadingAi && !isManualMacroEntry && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="ml-2 text-white">AI Analyzing...</p>
          </div>
        )}
        <CardHeader className="px-4 py-3 bg-primary text-primary-foreground">
          <div className="flex justify-between items-start gap-3">
            {/* Left Column: Title (Top) and Macros (Bottom) */}
            <div className="flex flex-col justify-between self-stretch flex-1 min-w-0">
              {/* Title - Aligned with Top Row Actions */}
              <div className="flex items-center h-7">
                <DialogTrigger asChild>
                  <Button variant="link" className={cn("p-0 h-auto text-md sm:text-lg font-semibold font-headline break-words text-left hover:underline decoration-white/50 underline-offset-4 leading-none justify-start")}>
                    {item.name}
                  </Button>
                </DialogTrigger>
              </div>

              {/* Macros - Aligned with Bottom Row Actions */}
              <div className="flex items-center h-7 text-xs sm:text-sm font-medium opacity-90 gap-3">
                {macroParts.length > 0 ? (
                  <>
                    {item.calories != null && <span className="flex items-center"><Flame className="w-3.5 h-3.5 mr-1 text-orange-200" />{Math.round(item.calories)}</span>}
                    {item.protein != null && <span className="flex items-center"><Beef className="w-3.5 h-3.5 mr-1 text-red-200" />{Math.round(item.protein)}P</span>}
                    {item.carbs != null && <span className="flex items-center"><Wheat className="w-3.5 h-3.5 mr-1 text-yellow-200" />{Math.round(item.carbs)}C</span>}
                    {item.fat != null && <span className="flex items-center"><Droplet className="w-3.5 h-3.5 mr-1 text-blue-200" />{Math.round(item.fat)}F</span>}
                    {item.macrosOverridden && <span className="flex items-center text-orange-200"><PencilLine className="w-3.5 h-3.5 mr-1" />Edited</span>}
                  </>
                ) : (
                  <span className="opacity-50 italic text-xs">No macros</span>
                )}
              </div>
            </div>

            {/* Right Column: Action Rows */}
            {!isGuestView && (
              <div className="flex flex-col items-end gap-1 ml-0 shrink-0">
                {/* Top Row: Favorite, Safe, Unsafe, Log Symptoms */}
                <div className="flex items-center gap-0.5 justify-end h-7">
                  {/* Favorite Action */}
                  {!isManualMacroEntry && onToggleFavorite && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleFavoriteToggle}
                            disabled={isLoadingAi}
                            className={cn(
                              "h-7 w-7",
                              item.isFavorite
                                ? 'bg-white/25 hover:bg-white/35 text-primary-foreground'
                                : 'text-primary-foreground opacity-70 hover:opacity-100 hover:bg-white/10'
                            )}
                            aria-label={item.isFavorite ? "Unmark as Favorite" : "Mark as Favorite"}
                          >
                            <Heart className={cn("h-4 w-4", item.isFavorite ? 'fill-red-500 text-red-500' : '')} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border-border">
                          <p>{item.isFavorite ? "Unmark as Favorite" : "Mark as Favorite"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Safe/Unsafe Actions */}
                  {!isManualMacroEntry && onSetFeedback && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleFeedback('safe'); }}
                              disabled={isLoadingAi}
                              className={cn(
                                "h-7 w-7",
                                item.userFeedback === 'safe'
                                  ? 'bg-white/20 hover:bg-white/30 text-primary-foreground'
                                  : 'text-primary-foreground opacity-70 hover:opacity-100 hover:bg-white/10'
                              )}
                              aria-label="Mark as Safe"
                            >
                              <ThumbsUp className={cn("h-4 w-4", item.userFeedback === 'safe' ? 'fill-primary-foreground/70' : '')} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground border-border"><p>Mark as Safe</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleFeedback('unsafe'); }}
                              disabled={isLoadingAi}
                              className={cn(
                                "h-7 w-7",
                                item.userFeedback === 'unsafe'
                                  ? 'bg-red-700/60 hover:bg-red-700/80 text-primary-foreground'
                                  : 'text-primary-foreground opacity-70 hover:opacity-100 hover:bg-white/10'
                              )}
                              aria-label="Mark as Unsafe"
                            >
                              <ThumbsDown className={cn("h-4 w-4", item.userFeedback === 'unsafe' ? 'fill-primary-foreground/70' : '')} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground border-border"><p>Mark as Unsafe</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}

                  {/* Log Symptoms Action */}
                  {!isManualMacroEntry && onLogSymptoms && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); onLogSymptoms(item.id); }}
                            disabled={isLoadingAi}
                            className={iconButtonClass}
                            aria-label="Log Symptoms"
                          >
                            <ListChecks className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border-border"><p>Log Symptoms</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {/* Bottom Row: Edit, Copy, Delete */}
                <div className="flex items-center gap-0.5 justify-end h-7">
                  {/* Edit Action */}
                  {onEditIngredients && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); onEditIngredients(item); }}
                            disabled={isLoadingAi}
                            className={iconButtonClass}
                            aria-label="Edit Item"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border-border"><p>Edit Item</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Copy Meal Action */}
                  {onRepeatMeal && item.entryType === 'food' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); onRepeatMeal(item); }}
                            disabled={isLoadingAi}
                            className={iconButtonClass}
                            aria-label="Copy Meal"
                          >
                            <Repeat className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border-border"><p>Copy Meal</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Remove Action with Confirmation */}
                  {onRemoveItem && (
                    <AlertDialog>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); /* Dialog handles opening */ }} className="text-red-300 hover:text-red-200 hover:bg-white/10 h-7 w-7" disabled={isLoadingAi} aria-label="Remove this item">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground border-border"><p>Remove Item</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialogContent className="bg-card text-card-foreground border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this content? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border hover:bg-muted text-foreground">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-2 pb-3 space-y-3">
          {item.isSimilarToSafe && !isManualMacroEntry && (
            <Badge
              variant="default"
              className="text-sm mb-0 inline-flex"
              style={{
                backgroundColor: 'var(--success-indicator-bg, #34C759)',
                color: 'var(--success-indicator-text, white)',
                borderColor: 'var(--primary, #27AE60)',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              <CheckCheck className="mr-1.5 h-4 w-4" /> Similar to your Safe Foods
            </Badge>
          )}

          {/* Health Indicators - Promoted to main view */}
          {hasHealthIndicators && item.fodmapData && (
            <div className={cn("text-xs pt-0 flex flex-wrap items-center gap-2")}>
              <MicronutrientsIndicator micronutrientsInfo={item.fodmapData.micronutrientsInfo} />
              <DietaryFiberIndicator fiberInfo={item.fodmapData.dietaryFiberInfo} />
              <GlycemicIndexIndicator giInfo={item.fodmapData.glycemicIndexInfo} />
              <KetoFriendlinessIndicator ketoInfo={item.fodmapData.ketoFriendliness} />
              <FodmapIndicator score={item.fodmapData.overallRisk} reason={item.fodmapData.reason} />
              <GutBacteriaIndicator gutImpact={item.fodmapData.gutBacteriaImpact} />
              {detectedAllergens && detectedAllergens.length > 0 &&
                detectedAllergens.map((allergen: string) => (
                  <TooltipProvider key={allergen}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="destructive" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 flex items-center gap-1 cursor-default">
                          <AlertCircle className="h-3.5 w-3.5" /> {allergen}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover text-popover-foreground border-border">
                        <p>Contains Allergen: {allergen}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Content for Log Details */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Details</DialogTitle>
        </DialogHeader>
        <div className="text-sm space-y-3 pt-2">
          <div>
            <p className="font-semibold text-foreground/80 flex items-center mb-0.5"><Clock className="h-4 w-4 mr-2 text-primary" />Time</p>
            <div className="pl-6 text-muted-foreground">
              <p>{exactTime} <span className="text-xs opacity-70">({timeAgo})</span></p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-foreground/80 flex items-center mb-0.5"><Info className="h-4 w-4 mr-2 text-primary" />Analysis Source</p>
            <div className="pl-6 text-muted-foreground">
              {item.originalName && item.originalName !== item.name && (
                <p className="mb-1">Analyzed as: <span className="font-medium text-foreground">{item.originalName}</span></p>
              )}
              <p>Portion: {item.portionSize} {item.portionUnit}</p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-foreground/80 flex items-center mb-0.5"><ListChecks className="h-4 w-4 mr-2 text-primary" />Ingredients / Method</p>
            <div className="pl-6 text-muted-foreground">
              {item.sourceDescription ? (
                <p className="italic">"{item.sourceDescription}"</p>
              ) : (
                <p>{item.ingredients || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
