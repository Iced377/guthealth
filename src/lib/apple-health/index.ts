import { Capacitor, registerPlugin } from '@capacitor/core';

// Define minimal interfaces based on the inspected definitions
interface HealthSample {
    value: number;
    startDate: string;
    endDate: string;
}

interface ReadSamplesResult {
    samples: HealthSample[];
}

interface HealthPlugin {
    isAvailable(): Promise<{ available: boolean }>;
    requestAuthorization(options: { read: string[], write: string[] }): Promise<any>;
    readSamples(options: { dataType: string, startDate: string, endDate: string }): Promise<ReadSamplesResult>;
}

// User confirmed plugin name is 'CapacitorHealth'
const CapacitorHealth = registerPlugin<HealthPlugin>('CapacitorHealth');

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

            // Fetch all step samples for today
            const result = await CapacitorHealth.readSamples({
                dataType: 'steps',
                startDate: startOfDay.toISOString(),
                endDate: now.toISOString(),
            });

            // Aggregate manually
            const totalSteps = result.samples.reduce((sum, sample) => sum + sample.value, 0);

            return Math.round(totalSteps);

        } catch (error) {
            console.error('Error getting step count:', error);
            if (error instanceof Error) {
                console.error(error.message);
            }
            return 0;
        }
    }
};
