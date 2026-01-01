
'use client';

import { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TimelineEntry, UserProfile, DailyNutritionSummary, LoggedFoodItem, MicronutrientDetail } from '@/types';
import TimelineFoodCard from '@/components/food-logging/TimelineFoodCard';
import TimelineSymptomCard from '@/components/food-logging/TimelineSymptomCard';
import { Flame, Beef, Wheat, Droplet, Utensils, Check, Atom, Sparkles, Bone, Nut, Citrus, Carrot, Leaf, Milk, Sun, Brain, Activity, Zap as Bolt, Eye, Wind, Heart, ShieldCheck, ShieldQuestion, Anchor, PersonStanding, Baby, Target, Network, HelpCircle, Plus, PlusCircle, Camera, ListChecks, CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { startOfDay, endOfDay, format, addDays, isSameDay } from 'date-fns';
import NutritionOverview from '@/components/dashboard/NutritionOverview';
import { Card, CardContent } from "@/components/ui/card";

const RepresentativeLucideIcons: { [key: string]: React.ElementType } = {
    // General & Fallbacks
    Atom, Sparkles, HelpCircle,
    // Specific by Nutrient Name (primary fallback if AI iconName isn't in map)
    Iron: Wind,
    Calcium: Bone,
    Phosphorus: Bone,
    Magnesium: Activity,
    Sodium: Droplet,
    Potassium: Droplet,
    Chloride: Droplet,
    Zinc: PersonStanding,
    Copper: Network,
    Manganese: Bone,
    Selenium: ShieldCheck,
    Iodine: Brain,
    Chromium: Target,
    VitaminA: Eye,
    VitaminC: ShieldCheck,
    VitaminD: ShieldCheck,
    VitaminE: ShieldQuestion,
    VitaminK: Heart,
    VitaminB1: Brain,
    VitaminB2: Activity,
    VitaminB3: Activity,
    VitaminB5: Activity,
    VitaminB6: Brain,
    VitaminB12: Brain,
    Biotin: Activity,
    Folate: Baby,
    Omega3: Heart,
    // Common AI-suggested iconNames from the prompt (to ensure they are mapped)
    Bone: Bone, Nut: Nut, Activity: Activity, PersonStanding: PersonStanding, Eye: Eye, ShieldCheck: ShieldCheck, Droplet: Droplet, Wind: Wind, Brain: Brain, Baby: Baby, Heart: Heart, ShieldQuestion: ShieldQuestion, Network: Network, Target: Target
};


interface DashboardContentProps {
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
    groupedTimelineEntries: Record<string, TimelineEntry[]>;
}

interface AchievedMicronutrient {
    name: string;
    iconName?: string;
    totalDV: number;
}

export default function DashboardContent({
    userProfile,
    timelineEntries,
    dailyNutritionSummary, // Initial summary (likely for Today)
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
}: DashboardContentProps) {

    const [isFabPopoverOpen, setIsFabPopoverOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    const handleFabActionClick = (action?: () => void) => {
        if (action) {
            action();
        }
        setIsFabPopoverOpen(false);
    }

    // Dynamic Summary calculation based on selected Date
    const currentDaySummary = useMemo<DailyNutritionSummary>(() => {
        // If selected date is Today, we *could* use the prop, but calculating ensures consistency with client-side entries/nav
        // Let's calculate from timelineEntries to support historical nav
        let calories = 0, protein = 0, carbs = 0, fat = 0;

        timelineEntries.forEach(entry => {
            if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
                const item = entry as LoggedFoodItem;
                if (isSameDay(new Date(item.timestamp), currentDate)) {
                    calories += item.calories || 0;
                    protein += item.protein || 0;
                    carbs += item.carbs || 0;
                    fat += item.fat || 0;
                }
            }
        });

        return { calories, protein, carbs, fat };
    }, [timelineEntries, currentDate]);

    const achievedMicronutrients = useMemo<AchievedMicronutrient[]>(() => {
        const targetStart = startOfDay(currentDate);
        const targetEnd = endOfDay(currentDate);
        const dailyTotals: Record<string, { totalDV: number, iconName?: string }> = {};

        timelineEntries.forEach(entry => {
            if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
                const entryDate = new Date(entry.timestamp);
                if (entryDate >= targetStart && entryDate <= targetEnd) {
                    const foodItem = entry as LoggedFoodItem;
                    const microsInfo = foodItem.fodmapData?.micronutrientsInfo;
                    if (microsInfo) {
                        const allMicros: MicronutrientDetail[] = [];
                        if (microsInfo.notable) allMicros.push(...microsInfo.notable);
                        if (microsInfo.fullList) allMicros.push(...microsInfo.fullList);

                        allMicros.forEach(micro => {
                            if (micro.dailyValuePercent !== undefined) {
                                if (!dailyTotals[micro.name]) {
                                    dailyTotals[micro.name] = { totalDV: 0, iconName: micro.iconName };
                                }
                                dailyTotals[micro.name].totalDV += micro.dailyValuePercent;
                                if (micro.iconName && !dailyTotals[micro.name].iconName) {
                                    dailyTotals[micro.name].iconName = micro.iconName;
                                }
                            }
                        });
                    }
                }
            }
        });

        return Object.entries(dailyTotals)
            .filter(([, data]) => data.totalDV >= 100)
            .map(([name, data]) => ({ name, iconName: data.iconName, totalDV: data.totalDV }))
            .sort((a, b) => b.totalDV - a.totalDV)
            .slice(0, 5);
    }, [timelineEntries, currentDate]);

    const sortedDateKeys = useMemo(() => {
        return Object.keys(groupedTimelineEntries).sort((a, b) => {
            // Find the latest timestamp for each date group to sort the groups themselves
            const lastTimeA = new Date(groupedTimelineEntries[a][0].timestamp).getTime();
            const lastTimeB = new Date(groupedTimelineEntries[b][0].timestamp).getTime();
            return lastTimeB - lastTimeA;
        });
    }, [groupedTimelineEntries]);


    return (
        <div className="h-full flex flex-col p-4 bg-background text-foreground relative gap-4 max-w-5xl mx-auto w-full">
            {/* Nutrition Overview Section */}
            <div className="shrink-0 w-full animate-in fade-in slide-in-from-top-4 duration-500">
                <NutritionOverview
                    summary={currentDaySummary}
                    currentDate={currentDate}
                    onPrevDate={() => setCurrentDate(prev => addDays(prev, -1))}
                    onNextDate={() => setCurrentDate(prev => addDays(prev, 1))}
                />
            </div>

            {/* Micronutrients Highlights (if any) */}
            {achievedMicronutrients.length > 0 && (
                <div className="shrink-0 w-full animate-in fade-in slide-in-from-top-8 duration-700 delay-100">
                    <Card className="shadow-sm border-border bg-card/30">
                        <CardContent className="p-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
                            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap mr-1">Micronutrient Goals ({isSameDay(currentDate, new Date()) ? 'Today' : format(currentDate, 'MMM d')}):</span>
                            {achievedMicronutrients.map(micro => {
                                const IconComponent = (micro.iconName && RepresentativeLucideIcons[micro.iconName]) || RepresentativeLucideIcons[micro.name] || Atom;
                                return (
                                    <Popover key={micro.name}>
                                        <PopoverTrigger asChild>
                                            <div className="relative p-1.5 cursor-pointer flex items-center bg-background rounded-full border border-border hover:bg-accent transition-colors">
                                                <IconComponent className="h-4 w-4 text-primary" />
                                                <span className="ml-1.5 text-xs font-semibold mr-1">{micro.name}</span>
                                                <Check className="h-3 w-3 text-green-500 bg-green-500/10 rounded-full p-0.5" />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto max-w-xs bg-popover text-popover-foreground border-border p-2 text-sm z-50">
                                            <p><span className="font-semibold">{micro.name}:</span> {Math.round(micro.totalDV)}% DV achieved</p>
                                        </PopoverContent>
                                    </Popover>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            )}


            <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="relative pb-24 pt-6">
                    <div className="space-y-6">
                        {timelineEntries.length === 0 && !Object.values(isLoadingAi).some(Boolean) && (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl mt-4 bg-muted/20">
                                <Utensils className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                <h2 className="text-xl font-semibold font-headline mb-2 text-foreground">Timeline is Empty</h2>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                    {userProfile.premium ? "Start tracking your gut health by logging your first meal." : "Log food or symptoms to see them appear here."}
                                </p>
                            </div>
                        )}
                        {sortedDateKeys.map(dateKey => {
                            const entriesOnDate = groupedTimelineEntries[dateKey];
                            if (!entriesOnDate || entriesOnDate.length === 0) return null;

                            // Check if there are any displayable entries (food, manual, symptom) before rendering header
                            // This hides dates that might be in the list but have no valid content to show
                            const displayableEntries = entriesOnDate.filter(
                                e => ['food', 'manual_macro', 'symptom'].includes(e.entryType)
                            );

                            if (displayableEntries.length === 0) return null;

                            return (
                                <div key={dateKey} className="relative pl-8 pb-12 last:pb-0 border-l-2 border-primary/20 ml-2">
                                    {/* Timeline Node */}
                                    <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary ring-4 ring-background" />

                                    {/* Date Header */}
                                    <div className="flex items-center gap-2 mb-6 -mt-1">
                                        <h3 className="text-sm font-bold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full shadow-sm border border-primary/10">
                                            {dateKey}
                                        </h3>
                                    </div>

                                    {/* Cards Grid */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                                        {displayableEntries.map((entry, entryIndex) => {
                                            if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
                                                return (
                                                    <div
                                                        key={entry.id}
                                                        className="card-reveal-animation h-full"
                                                        style={{ animationDelay: `${entryIndex * 0.05}s` }}
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
                                                        className="card-reveal-animation h-full"
                                                        style={{ animationDelay: `${entryIndex * 0.05}s` }}
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
                    <Button variant="default" className="absolute bottom-20 right-6 h-16 w-16 rounded-full shadow-2xl z-20" size="icon">
                        <Plus className="h-8 w-8" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    side="top"
                    align="end"
                    className="w-auto bg-card text-card-foreground border-border shadow-xl rounded-xl p-0 mb-2"
                >
                    <div className="flex flex-col gap-1 p-2">
                        <Button variant="ghost" className="justify-start w-full text-base py-3 px-4 text-card-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => handleFabActionClick(onLogFoodAIClick)}>
                            <PlusCircle className="mr-3 h-5 w-5" /> Log Food (AI Text)
                        </Button>
                        <Button variant="ghost" className="justify-start w-full text-base py-3 px-4 text-card-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => handleFabActionClick(onIdentifyByPhotoClick)}>
                            <Camera className="mr-3 h-5 w-5" /> Identify by Photo
                        </Button>
                        <Button variant="ghost" className="justify-start w-full text-base py-3 px-4 text-card-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => handleFabActionClick(onLogSymptomsClick)}>
                            <ListChecks className="mr-3 h-5 w-5" /> Log Symptoms
                        </Button>
                        <Button variant="ghost" className="justify-start w-full text-base py-3 px-4 text-card-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => handleFabActionClick(onLogPreviousMealClick)}>
                            <CalendarDays className="mr-3 h-5 w-5" /> Log Previous Meal
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
