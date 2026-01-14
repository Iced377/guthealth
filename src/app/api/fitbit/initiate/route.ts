import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        // Read body once
        const body = await req.json();
        const { idToken, platform } = body;

        if (!idToken) {
            return new NextResponse('Missing ID Token', { status: 400 });
        }

        const adminApp = getAdminApp();
        const adminAuth = getAuth(adminApp);
        const db = getFirestore(adminApp);

        // 1. Verify ID Token to identify the user
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Generate PKCE Verifier & Challenge
        const codeVerifier = crypto.randomBytes(32)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // 3. Generate Random State
        const state = crypto.randomBytes(16).toString('hex');

        // 4. Store State
        await db.collection('fitbit_auth_states').doc(state).set({
            uid,
            codeVerifier,
            createdAt: new Date(),
        });

        // 5. Construct Fitbit Authorization URL
        const clientId = process.env.FITBIT_CLIENT_ID;

        // Native Logic: Use custom scheme if platform is 'ios' or 'android'
        const isNative = platform === 'ios' || platform === 'android';
        const redirectUri = isNative
            ? 'gutcheck://callback'
            : process.env.FITBIT_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            const missing = [];
            if (!clientId) missing.push('FITBIT_CLIENT_ID');
            if (!redirectUri) missing.push('FITBIT_REDIRECT_URI');
            throw new Error(`Missing environment variables: ${missing.join(', ')}`);
        }

        const scope = 'activity nutrition weight profile';

        const url = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

        return NextResponse.json({ url });

    } catch (error: any) {
        console.error('Error initiating Fitbit flow:', error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
