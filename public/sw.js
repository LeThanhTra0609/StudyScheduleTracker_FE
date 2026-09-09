// Service Worker for StudyScheduleTracker Web Push Notifications
/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notification
self.addEventListener('push', (event) => {
  let data = {
    title: 'Thông báo lịch học',
    body: 'Bạn có thông báo mới từ StudyScheduleTracker',
    icon: '/icons.svg',
    badge: '/favicon.svg',
    tag: 'study-schedule-notification',
    data: { url: '/calendar' },
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons.svg',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || `notif-${Date.now()}`,
    data: data.data || { url: '/calendar' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'StudyScheduleTracker', options)
  );
});

// Handle notification click: focus or open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/calendar';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
