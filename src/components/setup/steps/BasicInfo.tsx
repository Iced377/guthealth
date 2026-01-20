'use client';

import { SetupData } from '../SetupWizard';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import IOSWheelPicker from '@/components/ui/IOSWheelPicker';
import LiquidWizardCard from '../LiquidWizardCard';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


interface BasicInfoProps {
    data: SetupData;
    updateData: (data: Partial<SetupData>) => void;
    onNext: () => void;
    onGenderSelect?: (gender: 'male' | 'female', x: number, y: number) => void;
}

export default function BasicInfo({ data, updateData, onGenderSelect }: BasicInfoProps) {
    const { isDarkMode } = useTheme();

    // ... (DOB Logic remains same)

    const handleGenderClick = (e: React.MouseEvent, gender: 'male' | 'female') => {
        // Prevent default creates issues with RadioGroup sometimes, but here we just want coords
        // We let the RadioGroup handle the actual value change via state or trigger it manually
        if (data.gender !== gender && onGenderSelect) {
            onGenderSelect(gender, e.clientX, e.clientY);
        } else {
            updateData({ gender });
        }
    };

    // Parse DOB...
    const getDob = () => {
        if (!data.dob) return { month: 0, day: 1, year: 2000 };
        const [y, m, d] = data.dob.split('-').map(Number);
        return { month: (m || 1) - 1, day: d || 1, year: y || 2000 };
    };
    const { month, day, year } = getDob();
    const updateDob = (type: 'month' | 'day' | 'year', val: number) => {
        let newMonth = month, newDay = day, newYear = year;
        if (type === 'month') newMonth = val;
        if (type === 'day') newDay = val;
        if (type === 'year') newYear = val;
        const mStr = String(newMonth + 1).padStart(2, '0');
        const dStr = String(newDay).padStart(2, '0');
        updateData({ dob: `${newYear}-${mStr}-${dStr}` });
    };

    const MONTHS = [
        { label: 'Jan', value: 0 }, { label: 'Feb', value: 1 }, { label: 'Mar', value: 2 },
        { label: 'Apr', value: 3 }, { label: 'May', value: 4 }, { label: 'Jun', value: 5 },
        { label: 'Jul', value: 6 }, { label: 'Aug', value: 7 }, { label: 'Sep', value: 8 },
        { label: 'Oct', value: 9 }, { label: 'Nov', value: 10 }, { label: 'Dec', value: 11 }
    ];

    return (
        <LiquidWizardCard
            title="Base Profile"
            description="Let's start with your metabolic baseline."
        // icon removed
        >
            {/* Form Fields */}
            <div className="w-full space-y-2 pb-14">
                {/* Gender */}
                <div className="grid grid-cols-2 gap-8 px-4">
                    <div className="flex flex-col items-center">
                        <div
                            className="relative"
                            onClick={(e) => handleGenderClick(e, 'male')}
                        >
                            <Label
                                className={cn(
                                    "cursor-pointer transition-all hover:scale-105 active:scale-95 flex flex-col items-center",
                                    data.gender === 'male' ? "opacity-100" : "opacity-50 hover:opacity-100"
                                )}
                            >
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors shadow-lg",
                                    data.gender === 'male' ? "bg-blue-600 text-white" : "bg-blue-100 dark:bg-blue-900/20 text-blue-400"
                                )}>
                                    <div className={cn("w-2 h-2 rounded-full bg-current", data.gender === 'male' ? "opacity-100" : "opacity-0")} />
                                </div>
                                <span className={cn("block text-center font-bold text-base", data.gender === 'male' ? "text-blue-500" : "text-muted-foreground")}>Male</span>
                            </Label>
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div
                            className="relative"
                            onClick={(e) => handleGenderClick(e, 'female')}
                        >
                            <Label
                                className={cn(
                                    "cursor-pointer transition-all hover:scale-105 active:scale-95 flex flex-col items-center",
                                    data.gender === 'female' ? "opacity-100" : "opacity-50 hover:opacity-100"
                                )}
                            >
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors shadow-lg",
                                    data.gender === 'female' ? "bg-pink-600 text-white" : "bg-pink-100 dark:bg-pink-900/20 text-pink-400"
                                )}>
                                    <div className={cn("w-2 h-2 rounded-full bg-current", data.gender === 'female' ? "opacity-100" : "opacity-0")} />
                                </div>
                                <span className={cn("block text-center font-bold text-base", data.gender === 'female' ? "text-pink-500" : "text-muted-foreground")}>Female</span>
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Inputs Grid */}
                <div className="grid grid-cols-2 gap-0 w-full px-4 pt-2">
                    <div className="flex flex-col items-center">
                        <IOSWheelPicker
                            label="cm"
                            items={Array.from({ length: 151 }, (_, i) => ({ label: `${i + 100}`, value: i + 100 }))}
                            selectedValue={data.height || 170}
                            onValueChange={(val) => updateData({ height: val })}
                            className="h-28 w-full"
                        />
                        <Label htmlFor="height" className="text-[9px] font-bold uppercase tracking-widest opacity-30 mt-1">Height</Label>
                    </div>
                    <div className="flex flex-col items-center">
                        <IOSWheelPicker
                            label="kg"
                            items={Array.from({ length: 171 }, (_, i) => ({ label: `${i + 30}`, value: i + 30 }))}
                            selectedValue={data.weight || 70}
                            onValueChange={(val) => updateData({ weight: val })}
                            className="h-28 w-full"
                        />
                        <Label htmlFor="weight" className="text-[9px] font-bold uppercase tracking-widest opacity-30 mt-1">Weight</Label>
                    </div>
                </div>

                {/* Date of Birth Picker */}
                <div className="space-y-2 pt-2 border-t border-dashed border-white/10 mx-4">
                    <Label className="text-[9px] font-bold uppercase tracking-widest opacity-30 block text-center mb-1">Date of Birth</Label>
                    <div className="flex justify-center gap-0 w-full">
                        {/* Month */}
                        <div className="w-[90px]">
                            <IOSWheelPicker
                                items={MONTHS}
                                selectedValue={month}
                                onValueChange={(val) => updateDob('month', val)}
                                className="h-28 w-full"
                            />
                        </div>
                        {/* Day */}
                        <div className="w-[70px]">
                            <IOSWheelPicker
                                items={Array.from({ length: 31 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))}
                                selectedValue={day}
                                onValueChange={(val) => updateDob('day', val)}
                                className="h-28 w-full"
                            />
                        </div>
                        {/* Year */}
                        <div className="w-[90px]">
                            <IOSWheelPicker
                                items={Array.from({ length: 100 }, (_, i) => {
                                    const y = new Date().getFullYear() - i;
                                    return { label: `${y}`, value: y };
                                })}
                                selectedValue={year}
                                onValueChange={(val) => updateDob('year', val)}
                                className="h-28 w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

        </LiquidWizardCard>
    );
}
