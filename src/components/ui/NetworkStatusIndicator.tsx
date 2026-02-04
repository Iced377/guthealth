'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatusIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        // Only run on client
        setHasHydrated(true);
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!hasHydrated) return null;

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="w-full bg-red-500/90 text-white backdrop-blur-sm z-[9999] relative overflow-hidden"
                >
                    <div className="flex items-center justify-center gap-2 p-2 text-xs font-semibold uppercase tracking-wider">
                        <WifiOff className="w-4 h-4" />
                        <span>Connection Lost</span>
                    </div>
                    <p className="text-center text-[10px] pb-2 opacity-80 px-4">
                        Changes may not be saved until connection is restored.
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
