"use client";

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RAMADAN_CITIES } from '../data/cities';
import RamadanPrimaryButton from './RamadanPrimaryButton';

interface RamadanCityPickerProps {
  onSelect: (city: { id: string; name: string; country: string; lat: number; lng: number; tz?: string }) => void;
  triggerLabel?: string;
  trigger?: React.ReactNode;
}

export default function RamadanCityPicker({ onSelect, triggerLabel = 'Select City', trigger }: RamadanCityPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return RAMADAN_CITIES;
    return RAMADAN_CITIES.filter((city) =>
      `${city.name} ${city.country}`.toLowerCase().includes(term)
    );
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <RamadanPrimaryButton>{triggerLabel}</RamadanPrimaryButton>}
      </DialogTrigger>
      <DialogContent className="glass-crystal max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Nearest City</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search city"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-white/5 border-white/10"
        />
        <ScrollArea className="h-72 mt-3 rounded-xl border border-white/10">
          <div className="p-2 space-y-1">
            {filtered.map((city) => (
              <button
                key={city.id}
                onClick={() => {
                  onSelect(city);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition"
              >
                <p className="text-sm font-medium text-foreground">{city.name}</p>
                <p className="text-xs text-muted-foreground">{city.country}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-4 text-xs text-muted-foreground">No matches found.</div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
