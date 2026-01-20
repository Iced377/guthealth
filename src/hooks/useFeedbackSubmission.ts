import { useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase'; // Assuming firebase config is here
import { useAuth } from '@/components/auth/AuthProvider';
import { FeedbackSubmission, UserProfile } from '@/types';
import { APP_VERSION } from '@/config/releaseNotes'; // Assuming APP_VERSION is exported from here

interface FeedbackMeta {
    hasSubmittedFeedback: boolean;
    lastFeedbackAt: Timestamp | null;
    lastFeedbackType: 'improve' | 'bug' | 'feature' | null;
}

export const useFeedbackSubmission = () => {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getDeviceContext = () => {
        if (typeof window === 'undefined') return { userAgent: '', platform: '', viewportW: 0, viewportH: 0 };
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            viewportW: window.innerWidth,
            viewportH: window.innerHeight
        };
    };

    const submitFeedback = async (
        type: 'improve' | 'bug' | 'feature',
        ratings: FeedbackSubmission['ratings'],
        freeform: string | null,
        didInteract: boolean // Only true if user actually touched something
    ): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Construct the document
            const submissionData: Omit<FeedbackSubmission, 'id'> = {
                uid: user?.uid || null,
                isGuest: !user,
                type,
                createdAt: serverTimestamp() as Timestamp, // Cast for type safety, Firestore handles this
                appVersion: APP_VERSION,
                buildNumber: process.env.NEXT_PUBLIC_BUILD_NUMBER || "unknown",
                routeContext: typeof window !== 'undefined' ? window.location.pathname : '',
                deviceContext: getDeviceContext(),
                ratings,
                freeform,
                didInteract,
            };

            // 2. Add to 'feedbackSubmissions' collection
            await addDoc(collection(db, 'feedbackSubmissions'), submissionData);

            // 3. Update User Profile Meta (Only if didInteract is true and user is logged in)
            if (didInteract && user) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    'feedbackMeta': {
                        hasSubmittedFeedback: true,
                        lastFeedbackAt: serverTimestamp(),
                        lastFeedbackType: type
                    }
                });
            }

            return true;
        } catch (err: any) {
            console.error("Feedback submission error:", err);
            setError(err.message || "Failed to submit feedback");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitImprove = (
        ratings: FeedbackSubmission['ratings'],
        freeform: string | null,
        didInteract: boolean
    ) => {
        return submitFeedback('improve', ratings, freeform, didInteract);
    };

    const submitBug = (freeform: string, didInteract: boolean = true) => {
        return submitFeedback('bug', {
            accuracy: null, convenience: null, usability: null, speed: null, performance: null
        }, freeform, didInteract);
    };

    const submitFeature = (freeform: string, didInteract: boolean = true) => {
        return submitFeedback('feature', {
            accuracy: null, convenience: null, usability: null, speed: null, performance: null
        }, freeform, didInteract);
    };

    const readUserFeedbackMeta = async (uid: string): Promise<FeedbackMeta> => {
        try {
            const userRef = doc(db, 'users', uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                const data = snap.data() as UserProfile;
                if (data.feedbackMeta) {
                    return data.feedbackMeta;
                }
            }
        } catch (e) {
            console.error("Error reading feedback meta", e);
        }
        return { hasSubmittedFeedback: false, lastFeedbackAt: null, lastFeedbackType: null };
    };

    return {
        submitImprove,
        submitBug,
        submitFeature,
        readUserFeedbackMeta,
        isSubmitting,
        error
    };
};
