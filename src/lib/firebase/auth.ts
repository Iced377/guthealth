
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
  sendPasswordResetEmail, // Added import
} from 'firebase/auth';
// Native Imports
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { auth } from '@/config/firebase';
import { signInWithCredential } from 'firebase/auth';

// Sign In with Google
// Sign In with Google
export const signInWithGoogle = async () => {
  // Check if running on native iOS/Android
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      // Native Flow: Use System Dialog (No Safari Redirect)
      // This requires @codetrix-studio/capacitor-google-auth
      const user = await GoogleAuth.signIn();

      // Create Firebase credential from the native token
      const credential = GoogleAuthProvider.credential(user.authentication.idToken);
      return signInWithCredential(auth, credential);
    } catch (error) {
      console.error("Native Google Sign-In Error", error);
      // Fallback or re-throw
      return error as AuthError;
    }
  } else {
    // Web Flow: Use Standard Popup
    // This preserves the existing web behavior perfectly.
    const provider = new GoogleAuthProvider();
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
