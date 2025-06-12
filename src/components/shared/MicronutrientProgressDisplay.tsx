
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { TimelineEntry, LoggedFoodItem, MicronutrientDetail, UserMicronutrientProgress } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import {
  Atom, Sparkles, Bone, Activity, PersonStanding, Eye, ShieldCheck, Droplet, Wind, Brain, Heart, ShieldQuestion, Network, Target, HelpCircle, Nut
} from 'lucide-react'; // Removed Baby, Milk, Sun, Anchor, Leaf icons as their primary nutrients are removed or re-assigned
import { startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface MicronutrientProgressDisplayProps {
  userId?: string | null;
}

const RepresentativeLucideIcons: { [key: string]: React.ElementType } = {
  // Functional Icons based on nutrient name
  VitaminA: Eye,
  VitaminC: ShieldCheck,
  VitaminD: ShieldCheck, 
  VitaminE: ShieldQuestion, // Changed from ShieldCheck to ShieldQuestion for variety
  VitaminK: Heart,
  Thiamin: Brain, // B1
  Riboflavin: Activity, // B2
  Niacin: Activity, // B3
  PantothenicAcid: Activity, // B5
  VitaminB6: Brain,
  // Biotin: Activity, // B7 - Removed
  // Folate: Baby, // B9 - Removed
  VitaminB12: Brain,
  Choline: Brain,

  Calcium: Bone,
  // Phosphorus: Bone, - Removed
  Magnesium: Activity,
  Iron: Wind,
  Zinc: PersonStanding,
  // Copper: Network, - Removed
  // Manganese: Bone, - Retained as it wasn't in removal list
  Selenium: ShieldCheck,
  // Iodine: Brain, - Removed
  Chromium: Target,
  // Molybdenum: Atom, - Removed
  Potassium: Droplet,
  Sodium: Droplet,
  // Chloride: Droplet, - Removed
  Omega3: Heart, // Added for Omega-3

  // AI-suggested functional icon names (ensure these are mapped if AI uses them)
  Bone: Bone, Activity: Activity, PersonStanding: PersonStanding, Eye: Eye, ShieldCheck: ShieldCheck,
  Droplet: Droplet, Wind: Wind, Brain: Brain, Heart: Heart, ShieldQuestion: ShieldQuestion,
  Network: Network, Target: Target, Nut: Nut, 
  // Fallback / General Icons
  Atom, Sparkles, HelpCircle,
};

const KEY_MICRONUTRIENTS_CONFIG: Array<{ name: string; displayName?: string; targetDV?: number; unit?: 'mg' | '%'; icon?: React.ElementType }> = [
  // Vitamins
  { name: 'VitaminA', displayName: 'Vitamin A', targetDV: 100, unit: '%' },
  { name: 'VitaminC', displayName: 'Vitamin C', targetDV: 100, unit: '%' },
  { name: 'VitaminD', displayName: 'Vitamin D', targetDV: 100, unit: '%' },
  { name: 'VitaminE', displayName: 'Vitamin E', targetDV: 100, unit: '%' },
  { name: 'VitaminK', displayName: 'Vitamin K', targetDV: 100, unit: '%' },
  { name: 'Thiamin', displayName: 'Thiamin (B1)', targetDV: 100, unit: '%' },
  { name: 'Riboflavin', displayName: 'Riboflavin (B2)', targetDV: 100, unit: '%' },
  { name: 'Niacin', displayName: 'Niacin (B3)', targetDV: 100, unit: '%' },
  { name: 'PantothenicAcid', displayName: 'Pantothenic Acid (B5)', targetDV: 100, unit: '%' },
  { name: 'VitaminB6', displayName: 'Vitamin B6', targetDV: 1.7, unit: 'mg' },
  { name: 'VitaminB12', displayName: 'Vitamin B12', targetDV: 100, unit: '%' },
  { name: 'Choline', displayName: 'Choline', targetDV: 550, unit: 'mg' },
  // Minerals
  { name: 'Calcium', displayName: 'Calcium', targetDV: 1000, unit: 'mg' },
  { name: 'Magnesium', displayName: 'Magnesium', targetDV: 420, unit: 'mg' },
  { name: 'Iron', displayName: 'Iron', targetDV: 100, unit: '%' },
  { name: 'Zinc', displayName: 'Zinc', targetDV: 11, unit: 'mg' },
  { name: 'Manganese', displayName: 'Manganese', targetDV: 100, unit: '%' },
  { name: 'Selenium', displayName: 'Selenium', targetDV: 100, unit: '%' },
  { name: 'Chromium', displayName: 'Chromium', targetDV: 0.035, unit: 'mg' }, // 35mcg
  { name: 'Potassium', displayName: 'Potassium', targetDV: 100, unit: '%' },
  { name: 'Sodium', displayName: 'Sodium', targetDV: 2300, unit: 'mg' },
  // Added Omega-3
  { name: 'Omega3', displayName: 'Omega-3 (EPA+DHA)', targetDV: 500, unit: 'mg', icon: RepresentativeLucideIcons.Heart },
];


export default function MicronutrientProgressDisplay({ userId }: MicronutrientProgressDisplayProps) {
  const [progressData, setProgressData] = useState<UserMicronutrientProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProgressData(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const entriesColRef = collection(db, 'users', userId, 'timelineEntries');
        const q = query(
          entriesColRef,
          where('timestamp', '>=', Timestamp.fromDate(todayStart)),
          where('timestamp', '<=', Timestamp.fromDate(todayEnd))
        );

        const querySnapshot = await getDocs(q);
        const fetchedEntries: TimelineEntry[] = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            ...data,
            id: docSnap.id,
            timestamp: (data.timestamp as Timestamp).toDate(),
          } as TimelineEntry;
        });

        const foodItemsToday = fetchedEntries.filter(
          (entry): entry is LoggedFoodItem => entry.entryType === 'food' || entry.entryType === 'manual_macro'
        );

        const dailyTotals: UserMicronutrientProgress = {};
        KEY_MICRONUTRIENTS_CONFIG.forEach(keyMicro => {
          dailyTotals[keyMicro.name] = {
            name: keyMicro.displayName || keyMicro.name,
            achievedValue: 0, 
            achievedDV: 0,    
            icon: keyMicro.icon || RepresentativeLucideIcons[keyMicro.name] || Atom,
            targetDV: keyMicro.targetDV || (keyMicro.unit === 'mg' ? 0 : 100), 
            unit: keyMicro.unit || '%',
          };
        });
        
        foodItemsToday.forEach(item => {
          const microsInfo = item.fodmapData?.micronutrientsInfo;
          if (microsInfo) {
            const combinedMicrosRaw: MicronutrientDetail[] = [
              ...(microsInfo.notable || []),
              ...(microsInfo.fullList || []),
            ];

            const perItemSummarizedMicros = new Map<string, {
                name: string; 
                totalAmountMg: number;
                totalAmountMcg: number;
                totalAmountIu: number; 
                totalDVPercent: number;
                iconName?: string;
            }>();

            combinedMicrosRaw.forEach(microDetail => {
                const normalizedName = microDetail.name.toLowerCase();
                let entry = perItemSummarizedMicros.get(normalizedName);
                if (!entry) {
                    entry = {
                        name: microDetail.name,
                        totalAmountMg: 0,
                        totalAmountMcg: 0,
                        totalAmountIu: 0,
                        totalDVPercent: 0,
                        iconName: microDetail.iconName,
                    };
                    perItemSummarizedMicros.set(normalizedName, entry);
                }

                if (microDetail.dailyValuePercent !== undefined) {
                    entry.totalDVPercent += microDetail.dailyValuePercent;
                }

                if (microDetail.amount) {
                    const amountString = String(microDetail.amount).toLowerCase();
                    const amountValue = parseFloat(amountString.replace(/[^0-9.]/g, '')); // Extract numeric part
                    if (!isNaN(amountValue)) {
                        if (amountString.includes("mcg") || amountString.includes("µg")) {
                            entry.totalAmountMcg += amountValue;
                        } else if (amountString.includes("mg")) {
                            entry.totalAmountMg += amountValue;
                        } else if (amountString.includes("iu")) {
                            entry.totalAmountIu += amountValue;
                        }
                    }
                }
                if (microDetail.iconName && !entry.iconName) {
                    entry.iconName = microDetail.iconName;
                }
            });
            
            Array.from(perItemSummarizedMicros.values()).forEach(summedMicroFromItem => {
                const normalizedSummedName = summedMicroFromItem.name.toLowerCase();
                let matchedConfigKey: string | undefined = undefined;
            
                if ((normalizedSummedName === 'epa' || normalizedSummedName === 'dha') && dailyTotals['Omega3']) {
                    matchedConfigKey = 'Omega3';
                } else {
                    const configEntry = KEY_MICRONUTRIENTS_CONFIG.find(km =>
                        km.name.toLowerCase() === normalizedSummedName ||
                        (km.displayName && km.displayName.toLowerCase() === normalizedSummedName)
                    );
                    if (configEntry) {
                        matchedConfigKey = configEntry.name;
                    }
                }
            
                if (matchedConfigKey && dailyTotals[matchedConfigKey]) {
                    const targetDailyEntry = dailyTotals[matchedConfigKey];
                    let valueToAdd = 0;
            
                    if (targetDailyEntry.unit === 'mg' || matchedConfigKey === 'Omega3') { // Omega3 is always mg
                        valueToAdd = summedMicroFromItem.totalAmountMg + (summedMicroFromItem.totalAmountMcg * 0.001);
                        targetDailyEntry.achievedValue = (targetDailyEntry.achievedValue || 0) + valueToAdd;
                    } else if (targetDailyEntry.unit === '%') {
                        valueToAdd = summedMicroFromItem.totalDVPercent;
                        targetDailyEntry.achievedDV = (targetDailyEntry.achievedDV || 0) + valueToAdd;
                    }
                    
                    const iconFromSummed = summedMicroFromItem.iconName ? RepresentativeLucideIcons[summedMicroFromItem.iconName] : undefined;
                    const iconFromConfigOrKey = targetDailyEntry.icon !== Atom ? targetDailyEntry.icon : (RepresentativeLucideIcons[matchedConfigKey] || Atom);
                    
                    if (iconFromSummed) {
                        targetDailyEntry.icon = iconFromSummed;
                    } else if (iconFromConfigOrKey && targetDailyEntry.icon === Atom) { 
                        targetDailyEntry.icon = iconFromConfigOrKey;
                    }
                }
            });
          }
        });
        setProgressData(dailyTotals);
      } catch (err) {
        console.error("[Micronutrients] Error fetching micronutrient data:", err);
        setError("Could not load micronutrient progress. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground mt-4">Loading micronutrient progress...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive p-4 text-center">{error}</p>;
  }

  if (!progressData || Object.keys(progressData).length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No micronutrient data logged for today yet.</p>;
  }

  const sortedMicronutrients = Object.values(progressData).sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {sortedMicronutrients.map((micro) => {
          const IconComponent = micro.icon || Atom;
          const target = micro.targetDV;
          const isSodium = micro.name.toLowerCase() === 'sodium';
          
          let percentage: number;
          let displayAchieved: string;
          let displayTarget: string;

          if (micro.unit === 'mg') {
            percentage = target > 0 ? Math.min(100, ((micro.achievedValue || 0) / target) * 100) : 0;
            displayAchieved = `${Math.round(micro.achievedValue || 0)}mg`;
            displayTarget = `${Math.round(target)}mg`;
          } else { // unit is '%'
            percentage = Math.min(100, micro.achievedDV);
            displayAchieved = `${Math.round(micro.achievedDV)}%`;
            displayTarget = `${Math.round(target)}% DV`;
          }
          
          const progressValue = isNaN(percentage) ? 0 : percentage;
          const isAchieved = isSodium ? (micro.achievedValue || 0) <= target : progressValue >= 100;

          return (
            <div key={micro.name} className="break-words">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center text-sm text-foreground min-w-0 mr-2">
                  <IconComponent className={cn("h-4 w-4 mr-2 shrink-0", isAchieved ? 'text-green-500' : 'text-muted-foreground')} />
                  <span className="truncate font-medium">{micro.name}</span>
                </div>
                <span className={cn("text-xs font-medium text-right shrink-0", isAchieved ? 'text-green-500' : 'text-muted-foreground')}>
                  {displayAchieved}
                  <span className="text-xs text-muted-foreground/80"> / {displayTarget}</span>
                </span>
              </div>
              <Progress
                  value={isSodium ? (target > 0 ? Math.min(100, ((micro.achievedValue || 0) / target) * 100) : 0) : progressValue}
                  className={cn("h-2.5",
                      isSodium 
                        ? ((micro.achievedValue || 0) > target ? "[&>div]:bg-red-500" : ((micro.achievedValue || 0) >= target * 0.8 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"))
                        : (progressValue >= 100 ? "[&>div]:bg-green-500" : (progressValue >=75 ? "[&>div]:bg-yellow-500" : ""))
                  )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

