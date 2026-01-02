
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const { idToken } = await req.json();
        if (!idToken) return new NextResponse('Missing ID Token', { status: 400 });

        const adminApp = getAdminApp();
        const adminAuth = getAuth(adminApp);
        const db = getFirestore(adminApp);

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Get Tokens
        const userDocRef = db.collection('users').doc(uid);
        const privateDataRef = userDocRef.collection('private').doc('fitbit');
        const docSnap = await privateDataRef.get();

        if (!docSnap.exists) return new NextResponse('No Fitbit data found', { status: 404 });
        const fitbitData = docSnap.data();
        const accessToken = fitbitData?.accessToken;

        if (!accessToken) return new NextResponse('No Access Token', { status: 400 });

        // 3. DEBUG: Fetch Profile for Timezone
        const profileRes = await fetch('https://api.fitbit.com/1/user/-/profile.json', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const profileData = await profileRes.json() as any;
        const offsetMillis = profileData?.user?.offsetFromUTCMillis || 0;

        // 4. Calculate "Today"
        const now = Date.now();
        const userLocalTime = new Date(now + offsetMillis);
        const todayStr = userLocalTime.toISOString().split('T')[0];

        // 5. DEBUG: Fetch Today's Data
        const [activityRes, weightRes] = await Promise.all([
            fetch(`https://api.fitbit.com/1/user/-/activities/date/${todayStr}.json`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }),
            fetch(`https://api.fitbit.com/1/user/-/body/log/weight/date/${todayStr}.json`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
        ]);

        const activityJson = await activityRes.json();
        const weightJson = await weightRes.json();

        return NextResponse.json({
            debugInfo: {
                serverTime: new Date().toISOString(),
                userOffsetHours: offsetMillis / 3600000,
                calculatedToday: todayStr,
                permissionsScope: fitbitData?.scope
            },
            rawResponses: {
                activity: activityJson,
                weight: weightJson
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
