'use client';

import { useState, useEffect } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

const LOCALSTORAGE_KEY = 'gutcheck-cookie-consent';
const EVENT_KEY = 'cookie-consent-updated';

export default function AnalyticsWithConsent() {
    const [consentGiven, setConsentGiven] = useState(false);
    const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

    useEffect(() => {
        // 1. Initial check on mount
        const savedConsent = localStorage.getItem(LOCALSTORAGE_KEY);
        if (savedConsent === 'accepted') {
            setConsentGiven(true);
        }

        // 2. Listen for the custom event (fired by the banner)
        const handleConsentUpdate = () => {
            const updatedConsent = localStorage.getItem(LOCALSTORAGE_KEY);
            if (updatedConsent === 'accepted') {
                setConsentGiven(true);
            }
        };

        window.addEventListener(EVENT_KEY, handleConsentUpdate);

        return () => {
            window.removeEventListener(EVENT_KEY, handleConsentUpdate);
        };
    }, []);

    if (!gaId || !consentGiven) {
        return null;
    }

    return <GoogleAnalytics gaId={gaId} />;
}
