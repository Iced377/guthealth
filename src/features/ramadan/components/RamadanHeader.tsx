"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import { cn } from '@/lib/utils';
import { useRamadan } from '../useRamadan';
import { formatCountdown, getDefaultMethodForLocation, getNextRamadanEvent } from '../utils';
import { RAMADAN_METHODS } from '../constants';
import { MoonStar, Sun, MapPin } from 'lucide-react';

interface RamadanHeaderProps {
  compact?: boolean;
}

export default function RamadanHeader({ compact = false }: RamadanHeaderProps) {
  const ramadan = useRamadan();
  const router = useRouter();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!ramadan.isAvailable || ramadan.config.status === 'unset' || ramadan.config.status === 'hidden') return null;

  const timings = ramadan.timings;
  const nextEvent = getNextRamadanEvent(now, timings);
  const countdown = nextEvent ? formatCountdown(nextEvent.time, now) : '--:--';
  const resolvedMethod = ramadan.config.method || getDefaultMethodForLocation(ramadan.config.location);
  const methodLabel = RAMADAN_METHODS[resolvedMethod]?.label || 'MWL';

  const themeGlow = ramadan.theme === 'daylight'
    ? "from-amber-500/10 via-transparent to-emerald-500/10"
    : "from-blue-500/10 via-transparent to-purple-500/10";

  const modeLabel = ramadan.config.status === 'fasting' ? 'fasting' : 'witnessing';

  return (
    <GlassCard
      variant="floating"
      intensity="high"
      className={cn(
        "w-full mb-4 border-white/10 overflow-hidden",
        compact ? "p-4" : "p-5"
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", themeGlow)} />
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 50%)"
      }} />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center border border-white/10",
              ramadan.mode === 'fasting' ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"
            )}>
              {ramadan.mode === 'fasting' ? <Sun className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ramadan Mode</p>
              <h3 className="text-lg font-semibold text-foreground capitalize">{modeLabel}</h3>
            </div>
          </div>
          <LiquidPressable
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => router.push('/profile')}
          >
            Adjust Settings
          </LiquidPressable>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Next</p>
            <p className="text-xl font-semibold text-foreground">{nextEvent?.label ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{nextEvent ? format(nextEvent.time, 'h:mm a') : 'Set location to calculate'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Countdown</p>
            <p className="text-xl font-semibold text-foreground">{countdown}</p>
            <p className="text-xs text-muted-foreground">Auto-updates every 30 seconds</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Method</p>
            <p className="text-xl font-semibold text-foreground">{methodLabel}</p>
            <p className="text-xs text-muted-foreground">Calculated locally</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {ramadan.config.location?.city
              ? `${ramadan.config.location.city}${ramadan.config.location.country ? `, ${ramadan.config.location.country}` : ''}`
              : 'Location needed for precise timings'}
          </div>
          {!ramadan.config.location && (
            <LiquidPressable variant="pill" size="sm" onClick={ramadan.requestDeviceLocation} className="bg-white/10">
              Use Device Location
            </LiquidPressable>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
