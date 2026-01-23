'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronRight } from 'lucide-react';

export interface LiquidAction {
    id?: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    endIcon?: React.ReactNode;
}

interface LiquidActionMenuProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    actions: LiquidAction[];
}

export default function LiquidActionMenu({
    isOpen,
    onClose,
    title,
    actions
}: LiquidActionMenuProps) {
    const { isDarkMode } = useTheme();
    const menuRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
                    />

                    {/* Menu Popup */}
                    <motion.div
                        ref={menuRef}
                        // Match "floating sub-menu" animation (SPRING_REVEAL)
                        initial={{ opacity: 0, scale: 0.8, y: 20, x: "-50%" }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.8, y: 20, x: "-50%" }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                        }}
                        className={cn(
                            // STRICT CENTERING & GUARDRAILS
                            "fixed z-[61]",
                            "left-1/2",
                            "bottom-[15vh]",
                            "w-[90vw] max-w-sm",
                            "mx-auto",

                            "rounded-[32px] overflow-hidden",
                            // Shadow & Glass Lensing Effect (Identical to ReuseMealMenu)
                            "shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)]",
                            isDarkMode
                                ? "bg-black/10 text-white"
                                : "bg-white/10 text-black",
                            "backdrop-blur-[32px] backdrop-saturate-[220%] backdrop-brightness-[1.1]"
                        )}
                        style={{
                            transformOrigin: "bottom center"
                        }}
                    >
                        {title && (
                            <div className="px-6 py-4">
                                <h3 className="font-headline font-bold text-lg text-center opacity-90">{title}</h3>
                            </div>
                        )}

                        <div className="flex flex-col py-2 max-h-[360px] overflow-y-auto overflow-x-hidden scrollbar-hide">
                            {actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        action.onClick();
                                        onClose();
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3.5 w-full text-left transition-colors outline-none focus:outline-none focus:ring-0 focus:bg-transparent select-none",
                                        isDarkMode ? "active:bg-white/15" : "active:bg-black/10",
                                        action.variant === 'destructive' && "text-red-500 hover:text-red-400"
                                    )}
                                >
                                    {/* Icon Container - Matching Reuse Menu Style */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 active-press",
                                        action.variant === 'destructive'
                                            ? "bg-red-500/10"
                                            : "bg-gradient-to-br from-green-400/20 to-emerald-500/20"
                                    )}>
                                        {action.icon && React.cloneElement(action.icon as React.ReactElement, {
                                            className: cn(
                                                "w-6 h-6 transition-transform duration-300",
                                                action.variant === 'destructive' ? "text-red-500" : "text-emerald-500"
                                            )
                                        })}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className={cn("font-semibold text-[15px] truncate leading-tight", action.variant === 'destructive' && "text-red-500")}>
                                            {action.label}
                                        </h4>
                                    </div>

                                    {action.endIcon ? (
                                        action.endIcon
                                    ) : (
                                        <ChevronRight className="w-4 h-4 opacity-30" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
