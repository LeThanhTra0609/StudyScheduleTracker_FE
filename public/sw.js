// Service Worker for StudyScheduleTracker Web Push Notifications
// Handles background push, notification display, click actions, and subscription renewal
/* eslint-disable no-restricted-globals */

const APP_NAME = 'StudyScheduleTracker';
const DEFAULT_ICON = '/pwa-192.png';
const DEFAULT_BADGE = '/pwa-192.png';
const DEFAULT_URL = '/calendar';

// ─── Lifecycle ───────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  // Skip waiting so the new SW activates immediately without waiting for tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  // Take control of all open pages immediately (no reload needed)
  event.waitUntil(self.clients.claim());
});

// ─── Web Push: Receive & Show Notification ───────────────────────────────────

self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: `📚 ${APP_NAME}`,
    body: 'Bạn có thông báo mới từ lịch học.',
    icon: DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag: `study-notif-${Date.now()}`,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: DEFAULT_URL },
    actions: [
      { action: 'open', title: '📅 Xem lịch học' },
      { action: 'dismiss', title: 'Bỏ qua' },
    ],
    timestamp: Date.now(),
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || DEFAULT_ICON,
    badge: data.badge || DEFAULT_BADGE,
    tag: data.tag,
    data: data.data || { url: DEFAULT_URL },
    vibrate: data.vibrate || [200, 100, 200],
    // requireInteraction: true means notification stays until user interacts (like native apps)
    requireInteraction: data.requireInteraction === true,
    actions: data.actions || [],
    timestamp: data.timestamp || Date.now(),
    // Show notification even if app is open in foreground
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || APP_NAME, options)
      .then(() => console.log('[SW] Notification shown:', data.title))
      .catch((err) => console.error('[SW] showNotification error:', err))
  );
});

// ─── Notification Click Handler ───────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked, action:', event.action);
  event.notification.close();

  // 'dismiss' action: just close
  if (event.action === 'dismiss') {
    return;
  }

  // 'open' action or direct click: navigate to relevant page
  const targetUrl = event.notification.data?.url || DEFAULT_URL;
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If there's already an open window for this origin, focus it and navigate
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.focus();
            if ('navigate' in client) {
              return client.navigate(absoluteUrl);
            }
            return;
          }
        }
        // No window open → open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(absoluteUrl);
        }
      })
  );
});

// ─── Notification Close Handler ───────────────────────────────────────────────

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed by user:', event.notification.tag);
});

// ─── Push Subscription Change (auto-renew when subscription expires) ──────────

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed (expired/renewed)');

  event.waitUntil(
    (async () => {
      try {
        // Re-subscribe with the same VAPID key
        const response = await fetch('/api/notifications/vapid-public-key', {
          headers: { 'Content-Type': 'application/json' },
        });
        const json = await response.json();
        const publicKey = json.publicKey;

        if (!publicKey) {
          console.error('[SW] Could not fetch VAPID key for re-subscription');
          return;
        }

        // Convert base64 VAPID key
        const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
        const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        // Subscribe again
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray,
        });

        const subJson = newSubscription.toJSON();
        console.log('[SW] Re-subscribed successfully, sending to server...');

        // Notify all open clients to re-register with server
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_RENEWED',
            subscription: subJson,
          });
        });
      } catch (err) {
        console.error('[SW] pushsubscriptionchange error:', err);
      }
    })()
  );
});
