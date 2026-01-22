
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
import { auth } from '@/config/firebase';
import { Capacitor } from '@capacitor/core';


// Sign In with Google - Web-Based Flow (Works on all platforms)
export const signInWithGoogle = async () => {
  console.log("Starting signInWithGoogle (web-based)...");
  const provider = new GoogleAuthProvider();

  // Use redirect on native platforms (iOS/Android) to avoid popup blocking
  if (Capacitor.isNativePlatform()) {
    console.log("Native platform detected, using signInWithRedirect");
    return signInWithRedirect(auth, provider);
  } else {
    console.log("Web platform detected, using signInWithPopup");
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
