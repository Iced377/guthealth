
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getAdminApp } from '@/lib/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET() {
  const clientId = process.env.FITBIT_CLIENT_ID;
  const redirectUri = process.env.FITBIT_REDIRECT_URI;
  const scopes = process.env.FITBIT_SCOPES;

  if (!clientId || !redirectUri || !scopes) {
    return new NextResponse('Fitbit environment variables are not configured.', { status: 500 });
  }

  // Generate a secure random string for the state parameter
  const state = randomBytes(16).toString('hex');
  const codeVerifier = randomBytes(32).toString('hex'); // For PKCE

  // Store state and verifier in Firestore to retrieve in the callback
  // We use Firestore because Firebase Hosting strips custom cookies (only __session is allowed)
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    await db.collection('fitbit_auth_states').doc(state).set({
      codeVerifier,
      createdAt: new Date(),
    });

  } catch (error) {
    console.error("Error storing Fitbit auth state:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  const fitbitAuthUrl = new URL('https://www.fitbit.com/oauth2/authorize');
  fitbitAuthUrl.searchParams.append('response_type', 'code');
  fitbitAuthUrl.searchParams.append('client_id', clientId);
  fitbitAuthUrl.searchParams.append('redirect_uri', redirectUri);
  fitbitAuthUrl.searchParams.append('scope', scopes);
  fitbitAuthUrl.searchParams.append('state', state);
  fitbitAuthUrl.searchParams.append('code_challenge', codeVerifier); // PKCE
  fitbitAuthUrl.searchParams.append('code_challenge_method', 'plain'); // PKCE

  return NextResponse.redirect(fitbitAuthUrl.toString());
}
