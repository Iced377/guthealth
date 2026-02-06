import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * Token Exchange Endpoint
 * 
 * Exchanges a native Firebase ID token (from Capacitor plugin) for a custom token
 * that the Firebase JS SDK can use to authenticate.
 * 
 * This solves the dual SDK auth state problem where:
 * - Native SDK (plugin) has authenticated user
 * - JS SDK (web) doesn't know about the user
 */
export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: 'Missing idToken' },
                { status: 400 }
            );
        }

        // Verify the ID token from the plugin
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // Create a custom token for the JS SDK
        const customToken = await adminAuth.createCustomToken(decodedToken.uid);

        console.log('[Token Exchange] Successfully created custom token for user:', decodedToken.uid);

        return NextResponse.json({ customToken });
    } catch (error: any) {
        console.error('[Token Exchange] Error:', error);
        console.error('[Token Exchange] Error code:', error.code);
        console.error('[Token Exchange] Error message:', error.message);
        console.error('[Token Exchange] Full error:', JSON.stringify(error, null, 2));

        return NextResponse.json(
            { error: 'Invalid or expired token', details: error.message, code: error.code },
            { status: 401 }
        );
    }
}
