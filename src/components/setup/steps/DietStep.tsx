'use client';

import { SetupData } from '../SetupWizard';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Utensils } from 'lucide-react';
import LiquidWizardCard from '../LiquidWizardCard';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface DietStepProps {
    data: SetupData;
    updateData: (data: Partial<SetupData>) => void;
    onBack?: () => void;
    onNext?: () => void;
}

const DIET_OPTIONS = [
    { id: 'keto', name: 'Keto' },
    { id: 'vegan', name: 'Vegan' },
    { id: 'vegetarian', name: 'Vegetarian' },
    { id: 'intermittent_fasting', name: 'Intermittent Fasting' },
    { id: 'gluten_free', name: 'Gluten Free' },
    { id: 'dairy_free', name: 'Dairy Free' },
    { id: 'low_fodmap', name: 'Low FODMAP' },
];

export default function DietStep({ data, updateData }: DietStepProps) {
    const { isDarkMode } = useTheme();

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
        <LiquidWizardCard
            title="Dietary Prefs"
            description="Select any specific diets you follow."
            showSwipeHint={false}
        >
            <div className="w-full flex-1 min-h-0 flex flex-col justify-center pb-8 px-1">
                <div className="flex flex-wrap gap-3 justify-center content-center">
                    {DIET_OPTIONS.map((diet) => {
                        const isSelected = (data.dietaryPreferences || []).includes(diet.id);
                        return (
                            <div
                                key={diet.id}
                                onClick={() => handleToggle(diet.id)}
                                className={cn(
                                    "relative group cursor-pointer px-5 py-3 rounded-full transition-all duration-300 border backdrop-blur-sm overflow-hidden",
                                    isSelected
                                        ? "border-transparent bg-white/10 dark:bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-105"
                                        : "border-white/10 bg-white/5 hover:bg-white/10 dark:bg-black/5 dark:hover:bg-white/5"
                                )}
                            >
                                {/* Fluid Background Animation for Selection (Neon Green) */}
                                <div className={cn(
                                    "absolute inset-0 transition-opacity duration-500 bg-gradient-to-r from-green-400/20 to-emerald-400/20",
                                    isSelected ? "opacity-100" : "opacity-0"
                                )} />

                                <div className="flex items-center gap-2 relative z-10">
                                    <span className={cn(
                                        "text-sm font-bold tracking-tight transition-colors duration-300",
                                        isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                                    )}>
                                        {diet.name}
                                    </span>

                                    {/* Fluid Dot Indicator (Neon Green) */}
                                    <div className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-500 ease-spring",
                                        isSelected
                                            ? "bg-gradient-to-tr from-green-400 to-emerald-400 scale-100 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                                            : "bg-muted-foreground/30 scale-0 opacity-0 w-0"
                                    )} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </LiquidWizardCard>
    );
}
