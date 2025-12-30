
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            return new NextResponse('Missing ID Token', { status: 400 });
        }

        const adminApp = getAdminApp();
        const adminAuth = getAuth(adminApp);
        const db = getFirestore(adminApp);

        // 1. Verify ID Token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Get Fitbit Credentials
        const userDocRef = db.collection('users').doc(uid);
        const privateDataRef = userDocRef.collection('private').doc('fitbit');
        const privateDataSnap = await privateDataRef.get();

        if (!privateDataSnap.exists) {
            return new NextResponse('Fitbit not connected', { status: 404 });
        }

        let fitbitData = privateDataSnap.data();
        if (!fitbitData || !fitbitData.accessToken) {
            return new NextResponse('Invalid Fitbit credentials', { status: 400 });
        }

        let accessToken = fitbitData.accessToken;
        const refreshToken = fitbitData.refreshToken;
        const expiresAt = fitbitData.expiresAt;

        // 3. Refresh Token if needed (buffer of 5 minutes)
        if (Date.now() > expiresAt - 5 * 60 * 1000) {
            console.log("Fitbit token expired, refreshing...");
            const clientId = process.env.FITBIT_CLIENT_ID;
            const clientSecret = process.env.FITBIT_CLIENT_SECRET;
            const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

            const refreshResponse = await fetch('https://api.fitbit.com/oauth2/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
            });

            if (!refreshResponse.ok) {
                console.error("Failed to refresh Fitbit token", await refreshResponse.text());
                return new NextResponse('Failed to refresh Fitbit token', { status: 401 });
            }

            const newTokens = await refreshResponse.json() as any;

            // Update Firestore
            accessToken = newTokens.access_token;
            fitbitData = {
                ...fitbitData,
                accessToken: newTokens.access_token,
                refreshToken: newTokens.refresh_token,
                expiresAt: Date.now() + newTokens.expires_in * 1000,
                lastUpdated: new Date()
            };
            await privateDataRef.set(fitbitData, { merge: true });
            console.log("Fitbit token refreshed.");
        }

        // 4. Fetch Data (Today)
        // We fetch for "today"
        const today = new Date();
        const dateStr = format(today, 'yyyy-MM-dd');

        // Parallel fetch for Weight and Activity
        const [weightRes, activityRes] = await Promise.all([
            fetch(`https://api.fitbit.com/1/user/-/body/log/weight/date/${dateStr}.json`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }),
            fetch(`https://api.fitbit.com/1/user/-/activities/date/${dateStr}.json`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
        ]);

        let weightLog = 0;
        let steps = 0;
        let caloriesBurned = 0;

        if (weightRes.ok) {
            const weightData = await weightRes.json() as any;
            // weightData.weight is an array of entries
            if (weightData.weight && weightData.weight.length > 0) {
                // Take the last entry? Or average? Let's take the last one.
                weightLog = weightData.weight[weightData.weight.length - 1].weight;
            }
        }

        if (activityRes.ok) {
            const activityData = await activityRes.json() as any;
            if (activityData.summary) {
                steps = activityData.summary.steps || 0;
                caloriesBurned = activityData.summary.caloriesOut || 0;
            }
        }

        // 5. Save to Timeline
        // Create a FitbitLog entry
        // We use a specific ID based on date to avoid duplicates for the same day
        const entryId = `fitbit_${dateStr}`;
        const timelineRef = userDocRef.collection('timelineEntries').doc(entryId);

        // If neither weight nor activity, maybe don't save? 
        // But user might want to see 0 steps if they did nothing.
        // Let's save if we got a successful response, even if 0.

        const newEntry = {
            id: entryId,
            timestamp: new Date(), // Current time of sync, OR date of data? 
            // Better to set timestamp to end of the day or just now? 
            // The charts use timestamp. If we sync multiple times a day, we update the same entry.
            // Let's keep the timestamp as "now" so it shows up at the top? 
            // OR preserve the date. Let's use the date we fetched for.
            // Actually, if I update it, I want it to be reflective of that day.
            // Let's set it to noon of that day to avoid timezone weirdness or just use `today`.

            entryType: 'fitbit_data',
            weight: weightLog,
            steps: steps,
            caloriesBurned: caloriesBurned,
            lastSynced: new Date()
        };

        // We merge true so we don't overwrite if we add other fields later
        await timelineRef.set(newEntry, { merge: true });

        return NextResponse.json({ success: true, weight: weightLog, steps, caloriesBurned });

    } catch (error: any) {
        console.error('Error syncing Fitbit data:', error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
