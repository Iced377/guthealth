'use client';

import { SetupData } from '../SetupWizard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Target, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACTIVITY_MULTIPLIERS, GOAL_ADJUSTMENTS } from '@/lib/calculations';

interface GoalsStepProps {
    data: SetupData;
    updateData: (data: Partial<SetupData>) => void;
    onBack: () => void;
    onNext: () => void;
}

export default function GoalsStep({ data, updateData, onBack, onNext }: GoalsStepProps) {

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
        // { id: 'super_active', label: 'Super Active', desc: 'Physical job + training' }, // Hidden for now to simplify
    ];

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-xl border-none">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-2 bg-pink-100 rounded-lg">
                        <Target className="w-6 h-6 text-pink-600" />
                    </div>
                    Your Goals & Activity
                </CardTitle>
                <CardDescription>
                    Help us understand your lifestyle to tailor your nutrition targets.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                {/* Goals Selection */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-800">What is your primary goal?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {goals.map((g) => (
                            <div
                                key={g.id}
                                onClick={() => updateData({ goal: g.id as any })}
                                className={cn(
                                    "cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md",
                                    data.goal === g.id
                                        ? "border-pink-500 bg-pink-50 ring-1 ring-pink-500"
                                        : "border-gray-200 bg-white hover:border-pink-200"
                                )}
                            >
                                <div className="text-3xl mb-2">{g.icon}</div>
                                <div className="font-semibold text-gray-900">{g.label}</div>
                                <div className="text-xs text-gray-500 mt-1">{g.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Level */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-600" />
                        How active are you?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activities.map((a) => (
                            <div
                                key={a.id}
                                onClick={() => updateData({ activityLevel: a.id as any })}
                                className={cn(
                                    "cursor-pointer border rounded-lg p-3 transition-colors flex flex-col",
                                    data.activityLevel === a.id
                                        ? "border-indigo-500 bg-indigo-50 relative"
                                        : "border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                <span className="font-medium text-gray-900">{a.label}</span>
                                <span className="text-xs text-gray-500">{a.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={onBack} className="w-1/3">
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                    </Button>
                    <Button className="w-2/3 bg-indigo-600 hover:bg-indigo-700" onClick={onNext}>
                        Next Step <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
