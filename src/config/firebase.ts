
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

let db: Firestore;
if (typeof window !== 'undefined') {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(),
    experimentalForceLongPolling: true, // Fix for iOS WebView transport errors
    ignoreUndefinedProperties: true, // Prevent crashes when saving optional fields (e.g. vitals)
  });
} else {
  // Use default settings for server-side rendering
  // (persistentLocalCache requires IndexedDB which is not available in Node)
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, auth, db, storage };
