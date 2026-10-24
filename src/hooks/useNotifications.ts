import { useCallback, useEffect, useState } from 'react';
import { messaging, onMessage, getPushPermission, getPushToken, requestNotificationPermission, type PushPermission } from '@/services/firebase';
import { authService } from '@/services/api';
import { usePathname, useRouter } from 'next/navigation';

const PERMISSION_EVENT = 'push-permission-changed';

/** The notification permission, and `enable` to ask for it. Every user of the hook stays in sync. */
export const usePushPermission = () => {
    const pathname = usePathname();
    // Starts as 'unsupported' so the server HTML and the first client render agree.
    const [permission, setPermission] = useState<PushPermission>('unsupported');

    useEffect(() => {
        const read = () => setPermission(getPushPermission());
        read();
        window.addEventListener(PERMISSION_EVENT, read);
        return () => window.removeEventListener(PERMISSION_EVENT, read);
    }, [pathname]);

    /** Call from a tap: browsers refuse the permission prompt anywhere else. */
    const enable = useCallback(async () => {
        const result = await requestNotificationPermission();
        setPermission(result);
        window.dispatchEvent(new Event(PERMISSION_EVENT));
    }, []);

    return { permission, enable };
};

export const useNotifications = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { permission, enable } = usePushPermission();
    const [signedIn, setSignedIn] = useState(false);

    // Checked after mount and on each navigation, since login and logout happen without a reload.
    useEffect(() => {
        setSignedIn(Boolean(localStorage.getItem('access_token')));
    }, [pathname]);

    useEffect(() => {
        const setupNotifications = async () => {
            if (typeof window === 'undefined' || !messaging) return;

            // 1. Get the token. This never prompts; see `enable`.
            const token = await getPushToken();
            if (token) {
                console.log('FCM Token (Retailer):', token);
                await authService.registerDeviceToken(token);
            }

            // 2. Handle foreground messages
            const broadcast = new BroadcastChannel('fcm_updates');

            const processMessage = (payload: any) => {
                if (payload.notification) {
                    const { title, body } = payload.notification;

                    if (Notification.permission === 'granted') {
                        const notification = new Notification(title || 'New Order / Update', {
                            body: body,
                            icon: '/logo.png',
                            data: payload.data
                        });

                        notification.onclick = (event) => {
                            event.preventDefault();
                            handleNotificationClick(payload.data);
                            notification.close();
                        };
                    }
                }

                // Handle silent updates
                const dataType = (payload.data?.type || payload.data?.event || '') as string;
                console.log('Classifying FCM message (Retailer):', { dataType, data: payload.data });

                if (payload.data?.is_silent === 'true' || dataType || payload.data?.order_id) {
                    let eventName = 'fcm_message';

                    const isChat = ['new_message', 'chat', 'order_chat'].includes(dataType);
                    const isOrder = ['order_status_update', 'order_refresh', 'order_update', 'new_order', 'order_refresh'].includes(dataType);

                    if (isChat) {
                        eventName = 'fcm_chat_message';
                    } else if (isOrder || payload.data?.order_id) {
                        eventName = 'fcm_order_update';
                    }

                    console.log(`Dispatching event: ${eventName}`, payload.data);
                    window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
                }
            };

            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground message received (Retailer):', payload);
                processMessage(payload);
                broadcast.postMessage(payload);
            });

            broadcast.onmessage = (event) => {
                console.log('Received broadcast message (Retailer):', event.data);
                processMessage(event.data);
            };

            return () => {
                unsubscribe();
                broadcast.close();
            };
        };

        if (!signedIn || permission !== 'granted') return;
        const setup = setupNotifications();
        return () => {
            setup.then((cleanup) => cleanup?.());
        };
    }, [router, permission, signedIn]);

    const handleNotificationClick = (data: any) => {
        const orderId = data?.order_id || data?.id;
        if (orderId) {
            router.push(`/dashboard/orders/details?id=${orderId}`);
        }
    };

    return { permission, enable };
};
