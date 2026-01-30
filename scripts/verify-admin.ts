import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (result.error) {
    console.warn("⚠️ Could not load .env.local:", result.error.message);
}

// Check for Project ID
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
console.log(`[Verify] Loaded Project ID: ${projectId ? projectId : 'UNDEFINED'}`);

// NOW import admin, after env is loaded
import { adminAuth } from '../src/lib/firebase/admin';

async function testAdmin() {
    if (!projectId) {
        console.error("❌ Cannot test: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing.");
        return;
    }

    try {
        console.log("Testing Admin Auth listUsers...");
        const result = await adminAuth.listUsers(10);
        console.log(`✅ Successfully fetched ${result.users.length} users.`);
        result.users.forEach(u => console.log(`- ${u.email} (${u.metadata.creationTime})`));
    } catch (error) {
        console.error("❌ Admin Auth Failed:", error);
    }
}

testAdmin();
