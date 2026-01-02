import { App, getApp, getApps, initializeApp, cert } from 'firebase-admin/app';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export function getAdminApp(): App {
  if (getApps().length === 0) {
    if (serviceAccount) {
      return initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } else {
      // Fallback to Application Default Credentials (ADC)or just Project ID
      // This allows initialization even without explicit credentials if only Project ID is needed for certain ops,
      // or if using ADC without service account file.
      return initializeApp({
        projectId,
      });
    }
  }

  return getApp();
}
