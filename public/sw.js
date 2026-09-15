// Service Worker for StudyScheduleTracker Web Push Notifications
// Handles background push, notification display, click actions, and subscription renewal
// v2 — fixes: requireInteraction, pushsubscriptionchange with token, foreground support
/* eslint-disable no-restricted-globals */

const APP_NAME = 'StudyScheduleTracker';
const DEFAULT_ICON = '/pwa-192.png';
const DEFAULT_BADGE = '/pwa-192.png';
const DEFAULT_URL = '/calendar';
const BACKEND_URL = self.location.origin;

// ─── IndexedDB helpers (to retrieve JWT token for API calls from SW) ──────────

const DB_NAME = 'sst-sw-store';
const DB_VERSION = 1;
const STORE_NAME = 'auth';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getToken() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get('token');
      req.onsuccess = (e) => resolve(e.target.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

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

  // ── FIX: requireInteraction must be explicitly true for reminders to stay on screen
  const isUrgent = data.requireInteraction === true || data.urgent === true;

  const options = {
    body: data.body,
    icon: data.icon || DEFAULT_ICON,
    badge: data.badge || DEFAULT_BADGE,
    tag: data.tag,
    data: data.data || { url: DEFAULT_URL },
    vibrate: isUrgent ? [300, 100, 300, 100, 300] : (data.vibrate || [200, 100, 200]),
    // FIX: requireInteraction keeps notification visible until user acts (like native apps)
    requireInteraction: isUrgent,
    actions: data.actions || [
      { action: 'open', title: '📅 Xem lịch học' },
      { action: 'dismiss', title: 'Bỏ qua' },
    ],
    timestamp: data.timestamp || Date.now(),
    silent: false,
    // renotify: show new notification even if same tag
    renotify: !!data.tag,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || APP_NAME, options)
      .then(() => console.log('[SW] Notification shown (urgent=' + isUrgent + '):', data.title))
      .catch((err) => console.error('[SW] showNotification error:', err))
  );
});

// ─── Message from client: save/update token in IndexedDB ─────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_AUTH_TOKEN') {
    openDB().then((db) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(event.data.token, 'token');
      console.log('[SW] Auth token saved to IndexedDB');
    }).catch(console.error);
  }
  if (event.data?.type === 'CLEAR_AUTH_TOKEN') {
    openDB().then((db) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete('token');
    }).catch(console.error);
  }
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
  console.log('[SW] Push subscription changed (expired/renewed) — auto-renewing...');

  event.waitUntil(
    (async () => {
      try {
        // 1. Get VAPID key (public endpoint, no auth needed)
        const vapidRes = await fetch(`${BACKEND_URL}/api/notifications/vapid-public-key`);
        if (!vapidRes.ok) throw new Error('VAPID fetch failed: ' + vapidRes.status);
        const { publicKey } = await vapidRes.json();
        if (!publicKey) throw new Error('No VAPID public key in response');

        // 2. Convert base64 VAPID key
        const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
        const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        // 3. Re-subscribe with browser PushManager
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray,
        });
        const subJson = newSubscription.toJSON();
        console.log('[SW] Re-subscribed successfully');

        // 4. Get JWT from IndexedDB and sync new subscription to backend
        const token = await getToken();
        if (token) {
          const syncRes = await fetch(`${BACKEND_URL}/api/notifications/push-subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              endpoint: subJson.endpoint,
              keys: subJson.keys,
              userAgent: navigator.userAgent,
            }),
          });
          if (syncRes.ok) {
            console.log('[SW] New subscription synced to server successfully');
          } else {
            console.warn('[SW] Server sync failed:', syncRes.status, '— will retry via client');
            // Fallback: notify open clients to re-register
            const clients = await self.clients.matchAll({ type: 'window' });
            clients.forEach((client) => client.postMessage({
              type: 'PUSH_SUBSCRIPTION_RENEWED',
              subscription: subJson,
            }));
          }
        } else {
          // No token in SW — notify open clients to handle sync
          console.warn('[SW] No auth token in IndexedDB, notifying clients to re-register');
          const clients = await self.clients.matchAll({ type: 'window' });
          clients.forEach((client) => client.postMessage({
            type: 'PUSH_SUBSCRIPTION_RENEWED',
            subscription: subJson,
          }));
        }
      } catch (err) {
        console.error('[SW] pushsubscriptionchange error:', err);
      }
    })()
  );
});
