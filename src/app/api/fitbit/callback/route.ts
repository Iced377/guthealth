
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase'; // Client SDK for user data (or can use admin SDK for consistency)
import { doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import fetch from 'node-fetch';

// This function handles the callback from Fitbit after the user authorizes the app.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // const cookieStore = await cookies();
  // const sessionCookie = cookieStore.get('__session')?.value;

  if (!code) {
    return new NextResponse('Authorization code not found in request.', { status: 400 });
  }

  if (!state) {
    return new NextResponse('State parameter not found.', { status: 400 });
  }

  // Retrieve code verifier and UID from Firestore using state
  let codeVerifier: string | undefined;
  let uid: string | undefined;

  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    const stateDocRef = adminDb.collection('fitbit_auth_states').doc(state);
    const stateDoc = await stateDocRef.get();

    if (stateDoc.exists) {
      const data = stateDoc.data();
      codeVerifier = data?.codeVerifier;
      uid = data?.uid;
      // Clean up the used state
      await stateDocRef.delete();
    }
  } catch (error) {
    console.error("Error retrieving Fitbit auth state:", error);
    return new NextResponse('Error validating auth state.', { status: 500 });
  }

  if (!codeVerifier || !uid) {
    return new NextResponse('Invalid state or code verifier. The authorization session may have expired.', { status: 400 });
  }

  // NOTE: We no longer depend on the session cookie here, because the `state` 
  // proves the user initiated this specific flow and we have their UID from step 1.



  const clientId = process.env.FITBIT_CLIENT_ID;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET;
  const redirectUri = process.env.FITBIT_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Fitbit server environment variables are not configured.');
    return new NextResponse('Server configuration error.', { status: 500 });
  }

  // --- Exchange Authorization Code for Access Token ---
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier, // Send the verifier for PKCE
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = (await tokenResponse.json()) as { errors?: { message?: string }[] };
      console.error('Fitbit token exchange failed:', errorBody);
      throw new Error(`Fitbit API error: ${errorBody.errors?.[0]?.message || 'Failed to get access token'}`);
    }

    const tokens = await tokenResponse.json() as { access_token: string; refresh_token: string; user_id: string; expires_in: number };

    // --- Securely store the tokens in Firestore, associated with the user ---
    const fitbitData = {
      fitbitUserId: tokens.user_id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date().getTime() + tokens.expires_in * 1000,
      scopes: process.env.FITBIT_SCOPES,
      lastUpdated: new Date(),
    };

    // Store it under a private subcollection for the user
    const userDocRef = doc(db, 'users', uid);
    const privateDataRef = doc(userDocRef, 'private', 'fitbit');
    await setDoc(privateDataRef, fitbitData, { merge: true });

    // Redirect user back to a success page or dashboard
    return NextResponse.redirect(new URL('/trends?fitbit=success', req.url));

  } catch (error) {
    console.error('Error during Fitbit callback processing:', error);
    return NextResponse.redirect(new URL('/trends?fitbit=error', req.url));
  } finally {
    // No clean up needed
  }
}
