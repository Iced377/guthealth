
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            return new NextResponse('Missing ID Token', { status: 400 });
        }

        const adminApp = getAdminApp();
        const adminAuth = getAuth(adminApp);
        const db = getFirestore(adminApp);

        // Verify User
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Delete Fitbit Credentials
        const userDocRef = db.collection('users').doc(uid);
        const privateDataRef = userDocRef.collection('private').doc('fitbit');

        await privateDataRef.delete();

        return NextResponse.json({ success: true, message: 'Fitbit disconnected successfully' });

    } catch (error: any) {
        console.error('Error disconnecting Fitbit:', error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
