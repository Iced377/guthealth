'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signInWithApple } from '@/lib/firebase/auth';
import { Apple, Loader2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

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
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleAppleLogin = async () => {
        if (isLoading) return;

        setIsLoading(true);

        try {
            await signInWithApple();
            // On web, AuthProvider's onAuthStateChanged handles navigation
            // On native, AuthProvider also handles the sync and LoginPage handles the redirect
        } catch (error: any) {
            console.error("Apple login error:", error);
            // Generic error toast
            toast({
                title: 'Sign in failed',
                description: 'Could not sign in with Apple. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

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
                disabled={isLoading}
                type="button"
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Apple className="mr-2 h-4 w-4 fill-current pb-[2px]" />
                )}
                {text}
            </Button>
        </motion.div>
    );
}
