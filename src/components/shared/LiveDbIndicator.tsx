'use client';

import React from 'react';

export default function LiveDbIndicator() {
    // Only show in local development mode
    const isDev = process.env.NODE_ENV === 'development';
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!isDev) return null;

    return (
        <div className="fixed top-2 right-2 z-[9999] pointer-events-none">
            <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Shared Prod DB: {projectId}
            </div>
        </div>
    );
}
