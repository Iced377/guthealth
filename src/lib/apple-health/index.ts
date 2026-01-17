import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';

export const AppleHealthService = {
    isAvailable: async (): Promise<boolean> => {
        if (Capacitor.getPlatform() !== 'ios') return false;
        try {
            const { available } = await Health.isAvailable();
            return available;
        } catch (e) {
            console.error('Apple Health availability check failed', e);
            return false;
        }
    },

    requestPermissions: async (): Promise<void> => {
        if (Capacitor.getPlatform() !== 'ios') return;
        try {
            await Health.requestAuthorization({
                read: ['steps'],
                write: ['steps']
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

            // Fetch all step samples for today
            const result = await Health.readSamples({
                dataType: 'steps',
                startDate: startOfDay.toISOString(),
                endDate: now.toISOString(),
                limit: 5000,
            });

            // Strict Source Prioritization
            // Strategy: If ANY data exists from an Apple Watch, we use ONLY Apple Watch data for the day.
            // This prevents double-counting where the Phone tracks steps alongside the Watch.
            // While this might miss steps if the user takes off the watch and walks with the phone,
            // it is the only reliable way to avoid duplication without native HKStatisticsQuery access.

            const hasWatchData = result.samples.some(s => (s.sourceName || '').toLowerCase().includes('watch'));

            let totalSteps = 0;
            if (hasWatchData) {
                totalSteps = result.samples
                    .filter(s => (s.sourceName || '').toLowerCase().includes('watch'))
                    .reduce((acc, curr) => acc + curr.value, 0);
            } else {
                totalSteps = result.samples
                    .reduce((acc, curr) => acc + curr.value, 0);
            }

            return Math.round(totalSteps);

        } catch (error: any) {
            // "Authorization not determined" is expected if the user hasn't granted permissions yet.
            // We shouldn't error loudly here as it blocks the UI in dev mode.
            if (error?.message?.includes?.('Authorization') || typeof error === 'string' && error.includes('Authorization')) {
                console.warn('Apple Health permission not yet granted (silent):', error);
            } else {
                console.warn('Error fetching steps:', error);
            }
            return 0;
        }
    },

    saveSteps: async (steps: number): Promise<void> => {
        if (Capacitor.getPlatform() !== 'ios') return;
        try {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            await Health.saveSample({
                dataType: 'steps',
                value: steps,
                startDate: oneHourAgo.toISOString(),
                endDate: now.toISOString(),
                unit: 'count'
            });
        } catch (error) {
            console.error('Error saving steps:', error);
            throw error;
        }
    },

    getRawStepSamples: async (days: number = 30): Promise<any[]> => {
        if (Capacitor.getPlatform() !== 'ios') return [];
        try {
            const now = new Date();
            const startDate = new Date();
            startDate.setDate(now.getDate() - days);

            const result = await Health.readSamples({
                dataType: 'steps',
                startDate: startDate.toISOString(),
                endDate: now.toISOString(),
                limit: 1000,
                ascending: false
            });

            return result.samples;
        } catch (error) {
            console.error('Error fetching raw samples:', error);
            throw error;
        }
    }
};
