
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import fetch from 'node-fetch';

// This function handles the callback from Fitbit after the user authorizes the app.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // For security, you should validate this state

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get('fitbit_code_verifier')?.value;
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!code) {
    return new NextResponse('Authorization code not found in request.', { status: 400 });
  }
   if (!codeVerifier) {
    return new NextResponse('Code verifier not found. Authorization flow may have expired.', { status: 400 });
  }
  if (!sessionCookie) {
    return new NextResponse('User session not found. Please log in first.', { status: 401 });
  }
  
  // Verify the session cookie and get the UID
  let uid: string;
  try {
    const adminApp = getAdminApp();
    const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    uid = decodedToken.uid;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return NextResponse.redirect(new URL('/login?error=session_expired', req.url));
  }


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
     // Clear the verifier cookie
     const clearCookie = `fitbit_code_verifier=; HttpOnly; Path=/; Max-Age=0;`;
     // The response is already sent, but we can try to set it for the next one.
     // In a real app, middleware might be better for this.
     // For now, we rely on the short Max-Age of the cookie.
  }
}
