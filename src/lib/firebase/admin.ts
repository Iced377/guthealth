
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

let adminApp: admin.app.App;

export function getAdminApp(): admin.app.App {
  if (!admin.apps.length) {
    if (serviceAccount) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback to Application Default Credentials (ADC) for production environments (like Firebase Functions/Cloud Run)
      adminApp = admin.initializeApp();
    }
  } else {
    adminApp = admin.app();
  }
  return adminApp;
}
