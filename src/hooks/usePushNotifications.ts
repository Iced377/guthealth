import { useEffect } from 'react';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/components/auth/AuthProvider';
import { doc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
    const { user } = useAuth();
    const { toast } = useToast();

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
                    toast({
                        title: event.notification.title || "New Notification",
                        description: event.notification.body || "You have a new alert."
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
