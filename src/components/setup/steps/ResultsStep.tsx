'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Flame, Droplet, Wheat, Dumbbell, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResultsStepProps {
    results: {
        bmr: number;
        tdee: number;
        macros: {
            protein: number;
            carbs: number;
            fats: number;
        };
    };
    onBack: () => void;
    onFinish: () => void;
    isSaving: boolean;
}

export default function ResultsStep({ results, onBack, onFinish, isSaving }: ResultsStepProps) {

    // Animation for macro bars
    const barVariants = {
        hidden: { width: 0 },
        visible: (custom: number) => ({
            width: `${custom}%`,
            transition: { duration: 1, delay: 0.2 }
        })
    };

    const totalMacros = results.macros.protein + results.macros.carbs + results.macros.fats;

    // Macros percentages calculation
    const pCal = results.macros.protein * 4;
    const cCal = results.macros.carbs * 4;
    const fCal = results.macros.fats * 9;
    const totalCal = pCal + cCal + fCal; // close to targetCalories

    const pPct = Math.round((pCal / totalCal) * 100);
    const cPct = Math.round((cCal / totalCal) * 100);
    const fPct = Math.round((fCal / totalCal) * 100);

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-2xl border-none bg-white/95 backdrop-blur">
            <CardHeader className="text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-[#2aac6b]/10 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <CheckCircle2 className="w-8 h-8 text-[#2aac6b]" />
                </motion.div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Your Personalized Plan
                </CardTitle>
                <CardDescription className="text-lg">
                    Based on your data, here is your daily nutritional roadmap.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                {/* Calories Highlight */}
                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="text-gray-500 uppercase tracking-widest text-xs font-semibold mb-1">Daily Target</h3>
                    <div className="text-5xl font-black text-gray-900 flex items-center justify-center gap-2">
                        <Flame className="w-8 h-8 text-orange-500" />
                        {results.tdee}
                        <span className="text-xl text-gray-400 font-medium self-end mb-2">kcal</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">BMR: {results.bmr} kcal • Maintenance</p>
                </div>

                {/* Macros Breakdown */}
                <div className="space-y-6">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Macro Targets</h4>

                    {/* Protein */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2 font-medium text-gray-700">
                                <Dumbbell className="w-4 h-4 text-blue-500" /> Protein
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-bold text-gray-900">{results.macros.protein}g</span>
                                <span className="text-xs text-gray-500 ml-2">({pPct}%)</span>
                            </div>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                custom={pPct}
                                variants={barVariants}
                                initial="hidden"
                                animate="visible"
                                className="h-full bg-blue-500 rounded-full"
                            />
                        </div>
                        <p className="text-xs text-gray-500">Essential for muscle repair and satiety.</p>
                    </div>

                    {/* Carbs */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2 font-medium text-gray-700">
                                <Wheat className="w-4 h-4 text-amber-500" /> Carbs
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-bold text-gray-900">{results.macros.carbs}g</span>
                                <span className="text-xs text-gray-500 ml-2">({cPct}%)</span>
                            </div>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                custom={cPct}
                                variants={barVariants}
                                initial="hidden"
                                animate="visible"
                                className="h-full bg-amber-500 rounded-full"
                            />
                        </div>
                        <p className="text-xs text-gray-500">Primary energy source for activity.</p>
                    </div>

                    {/* Fats */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2 font-medium text-gray-700">
                                <Droplet className="w-4 h-4 text-rose-500" /> Fats
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-bold text-gray-900">{results.macros.fats}g</span>
                                <span className="text-xs text-gray-500 ml-2">({fPct}%)</span>
                            </div>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                custom={fPct}
                                variants={barVariants}
                                initial="hidden"
                                animate="visible"
                                className="h-full bg-rose-500 rounded-full"
                            />
                        </div>
                        <p className="text-xs text-gray-500">Vital for hormone health.</p>
                    </div>
                </div>

                <div className="flex gap-4 pt-6">
                    <Button variant="ghost" onClick={onBack} disabled={isSaving} className="w-1/3">
                        Adjust Inputs
                    </Button>
                    <Button
                        className="w-2/3 text-lg"
                        onClick={onFinish}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>Saving...</>
                        ) : (
                            <>Start My Journey <ArrowRight className="ml-2 w-5 h-5" /></>
                        )}
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
