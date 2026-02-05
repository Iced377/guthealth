'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signInWithApple } from '@/lib/firebase/auth';
import { Apple, Loader2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AppleAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    fullWidth?: boolean;
}

export default function AppleAuthButton({
    text = 'Continue with Apple',
    variant = 'default',
    fullWidth = true,
    className,
    ...props
}: AppleAuthButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'delayed' | 'timed_out'>('idle');
    const { toast } = useToast();
    const timersRef = useRef<NodeJS.Timeout[]>([]);

    const clearTimers = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    };

    const handleAppleLogin = async () => {
        if (status !== 'idle' && status !== 'timed_out') return;

        setStatus('loading');
        clearTimers();

        // 1. Setup Timers
        const delayedTimer = setTimeout(() => {
            setStatus(prev => prev === 'loading' ? 'delayed' : prev);
        }, 2500); // 2.5s

        const timeoutTimer = setTimeout(() => {
            setStatus('timed_out');
        }, 10000); // 10s

        timersRef.current.push(delayedTimer, timeoutTimer);

        try {
            await signInWithApple();
            // Success handled by AuthProvider
        } catch (error: any) {
            console.error("Apple login error (UI caught):", error);

            // If it was a clean cancel, just reset
            if (error.message === 'CANCELED') {
                setStatus('idle');
                clearTimers();
                return;
            }
            // If it was a network error, tell user
            if (error.message === 'NETWORK_ERROR') {
                toast({
                    title: 'Network Error',
                    description: 'Please check your internet connection and try again.',
                    variant: 'destructive',
                });
                setStatus('idle');
                clearTimers();
                return;
            }
            // If manual timeout wasn't reached yet but we got a real error, reset
            if (error.message !== 'TIMEOUT') {
                toast({
                    title: 'Sign in failed',
                    description: error.message || 'Could not sign in with Apple.',
                    variant: 'destructive',
                });
                setStatus('idle');
                clearTimers();
            }
        }
    };

    const handleWebFallback = async () => {
        clearTimers();
        setStatus('loading'); // Show spinner again while redirecting
        try {
            const { signInWithAppleWeb } = await import('@/lib/firebase/auth');
            await signInWithAppleWeb();
        } catch (e) {
            console.error("Web fallback failed", e);
            setStatus('idle');
        }
    };

    const handleCancel = () => {
        clearTimers();
        setStatus('idle');
        // Ideally we would also abort the native call, but we can't really "cancel" a promise externally easily without an AbortController which the plugin doesn't support.
        // But our local `inFlight` guard in auth.ts prevents a new one from starting immediately and colliding weirdly.
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimers();
    }, []);

    // Render Logic
    if (status === 'timed_out') {
        return (
            <motion.div className={cn(fullWidth ? "w-full" : "w-auto", "flex flex-col gap-2")}>
                <Button
                    variant="outline"
                    className="w-full h-11 border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800"
                    onClick={handleWebFallback}
                    type="button"
                >
                    <Globe className="mr-2 h-4 w-4" />
                    Try Web Sign-In Instead
                </Button>
                <Button
                    variant="ghost"
                    className="w-full h-8 text-xs text-muted-foreground"
                    onClick={handleCancel}
                >
                    Cancel
                </Button>
            </motion.div>
        );
    }

    if (status === 'delayed') {
        return (
            <motion.div className={cn(fullWidth ? "w-full" : "w-auto", "flex flex-col gap-2")}>
                {/* Main Button is still "Loading" but text changes? Or we show a helper below? */}
                {/* User asked for: Display "Taking longer..." + "Continue with Web" button */}
                <div className="flex bg-amber-50 border border-amber-200 rounded-lg p-2 items-center justify-between animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                        <span className="text-xs text-amber-800 font-medium">Taking longer than usual...</span>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-amber-900 hover:bg-amber-100"
                        onClick={handleWebFallback}
                    >
                        Use Web
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    className="w-full h-8 text-xs text-muted-foreground"
                    onClick={handleCancel}
                >
                    Cancel
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={cn(fullWidth ? "w-full" : "w-auto")}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 8 }}
        >
            <Button
                variant={variant}
                className={cn("w-full rounded-full h-11 bg-black text-white hover:bg-black/90", className)}
                onClick={handleAppleLogin}
                disabled={status === 'loading'}
                type="button"
                {...props}
            >
                {status === 'loading' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Apple className="mr-2 h-4 w-4 fill-current pb-[2px]" />
                )}
                {text}
            </Button>
        </motion.div>
    );
}
