// Service Worker for UTeM ATech Push Notifications
// Placed in /public/sw.js so Vite serves it from root

self.addEventListener('install', () => {
    console.log('[SW] Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activated');
    event.waitUntil(self.clients.claim());
});

// Handle push events from server (if Push API is used in the future)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const title = data.title || 'UTeM ATech';
    const options = {
        body: data.body || 'You have a notification.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: data.url || '/',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        tag: data.tag || 'utem-atech',
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Handle notification click — open/focus the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data || '/';
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});
