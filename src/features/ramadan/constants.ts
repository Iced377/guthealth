import type { HighLatitudeRule, RamadanMethod } from './types';

export const RAMADAN_STORAGE_KEY = 'ramadan-config-v1';
export const RAMADAN_REMOTE_KEY = 'ramadan-remote-config-v1';
export const RAMADAN_CONFIG_VERSION = 1;

// Fallback calendar window (can be overridden via Firestore config/ramadan)
export const RAMADAN_FALLBACK_START = '2026-02-18';
export const RAMADAN_FALLBACK_DAYS = 30;

export const RAMADAN_METHODS: Record<RamadanMethod, { label: string; fajrAngle: number; explanation: string }> = {
  MWL: { label: 'MWL', fajrAngle: 18, explanation: 'Widely used globally; balanced twilight angles.' },
  ISNA: { label: 'ISNA', fajrAngle: 15, explanation: 'Common in North America with slightly later Fajr.' },
  Egypt: { label: 'Egypt', fajrAngle: 19.5, explanation: 'Egyptian General Authority of Survey.' },
  UmmAlQura: { label: 'Umm Al-Qura', fajrAngle: 18.5, explanation: 'Makkah-based standard widely used in GCC.' },
  Karachi: { label: 'Karachi', fajrAngle: 18, explanation: 'Popular in South Asia.' },
};

export const RAMADAN_HIGH_LAT_RULES: Record<HighLatitudeRule, { label: string; explanation: string }> = {
  SeventhOfNight: { label: 'Seventh of Night', explanation: 'Shortens night proportionally for high latitudes.' },
  MiddleOfNight: { label: 'Middle of Night', explanation: 'Splits night evenly for safer pre-dawn time.' },
  AngleBased: { label: 'Angle Based', explanation: 'Uses angle proportion relative to night length.' },
};

export const RAMADAN_SUPPORT_ACTIONS = [
  "Bring dates to the office breakroom for iftar.",
  "Send a sunset greeting to a fasting friend.",
  "Offer to take a meeting earlier to respect iftar time.",
  "Plan a post-iftar walk with your team.",
  "Host a light, healthy iftar spread with balanced options.",
  "Check in on a colleague's energy and workload.",
  "Share a healthy suhoor recipe idea.",
  "Offer to cover a late-afternoon task for someone fasting.",
  "Schedule a lighter workout together after iftar.",
];
