import { useFormContext } from 'react-hook-form';
import { CalendarIcon, ClockIcon, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { format } from 'date-fns';
import { useState } from 'react';

export default function ComposerChipsRow() {
    const { isDarkMode } = useTheme();
    const { watch, register, setValue } = useFormContext();

    // Watch form values
    const date = watch('date') || new Date();
    const time = watch('time'); // handle time init
    const name = watch('name');

    // Local state for Name toggle if not using purely form state (progressive disclosure)
    const [isNameExpanded, setIsNameExpanded] = useState(!!name);

    if (!time && typeof window !== 'undefined') {
        // Init time if missing. useEffect better but this is render-time check
        // We'll rely on defaultValues from parent for now or init in useEffect there.
    }

    const chipClass = cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95",
        isDarkMode
            ? "bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
            : "bg-white/60 hover:bg-white/80 border border-black/5 text-black/70 shadow-sm"
    );

    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {/* Date Chip */}
            <button type="button" className={chipClass}>
                <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
                <span>{format(date, 'MMM d')}</span>
            </button>

            {/* Time Chip */}
            <button type="button" className={chipClass}>
                <ClockIcon className="w-3.5 h-3.5 opacity-70" />
                <span>{time || format(new Date(), 'HH:mm')}</span>
            </button>

            {/* Name Chip / Input */}
            {isNameExpanded ? (
                <div className={cn(
                    "flex items-center rounded-full pl-3 pr-1 py-0.5 border transition-all",
                    isDarkMode ? "bg-white/5 border-white/10" : "bg-white/60 border-black/5"
                )}>
                    <UserIcon className="w-3.5 h-3.5 opacity-70 mr-2" />
                    <input
                        {...register('name')}
                        placeholder="Name your meal..."
                        className="bg-transparent border-none outline-none text-xs w-32 h-7"
                        autoFocus
                    />
                    <button
                        onClick={() => { setValue('name', ''); setIsNameExpanded(false); }}
                        className="ml-1 p-1 opacity-50 hover:opacity-100"
                    >
                        ✕
                    </button>
                </div>
            ) : (
                <button type="button" onClick={() => setIsNameExpanded(true)} className={chipClass}>
                    <UserIcon className="w-3.5 h-3.5 opacity-70" />
                    <span>Name</span>
                </button>
            )}
        </div>
    );
}
