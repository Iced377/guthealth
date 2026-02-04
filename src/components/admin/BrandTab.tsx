'use client';

import React from 'react';
import { BrandDeck } from '@/components/brand/BrandDeck';

export function BrandTab() {
    // We pass an empty onClose or null because inside a tab, we don't "close" the deck back to admin, 
    // we just switch tabs. 
    // If BrandDeck requires onClose, we can give it a dummy function or hide the close button via CSS/prop if supported.
    return (
        <div className="w-full h-[600px] md:h-[800px] relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
            <BrandDeck onClose={() => { }} />
        </div>
    );
}
