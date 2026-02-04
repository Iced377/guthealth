
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

export const signInWithApple = async () => {
  console.log("Starting signInWithApple...");

  if (Capacitor.isNativePlatform()) {
    // Native iOS/Android flow
    console.log("Native platform detected, using Firebase Authentication plugin for Apple");

    try {
      const result = await FirebaseAuthentication.signInWithApple();
      const credential = new OAuthProvider('apple.com').credential({
        idToken: result.credential?.idToken,
        accessToken: result.credential?.accessToken, // Some versions might need rawNonce or similar, but typically idToken + nonce is enough. plugin handles it.
        rawNonce: result.credential?.nonce,
      });

      return signInWithCredential(auth, credential);
    } catch (error) {
      console.error("Native Apple Sign-In error:", error);
      throw error;
    }
  } else {
    // Web flow
    console.log("Web platform detected, using signInWithPopup for Apple");
    const provider = new OAuthProvider('apple.com');
    return signInWithPopup(auth, provider);
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
