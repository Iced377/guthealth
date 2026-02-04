'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signInWithApple } from '@/lib/firebase/auth';
import { Apple, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AppleAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    fullWidth?: boolean;
}

export default function AppleAuthButton({
    text = 'Continue with Apple',
    variant = 'default', // Apple button is usually black (default)
    fullWidth = true,
    className,
    ...props
}: AppleAuthButtonProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleAppleLogin = async () => {
        if (loading) return;

        setLoading(true);
        try {
            await signInWithApple();
            // Success is implicitly handled by AuthProvider's onAuthStateChanged
        } catch (error: any) {
            console.error("Apple login error:", error);

            if (error?.code === 'auth/popup-closed-by-user') {
                toast({
                    title: 'Sign in cancelled',
                    description: 'You cancelled the Apple sign in process.',
                    variant: 'default',
                });
            } else {
                toast({
                    title: 'Login failed',
                    description: error?.message || 'Could not sign in with Apple. Please try again.',
                    variant: 'destructive',
                });
            }
            setLoading(false);
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
                disabled={loading}
                type="button"
                {...props}
            >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Apple className="mr-2 h-4 w-4 fill-current pb-[2px]" />
                )}
                {text}
            </Button>
        </motion.div>
    );
}
