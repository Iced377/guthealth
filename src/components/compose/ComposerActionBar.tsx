import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { LiquidPressable } from '@/components/ui/LiquidPressable';

export default function ComposerActionBar() {
    return (
        <div
            className="w-full h-auto px-6 pb-[env(safe-area-inset-bottom,20px)] pt-4 pointer-events-none flex justify-center"
        >
            {/* FAB replaces the Analyze button, floats on right */}
            <LiquidPressable
                type="button" // Change to button to prevent double submit, we handle manually
                onClick={(e) => {
                    e?.preventDefault();
                    // Robustly find and submit the form by ID
                    const form = document.getElementById('compose-meal-form') as HTMLFormElement;
                    if (form) form.requestSubmit();
                }}
                className={cn(
                    "flex items-center justify-center p-0",
                    "w-14 h-14 rounded-full",
                    "bg-gradient-to-br from-green-500 to-emerald-600",
                    "shadow-lg shadow-green-500/40",
                    "pointer-events-auto transition-transform hover:scale-105 active:scale-95"
                )}
            >
                <Plus className="w-7 h-7 text-white" />
            </LiquidPressable>
        </div>
    );
}
