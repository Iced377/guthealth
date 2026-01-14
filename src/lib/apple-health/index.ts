import { Capacitor } from '@capacitor/core';
import { HealthKit, HealthKitOptions, ActivityType } from '@perfood/capacitor-healthkit';

const PERMISSIONS: HealthKitOptions = {
    readTypes: ['steps'],
    writeTypes: [],
};

export const AppleHealthService = {
    isAvailable: async (): Promise<boolean> => {
        if (Capacitor.getPlatform() !== 'ios') return false;
        try {
            const { available } = await HealthKit.isAvailable();
            return available;
        } catch (e) {
            console.error('Apple Health availability check failed', e);
            return false;
        }
    },

    requestPermissions: async (): Promise<void> => {
        if (Capacitor.getPlatform() !== 'ios') return;
        try {
            await HealthKit.requestAuthorization(PERMISSIONS);
        } catch (error) {
            console.error('Error requesting Apple Health permissions:', error);
            throw error;
        }
    },

    getTodaySteps: async (): Promise<number> => {
        if (Capacitor.getPlatform() !== 'ios') return 0;

        try {
            const now = new Date();
            // Start of today (00:00:00)
            const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const endDate = now.toISOString();

            const options = {
                startDate: startDate,
                endDate: endDate,
                sampleType: 'steps', // Ensure this matches the library's expected type string or enum
            };

            // Query specifically for steps. The API might vary slightly, but this is standard.
            // @perfood/capacitor-healthkit query HKSampleTypeIdentifierStepCount
            const { count } = await HealthKit.queryHKitSampleType<ActivityType.STEP_COUNT>({
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                sampleName: 'stepCount', // Specific to @perfood plugin
            });

            return count || 0;
        } catch (error) {
            console.error('Error getting step count:', error);
            return 0; // Return 0 on error to avoid crashing UI
        }
    }
};
