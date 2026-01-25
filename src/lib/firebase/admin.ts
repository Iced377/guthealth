import { App, getApp, getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export function getAdminApp(): App {
  if (getApps().length === 0) {
    if (serviceAccount) {
      console.log("✅ [Admin SDK] Initializing with Service Account Key...");
      try {
        return initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
      } catch (e) {
        console.error("❌ [Admin SDK] Cert initialization failed:", e);
        throw e;
      }
    } else {
      console.warn("⚠️ [Admin SDK] No Service Account Key found. Falling back to default credentials (ADC).");
      return initializeApp({
        projectId,
      });
    }
  }

  return getApp();
}

export const adminApp = getAdminApp();


export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
