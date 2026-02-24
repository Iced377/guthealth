import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { AppleHealthSourceTotalsLog, appendAppleHealthDebugLog, readIntegrationDebugFlag } from '@/lib/integration-monitoring';

type HealthSample = {
    value: number;
    startDate: string;
    endDate?: string;
    sourceName?: string;
    sourceId?: string;
};

const normalizeSourceKey = (sample: HealthSample) =>
    (sample.sourceId || sample.sourceName || 'unknown').toLowerCase();

const summarizeSourceTotals = (samples: HealthSample[]) => {
    const totals: Record<string, number> = {};
    let rawTotal = 0;

    for (const sample of samples) {
        const sourceKey = normalizeSourceKey(sample);
        const value = Number(sample.value) || 0;
        rawTotal += value;
        totals[sourceKey] = (totals[sourceKey] || 0) + value;
    }

    return { totals, rawTotal };
};

const persistAppleHealthDebugLog = async (log: AppleHealthSourceTotalsLog) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const logId = `apple-health-${log.label}`;
        await setDoc(doc(db, 'users', user.uid, 'integration_debug_logs', logId), {
            ...log,
            loggedAt: Timestamp.now(),
            platform: 'ios',
            source: 'apple_health'
        }, { merge: true });
    } catch (error) {
        console.warn('[Health][Debug] Failed to persist Apple Health log:', error);
    }
};

const logSourceTotals = (
    label: string,
    samples: HealthSample[],
    dedupedTotal: number,
    options?: { persistRemote?: boolean }
) => {
    if (!readIntegrationDebugFlag()) return;
    const { totals, rawTotal } = summarizeSourceTotals(samples);
    const sources = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([source, steps]) => ({ source, steps: Math.round(steps) }));

    const logPayload: AppleHealthSourceTotalsLog = {
        id: `apple-health-${label}-${Date.now()}`,
        label,
        timestamp: new Date().toISOString(),
        rawTotal: Math.round(rawTotal),
        dedupedTotal: Math.round(dedupedTotal),
        sampleCount: samples.length,
        sources
    };

    appendAppleHealthDebugLog(logPayload);
    if (options?.persistRemote) {
        void persistAppleHealthDebugLog(logPayload);
    }

    console.log(`[Health][Debug] Steps by source (${label})`, {
        sources,
        rawTotal: Math.round(rawTotal),
        dedupedTotal,
        sampleCount: samples.length
    });
};

// Deduplicate overlapping sources by taking the MAX source total per hour.
// This approximates Apple Health's source-priority behavior and avoids double counting.
const sumStepsWithHourlySourceDedup = (samples: HealthSample[]): number => {
    if (!samples.length) return 0;

    const hourBuckets = new Map<string, Map<string, number>>();

    for (const sample of samples) {
        const start = new Date(sample.startDate);
        if (Number.isNaN(start.getTime())) continue;

        const bucketKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}T${String(start.getHours()).padStart(2, '0')}`;
        const sourceKey = normalizeSourceKey(sample);
        const value = Number(sample.value) || 0;

        if (!hourBuckets.has(bucketKey)) {
            hourBuckets.set(bucketKey, new Map<string, number>());
        }
        const sourceTotals = hourBuckets.get(bucketKey)!;
        sourceTotals.set(sourceKey, (sourceTotals.get(sourceKey) || 0) + value);
    }

    let total = 0;
    for (const sourceTotals of hourBuckets.values()) {
        const maxForHour = Math.max(...Array.from(sourceTotals.values()), 0);
        total += maxForHour;
    }

    return Math.round(total);
};

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
            // Check if we already have permissions safely
            try {
                const status = await Health.checkAuthorization({ read: ['steps'] });
                if (status.readAuthorized.includes('steps')) {
                    console.log("[Health] Permissions already granted");
                    return;
                }
            } catch (e) {
                console.log("[Health] checkAuthorization failed, proceeding to requestAuthorization");
            }

            await Health.requestAuthorization({
                read: ['steps'],
                write: ['steps']
            });
        } catch (error) {
            console.error('Error requesting Apple Health permissions:', error);
        }
    },

    getTodaySteps: async (): Promise<number> => {
        if (Capacitor.getPlatform() !== 'ios') return 0;
        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // 1. Guard against unauthorized access
            try {
                const status = await Health.checkAuthorization({ read: ['steps'] });
                if (!status.readAuthorized.includes('steps')) {
                    console.warn('[Health] Fetch blocked: Steps not authorized');
                    return 0;
                }
            } catch (e) {
                console.warn('[Health] checkAuthorization failed in getTodaySteps');
                return 0;
            }

            // 2. Fetch all step samples for today
            const result = await Health.readSamples({
                dataType: 'steps',
                startDate: startOfDay.toISOString(),
                endDate: now.toISOString(),
                limit: 5000,
            });
            const samples = result.samples as HealthSample[];
            const dedupedTotal = sumStepsWithHourlySourceDedup(samples);
            const dayLabel = `${startOfDay.getFullYear()}-${String(startOfDay.getMonth() + 1).padStart(2, '0')}-${String(startOfDay.getDate()).padStart(2, '0')}`;
            logSourceTotals(dayLabel, samples, dedupedTotal, { persistRemote: true });
            return dedupedTotal;

        } catch (error: any) {
            const errMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
            console.warn('[Health] Today steps fetch suppressed (safely):', errMsg);
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

            // 1. Guard
            try {
                const status = await Health.checkAuthorization({ read: ['steps'] });
                if (!status.readAuthorized.includes('steps')) {
                    return [];
                }
            } catch (e) {
                return [];
            }

            // 2. Fetch
            const result = await Health.readSamples({
                dataType: 'steps',
                startDate: startDate.toISOString(),
                endDate: now.toISOString(),
                limit: 10000, // Increase limit for 30 days
                ascending: true
            });

            return result.samples;
        } catch (error: any) {
            const errMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
            console.warn('[Health] Raw samples fetch suppressed (safely):', errMsg);
            return [];
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

                // 1. Guard check
                try {
                    const status = await Health.checkAuthorization({ read: ['steps'] });
                    if (!status.readAuthorized.includes('steps')) {
                        return;
                    }
                } catch (e) {
                    return;
                }

                // 2. Use existing logic for specific day
                const result = await Health.readSamples({
                    dataType: 'steps',
                    startDate: startOfDay.toISOString(),
                    endDate: endOfDay.toISOString(),
                    limit: 3000,
                });

                const samples = result.samples as HealthSample[];
                if (!samples.length) return;
                const total = sumStepsWithHourlySourceDedup(samples);

                // Key: YYYY-MM-DD (Local)
                const year = startOfDay.getFullYear();
                const month = String(startOfDay.getMonth() + 1).padStart(2, '0');
                const day = String(startOfDay.getDate()).padStart(2, '0');
                const key = `${year}-${month}-${day}`;

                // Only persist today's log remotely to avoid flooding the database.
                logSourceTotals(key, samples, total, { persistRemote: offset === 0 });
                dailyTotals[key] = Math.round(total);
            };

            // Sequential execution for stability
            for (let i = 0; i < days; i++) {
                await processDay(i);
            }

            return dailyTotals;

        } catch (error: any) {
            // Log for debugging but return empty object to prevent app crash
            const errMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
            console.warn('[Health] Daily history fetch suppressed (safely):', errMsg);
            return {};
        }
    }
};
