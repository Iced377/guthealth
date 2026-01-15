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

            // Aggregate with Time-Bucket Deduplication (Watch Priority)
            // Strategy: 
            // 1. Bucketize time (minute slots).
            // 2. Track Watch vs Phone steps per minute.
            // 3. If bucket is claimed by Watch, ignore Phone.
            // 4. Default to Phone if no Watch data.

            const timeBuckets = new Map<string, { watchSteps: number, phoneSteps: number }>();

            result.samples.forEach(sample => {
                const key = new Date(sample.startDate).toISOString().substring(0, 16); // Minute bucket
                const isWatch = (sample.sourceName || '').toLowerCase().includes('watch');

                const bucket = timeBuckets.get(key) || { watchSteps: 0, phoneSteps: 0 };
                if (isWatch) {
                    bucket.watchSteps += sample.value;
                } else {
                    bucket.phoneSteps += sample.value;
                }
                timeBuckets.set(key, bucket);
            });

            let totalSteps = 0;
            timeBuckets.forEach((bucket) => {
                // If we have Watch data for this minute, use it ONLY. Ignore phone.
                if (bucket.watchSteps > 0) {
                    totalSteps += bucket.watchSteps;
                } else {
                    totalSteps += bucket.phoneSteps;
                }
            });

            return Math.round(totalSteps);

        } catch (error) {
            console.error('Error fetching steps:', error);
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
