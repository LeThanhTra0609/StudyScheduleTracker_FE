import { create } from 'zustand';
import { notificationApi } from '../api/notification.api';

export interface AppNotification {
  _id?: string;
  id: string;
  title?: string;
  message: string;
  type: 'attendance' | 'payment' | 'reminder' | 'family' | 'schedule_change' | 'info';
  read: boolean;
  createdAt: string | Date;
  link?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notif: Partial<AppNotification> & { message: string }) => void;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await notificationApi.getNotifications({ limit: 50 });
      if (res.data.success) {
        const formatted = res.data.data.map((item: any) => ({
          ...item,
          id: item._id || item.id,
        }));
        set({
          notifications: formatted,
          unreadCount: res.data.unreadCount,
          loading: false,
        });
      }
    } catch {
      set({ loading: false });
    }
  },

  addNotification: (notif) => {
    const notifId = notif._id || notif.id || crypto.randomUUID();
    const newNotif: AppNotification = {
      id: notifId,
      _id: notifId,
      title: notif.title || 'Thông báo',
      message: notif.message,
      type: (notif.type as any) || 'info',
      read: false,
      createdAt: notif.createdAt || new Date(),
      link: notif.link,
      metadata: notif.metadata,
    };

    set((state) => {
      // Deduplicate if already in list
      if (state.notifications.some((n) => n.id === notifId)) {
        return state;
      }
      return {
        notifications: [newNotif, ...state.notifications].slice(0, 50),
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  markRead: async (id) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await notificationApi.markRead(id);
    } catch (err) {
      console.error('[NotificationStore] Failed to mark read:', err);
    }
  },

  markAllRead: async () => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));

    try {
      await notificationApi.markAllRead();
    } catch (err) {
      console.error('[NotificationStore] Failed to mark all read:', err);
    }
  },

  removeNotification: async (id) => {
    const target = get().notifications.find((n) => n.id === id);
    const wasUnread = target && !target.read;

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }));

    try {
      await notificationApi.deleteNotification(id);
    } catch (err) {
      console.error('[NotificationStore] Failed to delete notification:', err);
    }
  },

  clearAll: async () => {
    set({ notifications: [], unreadCount: 0 });
    try {
      await notificationApi.clearAll();
    } catch (err) {
      console.error('[NotificationStore] Failed to clear all:', err);
    }
  },
}));
