'use client';

import React from 'react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface ActionItem {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive' | 'primary';
    className?: string;
    endIcon?: React.ReactNode;
}

interface NativeActionSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    children?: React.ReactNode; // Trigger if used as uncontrolled
    actions: ActionItem[];
    cancelLabel?: string;
}

export function NativeActionSheet({
    isOpen,
    onOpenChange,
    title,
    description,
    children,
    actions,
    cancelLabel = "Cancel"
}: NativeActionSheetProps) {
    const { isDarkMode } = useTheme();

    return (
        <Drawer.Root open={isOpen} onOpenChange={onOpenChange} shouldScaleBackground>
            {children && <Drawer.Trigger asChild>{children}</Drawer.Trigger>}

            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[9999]" />

                {/* We use a custom content wrapper to achieve the "floating" look */}
                <Drawer.Content className={cn(
                    "fixed bottom-0 left-0 right-0 z-[9999] p-3 flex flex-col gap-2 outline-none",
                    "pb-safe-offset-4" // Safe area padding
                )}>
                    {/* Accessibility Title (Required by Radix/Vaul) */}
                    <Drawer.Title className="sr-only">
                        {title || "Actions Menu"}
                    </Drawer.Title>

                    {/* Main Action Group */}
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[14px] overflow-hidden flex flex-col shadow-sm">
                        {(title || description) && (
                            <div className="p-3.5 text-center border-b border-gray-400/20 dark:border-white/10">
                                {title && <div className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 mb-0.5">{title}</div>}
                                {description && <div className="text-[13px] text-gray-400 dark:text-gray-500">{description}</div>}
                            </div>
                        )}

                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    action.onClick();
                                    onOpenChange(false);
                                }}
                                className={cn(
                                    "w-full p-4 flex items-center justify-between text-[17px] transition-colors outline-none focus:outline-none focus:ring-0 focus:bg-transparent select-none hover:bg-transparent",
                                    "active:bg-gray-200/50 dark:active:bg-white/10", // Keep active state for touch feedback
                                    index !== actions.length - 1 && "border-b border-gray-400/20 dark:border-white/10",
                                    action.variant === 'destructive' ? "text-red-500" : "text-blue-500 dark:text-blue-400",
                                    action.className
                                )}
                            >
                                <span className="flex items-center gap-3 pointer-events-none">
                                    {action.icon}
                                    <span className={cn(
                                        "font-normal",
                                    )}>{action.label}</span>
                                </span>
                                {action.endIcon}
                            </button>
                        ))}
                    </div>

                    {/* Cancel Button - Separate Group */}
                    <button
                        onClick={() => onOpenChange(false)}
                        className="w-full p-4 rounded-[14px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl text-blue-500 dark:text-blue-400 font-semibold text-[17px] shadow-sm active:scale-[0.98] transition-transform outline-none"
                    >
                        {cancelLabel}
                    </button>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
