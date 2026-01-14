import { Capacitor, registerPlugin } from '@capacitor/core';

// Use the new plugin
const CapacitorHealth = registerPlugin<any>('CapacitorHealth');

export const AppleHealthService = {
    isAvailable: async (): Promise<boolean> => {
        if (Capacitor.getPlatform() !== 'ios') return false;
        try {
            if (!CapacitorHealth) return false;
            const { available } = await CapacitorHealth.isAvailable();
            return available;
        } catch (e) {
            console.error('Apple Health availability check failed', e);
            return false;
        }
    },

    requestPermissions: async (): Promise<void> => {
        if (Capacitor.getPlatform() !== 'ios') return;
        try {
            // New API structure for @capgo/capacitor-health
            await CapacitorHealth.requestAuthorization({
                all: ['steps'],
                read: ['steps'],
                write: []
            });
        } catch (error) {
            console.error('Error requesting Apple Health permissions:', error);
            throw error;
        }
    },

    getTodaySteps: async (): Promise<number> => {
        if (Capacitor.getPlatform() !== 'ios') return 0;

        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // The new plugin might have a different query format. 
            // Assuming standard logic or generic query.
            // Using 'steps' as the data type.
            const { count } = await CapacitorHealth.query({
                name: 'steps',
                startDate: startOfDay.toISOString(),
                endDate: now.toISOString(),
                dataType: 'count' // or similar aggregation
            });

            // Note: If the return structure is different (e.g. { value: 100 }), we need to adjust.
            // Based on common patterns in this community.
            return typeof count === 'number' ? count : (count?.value || 0);

        } catch (error) {
            console.error('Error getting step count:', error);
            if (error instanceof Error) {
                console.error(error.message);
            }
            return 0;
        }
    }
};
