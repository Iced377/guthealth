import { Capacitor, registerPlugin } from '@capacitor/core';

// Safely obtain the plugin instance
const HealthKit = registerPlugin<any>('HealthKit');

// Define local interface for options if needed, or just use implicit objects
const PERMISSIONS = {
    readTypes: ['steps'],
    writeTypes: [],
};

export const AppleHealthService = {
    isAvailable: async (): Promise<boolean> => {
        if (Capacitor.getPlatform() !== 'ios') return false;
        try {
            if (!HealthKit) {
                console.warn('HealthKit plugin not registered');
                return false;
            }
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

            // Query specifically for steps.
            const { count } = await HealthKit.queryHKitSampleType({
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                sampleName: 'stepCount',
            });

            return count || 0;
        } catch (error) {
            console.error('Error getting step count:', error);
            if (error instanceof Error) {
                console.error(error.message);
            }
            return 0; // Return 0 on error to avoid crashing UI
        }
    }
};
