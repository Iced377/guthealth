
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
  console.log("Starting signInWithGoogle...");
  const isNative = Capacitor.isNativePlatform();
  console.log("Platform check:", isNative ? "Native" : "Web");

  if (isNative) {
    try {
      console.log("Initializing GoogleAuth plugin (Safety check)...");
      await GoogleAuth.initialize();

      console.log("Calling GoogleAuth.signIn()...");
      const user = await GoogleAuth.signIn();
      console.log("GoogleAuth.signIn() success:", user ? "User returned" : "No user");

      if (!user) throw new Error("GoogleAuth.signIn() returned null");

      const idToken = user.authentication.idToken;
      console.log("Got idToken:", idToken ? "Yes (hidden)" : "No");

      const credential = GoogleAuthProvider.credential(idToken);
      console.log("Signing into Firebase...");
      return await signInWithCredential(auth, credential);
    } catch (error) {
      console.error("Critical Native Google Sign-In Error:", error);
      // Re-throw to allow component to handle UI
      throw error;
    }
  } else {
    // Web Flow: Use Standard Popup
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
