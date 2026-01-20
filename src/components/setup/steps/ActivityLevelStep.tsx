'use client';

import { SetupData } from '../SetupWizard';
import LiquidWizardCard from '../LiquidWizardCard';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface ActivityLevelStepProps {
    data: SetupData;
    updateData: (data: Partial<SetupData>) => void;
    onNext: () => void;
}

export default function ActivityLevelStep({ data, updateData, onNext }: ActivityLevelStepProps) {

    const activities = [
        { id: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise', color: "bg-slate-400" },
        { id: 'lightly_active', label: 'Lightly Active', desc: '1-3 days/week', color: "bg-emerald-400" },
        { id: 'moderately_active', label: 'Moderately Active', desc: '3-5 days/week', color: "bg-blue-400" },
        { id: 'very_active', label: 'Very Active', desc: '6-7 days/week', color: "bg-orange-400" },
    ];

    const handleSelect = (id: string) => {
        updateData({ activityLevel: id as any });
        setTimeout(() => onNext(), 300);
    };

    return (
        <LiquidWizardCard
            title="Activity Level"
            description="How active are you on a daily basis?"
        // icon removed
        >
            <div className="grid grid-cols-2 gap-3 w-full h-full content-center">
                {activities.map((a) => {
                    const isSelected = data.activityLevel === a.id;
                    return (
                        <div
                            key={a.id}
                            onClick={() => handleSelect(a.id)}
                            className={cn(
                                "cursor-pointer rounded-3xl p-4 transition-all duration-300 border relative overflow-hidden flex flex-col items-center justify-center text-center gap-3 aspect-square",
                                isSelected
                                    ? "border-transparent bg-white/10 dark:bg-white/5 shadow-lg scale-[1.02]"
                                    : "border-transparent bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10"
                            )}
                        >
                            {/* Color Dot */}
                            <div className={cn(
                                "w-4 h-4 rounded-full transition-all duration-300",
                                a.color,
                                isSelected ? "scale-150 shadow-[0_0_10px_currentColor]" : "opacity-50"
                            )} />

                            <div>
                                <div className="font-bold text-sm mb-1">{a.label}</div>
                                <div className="text-[10px] text-muted-foreground leading-tight opacity-70">{a.desc}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </LiquidWizardCard>
    );
}
