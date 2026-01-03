
const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = require('dotenv').config({ path: envPath });

async function verify() {
    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            console.error('No Service Account Key found in .env.local');
            return;
        }

        const serviceAccount = JSON.parse(serviceAccountKey);
        const app = initializeApp({
            credential: cert(serviceAccount)
        });

        const db = getFirestore(app);
        const auth = getAuth(app);

        let nextPageToken;
        let foundData = false;

        do {
            const listUsersResult = await auth.listUsers(1000, nextPageToken);
            nextPageToken = listUsersResult.pageToken;

            for (const userRecord of listUsersResult.users) {
                const countSnapshot = await db.collection('users').doc(userRecord.uid).collection('timelineEntries')
                    .where('entryType', '==', 'pedometer_data')
                    .count()
                    .get();

                const count = countSnapshot.data().count;

                if (count > 0) {
                    foundData = true;
                    console.log(`\nFOUND DATA for user: ${userRecord.email} (${userRecord.uid})`);
                    console.log(`  Total Pedometer Entries: ${count}`);

                    const snapshot = await db.collection('users').doc(userRecord.uid).collection('timelineEntries')
                        .where('entryType', '==', 'pedometer_data')
                        .orderBy('timestamp', 'desc')
                        .limit(10)
                        .get();

                    console.log(`  Recent 10 entries:`);
                    snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        console.log(`    ${doc.id}: Date=${data.timestamp.toDate().toISOString()}, Steps=${data.steps}`);
                    });

                    break;
                }
            }
            if (foundData) break;

        } while (nextPageToken);

        if (!foundData) {
            console.log('Scanned all users. No pedometer_data found.');
        }

    } catch (e) {
        console.error(e);
    }
}

verify();
