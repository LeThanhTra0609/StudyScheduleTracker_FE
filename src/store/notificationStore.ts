import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: 'attendance' | 'payment' | 'reminder' | 'info';
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notif) => {
    const newNotif: AppNotification = {
      ...notif,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date(),
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications].slice(0, 50), // keep last 50
      unreadCount: state.unreadCount + 1,
    }));
  },

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
