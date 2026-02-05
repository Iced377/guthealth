
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
      const credential = GoogleAuthProvider.credential(result.credential?.idToken);

      return signInWithCredential(auth, credential);
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

      // 10s Timeout Promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 10000);
      });

      // Native Auth Promise
      const nativeAuthPromise = async () => {
        try {
          const result = await FirebaseAuthentication.signInWithApple();
          return result;
        } catch (error: any) {
          // Check for native cancellation or network error specifically
          // The plugin might return different error structures, but usually message contains keywords
          const errMsg = error?.message || JSON.stringify(error);
          if (errMsg.toLowerCase().includes('canceled') || errMsg.toLowerCase().includes('cancelled')) {
            throw new Error('CANCELED');
          }
          if (errMsg.toLowerCase().includes('network')) {
            throw new Error('NETWORK_ERROR');
          }
          throw error;
        }
      };

      try {
        // Race!
        const result: any = await Promise.race([nativeAuthPromise(), timeoutPromise]);

        console.log("[Auth] native_success: Plugin returned credentials.");
        const credential = new OAuthProvider('apple.com').credential({
          idToken: result.credential?.idToken,
          accessToken: result.credential?.accessToken,
          rawNonce: result.credential?.nonce,
        });

        return await signInWithCredential(auth, credential);

      } catch (error: any) {
        if (error.message === 'TIMEOUT') {
          console.error("[Auth] native_timeout: Native sign-in timed out after 10s.");
          throw error; // UI will handle this by showing "Try web now"
        } else if (error.message === 'CANCELED') {
          console.log("[Auth] native_cancel: User canceled native sheet.");
          throw error; // UI should just stop loading
        } else if (error.message === 'NETWORK_ERROR') {
          console.error("[Auth] native_error: Network issue.");
          throw error;
        }

        console.error("[Auth] native_error: Generic failure.", error);
        throw error;
      }

    } else {
      // Web flow (Desktop/Dev)
      console.log("[Auth] Web platform detected. Using popup for desktop/dev.");
      const provider = new OAuthProvider('apple.com');
      return signInWithPopup(auth, provider);
    }
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
