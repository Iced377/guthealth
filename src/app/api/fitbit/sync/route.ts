
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

        // 3.5 Fetch User Profile for Timezone (to determine "Today" for the user)
        const profileRes = await fetch('https://api.fitbit.com/1/user/-/profile.json', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        let offsetMillis = 0;
        if (profileRes.ok) {
            const profileData = await profileRes.json() as any;
            offsetMillis = profileData.user.offsetFromUTCMillis || 0;
            console.log(`[FitbitSync] User Timezone Offset: ${offsetMillis / 3600000} hours`);
        } else {
            console.warn("Failed to fetch profile for timezone, defaulting to Server Time (UTC).");
        }

        // --- RATE LIMITING ---
        const lastSyncedAt = fitbitData.lastUpdated ? (fitbitData.lastUpdated.toDate ? fitbitData.lastUpdated.toDate() : new Date(fitbitData.lastUpdated)) : null;
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        // If synced recently and this is an auto-sync (we assume query param or just default behavior, lets just limit generally for now)
        // But the user might press the button manually.
        // Let's assume calls to this endpoint should check time unless "force" param is present?
        // For simplicity, we'll just check specific today data if recent, or maybe skip?
        // User asked for "trends page load" -> this will happen a lot. 10 min throttle is good.
        let isCreateOrFullSync = false;
        if (lastSyncedAt && lastSyncedAt > tenMinutesAgo) {
            console.log("Sync performed recently (less than 10 mins). Skipping full historical sync to conserve API.");
            // We can optionally JUST do the "Today" fetch here to be super responsive, 
            // but let's stick to the plan: if verified recently, assume fresh enough.
            // OR: We can do a light sync (just today).
            // Let's do LIGHT SYNC only (Today) if throttled.
        } else {
            isCreateOrFullSync = true;
        }

        // --- DATE CALCULATIONS ---
        const now = Date.now();
        const userLocalTime = new Date(now + offsetMillis);
        const todayStr = userLocalTime.toISOString().split('T')[0]; // YYYY-MM-DD

        let startDate: Date;
        if (!lastSyncedAt) {
            // First time sync: 1 Year ago
            const d = new Date(userLocalTime);
            d.setFullYear(d.getFullYear() - 1);
            startDate = d;
        } else {
            // Incremental: Start from the day of last sync (to catch partial updates)
            // We use the user's timezone applied to the last sync time roughly, or just use the stored date?
            // Simpler: Use lastSyncedAt (UTC) -> User Time -> Date String.
            const lastSyncedUserTime = new Date(lastSyncedAt.getTime() + offsetMillis);
            startDate = lastSyncedUserTime;
            // Go back 1 day to be safe?
            startDate.setDate(startDate.getDate() - 1);
        }

        // Clamp start date to max 1 year ago to avoid crazy loops if user returns after 5 years
        const maxHistory = new Date(userLocalTime);
        maxHistory.setFullYear(maxHistory.getFullYear() - 1);
        if (startDate < maxHistory) startDate = maxHistory;

        const endDate = userLocalTime; // Today

        // --- CHUNKED HISTORICAL SYNC ---
        // Only run if we are doing a full/incremental sync (not throttled)
        const dailyMap: Record<string, { weight?: number; fatPercent?: number; steps?: number; caloriesBurned?: number }> = {};

        if (isCreateOrFullSync) {
            let currentStart = new Date(startDate);
            let chunksProcessed = 0;

            while (currentStart <= endDate) {
                let currentEnd = new Date(currentStart);
                currentEnd.setDate(currentEnd.getDate() + 30); // 30 day chunk
                if (currentEnd > endDate) currentEnd = endDate;

                const sStr = currentStart.toISOString().split('T')[0];
                const eStr = currentEnd.toISOString().split('T')[0];

                console.log(`[FitbitSync] Fetching chunk: ${sStr} to ${eStr}`);

                const [weightRes, fatRes, stepsRes, caloriesRes] = await Promise.all([
                    fetch(`https://api.fitbit.com/1/user/-/body/weight/date/${sStr}/${eStr}.json`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                    fetch(`https://api.fitbit.com/1/user/-/body/fat/date/${sStr}/${eStr}.json`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                    fetch(`https://api.fitbit.com/1/user/-/activities/steps/date/${sStr}/${eStr}.json`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                    fetch(`https://api.fitbit.com/1/user/-/activities/calories/date/${sStr}/${eStr}.json`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
                ]);

                // Helper to process response
                const processRes = async (res: any, key: string, mapFn: (entry: any) => void) => {
                    if (res.ok) {
                        const json = await res.json() as any;
                        const arr = json[key];
                        if (Array.isArray(arr)) arr.forEach(mapFn);
                    }
                };

                await Promise.all([
                    processRes(weightRes, 'body-weight', (e) => {
                        if (!dailyMap[e.dateTime]) dailyMap[e.dateTime] = {};
                        dailyMap[e.dateTime].weight = parseFloat(e.value);
                    }),
                    processRes(fatRes, 'body-fat', (e) => {
                        if (!dailyMap[e.dateTime]) dailyMap[e.dateTime] = {};
                        dailyMap[e.dateTime].fatPercent = parseFloat(e.value);
                    }),
                    processRes(stepsRes, 'activities-steps', (e) => {
                        if (!dailyMap[e.dateTime]) dailyMap[e.dateTime] = {};
                        dailyMap[e.dateTime].steps = parseInt(e.value, 10);
                    }),
                    processRes(caloriesRes, 'activities-calories', (e) => {
                        if (!dailyMap[e.dateTime]) dailyMap[e.dateTime] = {};
                        dailyMap[e.dateTime].caloriesBurned = parseInt(e.value, 10);
                    })
                ]);

                // Move next
                currentStart = new Date(currentEnd);
                currentStart.setDate(currentStart.getDate() + 1);
                chunksProcessed++;
            }
        }

        // --- ALWAYS FETCH TODAY ALONE (REAL-TIME GUARANTEE) ---
        // Providing specific endpoints for "Today" to bypass time-series lag
        console.log(`[FitbitSync] Fetching Real-Time Data for Today: ${todayStr}`);
        const [todayActivityRes, todayWeightLogRes] = await Promise.all([
            fetch(`https://api.fitbit.com/1/user/-/activities/date/${todayStr}.json`, { headers: { 'Authorization': `Bearer ${accessToken}` } }),
            fetch(`https://api.fitbit.com/1/user/-/body/log/weight/date/${todayStr}.json`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
        ]);

        if (todayActivityRes.ok) {
            const json = await todayActivityRes.json() as any;
            if (json.summary) {
                if (!dailyMap[todayStr]) dailyMap[todayStr] = {};
                // Activity Summary has total steps/calories for the day
                dailyMap[todayStr].steps = json.summary.steps;
                dailyMap[todayStr].caloriesBurned = json.summary.caloriesOut;
            }
        }

        if (todayWeightLogRes.ok) {
            const json = await todayWeightLogRes.json() as any;
            // Log API returns array of logs
            if (json.weight && Array.isArray(json.weight) && json.weight.length > 0) {
                // Taking the last log of the day? Or average? most recent usually.
                // It's sorted by time usually?
                const latestLog = json.weight[json.weight.length - 1]; // Logged logs
                if (!dailyMap[todayStr]) dailyMap[todayStr] = {};
                dailyMap[todayStr].weight = latestLog.weight;
                dailyMap[todayStr].fatPercent = latestLog.fat;
            }
        }


        // 5. Batch Write to Firestore
        const batch = db.batch();
        const timelineColRef = userDocRef.collection('timelineEntries');
        let operationCount = 0;

        Object.entries(dailyMap).forEach(([dateStr, data]) => {
            // Only save if we have at least one data point
            if (data.weight === undefined && data.steps === undefined && data.caloriesBurned === undefined) return;

            const entryId = `fitbit_${dateStr}`;
            const docRef = timelineColRef.doc(entryId);

            const timestamp = parseISO(dateStr);
            timestamp.setHours(12, 0, 0, 0);

            const newEntry = {
                id: entryId,
                timestamp: timestamp,
                entryType: 'fitbit_data',
                lastSynced: new Date(),
                ...data
            };

            batch.set(docRef, newEntry, { merge: true });
            operationCount++;
        });

        // Update last synced time
        await privateDataRef.set({ ...fitbitData, lastUpdated: new Date() }, { merge: true });

        if (operationCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({ success: true, syncedDays: operationCount, isFullSync: isCreateOrFullSync });

    } catch (error: any) {
        console.error('Error syncing Fitbit data:', error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
```
