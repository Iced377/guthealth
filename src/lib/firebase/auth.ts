
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type UserCredential,
  type AuthError,
  signInWithRedirect,
  browserLocalPersistence,
  setPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithCustomToken,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';


// Sign In with Google - Platform-Aware Flow
export const signInWithGoogle = async () => {
  console.log("Starting signInWithGoogle...");

  if (Capacitor.isNativePlatform()) {
    // Native iOS/Android flow - uses Firebase Authentication plugin
    console.log("Native platform detected, using Firebase Authentication plugin");

    try {
      const result = await FirebaseAuthentication.signInWithGoogle();

      // CRITICAL: After plugin sign-in, get the FIREBASE ID token (not Google token)
      // The plugin has already exchanged the Google token for a Firebase session
      const firebaseToken = await FirebaseAuthentication.getIdToken();
      console.log("[Auth] Firebase idToken obtained after Google sign-in");

      // Exchange the Firebase ID token for a custom token
      console.log("[Auth] Exchanging Firebase token with JS SDK...");

      const response = await fetch('/api/auth/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: firebaseToken.token }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const { customToken } = await response.json();

      // Sign in with custom token - this sets auth.currentUser!
      const userCredential = await signInWithCustomToken(auth, customToken);

      console.log("[Auth] Google Sign-In SUCCESS! Firebase JS SDK synced:", userCredential.user.uid);
      return userCredential;
    } catch (error) {
      console.error("Native Google Sign-In error:", error);
      throw error;
    }
  } else {
    // Web flow - uses popup (existing behavior)
    console.log("Web platform detected, using signInWithPopup");
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }
};

// Sign In with Apple - Platform-Aware Flow
import { OAuthProvider } from 'firebase/auth';

let isAppleAuthInFlight = false;

export const signInWithAppleWeb = async () => {
  console.log("[Auth] Starting signInWithAppleWeb (Redirect flow)...");
  const provider = new OAuthProvider('apple.com');
  // Use redirect for mobile web resilience
  return signInWithRedirect(auth, provider);
};

export const signInWithApple = async () => {
  console.log("[Auth] native_start: signInWithApple called");

  if (isAppleAuthInFlight) {
    console.warn("[Auth] signInWithApple already in flight. Ignoring double-tap.");
    throw new Error('AUTH_IN_FLIGHT');
  }

  isAppleAuthInFlight = true;

  try {
    if (Capacitor.isNativePlatform()) {
      console.log("[Auth] Native platform detected. Using Firebase Authentication plugin.");

      const result = await FirebaseAuthentication.signInWithApple();
      console.log("[Auth] Plugin result:", JSON.stringify(result, null, 2));

      // CRITICAL: After plugin sign-in, get the FIREBASE ID token (not Apple token)
      // The plugin has already exchanged the Apple token for a Firebase session
      const firebaseToken = await FirebaseAuthentication.getIdToken();
      console.log("[Auth] Firebase idToken obtained");

      // Exchange the Firebase ID token for a custom token that the JS SDK can use
      try {
        console.log("[Auth] Exchanging Firebase token with JS SDK...");

        const response = await fetch('/api/auth/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: firebaseToken.token }),
        });

        if (!response.ok) {
          throw new Error(`Token exchange failed: ${response.statusText}`);
        }

        const { customToken } = await response.json();

        // Sign in with custom token - this sets auth.currentUser!
        const userCredential = await signInWithCustomToken(auth, customToken);

        console.log("[Auth] SUCCESS! Firebase JS SDK synced:", userCredential.user.uid);
        return userCredential;
      } catch (error: any) {
        console.error("[Auth] Token exchange failed:", error);

        // Fallback: return plugin user even if exchange fails
        return {
          user: result.user,
          providerId: 'apple.com',
          operationType: 'signIn',
        } as any;
      }

    } else {
      // Web flow (Desktop/Dev)
      console.log("[Auth] Web platform detected. Using popup for desktop/dev.");
      const provider = new OAuthProvider('apple.com');
      return signInWithPopup(auth, provider);
    }
  } catch (error: any) {
    console.error("Apple Sign-In Error:", error);
    console.error("Error keys:", Object.keys(error));
    console.error("Error code:", error?.code);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);

    // Force error object construction for empty errors
    const errorObj = {
      code: error?.code || 'unknown',
      message: error?.message || 'Empty error object',
      originalError: error,
      stack: error?.stack,
    };
    console.error("Detailed error:", errorObj);

    throw error;
  } finally {
    isAppleAuthInFlight = false;
  }
};

// Sign Up with Email and Password
export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential | AuthError> => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    return error as AuthError;
  }
};

// Sign Out
export const signOutUser = async (): Promise<void | AuthError> => {
  try {
    await signOut(auth);
  } catch (error) {
    return error as AuthError;
  }
};

// Sign In with Email and Password
import { signInWithEmailAndPassword } from 'firebase/auth';

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential | AuthError> => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    return error as AuthError;
  }
};

// Send Password Reset Email
export const sendPasswordReset = async (email: string): Promise<void | AuthError> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    return error as AuthError;
  }
};

// Delete User Account & Data
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc, collection, getDocs, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const deleteUserAccount = async (uid: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    // 0. Audit Log (Pre-Deletion)
    try {
      if (user.email) {
        await addDoc(collection(db, 'audit_deleted_users'), {
          uid: uid,
          email: user.email,
          deletedAt: serverTimestamp(),
          reason: 'user_requested'
        });
      }
    } catch (auditError) {
      console.error("Failed to write audit log:", auditError);
      // Continue with deletion even if audit fails? 
      // safer to continue so user is not blocked from deleting.
    }

    // 1. Delete Firestore User Data
    // Note: This does NOT automatically delete subcollections (like timelineEntries).
    // For a production app with large data, use Cloud Functions.
    // Here we try to clean up 'timelineEntries' reasonably.
    const timelineRef = collection(db, 'users', uid, 'timelineEntries');
    const timelineSnapshot = await getDocs(timelineRef);

    // Batch delete subcollection (up to 500)
    if (!timelineSnapshot.empty) {
      const batch = writeBatch(db);
      timelineSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Delete Main User Doc
    await deleteDoc(doc(db, 'users', uid));

    // 2. Delete Auth User
    await deleteUser(user);

  } catch (error) {
    console.error("Error deleting user account:", error);
    throw error;
  }
};
