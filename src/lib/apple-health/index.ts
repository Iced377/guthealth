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
                limit: 10000, // Increase limit for 30 days
                ascending: true
            });

            return result.samples;
        } catch (error) {
            console.error('Error fetching raw samples:', error);
            throw error;
        }
    },

    // Optimized to query day-by-day to avoid hitting sample limits on large ranges
    getDailyStepsHistory: async (days: number = 30): Promise<Record<string, number>> => {
        if (Capacitor.getPlatform() !== 'ios') return {};
        try {
            const dailyTotals: Record<string, number> = {};
            const now = new Date();

            const processDay = async (offset: number) => {
                const date = new Date(now);
                date.setDate(now.getDate() - offset);

                // Set to MIDNIGHT local time for start/end query
                const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

                // Use existing logic for specific day
                const result = await Health.readSamples({
                    dataType: 'steps',
                    startDate: startOfDay.toISOString(),
                    endDate: endOfDay.toISOString(),
                    limit: 3000,
                });

                const samples = result.samples;
                if (!samples.length) return;

                const hasWatchData = samples.some(s => (s.sourceName || '').toLowerCase().includes('watch'));
                let total = 0;

                if (hasWatchData) {
                    total = samples
                        .filter(s => (s.sourceName || '').toLowerCase().includes('watch'))
                        .reduce((acc, curr) => acc + curr.value, 0);
                } else {
                    total = samples
                        .reduce((acc, curr) => acc + curr.value, 0);
                }

                // Key: YYYY-MM-DD (Local)
                const year = startOfDay.getFullYear();
                const month = String(startOfDay.getMonth() + 1).padStart(2, '0');
                const day = String(startOfDay.getDate()).padStart(2, '0');
                const key = `${year}-${month}-${day}`;

                dailyTotals[key] = Math.round(total);
            };

            // Sequential execution for stability
            for (let i = 0; i < days; i++) {
                await processDay(i);
            }

            return dailyTotals;

        } catch (error) {
            console.error('Error fetching history:', error);
            return {};
        }
    }
};
