import { notificationApi } from '../api/notification.api';

// ─── IndexedDB token storage for Service Worker ──────────────────────────────
// The SW needs the JWT to auto-renew push subscriptions when they expire.
// localStorage is NOT accessible from SW context, so we use IndexedDB.

const SW_DB_NAME = 'sst-sw-store';
const SW_STORE = 'auth';

async function swDbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SW_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      (e.target as IDBOpenDBRequest).result.createObjectStore(SW_STORE);
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

/**
 * Send JWT token to Service Worker to store in IndexedDB.
 * Call this after every login and token refresh.
 */
export const updateTokenInSW = async (token: string): Promise<void> => {
  try {
    // 1. Store directly in IndexedDB (works even if SW not ready yet)
    const db = await swDbOpen();
    const tx = db.transaction(SW_STORE, 'readwrite');
    tx.objectStore(SW_STORE).put(token, 'token');

    // 2. Also postMessage to active SW (if running)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SET_AUTH_TOKEN', token });
    }
  } catch (err) {
    console.warn('[WebPush] Could not save token to SW IndexedDB:', err);
  }
};

/**
 * Remove JWT token from SW IndexedDB on logout.
 */
export const clearTokenInSW = async (): Promise<void> => {
  try {
    const db = await swDbOpen();
    const tx = db.transaction(SW_STORE, 'readwrite');
    tx.objectStore(SW_STORE).delete('token');

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_AUTH_TOKEN' });
    }
  } catch (err) {
    console.warn('[WebPush] Could not clear token from SW IndexedDB:', err);
  }
};

/**
 * Convert URL base64 string to Uint8Array for PushManager
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Detect client browser environment (Chrome, Safari, Edge, Firefox, iOS)
 */
export const getBrowserInfo = () => {
  if (typeof navigator === 'undefined') {
    return { name: 'Trình duyệt hiện tại', isSafari: false, isIOS: false, isChrome: false };
  }
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isEdge = /edg/i.test(ua);
  const isChrome = /chrome|chromium|crios/i.test(ua) && !isEdge;
  const isFirefox = /firefox|fxios/i.test(ua);

  let name = 'Trình duyệt của bạn';
  if (isEdge) name = 'Microsoft Edge';
  else if (isChrome) name = 'Google Chrome';
  else if (isSafari) name = isIOS ? 'Apple Safari (iOS)' : 'Apple Safari (macOS)';
  else if (isFirefox) name = 'Mozilla Firefox';

  return { name, isSafari, isIOS, isChrome, isEdge, isFirefox };
};

/**
 * Check if the browser supports Web Push & Service Worker
 */
export const isPushSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

/**
 * Request notification permission with cross-browser fallback
 * Supports modern Promise-based and legacy callback-based (older Safari) syntax
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) return 'denied';

  // Try Promise syntax first (Chrome, modern Safari, Firefox, Edge)
  try {
    const promise = Notification.requestPermission();
    if (promise && typeof promise.then === 'function') {
      return await promise;
    }
  } catch {
    // Fallback below
  }

  // Fallback to callback syntax for older Safari versions
  return new Promise<NotificationPermission>((resolve) => {
    Notification.requestPermission((permission) => {
      resolve(permission);
    });
  });
};

/**
 * Get current browser notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
};

/**
 * Register Service Worker (/sw.js)
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      // updateViaCache: 'none' forces the browser to always check for a new SW
      updateViaCache: 'none',
    });

    // Force update check
    await registration.update();
    await navigator.serviceWorker.ready;

    console.log('[WebPush] Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[WebPush] Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Check if the current browser already has an active push subscription
 */
export const checkIsSubscribed = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    return !!subscription;
  } catch (err) {
    console.error('[WebPush] checkIsSubscribed error:', err);
    return false;
  }
};

/**
 * Internal: send a PushSubscription to backend
 */
const sendSubscriptionToServer = async (subscription: PushSubscription): Promise<void> => {
  const subJson = subscription.toJSON();
  if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
    throw new Error('Thông tin đăng ký Push không hợp lệ.');
  }
  await notificationApi.subscribePush({
    endpoint: subJson.endpoint,
    keys: {
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
    },
    userAgent: navigator.userAgent,
  });
};

/**
 * Subscribe user browser to Web Push notifications
 */
export const subscribeToWebPush = async (): Promise<{ success: boolean; message: string }> => {
  if (!isPushSupported()) {
    throw new Error('Trình duyệt của bạn không hỗ trợ tính năng Web Push Notifications.');
  }

  // 1. Request user permission using cross-browser helper
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    throw new Error('Quyền thông báo chưa được cấp. Vui lòng chọn "Cho phép" để kích hoạt thông báo.');
  }

  // 2. Register Service Worker
  const registration = await registerServiceWorker();
  if (!registration) {
    throw new Error('Không thể đăng ký Service Worker trên trình duyệt này.');
  }

  // 3. Get VAPID public key from backend
  const vapidRes = await notificationApi.getVapidPublicKey();
  const publicKey = vapidRes.data.publicKey;
  if (!publicKey) {
    throw new Error('Không lấy được khóa VAPID từ máy chủ.');
  }

  const convertedVapidKey = urlBase64ToUint8Array(publicKey);

  // 4. Subscribe to PushManager (or reuse existing)
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as unknown as BufferSource,
    });
    console.log('[WebPush] New push subscription created');
  } else {
    console.log('[WebPush] Reusing existing push subscription');
  }

  // 5. Send subscription to backend
  await sendSubscriptionToServer(subscription);

  return { success: true, message: 'Đăng ký nhận thông báo đẩy thành công!' };
};

/**
 * Silently register SW + subscribe push in background after login.
 * - If already subscribed, just ensures subscription is still valid with server.
 * - If not subscribed and permission was already granted, auto-subscribe.
 * - If permission is 'default' (not yet asked), will NOT ask — subscribe page / settings handles that.
 */
export const registerServiceWorkerAndAutoSubscribe = async (): Promise<void> => {
  if (!isPushSupported()) return;

  try {
    // 1. Always register/update SW
    const registration = await registerServiceWorker();
    if (!registration) return;

    // 2. Listen for subscription renewal messages from SW
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data?.type === 'PUSH_SUBSCRIPTION_RENEWED') {
        console.log('[WebPush] SW renewed subscription, re-registering with server...');
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sendSubscriptionToServer(sub).catch(console.error);
        }
      }
    });

    // 3. Check current permission status
    const permission = getNotificationPermission();

    if (permission === 'granted') {
      // Permission already granted → ensure subscription is active
      const vapidRes = await notificationApi.getVapidPublicKey();
      const publicKey = vapidRes.data?.publicKey;
      if (!publicKey) return;

      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscription gone (browser cleared it) → re-subscribe silently
        console.log('[WebPush] Permission granted but no subscription found, re-subscribing...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as unknown as BufferSource,
        });
        console.log('[WebPush] Re-subscribed silently');
      }

      // Always sync current subscription to server (handles subscription endpoint changes)
      await sendSubscriptionToServer(subscription).catch((err) => {
        console.warn('[WebPush] Could not sync subscription to server:', err.message);
      });
    }
    // If permission === 'default': do nothing (wait for user to enable in settings)
    // If permission === 'denied': do nothing (user explicitly blocked)
  } catch (error) {
    // Silent fail — push is enhancement only, never block app
    console.warn('[WebPush] Background registration error:', error);
  }
};

/**
 * Trigger an immediate local OS notification via Service Worker
 */
export const showLocalTestNotification = async (title?: string, body?: string): Promise<boolean> => {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title || '🔔 Kiểm tra thông báo StudyScheduleTracker', {
      body: body || 'Đây là thông báo đẩy thử nghiệm trực tiếp trên hệ điều hành của bạn!',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      vibrate: [200, 100, 200],
      tag: `local-test-${Date.now()}`,
      data: { url: '/calendar' },
      actions: [
        { action: 'open', title: '📅 Mở Lịch học' },
        { action: 'dismiss', title: 'Đóng' },
      ],
    } as any);
    return true;
  } catch (err) {
    console.error('[WebPush] showLocalTestNotification error:', err);
    return false;
  }
};

/**
 * Unsubscribe user from Web Push notifications
 */
export const unsubscribeFromWebPush = async (): Promise<{ success: boolean; message: string }> => {
  if (!isPushSupported()) {
    return { success: true, message: 'Đã hủy đăng ký.' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await notificationApi.unsubscribePush(subscription.endpoint);
      await subscription.unsubscribe();
    }
    return { success: true, message: 'Đã tắt nhận thông báo đẩy trên thiết bị này.' };
  } catch (error: any) {
    console.error('[WebPush] unsubscribe error:', error);
    throw new Error(error.message || 'Không thể hủy đăng ký thông báo.');
  }
};

