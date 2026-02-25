'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  getRedirectResult,
  browserLocalPersistence,
  setPersistence,
  signInWithCustomToken,
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { SplashScreen } from '@capacitor/splash-screen';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '@/types';
import { App } from '@capacitor/app';
import { writeIntegrationDebugFlag } from '@/lib/integration-monitoring';

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
  const [redirectLoading, setRedirectLoading] = useState(false); // Non-blocking now
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Handle Redirect Result (Google & Apple Sign In)
  const hasCheckedRedirect = useRef(false);

  useEffect(() => {
    if (hasCheckedRedirect.current) return;
    hasCheckedRedirect.current = true;

    // We don't block UI on this anymore
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Redirect login successful:", result.user.email);
          toast({ title: 'Welcome back!', description: `Signed in as ${result.user.displayName}` });
        }
      })
      .catch((error) => {
        console.error('Error during redirect result:', error);
      });
    // Persistence is handled automatically by Firebase config usually, 
    // or we can await it if strictly needed, but getting it out of the critical path helps TTI.
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

                // CRITICAL: Check availability first
                const available = await AppleHealthService.isAvailable();
                if (!available) {
                  console.log("[HealthSync] Apple Health not available on this device/platform");
                  return;
                }

                // Fetch history - the service itself now catches errors and returns {} safely
                // Throttle full history sync to once per day.
                const historyKey = `appleHealth.historySync.${targetUser.uid}`;
                let shouldSync = true;
                try {
                  const lastSync = localStorage.getItem(historyKey);
                  if (lastSync) {
                    const last = new Date(lastSync);
                    shouldSync = isNaN(last.getTime()) || (Date.now() - last.getTime()) > 24 * 60 * 60 * 1000;
                  }
                } catch {
                  // If storage is unavailable, proceed with sync.
                }

                if (!shouldSync) {
                  console.log("[HealthSync] History sync skipped (throttled).");
                  return;
                }

                console.log("[HealthSync] Fetching 30-day history...");
                const history = await AppleHealthService.getDailyStepsHistory(30);

                if (!history || Object.keys(history).length === 0) {
                  console.log("[HealthSync] No history returned (might be pending permission).");
                  return;
                }

                const batchPromises = Object.entries(history).map(async ([dateKey, steps]) => {
                  const syncDocId = `apple_health_${dateKey}`;
                  const [y, m, d] = dateKey.split('-').map(Number);
                  const localDate = new Date(y, m - 1, d, 12, 0, 0);

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

                try {
                  localStorage.setItem(historyKey, new Date().toISOString());
                } catch {
                  // No-op: storage might be unavailable
                }
                console.log(`Health sync: synced ${Object.keys(history).length} days`);
              } catch (healthError) {
                console.warn("[HealthSync] Sync suppressed safely:", healthError);
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

    // CRITICAL: Check Capacitor plugin auth state on mount
    // The plugin may have authenticated the user natively, but Firebase JS SDK doesn't know
    const checkPluginAuthState = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          console.log("[AuthProvider] Checking Capacitor plugin auth state...");
          const { user: pluginUser } = await FirebaseAuthentication.getCurrentUser();

          if (pluginUser && !auth.currentUser) {
            console.log("[AuthProvider] Found natively authenticated user:", pluginUser.uid);
            console.log("[AuthProvider] Exchanging token with Firebase JS SDK...");

            // Get ID token from plugin
            const { token: idToken } = await FirebaseAuthentication.getIdToken();

            try {
              // Exchange plugin token for custom token
              const response = await fetch('/api/auth/exchange-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
              });

              if (!response.ok) {
                throw new Error(`Token exchange failed: ${response.statusText}`);
              }

              const { customToken } = await response.json();

              // Sign in with custom token - this sets auth.currentUser!
              await signInWithCustomToken(auth, customToken);

              console.log("[AuthProvider] Successfully signed in with custom token");
              console.log("[AuthProvider] Firebase JS SDK now recognizes user:", (auth.currentUser as any)?.uid);

              // Sync session cookie for server-side auth
              await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
              });

              console.log("[AuthProvider] Session cookie synced");

              // onAuthStateChanged will fire automatically and set the user
            } catch (error) {
              console.error("[AuthProvider] Failed to exchange token:", error);
              setAuthLoading(false);
            }
          }
        } catch (error) {
          console.log("[AuthProvider] No plugin user found or error:", error);
        }
      }
    };

    checkPluginAuthState();

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
          const data = docSnap.data() as UserProfile;
          setUserProfile(data);
          writeIntegrationDebugFlag(!!data.integrationDebug?.appleHealth?.enabled);
        } else {
          setUserProfile(null);
          writeIntegrationDebugFlag(false);
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
      // CRITICAL: Only check setup status if profile has actually loaded
      // Otherwise we get a race condition where we redirect before profile loads
      if (!userProfile) {
        console.log("[AuthProvider] Waiting for profile to load before checking setup...");
        return; // Don't redirect yet, profile is still loading
      }

      // If user is logged in, check if they have completed setup
      const hasCompletedSetup = userProfile?.profile?.hasCompletedSetup === true;
      const profileMissing = !userProfile?.profile;

      const resolveDate = (value: any) => {
        if (!value) return null;
        if (value instanceof Date) return value;
        if (typeof value?.toDate === 'function') return value.toDate();
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const createdAt = resolveDate(userProfile?.createdAt) ||
        (user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : null);
      const accountAgeHours = createdAt ? (Date.now() - createdAt.getTime()) / 36e5 : null;
      const hasLegacySignals = Boolean(
        userProfile?.dateOfBirth ||
        (userProfile?.safeFoods?.length ?? 0) > 0 ||
        userProfile?.ramadanConfig
      );
      const shouldSkipSetup = profileMissing && (hasLegacySignals || (accountAgeHours !== null && accountAgeHours > 24));

      console.log("[AuthProvider] Setup check:", {
        hasCompletedSetup,
        userProfile: !!userProfile,
        profileKeys: userProfile ? Object.keys(userProfile) : [],
        pathname,
        uid: user.uid
      });

      if (shouldSkipSetup) {
        console.warn("[AuthProvider] Profile missing but skipping setup redirect (legacy user safeguard).", {
          hasLegacySignals,
          accountAgeHours
        });
        return;
      }

      // If not completed setup, and not on setup page, redirect
      if (!hasCompletedSetup && !shouldSkipSetup && pathname !== '/setup') {
        // Allow admin or some specific paths? maybe not.
        // But let's verify we are not in a loop.
        console.log("Redirecting to setup...");
        router.push('/setup');
      }
    }
  }, [user, userProfile, authLoading, profileLoading, pathname, router]);

  // HIDE SPLASH SCREEN WHEN READY
  useEffect(() => {
    if (!authLoading && !profileLoading) {
      SplashScreen.hide().catch((err: any) => console.warn("Splash hide error", err));
    }
  }, [authLoading, profileLoading]);

  const loading = authLoading; // Redirect check is now background only. Profile check handles itself logic below.
  // Let's keep initial loading blocking to prevent flash of content before redirect

  const value = useMemo(() => ({ user, loading, userProfile }), [user, loading, userProfile]);

  if (loading) { // Block until auth is checked
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
