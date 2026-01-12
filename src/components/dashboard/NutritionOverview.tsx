
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DailyNutritionSummary } from '@/types';
import { Flame, Beef, Wheat, Droplet, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { format, isToday } from 'date-fns';

interface NutritionGoals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

interface NutritionOverviewProps {
    summary: DailyNutritionSummary;
    currentDate: Date;
    onPrevDate: () => void;
    onNextDate: () => void;
    goals?: NutritionGoals;
}

export default function NutritionOverview({ summary, currentDate, onPrevDate, onNextDate, goals }: NutritionOverviewProps) {
    // defaults if not provided
    const targets = goals || {
        calories: 2500,
        protein: 150,
        carbs: 300,
        fat: 80,
    };

    const getPercent = (current: number, target: number) => Math.min(100, (current / target) * 100);

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center justify-between mb-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrevDate}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{isToday(currentDate) ? "Today" : format(currentDate, 'MMMM do, yyyy')}</span>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNextDate} disabled={isToday(currentDate)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {/* Calories */}
                <Card className="shadow-sm border-orange-200/20 bg-orange-500/5 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center opacity-[0.15] pointer-events-none group-hover:opacity-[0.25] transition-opacity">
                        <Flame className="h-[120%] w-[120%] text-orange-500 translate-x-1/4" />
                    </div>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                        <CardTitle className="text-sm font-medium text-orange-600/80 dark:text-orange-400/80">Calories</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 relative z-10">
                        <div className="text-2xl font-bold font-headline text-orange-700 dark:text-orange-300">{Math.round(summary.calories)}</div>
                        <p className="text-xs text-orange-600/60 dark:text-orange-400/60 mb-3">kcal</p>
                        <Progress value={getPercent(summary.calories, targets.calories)} className="h-2 bg-orange-500/20" indicatorClassName="bg-orange-500" />
                    </CardContent>
                </Card>

                {/* Protein */}
                <Card className="shadow-sm border-red-200/20 bg-red-500/5 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center opacity-[0.15] pointer-events-none group-hover:opacity-[0.25] transition-opacity">
                        <Beef className="h-[120%] w-[120%] text-red-500 translate-x-1/4" />
                    </div>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                        <CardTitle className="text-sm font-medium text-red-600/80 dark:text-red-400/80">Protein</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 relative z-10">
                        <div className="text-2xl font-bold font-headline text-red-700 dark:text-red-300">{Math.round(summary.protein)}g</div>
                        <p className="text-xs text-red-600/60 dark:text-red-400/60 mb-3">{Math.round(getPercent(summary.protein, targets.protein))}% of target</p>
                        <Progress value={getPercent(summary.protein, targets.protein)} className="h-2 bg-red-500/20" indicatorClassName="bg-red-500" />
                    </CardContent>
                </Card>

                {/* Carbs */}
                <Card className="shadow-sm border-yellow-200/20 bg-yellow-500/5 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center opacity-[0.15] pointer-events-none group-hover:opacity-[0.25] transition-opacity">
                        <Wheat className="h-[120%] w-[120%] text-yellow-500 translate-x-1/4" />
                    </div>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                        <CardTitle className="text-sm font-medium text-yellow-600/80 dark:text-yellow-400/80">Carbs</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 relative z-10">
                        <div className="text-2xl font-bold font-headline text-yellow-700 dark:text-yellow-300">{Math.round(summary.carbs)}g</div>
                        <p className="text-xs text-yellow-600/60 dark:text-yellow-400/60 mb-3">{Math.round(getPercent(summary.carbs, targets.carbs))}% of target</p>
                        <Progress value={getPercent(summary.carbs, targets.carbs)} className="h-2 bg-yellow-500/20" indicatorClassName="bg-yellow-500" />
                    </CardContent>
                </Card>

                {/* Fat */}
                <Card className="shadow-sm border-blue-200/20 bg-blue-500/5 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center opacity-[0.15] pointer-events-none group-hover:opacity-[0.25] transition-opacity">
                        <Droplet className="h-[120%] w-[120%] text-blue-500 translate-x-1/4" />
                    </div>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                        <CardTitle className="text-sm font-medium text-blue-600/80 dark:text-blue-400/80">Fat</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 relative z-10">
                        <div className="text-2xl font-bold font-headline text-blue-700 dark:text-blue-300">{Math.round(summary.fat)}g</div>
                        <p className="text-xs text-blue-600/60 dark:text-blue-400/60 mb-3">{Math.round(getPercent(summary.fat, targets.fat))}% of target</p>
                        <Progress value={getPercent(summary.fat, targets.fat)} className="h-2 bg-blue-500/20" indicatorClassName="bg-blue-500" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
