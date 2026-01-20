'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Symptom, LoggedSymptom } from '@/types';
import { SymptomLogTriggerContext } from '@/contexts/ActionContext';
import { format } from 'date-fns';
import LiquidChartCarousel from '@/components/trends/LiquidChartCarousel';
import {
  Activity,
  AlertCircle,
  Calendar as CalendarIcon,
  Wind, // Bloating/Gas
  Zap, // Pain/Cramps
  Waves, // Nausea
  Flame, // Reflux
  ListPlus,
  Loader2,
  Check,
  X // Close icon
} from 'lucide-react';
import { HapticsService } from '@/lib/haptics';

interface SymptomLoggingDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLogSymptoms: (symptoms: LoggedSymptom[], notes?: string, severity?: number, linkedFoodItemIds?: string[], experiencedAt?: Date, triggerContext?: any) => void;
  allSymptoms: Symptom[];
  context?: SymptomLogTriggerContext;
}

// Internal Card Component
const SymptomCard = ({
  symptom,
  isSelected,
  severity,
  onToggle,
  onSeverityChange,
  isCustom = false,
  customName = '',
  onCustomNameChange,
  isDarkMode
}: {
  symptom: Symptom | { id: string, name: string };
  isSelected: boolean;
  severity: number;
  onToggle: () => void;
  onSeverityChange: (e: React.MouseEvent, val: number) => void;
  isCustom?: boolean;
  customName?: string;
  onCustomNameChange?: (val: string) => void;
  isDarkMode: boolean;
}) => {

  const getSymptomIcon = (id: string) => {
    switch (id) {
      case 'bloating': return Wind;
      case 'gas': return Wind;
      case 'cramps': return Zap;
      case 'diarrhea': return Waves;
      case 'constipation': return Activity;
      case 'nausea': return AlertCircle;
      case 'reflux': return Flame;
      default: return ListPlus;
    }
  };

  const Icon = getSymptomIcon(symptom.id);

  return (
    <div className="h-full w-full px-4 flex items-center justify-center">
      <motion.div
        layout
        onClick={!isSelected ? onToggle : undefined} // Only toggle on if clicking body, toggle off via button or specific logic if needed
        className={cn(
          "w-full max-w-xs aspect-[4/5] rounded-[32px] relative overflow-hidden flex flex-col items-center justify-center p-6 text-center transition-all duration-300",
          isDarkMode
            ? "bg-white/[0.05] border border-white/10 shadow-2xl"
            : "bg-white/40 border border-white/40 shadow-xl",
          isSelected && (isDarkMode ? "bg-primary/10 border-primary/20" : "bg-primary/5 border-primary/10")
        )}
        style={{
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full">
          {/* Icon Bubble */}
          <motion.div
            layout
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mb-2 transition-colors duration-500",
              isSelected
                ? "bg-primary text-primary-foreground shadow-lg scale-110"
                : (isDarkMode ? "bg-white/5 text-muted-foreground" : "bg-white/50 text-muted-foreground")
            )}
          >
            <Icon className="w-10 h-10" />
          </motion.div>

          {/* Title */}
          {isCustom ? (
            <div className="w-full space-y-2">
              <span className="text-sm font-medium opacity-70 uppercase tracking-widest">Custom</span>
              <Input
                value={customName}
                onChange={(e) => onCustomNameChange?.(e.target.value)}
                placeholder="E.g. Headache"
                className="text-center text-lg font-bold bg-transparent border-b border-0 rounded-none focus-visible:ring-0 px-0 h-auto placeholder:text-muted-foreground/50"
                autoFocus={isSelected}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <motion.h3 layout className="text-2xl font-bold font-headline">
              {symptom.name}
            </motion.h3>
          )}

          {/* Expansion: Severity or Add Button */}
          <AnimatePresence mode="wait">
            {isSelected ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full space-y-4"
              >
                <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-full bg-black/5 dark:bg-black/20 w-full">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={(e) => onSeverityChange(e, level)}
                      className={cn(
                        "flex-1 h-10 rounded-full text-sm font-bold transition-all duration-200",
                        severity === level
                          ? "bg-white dark:bg-zinc-800 shadow-md text-foreground scale-105 ring-1 ring-black/5 dark:ring-white/10"
                          : "text-muted-foreground/60 hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between px-4 text-[10px] uppercase tracking-wider font-semibold opacity-50">
                  <span>Mild</span>
                  <span>Severe</span>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onToggle(); }}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full px-6"
                >
                  Remove
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-full px-8 font-semibold bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 border border-black/5 dark:border-white/5"
                  onClick={() => onToggle()} // handled by parent div click mostly
                >
                  Log This
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default function SymptomLoggingDialog({
  isOpen,
  onOpenChange,
  onLogSymptoms,
  allSymptoms,
  context,
}: SymptomLoggingDialogProps) {
  const { isDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  // State
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, number>>({}); // id -> severity
  const [customSymptom, setCustomSymptom] = useState('');
  const [customSeverity, setCustomSeverity] = useState(3);
  const [isCustomSelected, setIsCustomSelected] = useState(false); // Helper to track if custom card is "active"
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Date/Time State
  const [experiencedAt, setExperiencedAt] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      // Reset
      setSelectedSymptoms({});
      setCustomSymptom('');
      setCustomSeverity(3);
      setIsCustomSelected(false);
      setNotes('');
      setIsSubmitting(false);
      setCurrentIndex(0);

      // Set experiencedAt based on context
      if (context?.type === 'meal' && context.mealTimestamp) {
        setExperiencedAt(new Date(context.mealTimestamp));
      } else {
        setExperiencedAt(new Date());
      }
    }
  }, [isOpen, context]);

  // Combine standard symptoms + custom option for the carousel
  const carouselItems = [
    ...allSymptoms.filter(s => s.id !== 'other'),
    { id: 'custom-card', name: 'Custom' }
  ];

  const handleSymptomToggle = (id: string, isCustom = false) => {
    HapticsService.selection();
    if (isCustom) {
      if (isCustomSelected) {
        setIsCustomSelected(false); // Deselect
      } else {
        setIsCustomSelected(true); // Select
      }
    } else {
      if (selectedSymptoms[id]) {
        const newSelected = { ...selectedSymptoms };
        delete newSelected[id];
        setSelectedSymptoms(newSelected);
      } else {
        setSelectedSymptoms(prev => ({ ...prev, [id]: 3 }));
      }
    }
  };

  const handleSeverityChange = (e: React.MouseEvent, id: string, severity: number, isCustom = false) => {
    e.stopPropagation();
    HapticsService.selection();
    if (isCustom) {
      setCustomSeverity(severity);
    } else {
      setSelectedSymptoms(prev => ({ ...prev, [id]: severity }));
    }
  };

  const handleSubmit = () => {
    if (Object.keys(selectedSymptoms).length === 0 && (!isCustomSelected || !customSymptom.trim())) {
      return;
    }

    setIsSubmitting(true);
    const finalSymptoms: LoggedSymptom[] = [];

    // Process predefined
    Object.entries(selectedSymptoms).forEach(([id, severity]) => {
      const def = allSymptoms.find(s => s.id === id);
      if (def) {
        finalSymptoms.push({ ...def, severity });
      }
    });

    // Process custom
    if (isCustomSelected && customSymptom.trim()) {
      finalSymptoms.push({
        id: `custom-${Date.now()}`,
        name: customSymptom.trim(),
        severity: customSeverity
      });
    }

    const linkedIds = context?.mealId ? [context.mealId] : undefined;
    const overallSeverity = finalSymptoms.length > 0
      ? Math.round(finalSymptoms.reduce((acc, curr) => acc + curr.severity, 0) / finalSymptoms.length)
      : 3;

    onLogSymptoms(
      finalSymptoms,
      notes,
      overallSeverity,
      linkedIds,
      experiencedAt,
      context
    );
  };

  const getHeaderContent = () => {
    if (context?.type === 'meal' && context.mealName) {
      return {
        title: `How did "${context.mealName}" feel?`,
        description: `Logged at ${format(new Date(context.mealTimestamp || new Date()), 'h:mm a')}`
      };
    }
    if (context?.type === 'checkin') {
      return {
        title: "How are you feeling?",
        description: "Quick health check-in"
      };
    }
    return {
      title: "Log Symptoms",
      description: "Past record"
    };
  };

  const header = getHeaderContent();
  const selectedCount = Object.keys(selectedSymptoms).length + (isCustomSelected ? 1 : 0);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ touchAction: 'none' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Header / Top Controls */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-[61] pt-14 pb-4 px-6 flex justify-between items-start pointer-events-none"
          >


            {/* Counter Pill */}
            {selectedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pointer-events-auto px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {selectedCount} Selected
              </motion.div>
            )}
          </motion.div>


          {/* Main Content Area - Centered Carousel */}
          <motion.div
            className="flex-1 relative z-[61] flex flex-col items-center justify-center min-h-0 pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="w-full max-w-md h-[450px] pointer-events-auto">
              <LiquidChartCarousel
                currentIndex={currentIndex}
                onIndexChange={setCurrentIndex}
                showDots={false}
                className="h-full"
              >
                {carouselItems.map((item) => {
                  if (item.id === 'custom-card') {
                    return (
                      <SymptomCard
                        key={item.id}
                        symptom={item}
                        isSelected={isCustomSelected}
                        severity={customSeverity}
                        onToggle={() => handleSymptomToggle('custom', true)}
                        onSeverityChange={(e, val) => handleSeverityChange(e, 'custom', val, true)}
                        isCustom={true}
                        customName={customSymptom}
                        onCustomNameChange={setCustomSymptom}
                        isDarkMode={isDarkMode}
                      />
                    );
                  }
                  return (
                    <SymptomCard
                      key={item.id}
                      symptom={item}
                      isSelected={!!selectedSymptoms[item.id]}
                      severity={selectedSymptoms[item.id] || 3}
                      onToggle={() => handleSymptomToggle(item.id)}
                      onSeverityChange={(e, val) => handleSeverityChange(e, item.id, val)}
                      isDarkMode={isDarkMode}
                    />
                  );
                })}
              </LiquidChartCarousel>
            </div>

            {/* Dots underneath */}
            <div className="mt-8 pointer-events-auto flex justify-center gap-2">
              {carouselItems.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm",
                    currentIndex === idx
                      ? "bg-white w-4" // Active: White
                      : "bg-white/20" // Inactive: Translucent White (better than muted-foreground on dark)
                  )}
                />
              ))}
            </div>

            {/* Notes Input - Absolute Positioned or Overlay? Let's put it below dots */}
            <div className="w-full max-w-sm px-6 mt-8 pointer-events-auto">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note... (optional)"
                className="h-12 rounded-full bg-white/10 border-white/10 text-white placeholder:text-white/40 text-center backdrop-blur-md shadow-lg font-medium"
              />
            </div>
          </motion.div>

          {/* Footer Action */}
          <div className="p-6 relative z-[61] flex justify-center pointer-events-none pb-12">
            <AnimatePresence>
              {(selectedCount > 0 || (isCustomSelected && customSymptom)) && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="pointer-events-auto w-full max-w-xs"
                >
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-full text-lg font-bold shadow-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white border-0 ring-2 ring-white/20"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Log Symptoms"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
