'use client';

import { useState } from 'react';
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
import GoalsStep from './steps/GoalsStep';
import SymptomsStep from './steps/SymptomsStep';
import DietStep from './steps/DietStep';
import ResultsStep from './steps/ResultsStep';

type WizardStep = 'intro' | 'basic-info' | 'goals' | 'diet' | 'symptoms' | 'results';

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

export default function SetupWizard() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState<WizardStep>('intro');
    const [direction, setDirection] = useState(0); // For slide animations

    const [formData, setFormData] = useState<SetupData>({
        gender: 'female', // Default
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

    const nextStep = (next: WizardStep) => {
        setDirection(1);
        setCurrentStep(next);
    };

    const prevStep = (prev: WizardStep) => {
        setDirection(-1);
        setCurrentStep(prev);
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

            // Also save DOB to root user profile as originally designed
            await updateDoc(doc(db, 'users', user.uid), {
                dateOfBirth: formData.dob,
                profile: profileData
            });

            toast({
                title: "Profile Setup Complete!",
                description: "Your nutrition plan has been personalized.",
            });

            router.refresh();
            router.push('/');

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

    // Variants for slide animation
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95
        })
    };

    // Theme Logic (Only for Basic Info step)
    const getThemeGradient = () => {
        if (currentStep === 'basic-info') {
            if (formData.gender === 'male') return 'from-blue-100 to-sky-100';
            if (formData.gender === 'female') return 'from-pink-100 to-rose-100';
        }
        return 'from-indigo-50 to-purple-50'; // Default
    };

    // Progress Logic
    const steps: WizardStep[] = ['intro', 'basic-info', 'goals', 'diet', 'symptoms', 'results'];
    const currentStepIndex = steps.indexOf(currentStep);
    const progress = Math.min(100, Math.max(0, ((currentStepIndex) / (steps.length - 1)) * 100));

    return (
        <div className={`min-h-screen bg-gradient-to-br ${getThemeGradient()} transition-colors duration-700 ease-in-out flex flex-col items-center justify-center p-4 overflow-hidden`}>

            {/* Progress Bar */}
            {currentStep !== 'intro' && (
                <div className="absolute top-0 left-0 w-full h-2 bg-black/5 z-50">
                    <motion.div
                        className="h-full bg-primary/80"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>
            )}

            <div className="w-full max-w-4xl relative mt-8">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    {currentStep === 'intro' && (
                        <IntroVideo key="intro" onComplete={() => nextStep('basic-info')} />
                    )}

                    {currentStep === 'basic-info' && (
                        <motion.div
                            key="basic-info"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full"
                        >
                            <BasicInfo
                                data={formData}
                                updateData={updateFormData}
                                onNext={() => nextStep('goals')}
                            />
                        </motion.div>
                    )}

                    {currentStep === 'goals' && (
                        <motion.div
                            key="goals"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full"
                        >
                            <GoalsStep
                                data={formData}
                                updateData={updateFormData}
                                onBack={() => prevStep('basic-info')}
                                onNext={() => nextStep('diet')}
                            />
                        </motion.div>
                    )}

                    {currentStep === 'diet' && (
                        <motion.div
                            key="diet"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full"
                        >
                            <DietStep
                                data={formData}
                                updateData={updateFormData}
                                onBack={() => prevStep('goals')}
                                onNext={() => nextStep('symptoms')}
                            />
                        </motion.div>
                    )}

                    {currentStep === 'symptoms' && (
                        <motion.div
                            key="symptoms"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full"
                        >
                            <SymptomsStep
                                data={formData}
                                updateData={updateFormData}
                                onBack={() => prevStep('diet')}
                                onNext={() => {
                                    calculateResults();
                                    nextStep('results');
                                }}
                            />
                        </motion.div>
                    )}

                    {currentStep === 'results' && results && (
                        <motion.div
                            key="results"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full"
                        >
                            <ResultsStep
                                results={results}
                                onBack={() => prevStep('symptoms')}
                                onFinish={handleFinish}
                                isSaving={isSaving}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
