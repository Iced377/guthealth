"use client";

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useRamadan } from '../useRamadan';

export default function RamadanDashboardDecor() {
  const ramadan = useRamadan();

  if (!ramadan.isEnabled) return null;

  const bulbs = useMemo(() => Array.from({ length: 9 }).map((_, i) => i), []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      <div className="relative mx-auto w-full max-w-6xl px-6 pt-4">
        <div className="flex items-center justify-between">
          {bulbs.map((i) => (
            <div
              key={`ramadan-light-${i}`}
              className={cn(
                "h-3 w-3 rounded-full blur-[0.5px]",
                i % 3 === 0 ? "bg-amber-300/70" : i % 3 === 1 ? "bg-emerald-300/70" : "bg-blue-300/70"
              )}
              style={{ boxShadow: "0 0 16px rgba(255,255,255,0.25)" }}
            />
          ))}
        </div>
        <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute -bottom-6 right-8 h-10 w-10 rounded-full bg-amber-400/10 blur-2xl" />
        <div className="absolute -bottom-8 left-10 h-12 w-12 rounded-full bg-emerald-400/10 blur-2xl" />
      </div>
    </div>
  );
}
