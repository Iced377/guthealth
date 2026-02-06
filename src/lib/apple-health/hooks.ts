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
                try {
                    console.log("[Health] Requesting permissions...");
                    await AppleHealthService.requestPermissions();
                    console.log("[Health] Permissions resolved");
                } catch (e) {
                    console.warn("[Health] Permission request info:", e);
                }

                // Fetch initial data - wait for it
                console.log("[Health] Fetching initial steps...");
                const steps = await AppleHealthService.getTodaySteps();
                setHealthData({ steps, distance: 0 });
                console.log("[Health] Initial steps set:", steps);
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
