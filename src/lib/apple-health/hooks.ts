import { useState, useEffect } from 'react';
import { AppleHealthService } from './index';

export function useHealthKit(enabled: boolean = true) {
    const [healthData, setHealthData] = useState<{ steps: number; distance: number } | null>(null);
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setHealthData(null);
            setIsAvailable(false);
            return;
        }
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
    }, [enabled]);

    const refreshHealthData = async () => {
        if (enabled && isAvailable) {
            const steps = await AppleHealthService.getTodaySteps();
            setHealthData({ steps, distance: 0 });
        }
    };

    return { healthData, refreshHealthData, isAvailable };
}
