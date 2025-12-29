import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            return new NextResponse('Missing ID Token', { status: 400 });
        }

        const adminApp = getAdminApp();
        const adminAuth = getAuth(adminApp);

        // Verify the ID token first
        await adminAuth.verifyIdToken(idToken);

        // Create session cookie (expires in 5 days)
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const response = new NextResponse(JSON.stringify({ status: 'success' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

        response.cookies.set('__session', sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax', // Critical for OAuth redirects to work
        });

        return response;
    } catch (error) {
        console.error('Error creating session cookie:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
