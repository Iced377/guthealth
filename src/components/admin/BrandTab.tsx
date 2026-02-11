'use client';

import React from 'react';
import { BrandDeck } from '@/components/brand/BrandDeck';

export function BrandTab({ onClose }: { onClose?: () => void }) {
    return (
        <div className="w-full h-[600px] md:h-[800px] relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
            <BrandDeck onClose={onClose} />
        </div>
    );
}
