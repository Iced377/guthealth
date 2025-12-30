
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';
import { format, parseISO } from 'date-fns';

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

        // 4. Fetch History Data (Last 30 Days)
        // We use 'today/30d' to get the last 30 days including today.
        // APIs:
        // Weight Logs (includes BMI, Fat): /1/user/-/body/log/weight/date/today/30d.json
        // Steps Time Series: /1/user/-/activities/steps/date/today/30d.json
        // Calories Time Series: /1/user/-/activities/calories/date/today/30d.json

        const [weightRes, stepsRes, caloriesRes] = await Promise.all([
            fetch(`https://api.fitbit.com/1/user/-/body/log/weight/date/today/30d.json`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }),
            fetch(`https://api.fitbit.com/1/user/-/activities/steps/date/today/30d.json`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }),
            fetch(`https://api.fitbit.com/1/user/-/activities/calories/date/today/30d.json`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
        ]);

        const dailyMap: Record<string, { weight?: number; fatPercent?: number; steps?: number; caloriesBurned?: number }> = {};

        // Process Weight
        if (weightRes.ok) {
            const data = await weightRes.json() as any;
            // data.weight is array of { date: 'YYYY-MM-DD', weight: 80, fat: 20, ... }
            if (data.weight && Array.isArray(data.weight)) {
                data.weight.forEach((entry: any) => {
                    const date = entry.date;
                    if (!dailyMap[date]) dailyMap[date] = {};
                    dailyMap[date].weight = entry.weight;
                    if (entry.fat) dailyMap[date].fatPercent = entry.fat;
                });
            }
        } else {
            console.warn("Failed to fetch weight history", await weightRes.text());
        }

        // Process Steps
        if (stepsRes.ok) {
            const data = await stepsRes.json() as any;
            // data['activities-steps'] is array of { dateTime: 'YYYY-MM-DD', value: '123' }
            const stepsArr = data['activities-steps'];
            if (stepsArr && Array.isArray(stepsArr)) {
                stepsArr.forEach((entry: any) => {
                    const date = entry.dateTime;
                    if (!dailyMap[date]) dailyMap[date] = {};
                    dailyMap[date].steps = parseInt(entry.value, 10);
                });
            }
        } else {
            console.warn("Failed to fetch steps history", await stepsRes.text());
        }

        // Process Calories
        if (caloriesRes.ok) {
            const data = await caloriesRes.json() as any;
            const calArr = data['activities-calories'];
            if (calArr && Array.isArray(calArr)) {
                calArr.forEach((entry: any) => {
                    const date = entry.dateTime;
                    if (!dailyMap[date]) dailyMap[date] = {};
                    dailyMap[date].caloriesBurned = parseInt(entry.value, 10);
                });
            }
        } else {
            console.warn("Failed to fetch calories history", await caloriesRes.text());
        }

        // 5. Batch Write to Firestore
        const batch = db.batch();
        const timelineColRef = userDocRef.collection('timelineEntries');
        let operationCount = 0;

        Object.entries(dailyMap).forEach(([dateStr, data]) => {
            // Only save if we have at least one data point
            if (data.weight === undefined && data.steps === undefined && data.caloriesBurned === undefined) return;

            // Skip "0" steps/calories if that's all we have? 
            // No, 0 steps is valid data for history (maybe didn't wear it), but typically we want real data.
            // Let's save whatever Fitbit returned.

            const entryId = `fitbit_${dateStr}`;
            const docRef = timelineColRef.doc(entryId);

            // We set the timestamp to NOON of that day to avoid timezone shifting it to prev/next day in UI
            const timestamp = parseISO(dateStr);
            timestamp.setHours(12, 0, 0, 0);

            const newEntry = {
                id: entryId,
                timestamp: timestamp,
                entryType: 'fitbit_data',
                lastSynced: new Date(),
                ...data // merges weight, fatPercent, steps, caloriesBurned
            };

            batch.set(docRef, newEntry, { merge: true });
            operationCount++;
        });

        if (operationCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({ success: true, syncedDays: operationCount });

    } catch (error: any) {
        console.error('Error syncing Fitbit data:', error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
