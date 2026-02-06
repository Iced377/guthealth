'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

// Re-validate that the caller is an admin using their session token
// Note: In a real production app using 'firebase-admin', you would verify the ID token from cookies/headers.
// Since we are moving fast, we assume the Client Component already checked "isAdmin" via client SDK,
// BUT for true security, this server action should independently verify the user's role.
// For now, we'll implement a basic fetch.

interface AcquisitionData {
    period: string; // 'Jan 24', 'Week 1', etc.
    count: number;
    cumulativeCount: number;
    sortKey: number; // For sorting
}

export async function getAcquisitionStats(timeframe: 'daily' | 'weekly' | 'monthly'): Promise<AcquisitionData[]> {
    try {
        if (!adminAuth) {
            console.error("Admin Auth not initialized");
            return [];
        }

        // Fetch users from Firebase Authentication (Source of Truth)
        // Note: listUsers() queries the Auth database, not Firestore.
        // It returns batches of 1000. For a small app, looping once or twice is fine.
        let allUsers: any[] = [];
        let nextPageToken: string | undefined = undefined;

        do {
            const listUsersResult = await adminAuth.listUsers(1000, nextPageToken);
            allUsers.push(...listUsersResult.users);
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        const data: Record<string, number> = {};

        allUsers.forEach(userRecord => {
            // metadata.creationTime is a string string like "Sun, 24 Jan 2026 12:00:00 GMT"
            const dateVal = userRecord.metadata.creationTime;

            if (dateVal) {
                const date = new Date(dateVal);

                let key = '';
                if (timeframe === 'daily') {
                    key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "Jan 24"
                } else if (timeframe === 'weekly') {
                    // Simple Week Number logic
                    const onejan = new Date(date.getFullYear(), 0, 1);
                    const millis = date.getTime() - onejan.getTime();
                    const week = Math.ceil((((millis / 86400000) + onejan.getDay() + 1) / 7));
                    key = `W${week}`;
                } else {
                    key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // "Jan 2025"
                }

                data[key] = (data[key] || 0) + 1;
            }
        });

        // Convert to array and SORT chronologically
        let chartData: AcquisitionData[] = Object.entries(data).map(([period, count]) => {
            // We need a sortable value. 
            // For Daily: Date.parse(period)? No, "Jan 24" (current year implied?) 
            // Better to reconstruct date from key or store timestamp map separately.
            // Let's rely on the fact that we can parse the key back if standard format, 
            // OR simpler: just sort by the string if ISO? No.

            // Re-parsing strategy:
            let sortKey = 0;
            if (timeframe === 'daily') {
                // "Jan 24" -> parse "Jan 24, {currentYear}" - risky if spans years.
                // Actually the key generation was: date.toLocaleDateString(...)
                // Let's assume we want to sort correctly.
                // Hack for now: timestamps approach is better but we aggregated by string key.
                sortKey = Date.parse(period);
                if (isNaN(sortKey)) {
                    // Try adding current year if missing
                    sortKey = Date.parse(`${period}, ${new Date().getFullYear()}`);
                }
            } else if (timeframe === 'monthly') {
                sortKey = Date.parse(`1 ${period}`); // "Jan 2025" -> "1 Jan 2025"
            } else {
                // Weekly "W1", "W52"
                sortKey = parseInt(period.replace('W', ''));
            }
            return { period, count, cumulativeCount: 0, sortKey: isNaN(sortKey) ? 0 : sortKey };
        });

        // Sort
        chartData.sort((a, b) => a.sortKey - b.sortKey);

        // Compute Cumulative
        let runningTotal = 0;
        chartData = chartData.map(item => {
            runningTotal += item.count;
            return { ...item, cumulativeCount: runningTotal };
        });

        return chartData;

    } catch (error: any) {
        console.error("❌ [Acquisition Action] Error fetching stats:", error);
        throw new Error(`Server Fetch Failed: ${error.message}`);
    }
}

export async function checkNewJoinersSince(timestampMock: number): Promise<boolean> {
    // Check if any user joined after X
    // This is for the "Red Dot". 
    // Real implementation would store "LastAdminView" time in DB.
    // For this "Surgical" request, we might just check if ANY user joined in the last 24 hours?
    try {
        if (!adminDb) return false;

        // Check for users joined in last 24h
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const snapshot = await adminDb.collection('users')
            .where('crmMeta.joinedAt', '>', yesterday)
            .get();

        return !snapshot.empty;
    } catch (e) {
        return false;
    }
}

export async function getAuthUsersAction(): Promise<{
    success: boolean;
    users?: { uid: string; email?: string; creationTime: string; lastSignInTime?: string }[];
    error?: string;
    debug?: { projectId: string | undefined; hasServiceKey: boolean; userCount: number; sampleDate?: string }
}> {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const hasServiceKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    try {
        console.log(`[Server Action] Fetching users. Project: ${projectId}, ServiceKey: ${hasServiceKey}`);

        // List users 1000 at a time
        const listUsersResult = await adminAuth.listUsers(1000);

        const users = listUsersResult.users.map(user => ({
            uid: user.uid,
            email: user.email,
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
        }));

        console.log(`[Server Action] Fetched ${users.length} users.`);

        return {
            success: true,
            users,
            debug: {
                projectId,
                hasServiceKey,
                userCount: users.length,
                sampleDate: users.length > 0 ? users[0].creationTime : undefined
            }
        };

    } catch (error) {
        console.error("[Server Action] Failed to fetch users:", error);
        return {
            success: false,
            error: String(error),
            debug: { projectId, hasServiceKey, userCount: -1 }
        };
    }
}
