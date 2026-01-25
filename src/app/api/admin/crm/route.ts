import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const adminAuth = getAuth(getAdminApp());
        const decoded = await adminAuth.verifyIdToken(token);

        // Verify Admin Status (Double Check)
        const db = getFirestore(getAdminApp());
        const callerRef = db.collection('users').doc(decoded.uid);
        const callerSnap = await callerRef.get();

        if (!callerSnap.exists || !callerSnap.data()?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { action, targetUserId, payload } = body;

        const targetRef = db.collection('users').doc(targetUserId);

        if (action === 'update_meta') {
            // Update Acquisition Source
            await targetRef.set({
                crmMeta: payload // e.g. { acquisitionSource: '...' }
            }, { merge: true });

            return NextResponse.json({ success: true });
        }

        if (action === 'add_note') {
            // Add Note & Update Stats
            const { kind, title, detail, createdBy } = payload;

            // 1. Add to Subcollection
            const issuesRef = targetRef.collection('crmIssues');
            const docRef = await issuesRef.add({
                kind,
                status: 'open',
                severity: 'low',
                title,
                detail,
                createdAt: Timestamp.now(),
                createdBy
            });

            // 2. Update Stats on Parent (Admin SDK bypasses rules!)
            await targetRef.update({
                'crmStats.lastAdminNoteAt': Timestamp.now()
            });

            return NextResponse.json({ success: true, id: docRef.id });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error("Admin CRM API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
