
import { getAdminApp } from './src/lib/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Hardcode the user ID for known context, or list all users
// Since I can't know the UID easily without auth, I'll list all users' subcollections.
// Actually, I can search for the user by email if I knew it.
// Better: I'll list users and check their timelineEntries count.

async function verify() {
    try {
        const app = getAdminApp();
        const db = getFirestore(app);
        const auth = getAuth(app);

        // List users
        const listUsersResult = await auth.listUsers(10);
        for (const userRecord of listUsersResult.users) {
            console.log(`Checking user: ${userRecord.email} (${userRecord.uid})`);

            const snapshot = await db.collection('users').doc(userRecord.uid).collection('timelineEntries')
                .where('entryType', '==', 'pedometer_data')
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();

            if (snapshot.empty) {
                console.log('  No pedometer data found.');
                continue;
            }

            console.log(`  Found ${snapshot.size} recent entries (showing top 5):`);
            snapshot.docs.slice(0, 5).forEach(doc => {
                const data = doc.data();
                console.log(`    ${doc.id}: Date=${data.timestamp.toDate().toISOString()}, Steps=${data.steps}`);
            });

            // Count total
            const countSnapshot = await db.collection('users').doc(userRecord.uid).collection('timelineEntries')
                .where('entryType', '==', 'pedometer_data')
                .count()
                .get();

            console.log(`  Total Pedometer Entries: ${countSnapshot.data().count}`);
        }

    } catch (e) {
        console.error(e);
    }
}

verify();
