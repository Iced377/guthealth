import type { RamadanConfig, RamadanProfileConfig, RamadanStatus } from './types';
import { RAMADAN_STORAGE_KEY } from './constants';

const TIMINGS_CACHE_KEY = 'ramadan-timings-cache-v1';

const defaultConfig: RamadanConfig = {
  status: 'unset',
  quietHours: true,
  updatedAt: Date.now(),
};

export const loadRamadanConfig = (): RamadanConfig => {
  if (typeof window === 'undefined') return defaultConfig;
  try {
    const raw = localStorage.getItem(RAMADAN_STORAGE_KEY);
    if (!raw) return defaultConfig;
    const parsed = JSON.parse(raw) as RamadanConfig;
    return {
      ...defaultConfig,
      ...parsed,
    };
  } catch {
    return defaultConfig;
  }
};

export const saveRamadanConfig = (config: RamadanConfig) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RAMADAN_STORAGE_KEY, JSON.stringify(config));
};

export const mergeRemoteConfig = (local: RamadanConfig, remote?: RamadanProfileConfig | null): RamadanConfig => {
  if (!remote) return local;
  const localUpdatedAt = local.updatedAt || 0;
  const remoteUpdatedAt = remote.updatedAt || 0;
  if (remoteUpdatedAt > localUpdatedAt) {
    return {
      ...local,
      status: remote.status || local.status,
      method: remote.method || local.method,
      highLatitudeRule: remote.highLatitudeRule || local.highLatitudeRule,
      quietHours: typeof remote.quietHours === 'boolean' ? remote.quietHours : local.quietHours,
      updatedAt: remoteUpdatedAt,
    };
  }
  return local;
};

export const configStatusToMode = (status: RamadanStatus) => {
  if (status === 'fasting') return 'fasting';
  if (status === 'witnessing') return 'witnessing';
  return 'disabled';
};

export const sanitizeForProfile = (config: RamadanConfig): RamadanProfileConfig => ({
  status: config.status,
  mode: configStatusToMode(config.status),
  method: config.method,
  highLatitudeRule: config.highLatitudeRule,
  city: config.location?.city,
  tz: config.location?.tz,
  quietHours: config.quietHours,
  updatedAt: config.updatedAt,
});

export const loadTimingsCache = (cacheKey: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TIMINGS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { key: string; days: any[]; updatedAt: number };
    if (parsed.key !== cacheKey) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveTimingsCache = (cacheKey: string, days: { date: string; suhoor: string; iftar: string; method: string; rule: string }[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TIMINGS_CACHE_KEY, JSON.stringify({ key: cacheKey, days, updatedAt: Date.now() }));
};
