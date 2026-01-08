'use client';

import { SetupData } from '../SetupWizard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Stethoscope } from 'lucide-react';
import { COMMON_SYMPTOMS } from '@/types'; // Use centralized symptom list

interface SymptomsStepProps {
    data: SetupData;
    updateData: (data: Partial<SetupData>) => void;
    onBack: () => void;
    onNext: () => void;
}

export default function SymptomsStep({ data, updateData, onBack, onNext }: SymptomsStepProps) {

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
        <Card className="w-full max-w-2xl mx-auto shadow-xl border-none">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-2 bg-[#2aac6b]/10 rounded-lg">
                        <Stethoscope className="w-6 h-6 text-[#2aac6b]" />
                    </div>
                    Symptom Control
                </CardTitle>
                <CardDescription>
                    Select any symptoms you want to manage. Your AI nutritionist will prioritize these.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {COMMON_SYMPTOMS.map((symptom) => {
                        const isSelected = data.symptoms.includes(symptom.id);
                        return (
                            <div
                                key={symptom.id}
                                className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${isSelected ? 'bg-[#2aac6b]/5 border-[#2aac6b]' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                                onClick={() => handleToggle(symptom.id)}
                            >
                                <Checkbox
                                    id={symptom.id}
                                    checked={isSelected}
                                    onCheckedChange={() => handleToggle(symptom.id)}
                                    className="mt-1 data-[state=checked]:bg-[#2aac6b] data-[state=checked]:border-[#2aac6b]"
                                />
                                <div className="space-y-1">
                                    <Label
                                        htmlFor={symptom.id}
                                        className="font-medium cursor-pointer"
                                    >
                                        {symptom.name}
                                    </Label>
                                    {/* We could add descriptions here if we had them in the type */}
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
                        Analyze & Calculate <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
