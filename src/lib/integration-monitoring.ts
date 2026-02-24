export const INTEGRATION_DEBUG_STORAGE_KEY = 'integration.debug.appleHealthSourceTotals';
export const INTEGRATION_DEBUG_LAST_KEY = 'integration.debug.appleHealthSourceTotals.last';
export const INTEGRATION_DEBUG_HISTORY_KEY = 'integration.debug.appleHealthSourceTotals.history';

export type AppleHealthSourceTotalsLog = {
    id: string;
    label: string;
    timestamp: string;
    rawTotal: number;
    dedupedTotal: number;
    sampleCount: number;
    sources: { source: string; steps: number }[];
};

export const readIntegrationDebugFlag = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem(INTEGRATION_DEBUG_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

export const writeIntegrationDebugFlag = (enabled: boolean): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(INTEGRATION_DEBUG_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
        // No-op: storage might be unavailable (private mode / disabled).
    }
};

const safeParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

export const readAppleHealthDebugLog = (): AppleHealthSourceTotalsLog | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(INTEGRATION_DEBUG_LAST_KEY);
        return safeParse<AppleHealthSourceTotalsLog | null>(raw, null);
    } catch {
        return null;
    }
};

export const readAppleHealthDebugHistory = (): AppleHealthSourceTotalsLog[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(INTEGRATION_DEBUG_HISTORY_KEY);
        return safeParse<AppleHealthSourceTotalsLog[]>(raw, []);
    } catch {
        return [];
    }
};

export const appendAppleHealthDebugLog = (log: AppleHealthSourceTotalsLog, maxEntries: number = 20): void => {
    if (typeof window === 'undefined') return;
    try {
        const history = readAppleHealthDebugHistory();
        const next = [log, ...history].slice(0, maxEntries);
        localStorage.setItem(INTEGRATION_DEBUG_LAST_KEY, JSON.stringify(log));
        localStorage.setItem(INTEGRATION_DEBUG_HISTORY_KEY, JSON.stringify(next));
    } catch {
        // No-op
    }
};

export const clearAppleHealthDebugHistory = (): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(INTEGRATION_DEBUG_LAST_KEY);
        localStorage.removeItem(INTEGRATION_DEBUG_HISTORY_KEY);
    } catch {
        // No-op
    }
};
