
import { db } from '@/config/firebase';
import { doc, getDoc, collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { UserProfile, TimelineEntry, FeedbackSubmission } from '@/types';

export const generateUserDataExport = async (userId: string) => {
    try {
        const exportData: any = {
            meta: {
                exportDate: new Date().toISOString(),
                version: "1.0",
                appName: "GutCheck",
                note: "This export includes your personal profile, timeline activity logs, and feedback submissions. It does not include temporary device-local storage."
            }
        };

        // 1. Fetch User Profile
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            exportData.profile = userDocSnap.data() as UserProfile;
        } else {
            exportData.profile = null;
        }

        // 2. Fetch Timeline Entries (ordered by timestamp)
        const timelineRef = collection(db, 'users', userId, 'timelineEntries');
        const timelineQuery = query(timelineRef, orderBy('timestamp', 'asc')); // Oldest first for a logical history
        const timelineSnap = await getDocs(timelineQuery);

        exportData.timeline = timelineSnap.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore Timestamps to ISO strings for JSON
            const processedData: any = { ...data, id: doc.id };
            if (data.timestamp && data.timestamp instanceof Timestamp) {
                processedData.timestamp = data.timestamp.toDate().toISOString();
            } else if (data.timestamp && data.timestamp.seconds) {
                // Handle case where it might be a raw object looking like a timestamp
                processedData.timestamp = new Date(data.timestamp.seconds * 1000).toISOString();
            }
            return processedData;
        });

        // 3. Fetch User Feedback
        const feedbackRef = collection(db, 'feedbackSubmissions');
        const feedbackQuery = query(feedbackRef, where('userId', '==', userId));
        const feedbackSnap = await getDocs(feedbackQuery);

        exportData.feedback = feedbackSnap.docs.map(doc => {
            const data = doc.data();
            const processedData: any = { ...data, id: doc.id };
            if (data.timestamp && data.timestamp instanceof Timestamp) {
                processedData.timestamp = data.timestamp.toDate().toISOString();
            }
            return processedData;
        });

        // Create JSON Blob
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Trigger Download
        const a = document.createElement('a');
        a.href = url;
        a.download = `gutcheck_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;

    } catch (error) {
        console.error("Data export failed:", error);
        throw error;
    }
};
