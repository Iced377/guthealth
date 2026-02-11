'use client';

import { useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { db, auth } from '@/config/firebase';

const METRIC_SENT_KEY = 'app-ttfr-sent-v1';
const SESSION_ID_KEY = 'app-session-id-v1';

const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  const existing = sessionStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;

  const generated = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  sessionStorage.setItem(SESSION_ID_KEY, generated);
  return generated;
};

export default function AppPerformanceTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(METRIC_SENT_KEY)) return;

    const appStart = (window as any).__APP_START_TS;

    const sendMetric = async () => {
      const start = typeof appStart === 'number' ? appStart : 0;
      const ttfrMs = Math.max(0, Math.round(performance.now() - start));

      try {
        await addDoc(collection(db, 'app_performance_metrics'), {
          ttfrMs,
          createdAt: serverTimestamp(),
          platform: Capacitor.getPlatform?.() ?? 'web',
          isNative: Capacitor.isNativePlatform?.() ?? false,
          userId: auth.currentUser?.uid ?? null,
          sessionId: getSessionId(),
        });
        sessionStorage.setItem(METRIC_SENT_KEY, '1');
      } catch (error) {
        console.warn('[Perf] Failed to record TTF render metric', error);
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sendMetric();
      });
    });
  }, []);

  return null;
}
