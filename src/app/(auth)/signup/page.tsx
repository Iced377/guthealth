
'use client'; // Ensure this is at the top

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import SignUpForm from '@/components/auth/SignUpForm';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import VideoAvatar from '@/components/auth/VideoAvatar';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';

export default function SignUpPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-full flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center items-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/')}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Go home"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <VideoAvatar />
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
          Join or Sign In to GutCheck
        </h1>
        <p className="mt-2 text-muted-foreground">
          Start logging your meals and understanding your body better.
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {showEmailAuth ? (
            <>
              <SignUpForm />
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  className="text-muted-foreground"
                  onClick={() => setShowEmailAuth(false)}
                >
                  Back to Google signup
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col space-y-4">
              <GoogleAuthButton text="Sign In / Sign Up with Google" />
              <div className="text-center">
                <Button
                  variant="link"
                  className="text-sm text-muted-foreground font-normal"
                  onClick={() => setShowEmailAuth(true)}
                >
                  Continue with email
                </Button>
              </div>
            </div>
          )}        </div>
      </div>
    </div>
  );
}
