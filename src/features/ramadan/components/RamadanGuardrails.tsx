"use client";

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { GlassCard } from '@/components/ui/GlassCard';
import { LiquidPressable } from '@/components/ui/LiquidPressable';
import { HandHeart, ShieldCheck, UtensilsCrossed, Activity, Droplet } from 'lucide-react';
import { useRamadan } from '../useRamadan';
import { RAMADAN_SUPPORT_ACTIONS } from '../constants';
import { cn } from '@/lib/utils';

export default function RamadanGuardrails() {
  const ramadan = useRamadan();

  if (!ramadan.isEnabled) return null;

  const dailyAction = useMemo(() => {
    const seed = new Date().getDate() % RAMADAN_SUPPORT_ACTIONS.length;
    return RAMADAN_SUPPORT_ACTIONS[seed];
  }, []);

  if (ramadan.mode === 'witnessing') {
    return (
      <GlassCard variant="default" intensity="medium" className="w-full mb-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <HandHeart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Witnessing Mode</p>
              <h4 className="text-base font-semibold text-foreground">Daily Support Action</h4>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Quiet Hours
            <Switch checked={ramadan.config.quietHours ?? true} onCheckedChange={ramadan.setQuietHours} />
          </div>
        </div>

        <p className="mt-3 text-sm text-foreground/90">{dailyAction}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <LiquidPressable variant="pill" size="sm" className="bg-white/10">
                Etiquette Guide
              </LiquidPressable>
            </DialogTrigger>
            <DialogContent className="glass-crystal max-w-md">
              <DialogHeader>
                <DialogTitle>Ramadan Etiquette (Quick Guide)</DialogTitle>
                <DialogDescription>
                  Respectful, simple ways to show support in shared spaces.
                </DialogDescription>
              </DialogHeader>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Be mindful of meetings near iftar time.</li>
                <li>Offer flexible meal breaks for fasting teammates.</li>
                <li>Keep food notifications quiet during daylight hours.</li>
                <li>Choose light, balanced options for shared meals.</li>
              </ul>
            </DialogContent>
          </Dialog>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Health-first guidance
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="default" intensity="medium" className="w-full mb-4 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
          <UtensilsCrossed className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fasting Guardrails</p>
          <h4 className="text-base font-semibold text-foreground">Stay steady all day</h4>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
            <Droplet className="h-4 w-4 text-emerald-400" />
            Hydration Pace
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Front-load water at suhoor, then taper after iftar.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
            <UtensilsCrossed className="h-4 w-4 text-amber-400" />
            Iftar Balance
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Break fast gently: protein + fiber + slow carbs.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
            <Activity className="h-4 w-4 text-blue-400" />
            Training Window
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Best sessions: 60–90 min after iftar.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Use the Coach for fasting-safe meal guidance.</span>
        <span className={cn("text-foreground/80")}>Ramadan Context Active</span>
      </div>
    </GlassCard>
  );
}
