
'use client';

import { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TimelineEntry, UserProfile, DailyNutritionSummary, LoggedFoodItem } from '@/types';
import TimelineFoodCard from '@/components/food-logging/TimelineFoodCard';
import TimelineSymptomCard from '@/components/food-logging/TimelineSymptomCard';
import { Flame, Beef, Wheat, Droplet, Utensils, Check, Atom, Sparkles, Bone, Nut, Citrus, Carrot, Leaf, Milk, Sun, Brain, Activity, Zap as Bolt, Eye, Wind, Heart, ShieldCheck, ShieldQuestion, Anchor, PersonStanding, Baby, Target, Network, HelpCircle, Plus, PlusCircle, Camera, ListChecks, CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { startOfDay, endOfDay, format } from 'date-fns';

const RepresentativeLucideIcons: { [key: string]: React.ElementType } = {
  // General & Fallbacks
  Atom, Sparkles, HelpCircle,
};


interface PremiumDashboardSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile;
  timelineEntries: TimelineEntry[];
  dailyNutritionSummary: DailyNutritionSummary;
  isLoadingAi: Record<string, boolean>;
  onSetFeedback: (itemId: string, feedback: 'safe' | 'unsafe' | null) => void;
  onRemoveTimelineEntry: (entryId: string) => void;
  onLogSymptomsForFood: (foodItemId?: string) => void;
  onEditIngredients?: (item: LoggedFoodItem) => void;
  onRepeatMeal?: (item: LoggedFoodItem) => void;
  onToggleFavorite: (itemId: string, currentIsFavorite: boolean) => void;
  onLogFoodAIClick?: () => void;
  onIdentifyByPhotoClick?: () => void;
  onLogSymptomsClick?: () => void;
  onLogPreviousMealClick?: () => void;
  // This prop will now come from page.tsx
  groupedTimelineEntries: Record<string, TimelineEntry[]>;
}



export default function PremiumDashboardSheet({
  children,
  isOpen,
  onOpenChange,
  userProfile,
  timelineEntries,
  dailyNutritionSummary,
  isLoadingAi,
  onSetFeedback,
  onRemoveTimelineEntry,
  onLogSymptomsForFood,
  onEditIngredients,
  onRepeatMeal,
  onToggleFavorite,
  onLogFoodAIClick,
  onIdentifyByPhotoClick,
  onLogSymptomsClick,
  onLogPreviousMealClick,
  groupedTimelineEntries,
}: PremiumDashboardSheetProps) {

  const [isFabPopoverOpen, setIsFabPopoverOpen] = useState(false);

  const handleFabActionClick = (action?: () => void) => {
    if (action) {
      action();
    }
    setIsFabPopoverOpen(false);
  }



  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedTimelineEntries).sort((a, b) => {
      // Find the latest timestamp for each date group to sort the groups themselves
      const lastTimeA = new Date(groupedTimelineEntries[a][0].timestamp).getTime();
      const lastTimeB = new Date(groupedTimelineEntries[b][0].timestamp).getTime();
      return lastTimeB - lastTimeA;
    });
  }, [groupedTimelineEntries]);


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-dvh flex flex-col p-0 bg-background text-foreground border-t-2 border-border">
        <SheetHeader className="p-4 border-b border-border shrink-0">
          <SheetTitle className="sr-only">Main Dashboard and Timeline</SheetTitle>
          <div className="flex flex-row flex-wrap justify-around items-center gap-x-2 sm:gap-x-3 gap-y-2 text-center">
            <div className="flex flex-col items-center">
              <Flame className="h-5 w-5 text-orange-400 mb-0.5" />
              <p className="text-lg font-bold text-foreground">{Math.round(dailyNutritionSummary.calories)}</p>
              <p className="text-xs text-muted-foreground">KCAL</p>
            </div>
            <div className="flex flex-col items-center">
              <Beef className="h-5 w-5 text-red-400 mb-0.5" />
              <p className="text-lg font-bold text-foreground">{Math.round(dailyNutritionSummary.protein)}g</p>
              <p className="text-xs text-muted-foreground">PROTEIN</p>
            </div>
            <div className="flex flex-col items-center">
              <Wheat className="h-5 w-5 text-yellow-400 mb-0.5" />
              <p className="text-lg font-bold text-foreground">{Math.round(dailyNutritionSummary.carbs)}g</p>
              <p className="text-xs text-muted-foreground">CARBS</p>
            </div>
            <div className="flex flex-col items-center">
              <Droplet className="h-5 w-5 text-blue-400 mb-0.5" />
              <p className="text-lg font-bold text-foreground">{Math.round(dailyNutritionSummary.fat)}g</p>
              <p className="text-xs text-muted-foreground">FAT</p>
            </div>

          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="relative">
            <div className="px-4 py-4 space-y-0">
              {timelineEntries.length === 0 && !Object.values(isLoadingAi).some(Boolean) && (
                <div className="text-center py-12">
                  <Utensils className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-semibold font-headline mb-2 text-foreground">Timeline is Empty</h2>
                  <p className="text-muted-foreground">
                    {userProfile.premium ? "Log food or symptoms using the central button." : "Log food or symptoms. Data is retained for 2 days for free users."}
                  </p>
                </div>
              )}
              {sortedDateKeys.map(dateKey => {
                const entriesOnDate = groupedTimelineEntries[dateKey];
                if (!entriesOnDate || entriesOnDate.length === 0) return null;

                return (
                  <div key={dateKey} className="mb-6">
                    <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm -mx-4 px-4 py-2 mb-2 border-b border-border">
                      <h3 className="text-sm font-semibold text-primary">{dateKey}</h3>
                    </div>
                    <div className="space-y-4">
                      {entriesOnDate.map((entry, entryIndex) => {
                        if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
                          return (
                            <div
                              key={entry.id}
                              className="card-reveal-animation"
                              style={{ animationDelay: `${entryIndex * 0.07}s` }}
                            >
                              <TimelineFoodCard
                                item={entry}
                                onSetFeedback={onSetFeedback}
                                onRemoveItem={() => onRemoveTimelineEntry(entry.id)}
                                onLogSymptoms={() => onLogSymptomsForFood(entry.id)}
                                isLoadingAi={!!isLoadingAi[entry.id]}
                                onEditIngredients={onEditIngredients}
                                onRepeatMeal={onRepeatMeal}
                                onToggleFavorite={onToggleFavorite}
                              />
                            </div>
                          );
                        }
                        if (entry.entryType === 'symptom') {
                          return (
                            <div
                              key={entry.id}
                              className="card-reveal-animation"
                              style={{ animationDelay: `${entryIndex * 0.07}s` }}
                            >
                              <TimelineSymptomCard
                                item={entry}
                                onRemoveItem={() => onRemoveTimelineEntry(entry.id)}
                              />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        <Popover open={isFabPopoverOpen} onOpenChange={setIsFabPopoverOpen}>
          <PopoverTrigger asChild>
            <LiquidPressable variant="fab" haptic="medium" className="absolute bottom-20 right-6 h-16 w-16 rounded-full shadow-2xl z-20 bg-primary text-primary-foreground hover:bg-primary/90 p-0 flex items-center justify-center">
              <Plus className="h-8 w-8" />
            </LiquidPressable>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-auto bg-card text-card-foreground border-border shadow-xl rounded-xl p-0 mb-2"
          >
            <div className="flex flex-col gap-1 p-2">
              <LiquidPressable variant="ghost" size="lg" haptic="light" className="justify-start w-full text-base py-3 px-4 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-xl h-auto" onClick={() => handleFabActionClick(onLogFoodAIClick)}>
                <PlusCircle className="mr-3 h-5 w-5" /> Log Food with Text
              </LiquidPressable>
              <LiquidPressable variant="ghost" size="lg" haptic="light" className="justify-start w-full text-base py-3 px-4 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-xl h-auto" onClick={() => handleFabActionClick(onIdentifyByPhotoClick)}>
                <Camera className="mr-3 h-5 w-5" /> Identify by Photo
              </LiquidPressable>
              <LiquidPressable variant="ghost" size="lg" haptic="light" className="justify-start w-full text-base py-3 px-4 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-xl h-auto" onClick={() => handleFabActionClick(onLogSymptomsClick)}>
                <ListChecks className="mr-3 h-5 w-5" /> Log Symptoms
              </LiquidPressable>
              <LiquidPressable variant="ghost" size="lg" haptic="light" className="justify-start w-full text-base py-3 px-4 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-xl h-auto" onClick={() => handleFabActionClick(onLogPreviousMealClick)}>
                <CalendarDays className="mr-3 h-5 w-5" /> Log Previous Meal
              </LiquidPressable>
            </div>
          </PopoverContent>
        </Popover>

        <SheetFooter className="p-3 border-t border-border sticky bottom-0 bg-card shrink-0">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">Close Dashboard</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
