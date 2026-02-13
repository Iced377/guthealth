'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRamadan } from '@/features/ramadan/useRamadan';
import RamadanHeader from '@/features/ramadan/components/RamadanHeader';
import RamadanGuardrails from '@/features/ramadan/components/RamadanGuardrails';
import RamadanSettingsPanel from '@/features/ramadan/components/RamadanSettingsPanel';
import { MoonStar, Sparkles, Sun, Timer } from 'lucide-react';
import RamadanPrimaryButton from '@/features/ramadan/components/RamadanPrimaryButton';

export default function RamadanDiscoverPage() {
  const ramadan = useRamadan();

  const countdown = useMemo(() => {
    if (!ramadan.windowStart) return null;
    const now = new Date();
    const diff = ramadan.windowStart.getTime() - now.getTime();
    if (diff <= 0) return null;
    const days = Math.ceil(diff / 86400000);
    return `${days} days`;
  }, [ramadan.windowStart]);

  return (
    <div
      className="min-h-screen w-full px-6 pb-24 pt-8"
      style={{
        backgroundImage: "url('/ramadan-bg.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top left',
        backgroundSize: '100% auto',
        backgroundAttachment: 'fixed',
        backgroundColor: '#0b2a22',
      }}
    >
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Ramadan Hub</h1>
        </div>

        {ramadan.isAvailable && ramadan.windowStart && ramadan.windowEnd && (
          <GlassCard variant="default" intensity="medium" className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Timer className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Auto Activation</p>
                  <p className="text-base font-semibold text-foreground">
                    {format(ramadan.windowStart, 'MMM d, yyyy')} → {format(ramadan.windowEnd, 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">Auto‑activation window.</p>
                </div>
              </div>
              {countdown && (
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted-foreground">
                  Starts in {countdown}
                </div>
              )}
            </div>
          </GlassCard>
        )}

        <RamadanHeader />

        {ramadan.isEnabled && <RamadanGuardrails />}

        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard variant="default" intensity="medium" className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fasting Optimization</p>
                <h3 className="text-lg font-semibold text-foreground">Suhoor • Iftar • Training</h3>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Hydration front‑load at suhoor.</li>
              <li>Break fast gently: protein + fiber.</li>
              <li>Train 60–90 min post‑iftar.</li>
            </ul>
          </GlassCard>

          <GlassCard variant="default" intensity="medium" className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <MoonStar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Witnessing Support</p>
                <h3 className="text-lg font-semibold text-foreground">Quiet Hours • Etiquette</h3>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Mute food nudges in daylight.</li>
              <li>Respect iftar timing in schedules.</li>
              <li>Offer light, balanced options.</li>
            </ul>
          </GlassCard>
        </div>

        <RamadanSettingsPanel />

        <div className="flex justify-end">
          <RamadanPrimaryButton onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top
          </RamadanPrimaryButton>
        </div>
      </div>
    </div>
  );
}
