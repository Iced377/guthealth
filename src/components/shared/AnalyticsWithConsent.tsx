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

        // Native Check (iOS ATT)
        const checkNativeTracking = async () => {
            if (process.env.NEXT_PUBLIC_CAPACITOR_PLATFORM === 'ios' || (window as any).Capacitor?.getPlatform() === 'ios') {
                try {
                    const { AppTrackingTransparency } = await import('capacitor-plugin-app-tracking-transparency');
                    const status = await AppTrackingTransparency.requestPermission();
                    if (status.status === 'authorized') {
                        console.log("iOS Tracking Authorized");
                        setConsentGiven(true);
                    } else {
                        console.log("iOS Tracking Denied/Restricted");
                        // If denied, we do NOT set consentGiven(true), so GA doesn't load.
                        // We might want to respect local storage too? 
                        // Guideline says: "If the user does not allow tracking, do not collect cookies for tracking purposes."
                        // So native denial overrides local storage acceptance? 
                        // Yes, native rule is stricter.
                        setConsentGiven(false);
                    }
                } catch (e) {
                    console.error("ATT Plugin error:", e);
                }
            }
        };
        checkNativeTracking();

        // 2. Listen for the custom event (fired by the banner)
        const handleConsentUpdate = () => {
            const updatedConsent = localStorage.getItem(LOCALSTORAGE_KEY);
            if (updatedConsent === 'accepted') {
                // For web, this is fine. For iOS, we should technically check ATT again or rely on native check.
                // But usually cookie banner is hidden on native if we handle it there.
                // Let's assume this event is mostly for web.
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
