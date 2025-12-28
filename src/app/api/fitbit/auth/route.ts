
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET() {
  const clientId = process.env.FITBIT_CLIENT_ID;
  const redirectUri = process.env.FITBIT_REDIRECT_URI;
  const scopes = process.env.FITBIT_SCOPES;

  if (!clientId || !redirectUri || !scopes) {
    return new NextResponse('Fitbit environment variables are not configured.', { status: 500 });
  }

  // Generate a secure random string for the state parameter to prevent CSRF attacks
  const state = randomBytes(16).toString('hex');
  const codeVerifier = randomBytes(32).toString('hex'); // For PKCE
  
  // Store verifier in a secure, httpOnly cookie to retrieve in the callback
  const codeVerifierCookie = `fitbit_code_verifier=${codeVerifier}; HttpOnly; Path=/; Max-Age=300; SameSite=Lax; Secure`;

  const fitbitAuthUrl = new URL('https://www.fitbit.com/oauth2/authorize');
  fitbitAuthUrl.searchParams.append('response_type', 'code');
  fitbitAuthUrl.searchParams.append('client_id', clientId);
  fitbitAuthUrl.searchParams.append('redirect_uri', redirectUri);
  fitbitAuthUrl.searchParams.append('scope', scopes);
  fitbitAuthUrl.searchParams.append('state', state); // Although we are not using it, it's good practice
  fitbitAuthUrl.searchParams.append('code_challenge', codeVerifier); // PKCE
  fitbitAuthUrl.searchParams.append('code_challenge_method', 'plain'); // PKCE

  const response = NextResponse.redirect(fitbitAuthUrl.toString());
  response.headers.set('Set-Cookie', codeVerifierCookie);
  
  return response;
}
