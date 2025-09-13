/* eslint-disable no-console */
// Service Worker for Push Notifications
// This handles push notifications when the app is not active

const CACHE_NAME = 'archer-fitness-v1';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  event.waitUntil(self.skipWaiting());
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);

  if (!event.data) {
    console.log('Push notification but no data');
    return;
  }

  const data = event.data.json();
  console.log('Push data:', data);

  const options = {
    body: data.body,
    icon: '/logo.webp',
    badge: '/logo.webp',
    image: data.image || '/logo.webp',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      type: data.type || 'general'
    },
    actions: data.actions || [],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Archer Fitness', options)
  );
});

// Notification click event - handle when user clicks on notification
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received', event);

  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const payload = event.data.payload;
    const options = {
      body: payload.body,
      icon: payload.icon || '/logo.webp',
      badge: payload.badge || '/logo.webp',
      image: payload.image,
      vibrate: [200, 100, 200],
      data: {
        url: payload.url || '/',
        type: payload.type || 'general'
      },
      actions: payload.actions || [],
      requireInteraction: true,
      silent: false
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || 'Archer Fitness', options)
        .then(() => {
          console.log('Service Worker: Notification shown successfully');
        })
        .catch((error) => {
          console.error('Service Worker: Failed to show notification:', error);
        })
    );
  }
});