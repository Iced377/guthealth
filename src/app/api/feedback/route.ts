import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getFirestore, Timestamp as AdminTimestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { FeedbackSubmission } from '@/types';
// CRMIssue imports client-side Timestamp. We define a ServerCRMIssue here or cast.
import type { CRMIssue } from '@/types/admin';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        // ... (rest is same logic, just fixed imports)

        const body = await req.json();
        const {
            type, ratings, freeform, didInteract,
            uid, isGuest, appVersion, buildNumber,
            routeContext, deviceContext
        } = body;

        const db = getFirestore(getAdminApp());
        const adminAuth = getAuth(getAdminApp());

        // Verify Auth if provided
        let verifiedUid: string | null = null;
        if (uid && authHeader) {
            const token = authHeader.split('Bearer ')[1];
            try {
                const decoded = await adminAuth.verifyIdToken(token);
                if (decoded.uid === uid) {
                    verifiedUid = uid;
                }
            } catch (e) {
                console.error("Token verification failed", e);
                // Proceed as guest? Or fail? 
                // Existing logic allowed guests. If token fails, maybe they are actually offline/guest?
                // Safer to treat as guest if verification fails, or rejecting if claim is "I am logged in".
                // Let's safe-fail to guest logic if verification fails but log it.
            }
        }

        // 1. Submit Feedback
        const feedbackData = {
            uid: verifiedUid || null,
            isGuest: !verifiedUid,
            type,
            ratings,
            freeform,
            didInteract,
            appVersion,
            buildNumber,
            routeContext,
            deviceContext,
            createdAt: AdminTimestamp.now()
        };

        // @ts-ignore - mismatch between Admin/Client timestamp types is fine for simple writes
        const feedbackRef = await db.collection('feedbackSubmissions').add(feedbackData);

        // 2. Update User Meta (if logged in)
        if (verifiedUid) {
            const userRef = db.collection('users').doc(verifiedUid);

            // @ts-ignore
            await userRef.set({
                feedbackMeta: {
                    hasSubmittedFeedback: true,
                    lastFeedbackAt: AdminTimestamp.now(),
                    lastFeedbackType: type
                }
            }, { merge: true });

            // 3. AUTO-LOG CRM ISSUE (If Bug)
            if (type === 'bug') {
                const issueData: any = { // Use 'any' to bypass strict type check for now
                    id: '', // Placeholder
                    kind: 'auto_log',
                    status: 'open',
                    severity: 'high',
                    code: 'BUG_REPORT',
                    title: 'Bug report submitted',
                    source: {
                        type: 'feedback',
                        refId: feedbackRef.id
                    },
                    createdAt: AdminTimestamp.now(),
                    createdBy: 'system',
                    expiresAt: AdminTimestamp.fromMillis(Date.now() + 1000 * 60 * 60 * 24 * 60) // 60 Days TTL
                };

                // Use subcollection
                await userRef.collection('crmIssues').add(issueData);

                // Update Stats (Atomic Increment)
                await userRef.update({
                    'crmStats.openIssuesCount': FieldValue.increment(1),
                    'crmStats.lastIssueAt': AdminTimestamp.now()
                });
            }
        }

        return NextResponse.json({ success: true, id: feedbackRef.id });

    } catch (error: any) {
        console.error("Feedback API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
