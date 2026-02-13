"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useActionContext } from '@/contexts/ActionContext';
import { db } from '@/config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { RAMADAN_FALLBACK_DAYS, RAMADAN_FALLBACK_START, RAMADAN_REMOTE_KEY } from './constants';
import { calculateRamadanTimings, getDefaultMethodForLocation, getFastingTheme } from './utils';
import {
  configStatusToMode,
  loadRamadanConfig,
  loadTimingsCache,
  mergeRemoteConfig,
  saveTimingsCache,
  sanitizeForProfile,
  saveRamadanConfig,
} from './storage';
import type { RamadanConfig, RamadanMode, RamadanTimings } from './types';
import { RAMADAN_ENABLED } from '@/lib/featureFlags';

interface RamadanContextValue {
  isAvailable: boolean;
  isEnabled: boolean;
  isWithinWindow: boolean;
  windowStart: Date | null;
  windowEnd: Date | null;
  mode: RamadanMode;
  timings: RamadanTimings | null;
  theme: 'daylight' | 'midnight' | 'standard';
  config: RamadanConfig;
  isLoading: boolean;
  setStatus: (status: RamadanConfig['status']) => void;
  setMethod: (method: RamadanConfig['method']) => void;
  setHighLatitudeRule: (rule: RamadanConfig['highLatitudeRule']) => void;
  setQuietHours: (enabled: boolean) => void;
  requestDeviceLocation: () => Promise<void>;
  setManualLocation: (params: { lat: number; lng: number; city: string; country?: string; tz?: string; cityId?: string }) => void;
}

const DisabledState: RamadanContextValue = {
  isAvailable: false,
  isEnabled: false,
  isWithinWindow: false,
  windowStart: null,
  windowEnd: null,
  mode: 'disabled',
  timings: null,
  theme: 'standard',
  config: { status: 'unset', quietHours: true },
  isLoading: false,
  setStatus: () => {},
  setMethod: () => {},
  setHighLatitudeRule: () => {},
  setQuietHours: () => {},
  requestDeviceLocation: async () => {},
  setManualLocation: () => {},
};

export const RamadanContext = createContext<RamadanContextValue>(DisabledState);

const REMOTE_TTL_MS = 6 * 60 * 60 * 1000;

type RamadanRemoteConfig = { enabled: boolean; fetchedAt: number; startDate?: string; endDate?: string };

const loadRemoteFlag = (): RamadanRemoteConfig | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RAMADAN_REMOTE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RamadanRemoteConfig;
    if (!parsed.fetchedAt || Date.now() - parsed.fetchedAt > REMOTE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveRemoteFlag = (config: RamadanRemoteConfig) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RAMADAN_REMOTE_KEY, JSON.stringify(config));
};

export const RamadanProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { userProfile } = useActionContext();
  const [config, setConfig] = useState<RamadanConfig>(() => loadRamadanConfig());
  const cachedRemote = loadRemoteFlag();
  const [remoteEnabled, setRemoteEnabled] = useState<boolean>(() => cachedRemote?.enabled ?? true);
  const [remoteStartDate, setRemoteStartDate] = useState<string | undefined>(() => cachedRemote?.startDate);
  const [remoteEndDate, setRemoteEndDate] = useState<string | undefined>(() => cachedRemote?.endDate);
  const [isLoading, setIsLoading] = useState(false);
  const [dayStamp, setDayStamp] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const buildEnabled = RAMADAN_ENABLED;

  useEffect(() => {
    if (!buildEnabled) return;
    if (config.status === 'hidden') return;
    if (!user) return;
    const cached = loadRemoteFlag();
    if (cached !== null) {
      setRemoteEnabled(cached.enabled);
      setRemoteStartDate(cached.startDate);
      setRemoteEndDate(cached.endDate);
      return;
    }
    let isActive = true;
    const fetchRemote = async () => {
      try {
        const ref = doc(db, 'config', 'ramadan');
        const snap = await getDoc(ref);
        if (!isActive) return;
        if (snap.exists()) {
          const data = snap.data() as { enabled?: boolean; startDate?: string; endDate?: string };
          const enabled = data.enabled !== false;
          setRemoteEnabled(enabled);
          setRemoteStartDate(data.startDate);
          setRemoteEndDate(data.endDate);
          saveRemoteFlag({ enabled, fetchedAt: Date.now(), startDate: data.startDate, endDate: data.endDate });
        } else {
          setRemoteEnabled(true);
          saveRemoteFlag({ enabled: true, fetchedAt: Date.now() });
        }
      } catch {
        setRemoteEnabled(true);
      }
    };
    fetchRemote();
    return () => {
      isActive = false;
    };
  }, [buildEnabled, config.status, user]);

  useEffect(() => {
    if (!userProfile?.ramadanConfig) return;
    const merged = mergeRemoteConfig(config, userProfile.ramadanConfig);
    setConfig(merged);
    saveRamadanConfig(merged);
  }, [userProfile?.ramadanConfig]);

  const updateConfig = useCallback(
    async (partial: Partial<RamadanConfig>, syncProfile: boolean) => {
      const next: RamadanConfig = {
        ...config,
        ...partial,
        updatedAt: Date.now(),
      };
      setConfig(next);
      saveRamadanConfig(next);

      if (syncProfile && user && user.uid !== 'guest-user') {
        try {
          const profileRef = doc(db, 'users', user.uid);
          await setDoc(profileRef, { ramadanConfig: sanitizeForProfile(next) }, { merge: true });
        } catch (err) {
          console.error('[Ramadan] Failed to sync config', err);
        }
      }
    },
    [config, user]
  );

  const setStatus = useCallback(
    (status: RamadanConfig['status']) => {
      updateConfig({ status }, true);
    },
    [updateConfig]
  );

  const setMethod = useCallback(
    (method: RamadanConfig['method']) => {
      updateConfig({ method }, true);
    },
    [updateConfig]
  );

  const setHighLatitudeRule = useCallback(
    (highLatitudeRule: RamadanConfig['highLatitudeRule']) => {
      updateConfig({ highLatitudeRule }, true);
    },
    [updateConfig]
  );

  const setQuietHours = useCallback(
    (quietHours: boolean) => {
      updateConfig({ quietHours }, true);
    },
    [updateConfig]
  );

  const requestDeviceLocation = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setIsLoading(true);
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nextLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: 'device' as const,
            updatedAt: Date.now(),
          };
          updateConfig({ location: nextLocation }, false);
          setIsLoading(false);
          resolve();
        },
        () => {
          setIsLoading(false);
          resolve();
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 3600000 }
      );
    });
  }, [updateConfig]);

  const setManualLocation = useCallback(
    (params: { lat: number; lng: number; city: string; country?: string; tz?: string; cityId?: string }) => {
      updateConfig(
        {
          location: {
            lat: params.lat,
            lng: params.lng,
            city: params.city,
            country: params.country,
            tz: params.tz,
            source: 'manual',
            updatedAt: Date.now(),
          },
          cityId: params.cityId,
        },
        true
      );
    },
    [updateConfig]
  );

  useEffect(() => {
    if (!buildEnabled || !remoteEnabled) return;
    if (config.status !== 'fasting' && config.status !== 'witnessing') return;
    if (!config.location) {
      requestDeviceLocation();
    }
  }, [buildEnabled, remoteEnabled, config.status, config.location, requestDeviceLocation]);

  useEffect(() => {
    const id = setInterval(() => {
      const nextStamp = new Date().toISOString().slice(0, 10);
      setDayStamp((prev) => (prev === nextStamp ? prev : nextStamp));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const timings = useMemo(() => {
    if (!config.location) return null;
    const method = config.method || getDefaultMethodForLocation(config.location);
    const rule = config.highLatitudeRule || 'SeventhOfNight';
    const cacheKey = `${config.location.lat.toFixed(2)}:${config.location.lng.toFixed(2)}:${method}:${rule}`;
    const cached = loadTimingsCache(cacheKey);
    const todayKey = new Date().toISOString().slice(0, 10);
    if (cached?.days?.length) {
      const match = cached.days.find((day) => day.date === todayKey);
      if (match) {
        return {
          date: match.date,
          suhoor: new Date(match.suhoor),
          iftar: new Date(match.iftar),
          method,
          highLatitudeRule: rule,
        };
      }
    }

    const computed = calculateRamadanTimings(new Date(), config.location.lat, config.location.lng, method, rule);
    if (computed) {
      const days = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        const dayTiming = calculateRamadanTimings(date, config.location!.lat, config.location!.lng, method, rule);
        return dayTiming
          ? {
              date: dayTiming.date,
              suhoor: dayTiming.suhoor.toISOString(),
              iftar: dayTiming.iftar.toISOString(),
              method,
              rule,
            }
          : null;
      }).filter(Boolean) as { date: string; suhoor: string; iftar: string; method: string; rule: string }[];
      saveTimingsCache(cacheKey, days);
    }
    return computed;
  }, [config.location, config.method, config.highLatitudeRule, dayStamp]);

  const theme = useMemo(() => getFastingTheme(new Date(), timings), [timings]);

  const isAvailable = buildEnabled && remoteEnabled;
  const windowStart = useMemo(() => {
    const value = remoteStartDate || RAMADAN_FALLBACK_START;
    return value ? new Date(`${value}T00:00:00`) : null;
  }, [remoteStartDate]);
  const windowEnd = useMemo(() => {
    if (!windowStart) return null;
    if (remoteEndDate) return new Date(`${remoteEndDate}T23:59:59`);
    const end = new Date(windowStart);
    end.setDate(end.getDate() + (RAMADAN_FALLBACK_DAYS - 1));
    return end;
  }, [windowStart, remoteEndDate]);
  const now = new Date();
  const isWithinWindow = !!(windowStart && windowEnd && now >= windowStart && now <= windowEnd);

  const isEnabled = isAvailable && isWithinWindow && (config.status === 'fasting' || config.status === 'witnessing');
  const mode = isEnabled ? configStatusToMode(config.status) : 'disabled';

  const value = useMemo<RamadanContextValue>(
    () => ({
      isEnabled,
      isAvailable,
      isWithinWindow,
      windowStart,
      windowEnd,
      mode,
      timings,
      theme,
      config,
      isLoading,
      setStatus,
      setMethod,
      setHighLatitudeRule,
      setQuietHours,
      requestDeviceLocation,
      setManualLocation,
    }),
    [
      isEnabled,
      isAvailable,
      isWithinWindow,
      windowStart,
      windowEnd,
      mode,
      timings,
      theme,
      config,
      isLoading,
      setStatus,
      setMethod,
      setHighLatitudeRule,
      setQuietHours,
      requestDeviceLocation,
      setManualLocation,
    ]
  );

  return <RamadanContext.Provider value={value}>{children}</RamadanContext.Provider>;
};
