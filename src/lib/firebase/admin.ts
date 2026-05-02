import { App, getApp, getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

// Fix escaped newlines that are common when injecting JSON into environment variables
if (serviceAccount && serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export function getAdminApp(): App {
  console.log(`[Admin SDK] Attempting to initialize for project: ${projectId || 'default'}`);
  
  if (getApps().length === 0) {
    if (serviceAccount) {
      console.log("✅ [Admin SDK] Service Account detected");
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
        console.warn("⚠️ [Admin SDK] Falling back to default credentials (ADC) due to cert failure.");
        const app = initializeApp({ projectId });
        const firestore = getFirestore(app);
        firestore.settings({ ignoreUndefinedProperties: true });
        return app;
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
