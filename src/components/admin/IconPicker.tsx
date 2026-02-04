'use client';

import React from 'react';
import {
    Rocket, Flag, Trophy, Users, Heart, Star, Lock,
    CheckCircle2, Zap, Target, Crown, Medal,
    TrendingUp, Award, Sparkles, Globe, Smartphone,
    Bug, Construction, Search, AlertTriangle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Map of icon names to components
export const ICON_MAP: Record<string, React.ElementType> = {
    'Rocket': Rocket,
    'Flag': Flag,
    'Trophy': Trophy,
    'Users': Users,
    'Heart': Heart,
    'Star': Star,
    'Lock': Lock, // Keep Lock available manually? Mostly used for status state.
    'CheckCircle2': CheckCircle2,
    'Zap': Zap,
    'Target': Target,
    'Crown': Crown,
    'Medal': Medal,
    'TrendingUp': TrendingUp,
    'Award': Award,
    'Sparkles': Sparkles,
    'Globe': Globe,
    'Smartphone': Smartphone,
    'Bug': Bug,
    'Construction': Construction,
    'Search': Search,
    'AlertTriangle': AlertTriangle,
    'Info': Info
};

interface IconPickerProps {
    value: string;
    onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const SelectedIcon = ICON_MAP[value] || Sparkles;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 h-10">
                    <SelectedIcon className="w-5 h-5 text-muted-foreground" />
                    <span>{value || "Select Icon"}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-2" align="start">
                <div className="grid grid-cols-5 gap-2">
                    {Object.entries(ICON_MAP).map(([name, Icon]) => (
                        <Button
                            key={name}
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-10 w-10 rounded-lg hover:bg-muted",
                                value === name && "bg-primary/20 text-primary hover:bg-primary/30"
                            )}
                            onClick={() => onChange(name)}
                            title={name}
                        >
                            <Icon className="w-5 h-5" />
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
