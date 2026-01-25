'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import IntroVideo from './steps/IntroVideo';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types';
import { calculateBMR, calculateTDEE, calculateNutritionTargets, ACTIVITY_MULTIPLIERS, GOAL_ADJUSTMENTS } from '@/lib/calculations';
import BasicInfo from './steps/BasicInfo';
import GoalSelectionStep from './steps/GoalSelectionStep';
import ActivityLevelStep from './steps/ActivityLevelStep';
import SymptomsStep from './steps/SymptomsStep';
import DietStep from './steps/DietStep';
import ResultsStep from './steps/ResultsStep';
import OutroVideo from './steps/OutroVideo';
import LiquidChartCarousel from '@/components/trends/LiquidChartCarousel';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export interface SetupData {
    gender: 'male' | 'female';
    dob: string;
    height: number;
    weight: number;
    activityLevel: keyof typeof ACTIVITY_MULTIPLIERS;
    goal: keyof typeof GOAL_ADJUSTMENTS;
    symptoms: string[];
    dietaryPreferences?: string[];
}

type WizardMode = 'intro' | 'wizard' | 'results';

export default function SetupWizard() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { isDarkMode } = useTheme();

    const [mode, setMode] = useState<WizardMode>('intro');
    const [carouselIndex, setCarouselIndex] = useState(0);

    const [formData, setFormData] = useState<SetupData>({
        gender: 'female',
        dob: '',
        height: 170,
        weight: 70,
        activityLevel: 'sedentary',
        goal: 'maintain',
        symptoms: [],
        dietaryPreferences: []
    });

    const [results, setResults] = useState<{ bmr: number, tdee: number, macros: { protein: number, carbs: number, fats: number } } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const updateFormData = (data: Partial<SetupData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const calculateResults = () => {
        if (!formData.dob || !formData.height || !formData.weight) return;

        const age = new Date().getFullYear() - new Date(formData.dob).getFullYear();
        const bmr = calculateBMR(formData.weight, formData.height, age, formData.gender);
        const tdee = calculateTDEE(bmr, formData.activityLevel);
        const nutrition = calculateNutritionTargets(
            bmr,
            tdee,
            formData.weight,
            formData.goal,
            formData.symptoms
        );

        const calculatedResults = {
            bmr,
            tdee,
            ...nutrition
        };

        setResults(calculatedResults);
        return calculatedResults;
    };

    // Navigation Handlers
    const handleNext = () => {
        // 0: BasicInfo, 1: GoalSelection, 2: ActivityLevel, 3: Diet, 4: Symptoms
        if (carouselIndex < 4) {
            setCarouselIndex(prev => prev + 1);
        } else {
            // Finished wizard steps
            calculateResults();
            setMode('results');
        }
    };

    const handleBack = () => {
        if (carouselIndex > 0) {
            setCarouselIndex(prev => prev - 1);
        }
    };

    const handleFinish = async () => {
        if (!user || !results) return;
        setIsSaving(true);

        try {
            const profileData: UserProfile['profile'] = {
                hasCompletedSetup: true,
                gender: formData.gender,
                height: formData.height,
                weight: formData.weight,
                activityLevel: formData.activityLevel,
                goal: formData.goal,
                symptoms: formData.symptoms,
                dietaryPreferences: formData.dietaryPreferences,
                bmr: results.bmr,
                tdee: results.tdee,
                macros: results.macros
            };

            await updateDoc(doc(db, 'users', user.uid), {
                dateOfBirth: formData.dob,
                profile: profileData
            });

            // Show Outro Video instead of jumping directly
            setMode('outro');

        } catch (error) {
            console.error("Error saving profile:", error);
            toast({
                title: "Error",
                description: "Failed to save profile. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOutroComplete = () => {
        toast({
            title: "Profile Setup Complete!",
            description: "Your nutrition plan has been personalized.",
        });
        router.refresh();
        router.push('/');
    };

    // Ripple Effect Logic
    const [ripple, setRipple] = useState<{ x: number, y: number } | null>(null);
    const [prevGender, setPrevGender] = useState<SetupData['gender']>(formData.gender);

    const handleGenderSelect = (gender: 'male' | 'female', x: number, y: number) => {
        setPrevGender(formData.gender);
        setRipple({ x, y });
        updateFormData({ gender });
    };

    // Background State Logic
    const isIntro = mode === 'intro';
    const isResults = mode === 'results';
    const isOutro = mode === 'outro';

    const blueGradient = "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20";
    const pinkGradient = "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20";

    return (
        <div className="fixed inset-0 min-h-screen flex flex-col items-center justify-center overflow-hidden">

            {/* Background Layers */}

            {/* Intro Neutral Layer */}
            <div className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out bg-zinc-50 dark:bg-[#0a0a0a]",
                isIntro ? "opacity-100" : "opacity-0"
            )} />

            {/* Wizard/Results/Outro Gender Layers (Unified) */}
            {/* We want the Gender Gradient to persist through Results and Outro now, instead of forcing purple */}
            {!isIntro && (
                <>
                    {/* Base Layer */}
                    <div className={cn(
                        "absolute inset-0 z-0",
                        prevGender === 'male' ? blueGradient : pinkGradient
                    )} />

                    {/* Ripple Layer */}
                    <motion.div
                        key={formData.gender}
                        className={cn(
                            "absolute inset-0 z-10",
                            formData.gender === 'male' ? blueGradient : pinkGradient
                        )}
                        initial={{ clipPath: ripple ? `circle(0% at ${ripple.x}px ${ripple.y}px)` : "circle(150% at 50% 50%)" }}
                        animate={{ clipPath: `circle(150% at ${ripple ? ripple.x : 0}px ${ripple ? ripple.y : 0}px)` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                </>
            )}

            {/* Content Container (z-30 to sit above backgrounds) */}
            <div className="relative z-30 w-full h-full flex flex-col items-center justify-center">

                {/* Minimal Header Nav */}
                <AnimatePresence>
                    {mode === 'wizard' && carouselIndex > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="fixed top-12 left-6 z-50"
                        >
                            <button
                                onClick={handleBack}
                                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-foreground hover:bg-white/20 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 -ml-0.5"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {mode === 'intro' && (
                        <IntroVideo key="intro" onComplete={() => setMode('wizard')} />
                    )}

                    {mode === 'wizard' && (
                        <motion.div
                            key="wizard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="w-full h-full flex flex-col items-center justify-center"
                        >
                            {/* Carousel Container - Full Screen/immersive */}
                            <div className="w-full h-full relative">
                                <LiquidChartCarousel
                                    currentIndex={carouselIndex}
                                    onIndexChange={setCarouselIndex}
                                    showDots={true}
                                    className="h-full w-full"
                                >
                                    <div className="h-full w-full flex items-center justify-center">
                                        <BasicInfo
                                            data={formData}
                                            updateData={updateFormData}
                                            onNext={handleNext}
                                            onGenderSelect={handleGenderSelect}
                                        />
                                    </div>
                                    <div className="h-full w-full flex items-center justify-center">
                                        <GoalSelectionStep data={formData} updateData={updateFormData} onNext={handleNext} />
                                    </div>
                                    <div className="h-full w-full flex items-center justify-center">
                                        <ActivityLevelStep data={formData} updateData={updateFormData} onNext={handleNext} />
                                    </div>
                                    <div className="h-full w-full flex items-center justify-center">
                                        <DietStep data={formData} updateData={updateFormData} onNext={handleNext} />
                                    </div>
                                    <div className="h-full w-full flex items-center justify-center">
                                        <SymptomsStep data={formData} updateData={updateFormData} onNext={handleNext} />
                                    </div>
                                </LiquidChartCarousel>
                            </div>
                        </motion.div>
                    )}


                    {mode === 'results' && results && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            className="w-full h-full flex items-center justify-center p-0"
                        >
                            <ResultsStep
                                results={results}
                                onBack={() => { setMode('wizard'); setCarouselIndex(4); }}
                                onFinish={handleFinish}
                                isSaving={isSaving}
                            />
                        </motion.div>
                    )}

                    {mode === 'outro' && (
                        <OutroVideo key="outro" onComplete={handleOutroComplete} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Import at top (Wait, I need to add the import separately or rely on user to do it? 
// The specialized tool does replacements. I need to make sure I add the import line.)
// I'll assume I need to do a separate edit for the import if it's far away.
// Actually, I can replace the whole functional body or use multi-edit. 
// Given the complexity, I'm replacing the bottom half. I need to add the import.

