'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  getRedirectResult,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [redirectLoading, setRedirectLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Handle Redirect Result (Google Sign In)
  // Handle Redirect Result (Google Sign In)
  const hasCheckedRedirect = useRef(false);

  useEffect(() => {
    if (hasCheckedRedirect.current) return;
    hasCheckedRedirect.current = true;

    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        return getRedirectResult(auth);
      })
      .then((result) => {
        if (result?.user) {
          console.log("Redirect login successful:", result.user.email);
          toast({ title: 'Welcome back!', description: `Signed in as ${result.user.displayName}` });
          // setUser(result.user); // Handled by onAuthStateChanged
        } else {
          console.log("No redirect result found.");
        }
      })
      .catch((error) => {
        console.error('Error during redirect result or persistence setting:', error);
        toast({
          title: 'Sign-in Error',
          description: error.message || 'Could not complete sign-in process.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setRedirectLoading(false);
      });
  }, [toast]);

  // Handle Auth State Changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token }),
          });

          // Fetch User Profile
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              setUserProfile(userDoc.data() as UserProfile);
            } else {
              setUserProfile(null);
            }
          } catch (err) {
            console.error("Error fetching user profile:", err);
          }

        } catch (error) {
          console.error('Failed to sync session cookie:', error);
        }
      } else {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUserProfile(null);
      }

      setUser(firebaseUser);
      setAuthLoading(false);
      setProfileLoading(false);
    });

    return () => unsub();
  }, []);

  // Handle Setup Redirection
  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (user) {
      // If user is logged in, check if they have completed setup
      const hasCompletedSetup = userProfile?.profile?.hasCompletedSetup;

      // If not completed setup, and not on setup page, redirect
      if (!hasCompletedSetup && pathname !== '/setup') {
        // Allow admin or some specific paths? maybe not.
        // But let's verify we are not in a loop.
        console.log("Redirecting to setup...");
        router.push('/setup');
      }
    }
  }, [user, userProfile, authLoading, profileLoading, pathname, router]);

  const loading = redirectLoading || authLoading; // || profileLoading; // Profile loading shouldn't block entire app render, but maybe for this check it should?
  // Let's keep initial loading blocking to prevent flash of content before redirect

  const value = useMemo(() => ({ user, loading, userProfile }), [user, loading, userProfile]);

  if (loading || (user && profileLoading)) { // Block until profile is checked
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading GutCheck...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
