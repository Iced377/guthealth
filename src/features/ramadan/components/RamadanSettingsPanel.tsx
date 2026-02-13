"use client";

import { useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRamadan } from '../useRamadan';
import { RAMADAN_HIGH_LAT_RULES, RAMADAN_METHODS } from '../constants';
import { getDefaultMethodForLocation } from '../utils';
import RamadanCityPicker from './RamadanCityPicker';
import { format } from 'date-fns';
import RamadanPrimaryButton from './RamadanPrimaryButton';

export default function RamadanSettingsPanel() {
  const ramadan = useRamadan();

  const statusLabel = useMemo(() => {
    if (ramadan.config.status === 'fasting') return 'Fasting';
    if (ramadan.config.status === 'witnessing') return 'Witnessing';
    if (ramadan.config.status === 'hidden') return 'Hidden';
    return 'Unset';
  }, [ramadan.config.status]);

  if (!ramadan.isAvailable) return null;

  return (
    <GlassCard variant="default" intensity="medium" className="p-5 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ramadan Settings</p>
        <h3 className="text-lg font-semibold text-foreground">Mode: {statusLabel}</h3>
        {ramadan.windowStart && ramadan.windowEnd && (
          <p className="text-[11px] text-muted-foreground">
            Auto-activates from {format(ramadan.windowStart, 'MMM d, yyyy')} to {format(ramadan.windowEnd, 'MMM d, yyyy')}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Experience</p>
          <Select value={ramadan.config.status} onValueChange={(value) => ramadan.setStatus(value as any)}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Choose mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fasting">Fasting</SelectItem>
              <SelectItem value="witnessing">Witnessing</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Quiet Hours</p>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="text-sm text-foreground">Mute food notifications during daylight</span>
            <Switch checked={ramadan.config.quietHours ?? true} onCheckedChange={ramadan.setQuietHours} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Calculation Method</p>
          <Select value={ramadan.config.method || getDefaultMethodForLocation(ramadan.config.location)} onValueChange={(value) => ramadan.setMethod(value as any)}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RAMADAN_METHODS).map(([key, data]) => (
                <SelectItem key={key} value={key}>{data.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">{RAMADAN_METHODS[ramadan.config.method || getDefaultMethodForLocation(ramadan.config.location)].explanation}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">High Latitude Rule</p>
          <Select value={ramadan.config.highLatitudeRule || 'SeventhOfNight'} onValueChange={(value) => ramadan.setHighLatitudeRule(value as any)}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select rule" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RAMADAN_HIGH_LAT_RULES).map(([key, data]) => (
                <SelectItem key={key} value={key}>{data.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">{RAMADAN_HIGH_LAT_RULES[ramadan.config.highLatitudeRule || 'SeventhOfNight'].explanation}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <RamadanPrimaryButton onClick={ramadan.requestDeviceLocation}>
          Use Device Location
        </RamadanPrimaryButton>
        <RamadanCityPicker
          onSelect={(city) => ramadan.setManualLocation({ lat: city.lat, lng: city.lng, city: city.name, country: city.country, tz: city.tz, cityId: city.id })}
          triggerLabel="Select City"
          trigger={<RamadanPrimaryButton>Select City</RamadanPrimaryButton>}
        />
        {ramadan.config.location?.city && (
          <span className="text-xs text-muted-foreground">
            Using: {ramadan.config.location.city}{ramadan.config.location.country ? `, ${ramadan.config.location.country}` : ''}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
