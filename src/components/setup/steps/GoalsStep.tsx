'use client';

import { SetupData } from '../SetupWizard';
import { Target, Activity, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface GoalsStepProps {
    data: SetupData;
    updateData: (data: Partial<SetupData>) => void;
    onBack: () => void;
    onNext: () => void;
}

export default function GoalsStep({ data, updateData, onNext }: GoalsStepProps) {
    const { isDarkMode } = useTheme();

    const goals = [
        {
            id: 'lose_fat',
            label: 'Lose Fat',
            desc: 'Modest deficit to shred body fat while maintaining muscle.',
            icon: '📉'
        },
        {
            id: 'maintain',
            label: 'Maintain Weight',
            desc: 'Focus on performance, gut health, and body recomposition.',
            icon: '⚖️'
        },
        {
            id: 'gain_muscle',
            label: 'Gain Lean Mass',
            desc: 'Surplus calories to fuel hypertrophy and strength gains.',
            icon: '💪'
        },
    ];

    const activities = [
        { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise' },
        { id: 'lightly_active', label: 'Lightly Active', desc: '1-3 days/week exercise' },
        { id: 'moderately_active', label: 'Moderately Active', desc: '3-5 days/week exercise' },
        { id: 'very_active', label: 'Very Active', desc: '6-7 days/week hard exercise' },
    ];

    const handleGoalSelect = (goalId: string) => {
        updateData({ goal: goalId as any });
        if (data.activityLevel) {
            setTimeout(() => onNext(), 300); // Slight delay for visual feedback
        }
    };

    const handleActivitySelect = (activityId: string) => {
        updateData({ activityLevel: activityId as any });
        if (data.goal) {
            setTimeout(() => onNext(), 300);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center p-6 h-full space-y-8">
            <div className="flex flex-col items-center text-center space-y-4 shrink-0">
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-500 shadow-lg",
                    isDarkMode ? "bg-white/5 text-muted-foreground" : "bg-white/80 text-[#2aac6b] shadow-[#2aac6b]/20"
                )}>
                    <Target className="w-10 h-10" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold font-headline mb-2">Goals & Activity</h2>
                    <p className="text-sm text-muted-foreground max-w-[250px] mx-auto opacity-70">
                        Tailor your nutrition targets to your lifestyle.
                    </p>
                </div>
            </div>

            <div className="w-full space-y-8">
                {/* Goals Selection */}
                <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider opacity-60 pl-1">Primary Goal</h3>
                    <div className="space-y-3">
                        {goals.map((g) => (
                            <div
                                key={g.id}
                                onClick={() => handleGoalSelect(g.id)}
                                className={cn(
                                    "cursor-pointer rounded-2xl p-4 transition-all duration-200 border-2",
                                    data.goal === g.id
                                        ? "border-[#2aac6b] bg-[#2aac6b]/10 shadow-[0_0_15px_rgba(42,172,107,0.2)] scale-[1.02]"
                                        : "border-transparent bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl shrink-0">{g.icon}</div>
                                    <div className="text-left">
                                        <div className="font-bold text-foreground">{g.label}</div>
                                        <div className="text-xs text-muted-foreground leading-tight mt-0.5 opacity-80">{g.desc}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Level */}
                <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider opacity-60 pl-1 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Activity Level
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {activities.map((a) => (
                            <div
                                key={a.id}
                                onClick={() => handleActivitySelect(a.id)}
                                className={cn(
                                    "cursor-pointer rounded-xl p-3 transition-all duration-200 border-2 flex flex-col items-center text-center justify-center min-h-[80px]",
                                    data.activityLevel === a.id
                                        ? "border-[#2aac6b] bg-[#2aac6b]/10 shadow-sm scale-[1.02]"
                                        : "border-transparent bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10"
                                )}
                            >
                                <span className="font-bold text-sm text-foreground">{a.label}</span>
                                <span className="text-[10px] text-muted-foreground leading-tight mt-1 opacity-80">{a.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 right-6 flex items-center gap-1 text-muted-foreground/40 text-xs font-medium animate-pulse pointer-events-none">
                Swipe <ChevronRight className="w-3 h-3" />
            </div>
        </div>
    );
}
