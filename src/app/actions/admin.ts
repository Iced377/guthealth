'use server';

import { adminAuth } from '@/lib/firebase/admin';

export interface AuthUserData {
    uid: string;
    email?: string;
    creationTime: string; // ISO string
    lastSignInTime?: string;
}

export async function getAuthUsersAction(): Promise<{
    success: boolean;
    users?: AuthUserData[];
    error?: string;
    debug?: { projectId: string | undefined; hasServiceKey: boolean; userCount: number; sampleDate?: string }
}> {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const hasServiceKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    try {
        console.log(`[Server Action] Fetching users. Project: ${projectId}, ServiceKey: ${hasServiceKey}`);

        // List users 1000 at a time
        const listUsersResult = await adminAuth.listUsers(1000);

        const users: AuthUserData[] = listUsersResult.users.map(user => ({
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
