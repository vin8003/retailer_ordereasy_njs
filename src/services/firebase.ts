import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Messaging is only available in the browser
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export type PushPermission = NotificationPermission | 'unsupported';

export const getPushPermission = (): PushPermission =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';

/** Shows the browser's permission prompt. Browsers only allow this from a user gesture such as a tap. */
export const requestNotificationPermission = async (): Promise<PushPermission> => {
    if (getPushPermission() === 'unsupported') return 'unsupported';
    try {
        return await Notification.requestPermission();
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return getPushPermission();
    }
};

/** The push token, without any prompt: null unless permission was already granted. */
export const getPushToken = async () => {
    if (!messaging || getPushPermission() !== 'granted') return null;

    try {
        const swUrl = `/firebase-messaging-sw.js?apiKey=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}&authDomain=${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}&projectId=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}&storageBucket=${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}&messagingSenderId=${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}&appId=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}`;

        const registration = await navigator.serviceWorker.register(swUrl);
        return await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration
        });
    } catch (error) {
        console.error('Error getting the push token:', error);
        return null;
    }
};

export { auth, messaging, onMessage };
