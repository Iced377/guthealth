import { useEffect, useRef } from 'react';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/components/auth/AuthProvider';
import { doc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRamadan } from '@/features/ramadan/useRamadan';

export const usePushNotifications = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const ramadan = useRamadan();
    const ramadanRef = useRef(ramadan);

    useEffect(() => {
        ramadanRef.current = ramadan;
    }, [ramadan]);

    useEffect(() => {
        if (!user || Capacitor.getPlatform() === 'web') {
            console.log("[Push] Skipping initialization.");
            return;
        }

        let isMounted = true;
        const listeners: any[] = [];

        const initializePush = async () => {
            try {
                console.log("[Push] Requesting permissions...");
                const permStatus = await FirebaseMessaging.requestPermissions();

                if (permStatus.receive !== 'granted') {
                    console.warn('[Push] Permission denied');
                    return;
                }

                if (!isMounted) return;

                // 2. Get FCM Token directly
                console.log("[Push] Getting FCM token...");
                const { token } = await FirebaseMessaging.getToken();
                console.log('[Push] Registration Success. Token length:', token.length);

                if (user && isMounted) {
                    try {
                        const userRef = doc(db, 'users', user.uid);
                        await setDoc(userRef, {
                            pushTokens: arrayUnion(token),
                            lastPushRegistration: new Date()
                        }, { merge: true });
                    } catch (e) {
                        console.error("[Push] Firestore save error", e);
                    }
                }
            } catch (error) {
                console.error('[Push] Initialization failed', error);
            }
        };

        // 3. Setup Listeners
        const setupListeners = async () => {
            try {
                const recv = await FirebaseMessaging.addListener('notificationReceived', (event) => {
                    console.log('[Push] Received:', event.notification);

                    const current = ramadanRef.current;
                    const isQuietHours = current.isEnabled
                        && current.mode === 'witnessing'
                        && (current.config.quietHours ?? true)
                        && current.timings
                        && new Date() >= current.timings.suhoor
                        && new Date() <= current.timings.iftar;

                    const title = event.notification.title || "New Notification";
                    const body = event.notification.body || "You have a new alert.";
                    const text = `${title} ${body}`.toLowerCase();
                    const looksFoodRelated = ['meal', 'food', 'snack', 'lunch', 'breakfast', 'log', 'calorie'].some((k) => text.includes(k));

                    if (isQuietHours && looksFoodRelated) {
                        console.log('[Push] Suppressed food notification due to Ramadan quiet hours.');
                        return;
                    }

                    toast({
                        title,
                        description: body
                    });
                });
                listeners.push(recv);

                const act = await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
                    console.log('[Push] Action:', event.actionId);
                });
                listeners.push(act);

                const tok = await FirebaseMessaging.addListener('tokenReceived', async (event) => {
                    // Token refreshed - save to Firestore
                    if (user && isMounted) {
                        const userRef = doc(db, 'users', user.uid);
                        await setDoc(userRef, {
                            pushTokens: arrayUnion(event.token),
                            lastPushRegistration: new Date()
                        }, { merge: true });
                    }
                });
                listeners.push(tok);

                // Now initialize
                await initializePush();
            } catch (e) {
                console.error("[Push] Listener setup failed", e);
            }
        };

        setupListeners();

        // Cleanup
        return () => {
            isMounted = false;
            listeners.forEach(l => {
                if (l && typeof l.remove === 'function') {
                    l.remove();
                } else if (l && typeof l.then === 'function') {
                    l.then((resolved: any) => {
                        if (resolved && typeof resolved.remove === 'function') {
                            resolved.remove();
                        }
                    });
                }
            });
        };
    }, [user, toast]);
};
