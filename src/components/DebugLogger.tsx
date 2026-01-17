'use client';

import { useEffect } from 'react';

export default function DebugLogger({ label, data }: { label: string, data: any }) {
    useEffect(() => {
        console.log(`[DebugLogger] ${label}:`, data);
    }, [data, label]);
    return null;
}
