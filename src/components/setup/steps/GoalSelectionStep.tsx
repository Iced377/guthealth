'use client';

import { SetupData } from '../SetupWizard';
import LiquidWizardCard from '../LiquidWizardCard';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';

interface GoalSelectionStepProps {
    data: SetupData;
    updateData: (data: Partial<SetupData>) => void;
    onNext: () => void;
}

export default function GoalSelectionStep({ data, updateData, onNext }: GoalSelectionStepProps) {

    const goals = [
        {
            id: 'lose_fat',
            label: 'Lose Fat',
            desc: 'Shred body fat while maintaining muscle.',
            gradient: "from-blue-400 to-cyan-300"
        },
        {
            id: 'maintain',
            label: 'Maintain',
            desc: 'Focus on performance and gut health.',
            gradient: "from-emerald-400 to-teal-300"
        },
        {
            id: 'gain_muscle',
            label: 'Gain Muscle',
            desc: 'Fuel hypertrophy and strength gains.',
            gradient: "from-orange-400 to-rose-300"
        },
    ];

    const handleSelect = (id: string) => {
        updateData({ goal: id as any });
        setTimeout(() => onNext(), 300);
    };

    return (
        <LiquidWizardCard
            title="Primary Goal"
            description="What do you want to achieve with your nutrition plan?"
        // icon removed
        >
            <div className="flex flex-col gap-3 w-full">
                {goals.map((g) => {
                    const isSelected = data.goal === g.id;
                    return (
                        <div
                            key={g.id}
                            onClick={() => handleSelect(g.id)}
                            className={cn(
                                "cursor-pointer rounded-3xl p-4 transition-all duration-300 border relative overflow-hidden group h-24 flex items-center",
                                isSelected
                                    ? "border-transparent bg-white/10 dark:bg-white/5 shadow-lg scale-[1.02]"
                                    : "border-transparent bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10"
                            )}
                        >
                            {/* Color Pattern Background (Subtle) */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 transition-opacity duration-500 bg-gradient-to-r",
                                g.gradient,
                                isSelected ? "opacity-10" : "group-hover:opacity-5"
                            )} />

                            <div className="flex items-center gap-5 relative z-10 w-full">
                                {/* Color Circle Indicator */}
                                <div className={cn(
                                    "w-12 h-12 rounded-full shrink-0 bg-gradient-to-br shadow-inner transition-transform duration-300",
                                    g.gradient,
                                    isSelected ? "scale-110 ring-2 ring-white/20" : "opacity-80 grayscale-[0.3]"
                                )} />

                                <div className="text-left">
                                    <div className="font-bold text-lg leading-none mb-1">{g.label}</div>
                                    <div className="text-xs text-muted-foreground leading-tight opacity-80 pr-2">{g.desc}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </LiquidWizardCard>
    );
}
