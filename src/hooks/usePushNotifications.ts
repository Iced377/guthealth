import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/components/auth/AuthProvider';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!user || Capacitor.getPlatform() === 'web') return;

        const initializePush = async () => {
            try {
                // 1. Request Permission
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.log('Push notification permission denied');
                    return;
                }

                // 2. Register
                await PushNotifications.register();
            } catch (error) {
                console.error('Failed to initialize push notifications', error);
            }
        };

        initializePush();

        // 3. Listeners
        const registrationListener = PushNotifications.addListener('registration', async (token: { value: string }) => {
            console.log('Push Registration Success. Token:', token.value);

            // Save token to Firestore
            if (user) {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    // Use arrayUnion to allow multiple devices/tokens per user
                    await setDoc(userRef, {
                        pushTokens: arrayUnion(token.value),
                        lastPushRegistration: new Date()
                    }, { merge: true });
                } catch (e) {
                    console.error("Error saving push token to Firestore", e);
                }
            }
        });

        const registrationErrorListener = PushNotifications.addListener('registrationError', (error: any) => {
            console.error('Push Registration Error:', error);
            toast({
                title: "Push Notification Error",
                description: "Could not register for notifications.",
                variant: 'destructive'
            });
        });

        const notificationListener = PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
            console.log('Push Received:', notification);
            toast({
                title: notification.title || "New Notification",
                description: notification.body || "You have a new alert."
            });
        });

        const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
            console.log('Push Action Performed:', notification.actionId, notification.inputValue);
            // Navigate or handle deep link here if needed
        });

        // Cleanup
        return () => {
            registrationListener.then((l: any) => l.remove());
            registrationErrorListener.then((l: any) => l.remove());
            notificationListener.then((l: any) => l.remove());
            actionListener.then((l: any) => l.remove());
        };
    }, [user, toast]);
};
