'use client';

import { SetupData } from '../SetupWizard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DietStepProps {
    data: SetupData;
    updateData: (data: Partial<SetupData>) => void;
    onBack: () => void;
    onNext: () => void;
}

const DIET_OPTIONS = [
    { id: 'keto', name: 'Keto' },
    { id: 'vegan', name: 'Vegan' },
    { id: 'vegetarian', name: 'Vegetarian' },
    { id: 'intermittent_fasting', name: 'Intermittent Fasting' },
    { id: 'paleo', name: 'Paleo' },
    { id: 'gluten_free', name: 'Gluten Free' },
    { id: 'dairy_free', name: 'Dairy Free' },
    { id: 'pescatarian', name: 'Pescatarian' },
];

export default function DietStep({ data, updateData, onBack, onNext }: DietStepProps) {

    const handleToggle = (dietId: string) => {
        const current = data.dietaryPreferences || [];
        const exists = current.includes(dietId);

        if (exists) {
            updateData({ dietaryPreferences: current.filter(id => id !== dietId) });
        } else {
            updateData({ dietaryPreferences: [...current, dietId] });
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-xl border-none">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-2 bg-[#2aac6b]/10 rounded-lg">
                        <Utensils className="w-6 h-6 text-[#2aac6b]" />
                    </div>
                    Dietary Preferences
                </CardTitle>
                <CardDescription>
                    Do you follow any specific diet? This helps us tailor your food analysis and advice.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DIET_OPTIONS.map((diet) => {
                        const isSelected = (data.dietaryPreferences || []).includes(diet.id);
                        return (
                            <div
                                key={diet.id}
                                className={cn(
                                    "flex items-start space-x-3 p-4 rounded-lg border transition-colors cursor-pointer",
                                    isSelected
                                        ? "bg-[#2aac6b]/10 border-[#2aac6b]"
                                        : "bg-card border-border hover:bg-accent/50"
                                )}
                                onClick={() => handleToggle(diet.id)}
                            >
                                <Checkbox
                                    id={diet.id}
                                    checked={isSelected}
                                    onCheckedChange={() => handleToggle(diet.id)}
                                    className="mt-1 data-[state=checked]:bg-[#2aac6b] data-[state=checked]:border-[#2aac6b]"
                                />
                                <div className="space-y-1">
                                    <Label
                                        htmlFor={diet.id}
                                        className="font-medium cursor-pointer text-foreground"
                                    >
                                        {diet.name}
                                    </Label>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={onBack} className="w-1/3">
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                    </Button>
                    <Button className="w-2/3" onClick={onNext}>
                        Next <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
