'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const WEBVIEW_MIN_WIDTH = 1024;

export default function WebviewFlag() {
    useEffect(() => {
        const updateFlag = () => {
            const isIOS = Capacitor.getPlatform() === 'ios';
            const isWide = window.innerWidth >= WEBVIEW_MIN_WIDTH;

            if (!isIOS && isWide) {
                document.documentElement.dataset.webview = 'true';
            } else {
                delete document.documentElement.dataset.webview;
            }
        };

        updateFlag();
        window.addEventListener('resize', updateFlag);
        return () => window.removeEventListener('resize', updateFlag);
    }, []);

    return null;
}
