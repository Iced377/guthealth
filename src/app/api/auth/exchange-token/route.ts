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
        console.error('[Token Exchange] Project ID:', adminAuth.app.options.projectId);
        
        // Return more detail to the client for debugging (remove this in final production)
        return NextResponse.json(
            { 
                error: 'Token exchange failed', 
                message: error.message, 
                code: error.code,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 401 }
        );
    }
}
