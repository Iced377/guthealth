import { Capacitor } from '@capacitor/core';
// Do NOT import from @capacitor/haptics statically to avoid SSR crashes

// Re-export Enums manually to avoid import side-effects
export enum ImpactStyle {
    Heavy = 'HEAVY',
    Medium = 'MEDIUM',
    Light = 'LIGHT'
}

export enum NotificationType {
    Success = 'SUCCESS',
    Warning = 'WARNING',
    Error = 'ERROR'
}

const isNative = () => typeof window !== 'undefined' && Capacitor.isNativePlatform();

export const HapticsService = {
    impact: async (style: ImpactStyle = ImpactStyle.Light) => {
        if (isNative()) {
            try {
                // Dynamic import
                const { Haptics } = await import('@capacitor/haptics');
                // Cast to any because our local enum string matches the library's expected string/type at runtime
                await Haptics.impact({ style: style as any });
            } catch (e) {
                // Silent fail
            }
        } else {
            // Optional: Web fallback
        }
    },

    notification: async (type: NotificationType) => {
        if (isNative()) {
            try {
                const { Haptics } = await import('@capacitor/haptics');
                await Haptics.notification({ type: type as any });
            } catch (e) {
                // Silent fail
            }
        }
    },

    selection: async () => {
        if (isNative()) {
            try {
                const { Haptics } = await import('@capacitor/haptics');
                await Haptics.selectionStart();
                await Haptics.selectionChanged();
                await Haptics.selectionEnd();
            } catch (e) {
                // fail
            }
        }
    }
};

export const impactLight = async () => {
    return HapticsService.impact(ImpactStyle.Light);
};

export const impactMedium = async () => {
    return HapticsService.impact(ImpactStyle.Medium);
};
