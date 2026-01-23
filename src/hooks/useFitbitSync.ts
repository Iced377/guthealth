import { useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export const useFitbitSync = () => {
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);

    const syncFitbit = useCallback(async () => {
        if (!user) return;

        try {
            setIsSyncing(true);
            const idToken = await user.getIdToken();

            const response = await fetch('/api/fitbit/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                // If 404, it just means not connected, which is fine to ignore silently here
                // We might log strictly errors
                if (response.status !== 404) {
                    console.error('Fitbit sync failed', response.statusText);
                }
            } else {
                const data = await response.json();
                if (data.success && data.syncedDays > 0) {
                    console.log(`Fitbit synced successfully (${data.syncedDays} days).`);
                } else {
                    console.log('Fitbit sync check complete (up to date).');
                }
            }

        } catch (error) {
            console.error('Error triggering Fitbit sync:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [user]);

    return {
        syncFitbit,
        isSyncing
    };
};
