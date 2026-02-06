'use client';

import { useState, useEffect } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

const LOCALSTORAGE_KEY = 'gutcheck-cookie-consent';
const EVENT_KEY = 'cookie-consent-updated';

export default function AnalyticsWithConsent() {
    const [consentGiven, setConsentGiven] = useState(false);
    const [isNative, setIsNative] = useState(false);
    const [attChecked, setAttChecked] = useState(false);
    const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

    useEffect(() => {
        const checkPlatformAndConsent = async () => {
            // Detect if running in Capacitor (Native iOS/Android)
            const capacitor = (window as any).Capacitor;
            const platform = capacitor?.getPlatform?.() || 'web';
            const isNativePlatform = platform === 'ios' || platform === 'android';
            setIsNative(isNativePlatform);

            if (platform === 'ios') {
                // iOS: Use App Tracking Transparency
                try {
                    const { AppTrackingTransparency } = await import('capacitor-plugin-app-tracking-transparency');
                    const status = await AppTrackingTransparency.requestPermission();

                    if (status.status === 'authorized') {
                        console.log("[Analytics] iOS Tracking Authorized");
                        setConsentGiven(true);
                    } else {
                        console.log("[Analytics] iOS Tracking Denied/Restricted:", status.status);
                        setConsentGiven(false);
                    }
                } catch (e) {
                    console.error("[Analytics] ATT Plugin error:", e);
                    // Fail safe: don't track if ATT fails
                    setConsentGiven(false);
                }
                setAttChecked(true);
            } else {
                // Web or Android: Use cookie consent banner
                const savedConsent = localStorage.getItem(LOCALSTORAGE_KEY);
                if (savedConsent === 'accepted') {
                    setConsentGiven(true);
                }
                setAttChecked(true);
            }
        };

        checkPlatformAndConsent();

        // Listen for cookie consent updates (for web only)
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

    // Don't render until ATT check is complete (prevents flash of analytics)
    if (!attChecked) {
        return null;
    }

    // Don't load GA if no consent or no GA ID
    if (!gaId || !consentGiven) {
        return null;
    }

    return <GoogleAnalytics gaId={gaId} />;
}
