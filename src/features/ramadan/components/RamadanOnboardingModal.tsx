"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Moon, Sun, HandHeart } from 'lucide-react';
import { useRamadan } from '../useRamadan';
import { cn } from '@/lib/utils';

export default function RamadanOnboardingModal() {
  const ramadan = useRamadan();

  if (!ramadan || !ramadan.isAvailable || ramadan.config.status !== 'unset') return null;

  return (
    <Dialog open>
      <DialogContent className="glass-crystal max-w-md border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-amber-500/10 pointer-events-none" />
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl font-bold">Ramadan Mode</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Tailor your health journey for the month. Choose the experience that fits you today.
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 mt-4 space-y-3">
          <button
            onClick={() => ramadan.setStatus('fasting')}
            className={cn(
              "w-full flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10",
            )}
          >
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Sun className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">I am fasting</p>
              <p className="text-xs text-muted-foreground">Optimize suhoor, iftar, hydration, and training windows.</p>
            </div>
          </button>

          <button
            onClick={() => ramadan.setStatus('witnessing')}
            className="w-full flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Moon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">I am witnessing</p>
              <p className="text-xs text-muted-foreground">Support fasting friends and stay aligned with the schedule.</p>
            </div>
          </button>

          <button
            onClick={() => ramadan.setStatus('hidden')}
            className="w-full flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
          >
            <div className="h-10 w-10 rounded-xl bg-white/10 text-foreground/70 flex items-center justify-center">
              <HandHeart className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Prefer not to share</p>
              <p className="text-xs text-muted-foreground">Ramadan Mode will stay hidden unless you enable it later.</p>
            </div>
          </button>
        </div>

        <div className="relative z-10 pt-4">
          <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => ramadan.setStatus('hidden')}>
            Not right now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
