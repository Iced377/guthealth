
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DailyNutritionSummary } from '@/types';
import { Flame, Beef, Wheat, Droplet, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { format, isToday } from 'date-fns';

interface NutritionOverviewProps {
    summary: DailyNutritionSummary;
    currentDate: Date;
    onPrevDate: () => void;
    onNextDate: () => void;
}

export default function NutritionOverview({ summary, currentDate, onPrevDate, onNextDate }: NutritionOverviewProps) {
    // Goals could be passed in props later, hardcoding standard defaults for visualization scale
    // These are just reference points for the progress bars to make them look populated
    const targets = {
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
                <Card className="shadow-sm border-border bg-card/50 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center opacity-[0.07] pointer-events-none group-hover:opacity-[0.12] transition-opacity">
                        <Flame className="h-[120%] w-[120%] text-orange-500 translate-x-1/4" />
                    </div>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Calories</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 relative z-10">
                        <div className="text-2xl font-bold font-headline">{Math.round(summary.calories)}</div>
                        <p className="text-xs text-muted-foreground mb-3">kcal</p>
                        <Progress value={getPercent(summary.calories, targets.calories)} className="h-2 bg-secondary" indicatorClassName="bg-orange-500" />
                    </CardContent>
                </Card>

                {/* Protein */}
                <Card className="shadow-sm border-border bg-card/50 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center opacity-[0.07] pointer-events-none group-hover:opacity-[0.12] transition-opacity">
                        <Beef className="h-[120%] w-[120%] text-red-500 translate-x-1/4" />
                    </div>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Protein</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 relative z-10">
                        <div className="text-2xl font-bold font-headline">{Math.round(summary.protein)}g</div>
                        <p className="text-xs text-muted-foreground mb-3">{Math.round(getPercent(summary.protein, targets.protein))}% of target</p>
                        <Progress value={getPercent(summary.protein, targets.protein)} className="h-2 bg-secondary" indicatorClassName="bg-red-500" />
                    </CardContent>
                </Card>

                {/* Carbs */}
                <Card className="shadow-sm border-border bg-card/50 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center opacity-[0.07] pointer-events-none group-hover:opacity-[0.12] transition-opacity">
                        <Wheat className="h-[120%] w-[120%] text-yellow-500 translate-x-1/4" />
                    </div>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Carbs</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 relative z-10">
                        <div className="text-2xl font-bold font-headline">{Math.round(summary.carbs)}g</div>
                        <p className="text-xs text-muted-foreground mb-3">{Math.round(getPercent(summary.carbs, targets.carbs))}% of target</p>
                        <Progress value={getPercent(summary.carbs, targets.carbs)} className="h-2 bg-secondary" indicatorClassName="bg-yellow-500" />
                    </CardContent>
                </Card>

                {/* Fat */}
                <Card className="shadow-sm border-border bg-card/50 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center opacity-[0.07] pointer-events-none group-hover:opacity-[0.12] transition-opacity">
                        <Droplet className="h-[120%] w-[120%] text-blue-500 translate-x-1/4" />
                    </div>
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Fat</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 relative z-10">
                        <div className="text-2xl font-bold font-headline">{Math.round(summary.fat)}g</div>
                        <p className="text-xs text-muted-foreground mb-3">{Math.round(getPercent(summary.fat, targets.fat))}% of target</p>
                        <Progress value={getPercent(summary.fat, targets.fat)} className="h-2 bg-secondary" indicatorClassName="bg-blue-500" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
