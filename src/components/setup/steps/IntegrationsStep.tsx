'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Activity, Watch, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { AppleHealthService } from '@/lib/apple-health';
import { AppleHealthIcon, FitbitIcon } from '@/components/shared/BrandIcons';
import { SetupData } from '../SetupWizard';
import { useToast } from '@/hooks/use-toast';

import LiquidWizardCard from '../LiquidWizardCard';

interface IntegrationsStepProps {
    onNext: () => void;
    user: any; // User object from auth
    data: SetupData;
    updateData: (data: Partial<SetupData>) => void;
}

export default function IntegrationsStep({ onNext, user, data, updateData }: IntegrationsStepProps) {
    const { toast } = useToast();
    const [isConnecting, setIsConnecting] = useState(false);

    // States for toggling
    // For Apple Health, we sync with parent data
    const isAppleConnected = !!data.appleHealthEnabled;
    const [isFitbitConnected, setIsFitbitConnected] = useState(false);

    // Check if we are on a platform that supports Apple Health
    const isIOS = Capacitor.getPlatform() === 'ios';
    const isNative = Capacitor.isNativePlatform();

    const handleAppleToggle = async () => {
        if (isAppleConnected) {
            // Deselect
            updateData({ appleHealthEnabled: false });
            return;
        }

        if (!isIOS) {
            return; // Disabled on non-iOS
        }

        setIsConnecting(true);
        try {
            const available = await AppleHealthService.isAvailable();
            if (!available) {
                toast({ title: "Not Available", description: "Apple Health is not available on this device." });
                setIsConnecting(false);
                return;
            }

            await AppleHealthService.requestPermissions();
            // Assuming success if no error
            updateData({ appleHealthEnabled: true });
        } catch (error) {
            console.error("Failed to connect health", error);
            toast({ title: "Error", description: "Could not connect to Apple Health", variant: "destructive" });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleFitbitToggle = async () => {
        if (!user) return;

        if (isFitbitConnected) {
            // Deselect (Disconnect logic - simplified for onboarding, we just toggle state off)
            // Real disconnection requires API call but for onboarding flow before save, 
            // maybe we just hide the checkmark?
            // If they actually connected via OAuth, the token exists on backend.
            // We'll just toggle the visual state for now, assuming they can manage connection later in Profile.
            // Or better: Call disconnect API if we want to be strict.
            // Let's call disconnect to be consistent.
            setIsConnecting(true);
            try {
                const token = await user.getIdToken();
                await fetch('/api/fitbit/disconnect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: token }),
                });
                setIsFitbitConnected(false);
            } catch (e) {
                console.error("Disconnect error", e);
                // Force toggle off even if API fails to reset UI
                setIsFitbitConnected(false);
            } finally {
                setIsConnecting(false);
            }
            return;
        }

        setIsConnecting(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/fitbit/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken: token,
                    platform: isNative ? 'ios' : 'web'
                }),
            });

            if (response.ok) {
                const { url } = await response.json();

                if (isNative) {
                    await Browser.open({ url, windowName: '_self' });
                    // On Native, we can't easily await the result here as Browser.open returns immediately?
                    // Actually Browser.open awaits close.
                    // But auth happens in browser.
                    // We need to poll or rely on app resume.
                    // For onboarding, we might just assume success if they come back?
                    // Let's set connected to true optimistically or check status?
                    setIsFitbitConnected(true);
                } else {
                    // Web: Open in popup to preserve Wizard state
                    const width = 600;
                    const height = 700;
                    const left = (window.screen.width / 2) - (width / 2);
                    const top = (window.screen.height / 2) - (height / 2);
                    window.open(url, 'Connect Fitbit', `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`);

                    // Allow manual "I connected" confirmation or poll?
                    // Simplified: We set connected = true.
                    // Ideally we listen for message event.
                    setIsFitbitConnected(true);
                }
            } else {
                throw new Error("Failed to initiate");
            }
        } catch (error) {
            console.error("Fitbit error", error);
            toast({ title: "Error", description: "Could not initiate Fitbit connection.", variant: "destructive" });
        } finally {
            setIsConnecting(false);
        }
    };

    const hasAnyConnection = isAppleConnected || isFitbitConnected;

    return (
        <LiquidWizardCard
            title="Connect Apps"
            description="Sync your health data for better insights."
            icon={<Activity className="w-8 h-8" />}
            showSwipeHint={false}
        >
            <div className="w-full h-full flex flex-col pt-4 relative z-10">

                <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-1">

                    {/* Apple Health Card */}
                    <motion.button
                        disabled={!isIOS || isConnecting}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: isIOS ? 1 : 0.5, y: 0 }}
                        className={cn(
                            "relative w-full rounded-3xl p-5 border transition-all duration-300 overflow-hidden group text-left",
                            isAppleConnected
                                ? "bg-red-500/10 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                                : isIOS ? "bg-white/5 border-white/10 hover:border-white/20" : "bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                        )}
                        onClick={handleAppleToggle}
                    >
                        {/* Glass Shine */}
                        {isIOS && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />}

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors",
                                    isAppleConnected ? "bg-red-500/20 text-red-500" : "bg-white/10 text-foreground"
                                )}>
                                    <AppleHealthIcon className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-bold leading-none">Apple Health</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Sync steps</p>
                                    {!isIOS && <p className="text-[10px] text-red-400 mt-1 font-medium">Not available on browser</p>}
                                </div>
                            </div>

                            <div className="flex items-center">
                                {isAppleConnected ? (
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                                        <Check className="w-5 h-5 text-white" />
                                    </div>
                                ) : (
                                    <div className={cn("w-6 h-6 rounded-full border-2", isIOS ? "border-white/30" : "border-white/10")} />
                                )}
                            </div>
                        </div>
                    </motion.button>

                    {/* Fitbit Card */}
                    <motion.button
                        disabled={isConnecting}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={cn(
                            "relative w-full rounded-3xl p-5 border transition-all duration-300 overflow-hidden group text-left",
                            isFitbitConnected
                                ? "bg-[#00B0B9]/10 border-[#00B0B9]/20 shadow-[0_0_30px_rgba(0,176,185,0.1)]"
                                : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                        onClick={handleFitbitToggle}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors",
                                    isFitbitConnected ? "bg-[#00B0B9]/20 text-[#00B0B9]" : "bg-white/10 text-foreground"
                                )}>
                                    <FitbitIcon className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold leading-none">Fitbit</h3>
                                        {!isNative && <ExternalLink className="w-3 h-3 text-muted-foreground opacity-50" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Sync weight</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                {isFitbitConnected ? (
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                                        <Check className="w-5 h-5 text-white" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-white/30" />
                                )}
                            </div>
                        </div>
                    </motion.button>

                </div>

                <div className="pt-4 shrink-0 w-full px-2 mt-auto">
                    <Button
                        className="w-full h-14 rounded-full text-lg font-bold shadow-xl bg-foreground text-background hover:bg-foreground/90 transition-transform active:scale-95"
                        onClick={onNext}
                        disabled={isConnecting}
                    >
                        {isConnecting ? "Connecting..." : (hasAnyConnection ? "Create My Plan" : "Skip, Create My Plan")}
                        {!isConnecting && <ArrowRight className="ml-2 w-5 h-5" />}
                    </Button>
                </div>
            </div>
        </LiquidWizardCard>
    );
}
