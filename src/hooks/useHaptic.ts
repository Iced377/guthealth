import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useCallback } from 'react';

const isNative = Capacitor.isNativePlatform();

export const useHaptic = () => {
    const impact = useCallback(async (style: ImpactStyle = ImpactStyle.Light) => {
        if (isNative) {
            try {
                await Haptics.impact({ style });
            } catch (error) {
                console.warn('Haptic impact failed:', error);
            }
        }
    }, []);

    const notification = useCallback(async (type: NotificationType = NotificationType.Success) => {
        if (isNative) {
            try {
                await Haptics.notification({ type });
            } catch (error) {
                console.warn('Haptic notification failed:', error);
            }
        }
    }, []);

    const selection = useCallback(async () => {
        if (isNative) {
            try {
                await Haptics.selectionStart();
                await Haptics.selectionChanged();
                await Haptics.selectionEnd();
            } catch (error) {
                console.warn('Haptic selection failed:', error);
            }
        }
    }, []);

    return { impact, notification, selection };
};
