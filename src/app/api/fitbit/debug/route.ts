
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check - Read clientTimezone
        const { idToken, clientTimezone } = await req.json();
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

        const timezone = profileData?.user?.timezone;

        // Timezone Check
        const isTimezoneMismatch = clientTimezone && timezone && clientTimezone !== timezone;
        const timezoneWarning = isTimezoneMismatch
            ? `MISMATCH: App is in ${clientTimezone} but Fitbit is in ${timezone}. This causes data delays.`
            : undefined;

        // 4. Calculate "Today"
        const now = Date.now();
        const userLocalTime = new Date(now + offsetMillis);
        const todayStr = userLocalTime.toISOString().split('T')[0];

        // 5. DEBUG: Fetch Today's Data & Devices
        const [activityRes, weightRes, devicesRes] = await Promise.all([
            fetch(`https://api.fitbit.com/1/user/-/activities/date/${todayStr}.json`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }),
            fetch(`https://api.fitbit.com/1/user/-/body/log/weight/date/${todayStr}.json`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }),
            fetch('https://api.fitbit.com/1/user/-/devices.json', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
        ]);

        const activityJson = await activityRes.json();
        const weightJson = await weightRes.json();
        let devicesJson = null;
        if (devicesRes.ok) {
            devicesJson = await devicesRes.json();
        } else {
            devicesJson = { error: "Failed to fetch devices (check scope)", status: devicesRes.status };
        }

        return NextResponse.json({
            debugInfo: {
                serverTime: new Date().toISOString(),
                userOffsetHours: offsetMillis / 3600000,
                calculatedToday: todayStr,
                clientTimezone: clientTimezone,
                fitbitTimezone: timezone || "Unknown",
                timezoneWarning: timezoneWarning,
                permissionsScope: fitbitData?.scope || fitbitData?.scopes,
                isUsingFallbackTimezone: offsetMillis === 0 && !profileData?.user
            },
            rawResponses: {
                activity: activityJson,
                weight: weightJson,
                devices: devicesJson,
                profile: {
                    offsetFromUTCMillis: profileData?.user?.offsetFromUTCMillis,
                    timezone: profileData?.user?.timezone
                } // Returning relevant profile parts
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
