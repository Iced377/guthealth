import { App, getApp, getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

// Fix escaped newlines or spaces if they were mangled by environment variable injection
if (serviceAccount && serviceAccount.private_key) {
  let formatted = serviceAccount.private_key;
  formatted = formatted.replace(/\\n/g, '\n');
  formatted = formatted.replace(/-----BEGIN PRIVATE KEY-----/g, '-----BEGIN_PRIVATE_KEY-----');
  formatted = formatted.replace(/-----END PRIVATE KEY-----/g, '-----END_PRIVATE_KEY-----');
  formatted = formatted.replace(/[ \t]+/g, '\n');
  formatted = formatted.replace(/-----BEGIN_PRIVATE_KEY-----/g, '-----BEGIN PRIVATE KEY-----\n');
  formatted = formatted.replace(/-----END_PRIVATE_KEY-----/g, '\n-----END PRIVATE KEY-----\n');
  formatted = formatted.replace(/\n+/g, '\n');
  serviceAccount.private_key = formatted.trim();
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export function getAdminApp(): App {
  if (getApps().length === 0) {
    if (serviceAccount) {
      console.log("✅ [Admin SDK] Initializing with Service Account Key...");
      try {
        const app = initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
        const firestore = getFirestore(app);
        firestore.settings({ ignoreUndefinedProperties: true });
        return app;
      } catch (e) {
        console.error("❌ [Admin SDK] Cert initialization failed:", e);
        // If cert fails, maybe we shouldn't throw but try fallback? 
        // For now, let's allow it to throw if the explicit key failed.
        throw e;
      }
    } else {
      console.warn("⚠️ [Admin SDK] No Service Account Key found. Falling back to default credentials (ADC).");
      const app = initializeApp({
        projectId,
      });
      const firestore = getFirestore(app);
      firestore.settings({ ignoreUndefinedProperties: true });
      return app;
    }
  }

  return getApp();
}

export const adminApp = getAdminApp();


export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
