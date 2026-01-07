'use client';

import { SetupData } from '../SetupWizard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { ArrowRight, User } from 'lucide-react';

interface BasicInfoProps {
    data: SetupData;
    updateData: (data: Partial<SetupData>) => void;
    onNext: () => void;
}

export default function BasicInfo({ data, updateData, onNext }: BasicInfoProps) {

    const isValid = data.dob && data.height > 0 && data.weight > 0;

    return (
        <Card className="w-full max-w-lg mx-auto shadow-xl border-none">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    Base Profile
                </CardTitle>
                <CardDescription>
                    We need your anthropometric data to calculate your metabolic baseline accurately.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Gender */}
                <div className="space-y-3">
                    <Label className="text-base">Biological Gender</Label>
                    <RadioGroup
                        value={data.gender}
                        onValueChange={(val) => updateData({ gender: val as 'male' | 'female' })}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div>
                            <RadioGroupItem value="male" id="male" className="peer sr-only" />
                            <Label
                                htmlFor="male"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-indigo-600 [&:has([data-state=checked])]:border-indigo-600"
                            >
                                <span className="text-xl mb-1">👨</span>
                                Male
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="female" id="female" className="peer sr-only" />
                            <Label
                                htmlFor="female"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-indigo-600 [&:has([data-state=checked])]:border-indigo-600"
                            >
                                <span className="text-xl mb-1">👩</span>
                                Female
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* DOB */}
                <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                        id="dob"
                        type="date"
                        value={data.dob}
                        onChange={(e) => updateData({ dob: e.target.value })}
                        className="text-lg p-6 bg-gray-50/50"
                    />
                </div>

                {/* Height & Weight */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                            id="height"
                            type="number"
                            placeholder="175"
                            value={data.height}
                            onChange={(e) => updateData({ height: Number(e.target.value) })}
                            className="text-lg p-6 bg-gray-50/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                            id="weight"
                            type="number"
                            placeholder="70"
                            value={data.weight}
                            onChange={(e) => updateData({ weight: Number(e.target.value) })}
                            className="text-lg p-6 bg-gray-50/50"
                        />
                    </div>
                </div>

                <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6 mt-4"
                    onClick={onNext}
                    disabled={!isValid}
                >
                    Next Step <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

            </CardContent>
        </Card>
    );
}
