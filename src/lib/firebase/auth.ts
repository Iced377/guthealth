
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
