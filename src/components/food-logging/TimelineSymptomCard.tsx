'use client';

import type { SymptomLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, Clock, Activity, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

interface TimelineSymptomCardProps {
  item: SymptomLog;
  onRemoveItem: (itemId: string) => void;
}

export default function TimelineSymptomCard({ item, onRemoveItem }: TimelineSymptomCardProps) {
  const exactTime = format(new Date(item.timestamp), 'h:mm a');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const severityMap: { [key: number]: { label: string, color: string } } = {
    1: { label: 'Mild', color: 'bg-green-500/20 text-green-500' },
    2: { label: 'Slight', color: 'bg-yellow-500/20 text-yellow-500' },
    3: { label: 'Moderate', color: 'bg-orange-500/20 text-orange-500' },
    4: { label: 'Severe', color: 'bg-red-500/20 text-red-500' },
    5: { label: 'Very Severe', color: 'bg-red-600/30 text-red-600' },
  };

  const severityInfo = item.severity ? severityMap[item.severity] : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group flex items-center justify-between py-3 px-2 cursor-pointer hover:bg-white/5 rounded-xl transition-all active:scale-[0.99]">
          {/* Left: Time and Title (Text that fits background) */}
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-xs font-medium text-muted-foreground/60 group-hover:text-muted-foreground min-w-[50px]">
              {exactTime}
            </span>

            <div className="flex items-center gap-2 overflow-hidden">
              {/* Glowing Dot - Visual anchor */}
              <div className={cn(
                "w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]",
                item.severity && item.severity >= 4 ? "text-red-500 bg-red-500" : "text-orange-400 bg-orange-400"
              )} />

              <span className="text-sm font-medium text-foreground/70 group-hover:text-foreground transition-colors truncate">
                {item.symptoms.map(s => s.name).join(', ')}
              </span>
            </div>
          </div>

          {/* Right: Subtle Chevron or Severity? Let's keep it minimal as requested */}
          {severityInfo && (
            <span className={cn(
              "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md opacity-60 group-hover:opacity-100 transition-opacity",
              severityInfo.color
            )}>
              {severityInfo.label}
            </span>
          )}
        </div>
      </DialogTrigger>

      {/* Expanded Card (Liquid Crystal Style) */}
      <DialogContent
        className="glass-crystal p-0 overflow-hidden 
                fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 
                w-[90vw] max-w-sm rounded-[40px] shadow-2xl
                data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2
                data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2"
      >
        <div className="relative h-40 bg-gradient-to-b from-orange-500/20 to-transparent">
          {/* Background Icon */}
          <Activity className="absolute bottom-4 right-4 w-32 h-32 text-orange-500 opacity-20 rotate-12" />

          <DialogClose className="absolute top-4 right-4 bg-black/20 hover:bg-black/30 text-white rounded-full p-2 backdrop-blur-md transition-colors z-50">
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </DialogClose>

          <div className="absolute bottom-4 left-6 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-orange-400 fill-orange-400/20" />
              <span className="text-xs font-bold text-orange-300 uppercase tracking-widest">Symptom Log</span>
            </div>
            <DialogTitle className="text-2xl font-bold font-headline leading-none">
              {item.symptoms.length} Symptoms
            </DialogTitle>
            <p className="text-sm opacity-70 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {exactTime}</p>
          </div>
        </div>

        <div className="p-6 space-y-6 bg-background/40 backdrop-blur-xl">

          {/* Severity Display */}
          {severityInfo && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold opacity-60 uppercase tracking-wider">Severity Reached</h3>
              <div className="flex items-center gap-3">
                <div className={cn("text-lg font-bold px-3 py-1 rounded-lg border border-white/10", severityInfo.color)}>
                  {item.severity} / 5
                </div>
                <span className="text-lg font-medium opacity-80">{severityInfo.label}</span>
              </div>
            </div>
          )}

          {/* Symptoms List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold opacity-60 uppercase tracking-wider">Reported Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {item.symptoms.map(s => (
                <div key={s.name} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span className="font-medium text-sm">{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes if any */}
          {item.notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold opacity-60 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3" /> Notes
              </h3>
              <div className="p-3 bg-white/5 rounded-2xl text-sm leading-relaxed opacity-90 border border-white/5">
                "{item.notes}"
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs text-muted-foreground/50">ID: {item.id.slice(0, 8)}</span>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-auto py-2 px-3 rounded-xl gap-2 text-sm">
                  <Trash2 className="w-4 h-4" /> Delete Entry
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-crystal border-0 max-w-[320px] rounded-[20px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Log?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-between gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto mt-0 bg-transparent border border-white/20 rounded-xl h-11">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onRemoveItem(item.id)}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl h-11"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
