'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface ExpertAssignmentPromptProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    onLater: () => void;
}

export default function ExpertAssignmentPrompt({ isOpen, onClose, onAccept, onLater }: ExpertAssignmentPromptProps) {
    const { isDarkMode } = useTheme();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={cn(
                "sm:max-w-[425px] rounded-[2.5rem] border-none p-0 overflow-hidden",
                isDarkMode ? "bg-zinc-900" : "bg-white"
            )}>
                <div className="relative p-8 text-center space-y-6">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
                    
                    {/* Icon */}
                    <div className="relative mx-auto w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-bounce-subtle">
                        <Users className="w-10 h-10" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#ffc01f] flex items-center justify-center text-black">
                            <Sparkles className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <DialogTitle className="text-2xl font-black tracking-tight leading-tight">
                            Personalize Your Journey
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                            Would you like to assign a dedicated GutCheck Expert to review your data and provide personalized guidance?
                        </DialogDescription>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Button 
                            onClick={onAccept}
                            className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-lg shadow-emerald-500/20 group"
                        >
                            Find My Expert
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={onLater}
                            className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground font-medium"
                        >
                            Maybe Later
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
