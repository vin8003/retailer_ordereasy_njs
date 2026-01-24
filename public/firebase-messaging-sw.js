importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');


const urlParams = new URLSearchParams(self.location.search);
firebase.initializeApp({
    apiKey: urlParams.get('apiKey'),
    authDomain: urlParams.get('authDomain'),
    projectId: urlParams.get('projectId'),
    storageBucket: urlParams.get('storageBucket'),
    messagingSenderId: urlParams.get('messagingSenderId'),
    appId: urlParams.get('appId'),
});

const messaging = firebase.messaging();

// Broadcast Channel for cross-tab communication
const broadcast = new BroadcastChannel('fcm_updates');

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Broadcast to open tabs
    broadcast.postMessage(payload);

    if (payload.data?.is_silent === 'true' && !payload.notification) {
        return;
    }

    const notificationTitle = payload.notification?.title || 'New Order / Update';
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/logo.png',
        data: payload.data
    };
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification.data;
    const orderId = data?.order_id || data?.id;

    if (!orderId) return;

    const urlToOpen = new URL(`/dashboard/orders/details?id=${orderId}`, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
