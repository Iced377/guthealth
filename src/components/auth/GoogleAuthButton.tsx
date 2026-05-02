'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { Chrome, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { motion } from 'framer-motion';

interface GoogleAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    fullWidth?: boolean;
}

export default function GoogleAuthButton({
    text = 'Continue with Google',
    variant = 'outline',
    fullWidth = true,
    className,
    ...props
}: GoogleAuthButtonProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();


    // We can use the global loading state if we suspect a redirect is happening, 
    // but for the button itself, local loading state is better for immediate feedback.

    const handleGoogleLogin = async () => {
        if (loading) return;

        setLoading(true);
        try {
            // signInWithGoogle handles the popup or redirect.
            // If it's a redirect (mobile), this promise might not resolve until page reload (handled by AuthProvider).
            // If it's a popup (desktop), it resolves with the user credential.
            await signInWithGoogle();

            // Success is implicitly handled by AuthProvider's onAuthStateChanged
        } catch (error: any) {
            console.error("Google login error:", error);

            // Handle the 'auth/popup-closed-by-user' error specifically if needed,
            // but usually just showing the message is enough or ignoring it.
            if (error?.code === 'auth/popup-closed-by-user') {
                toast({
                    title: 'Sign in cancelled',
                    description: 'You cancelled the Google sign in process.',
                    variant: 'default',
                });
            } else {
                let errorMessage = error?.message || 'Could not sign in with Google. Please try again.';
                
                // If it's a server-side error from our exchange endpoint
                if (error?.details || error?.error === 'Token exchange failed') {
                    errorMessage = error.details || error.message || errorMessage;
                }

                toast({
                    title: 'Login failed',
                    description: errorMessage,
                    variant: 'destructive',
                });
            }
            setLoading(false);
        }
        // Note: We don't indiscriminately set loading(false) here because if it's a redirect,
        // we want the button to stay loading until the page unloads.
        // However, since we can't easily detect "redirect initiated" vs "popup open",
        // we might stick to local loading state management or rely on a timeout fallback if needed.
        // For now, simpler is better: if it throws (popup closed/error), stop loading.
        // If it succeeds (popup), logic follows.
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
                className={cn("w-full rounded-full h-11", className)} // Added rounded-full and h-11 match tour style
                onClick={handleGoogleLogin}
                disabled={loading}
                type="button"
                {...props}
            >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Chrome className="mr-2 h-4 w-4" />
                )}
                {text}
            </Button>
        </motion.div>
    );
}
