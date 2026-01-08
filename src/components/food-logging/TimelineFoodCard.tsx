
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
import { ThumbsUp, ThumbsDown, Trash2, ListChecks, Loader2, Flame, Beef, Wheat, Droplet, Edit3, CheckCheck, PencilLine, Sparkles, Leaf, Users, Activity, Repeat, MessageSquareText, Info, AlertCircle, Heart, ChevronsUpDown, Clock, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getFoodIcon } from './food-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
    "bg-card text-card-foreground border-border h-full flex flex-col"
  );

  const detectedAllergens = item.fodmapData?.detectedAllergens;
  const hasLogDetails = !isManualMacroEntry && (item.originalName && item.originalName !== item.name || item.sourceDescription);
  const hasHealthIndicators = !isManualMacroEntry && item.fodmapData;

  const FoodIcon = getFoodIcon(item.name || item.originalName || "Food");

  const iconButtonClass = "h-7 w-7 text-primary-foreground opacity-70 hover:opacity-100 hover:bg-white/10";

  return (
    <Dialog>
      <Card className={cardClasses}>
        {isLoadingAi && !isManualMacroEntry && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="ml-2 text-white">Analyzing...</p>
          </div>
        )}

        {/* Background Illustration */}
        <div className="absolute -bottom-6 -right-6 pointer-events-none z-0 overflow-hidden opacity-[0.07] transform rotate-12">
          <FoodIcon className="w-40 h-40 text-current" strokeWidth={1.5} />
        </div>

        <CardHeader className="px-4 py-3 bg-primary text-primary-foreground relative z-1">
          <div className="flex justify-between items-start gap-3">
            {/* Left Column: Title (Top) and Macros (Bottom) */}
            <div className="flex flex-col justify-between self-stretch flex-1 min-w-0">
              {/* Title - Aligned with Top Row Actions */}
              <div className="flex items-center h-7">
                <DialogTrigger asChild>
                  <span className="inline-block active-press">
                    <Button
                      variant="ghost"
                      className={cn(
                        "p-0 h-auto text-md sm:text-lg font-semibold font-headline break-words text-left text-primary-foreground hover:bg-transparent hover:underline decoration-white/50 underline-offset-4 leading-none justify-start whitespace-normal"
                      )}
                    >
                      {item.name}
                    </Button>
                  </span>
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

                  </>
                ) : (
                  <span className="opacity-50 italic text-xs">No macros</span>
                )}
              </div>
            </div>

            {/* Right Column: Action Rows */}
            {/* Right Column: Action Menu */}
            {!isGuestView && (
              <div className="flex flex-col items-end gap-1 ml-0 shrink-0">
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-white/20">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {/* Favorite */}
                      {!isManualMacroEntry && onToggleFavorite && (
                        <DropdownMenuItem onClick={handleFavoriteToggle}>
                          <Heart className={cn("mr-2 h-4 w-4", item.isFavorite ? "fill-red-500 text-red-500" : "")} />
                          <span>{item.isFavorite ? "Unfavorite" : "Favorite"}</span>
                        </DropdownMenuItem>
                      )}

                      {/* Feedback */}
                      {!isManualMacroEntry && onSetFeedback && (
                        <>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleFeedback('safe'); }}>
                            <ThumbsUp className={cn("mr-2 h-4 w-4", item.userFeedback === 'safe' ? "fill-primary text-primary" : "")} />
                            <span>Mark as Safe</span>
                            {item.userFeedback === 'safe' && <CheckCheck className="ml-auto h-4 w-4 text-primary" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleFeedback('unsafe'); }}>
                            <ThumbsDown className={cn("mr-2 h-4 w-4", item.userFeedback === 'unsafe' ? "fill-red-600 text-red-600" : "")} />
                            <span>Mark as Unsafe</span>
                            {item.userFeedback === 'unsafe' && <CheckCheck className="ml-auto h-4 w-4 text-red-600" />}
                          </DropdownMenuItem>
                        </>
                      )}

                      {/* Log Symptoms */}
                      {!isManualMacroEntry && onLogSymptoms && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLogSymptoms(item.id); }}>
                          <ListChecks className={cn("mr-2 h-4 w-4", (item.symptoms && item.symptoms.length > 0) ? "text-primary" : "")} />
                          <span>Log Symptoms</span>
                          {(item.symptoms && item.symptoms.length > 0) && <CheckCheck className="ml-auto h-4 w-4 text-primary" />}
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {/* Edit */}
                      {onEditIngredients && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditIngredients(item); }}>
                          <Edit3 className={cn("mr-2 h-4 w-4", item.macrosOverridden ? "text-primary" : "")} />
                          <span>Edit Item</span>
                        </DropdownMenuItem>
                      )}

                      {/* Copy */}
                      {onRepeatMeal && item.entryType === 'food' && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRepeatMeal(item); }}>
                          <Repeat className="mr-2 h-4 w-4" />
                          <span>Copy Meal</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {/* Delete */}
                      {onRemoveItem && (
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Alert Dialog Content (Outside Dropdown Menu Content but inside AlertDialog scope) */}
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
                        onClick={(e) => { e.stopPropagation(); onRemoveItem && onRemoveItem(item.id); }}
                        className="bg-red-600 hover:bg-red-700 text-white"
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
        <CardContent className="px-4 pt-2 pb-3 space-y-3 relative z-1">
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
              <div className="active-press"><MicronutrientsIndicator micronutrientsInfo={item.fodmapData.micronutrientsInfo} /></div>
              <div className="active-press"><DietaryFiberIndicator fiberInfo={item.fodmapData.dietaryFiberInfo} /></div>
              <div className="active-press"><GlycemicIndexIndicator giInfo={item.fodmapData.glycemicIndexInfo} /></div>
              <div className="active-press"><KetoFriendlinessIndicator ketoInfo={item.fodmapData.ketoFriendliness} /></div>
              <div className="active-press"><FodmapIndicator score={item.fodmapData.overallRisk} reason={item.fodmapData.reason} /></div>
              <div className="active-press"><GutBacteriaIndicator gutImpact={item.fodmapData.gutBacteriaImpact} /></div>
              {detectedAllergens && detectedAllergens.length > 0 &&
                detectedAllergens.map((allergen: string) => (
                  <TooltipProvider key={allergen}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="destructive" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 flex items-center gap-1 cursor-default active-press">
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
          <DialogDescription className="sr-only">
            Detailed information about this logged food entry.
          </DialogDescription>
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
