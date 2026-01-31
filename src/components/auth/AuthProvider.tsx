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
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '@/types';
import { App } from '@capacitor/app';

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

// Component to provide authentication state
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



  // ... (existing imports)

  // Handle Auth State Changes
  // Handle Auth State Changes & Health Sync
  useEffect(() => {
    // Shared Sync Logic
    const syncHealthData = async (targetUser: User) => {
      try {
        const platform = Capacitor.getPlatform();
        if (platform === 'ios') {
          const userDocRef = doc(db, 'users', targetUser.uid);
          const userSnapshot = await getDoc(userDocRef);

          if (userSnapshot.exists()) {
            const data = userSnapshot.data() as UserProfile;
            if (data.profile?.appleHealthEnabled) {
              try {
                const { AppleHealthService } = await import('@/lib/apple-health');

                // Fetch last 30 days history in one go
                // This ensures we catch up any missing days
                const history = await AppleHealthService.getDailyStepsHistory(30);

                const batchPromises = Object.entries(history).map(async ([dateKey, steps]) => {
                  const syncDocId = `apple_health_${dateKey}`;
                  const entryDate = new Date(dateKey); // Local YYYY-MM-DD to date object (will be 00:00 local usually, or UTC 00:00 depending on browser? verifying...)
                  // Actually new Date('2023-01-01') is UTC. 
                  // But we want to store it effectively. Firestore timestamps are UTC.
                  // If we constructed dateKey as local YYYY-MM-DD, new Date(dateKey) might shift.
                  // Safest to parse manual:
                  const [y, m, d] = dateKey.split('-').map(Number);
                  const localDate = new Date(y, m - 1, d, 12, 0, 0); // Noon to avoid timezone edge cases

                  return setDoc(doc(db, 'users', targetUser.uid, 'timelineEntries', syncDocId), {
                    id: syncDocId,
                    timestamp: Timestamp.fromDate(localDate),
                    entryType: 'pedometer_data',
                    steps: steps,
                    distance: 0,
                    floorsAscended: 0,
                    activeEnergy: 0,
                    source: 'apple_health',
                    syncedAt: Timestamp.now()
                  }, { merge: true });
                });

                await Promise.all(batchPromises);
                console.log(`Health sync: synced ${Object.keys(history).length} days`);
              } catch (healthError) {
                console.error("Apple Health sync internal error:", healthError);
              }
            }
          }
        }
      } catch (e) {
        console.error("Error in syncHealthData:", e);
      }
    };

    // Listener for App Resume
    const setupAppListener = async () => {
      await App.addListener('resume', async () => {
        console.log('App resumed, refreshing session...');
        if (auth.currentUser) {
          try {
            await auth.currentUser.getIdToken(true);
            await syncHealthData(auth.currentUser);
          } catch (e) {
            console.error("Error refreshing token or syncing on resume", e);
          }
        }
      });
    };
    setupAppListener();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force token refresh on initial load/change too
          const token = await firebaseUser.getIdToken();
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token }),
          });

          // Trigger Health Sync on Load
          syncHealthData(firebaseUser).catch(err => console.error("Initial load sync failed", err));



          // Cleanup listener on unmount or user change (handled by effect cleanup?)
          // actually this is inside onAuthStateChanged... complex.
          // Better approach: store unsubscribe in a ref or manage it properly.
          // Since onAuthStateChanged can fire multiple times, we need to be careful not to leak listeners.
          // However, the cleanest way in this specific structure (without refactoring everything) 
          // might be to relying on the fact that we can't easily return a cleanup from inside the callback.

          // ALTERNATIVE: Move profile listening to a separate useEffect dependent on 'user' state. 
          // The current structure mixes auth state change (firebase) with profile fetching.
          // Let's refactor slightly to be safe: 
          // 1. set user in onAuthStateChanged.
          // 2. add a useEffect([user]) that sets up the onSnapshot.
          // This is cleaner and safer.

          // So here we just set user and AuthLoading. ProfileLoading will be handled by the new effect.


        } catch (error) {
          console.error('Failed to sync session cookie:', error);
        }
      } else {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUserProfile(null);
        setProfileLoading(false); // Only stop loading profile if no user
      }

      setUser(firebaseUser);
      setAuthLoading(false);
      // Do NOT set profileLoading(false) here if user exists.
      // The second useEffect [user] will handle profile fetching and setting it to false.
    });

    return () => {
      unsub();
      App.removeAllListeners();
    };
  }, []);

  // Separate Effect for Realtime Profile Data
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      // If auth is done but no user, profile loading is also done (null)
      if (!authLoading) setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const userDocRef = doc(db, 'users', user.uid);

    // Listen to changes (e.g. when SetupWizard completes)
    const unsubscribe = onSnapshot(userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setProfileLoading(false);
      },
      (err) => {
        console.error("Error in profile listener:", err);
        setProfileLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        {/* Custom Pulse Loader */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-[-20%] right-[-20%] h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-pulse-width" />
          {/* Rotating Orb */}
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          {/* Inner Glow */}
          <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl animate-pulse" />
        </div>

        <h3 className="text-lg font-headline font-bold mb-2 animate-pulse">Loading...</h3>
        <p className="text-sm text-muted-foreground max-w-[200px] text-center">
          Preparing your personalized health dashboard.
        </p>
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
