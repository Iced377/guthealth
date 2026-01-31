'use client';

import { SetupData } from '../SetupWizard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Stethoscope, ArrowRight } from 'lucide-react';
import LiquidWizardCard from '../LiquidWizardCard';
import { COMMON_SYMPTOMS } from '@/types';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface SymptomsStepProps {
    data: SetupData;
    updateData: (data: Partial<SetupData>) => void;
    onBack?: () => void;
    onNext: () => void;
}

export default function SymptomsStep({ data, updateData, onNext }: SymptomsStepProps) {
    const { isDarkMode } = useTheme();

    const handleToggle = (symptomId: string) => {
        const current = data.symptoms || [];
        const exists = current.includes(symptomId);

        if (exists) {
            updateData({ symptoms: current.filter(id => id !== symptomId) });
        } else {
            updateData({ symptoms: [...current, symptomId] });
        }
    };

    return (
        <LiquidWizardCard
            title="Symptoms"
            description="Select any symptoms to manage."
            showSwipeHint={false}
        >
            <div className="w-full flex-1 min-h-0 flex flex-col justify-center pb-8 px-1">
                <div className="flex flex-wrap gap-3 justify-center content-center">
                    {COMMON_SYMPTOMS.map((symptom) => {
                        const isSelected = data.symptoms.includes(symptom.id);
                        return (
                            <div
                                key={symptom.id}
                                onClick={() => handleToggle(symptom.id)}
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
                                        {symptom.name}
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
