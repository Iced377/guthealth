"use client";

import { format } from 'date-fns';
import type { RamadanInjectionContext } from '@/ai/features/ramadan-dietitian';

// Local helper to avoid circular type import
export const buildRamadanInjection = (
  ramadan: {
    isEnabled: boolean;
    mode: 'fasting' | 'witnessing' | 'disabled';
    timings: { suhoor: Date; iftar: Date } | null;
    theme: 'daylight' | 'midnight' | 'standard';
  }
): RamadanInjectionContext | undefined => {
  if (!ramadan.isEnabled || !ramadan.timings || ramadan.mode === 'disabled') return undefined;
  const now = new Date();
  const nextEvent = now < ramadan.timings.iftar ? 'Iftar' : 'Suhoor';
  const nextTime = now < ramadan.timings.iftar ? ramadan.timings.iftar : new Date(ramadan.timings.suhoor.getTime() + 86400000);
  const diffMs = nextTime.getTime() - now.getTime();
  const hours = Math.max(0, Math.floor(diffMs / 3600000));
  const minutes = Math.max(0, Math.floor((diffMs % 3600000) / 60000));

  return {
    mode: ramadan.mode === 'fasting' ? 'fasting' : 'witnessing',
    suhoorTime: format(ramadan.timings.suhoor, 'h:mm a'),
    iftarTime: format(ramadan.timings.iftar, 'h:mm a'),
    nextEvent,
    countdown: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    theme: ramadan.theme,
  };
};
