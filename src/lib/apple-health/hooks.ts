import { useState, useEffect } from 'react';
import { AppleHealthService } from './index';

export function useHealthKit() {
    const [healthData, setHealthData] = useState<{ steps: number; distance: number } | null>(null);
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        const init = async () => {
            const available = await AppleHealthService.isAvailable();
            setIsAvailable(available);
            if (available) {
                // Request permissions if needed.
                // We wrap this in a try/catch to avoid blocking the UI if the user cancels or it fails.
                try {
                    await AppleHealthService.requestPermissions();
                } catch (e) {
                    console.warn("Permission request info:", e);
                }

                // Fetch initial data
                const steps = await AppleHealthService.getTodaySteps();
                setHealthData({ steps, distance: 0 }); // AppleHealthService might need update to return distance
            }
        };
        init();
    }, []);

    const refreshHealthData = async () => {
        if (isAvailable) {
            const steps = await AppleHealthService.getTodaySteps();
            setHealthData({ steps, distance: 0 });
        }
    };

    return { healthData, refreshHealthData, isAvailable };
}
