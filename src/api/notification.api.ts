import apiClient from './client';
import type { AppNotification } from '../store/notificationStore';

export interface NotificationListResponse {
  success: boolean;
  data: AppNotification[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const notificationApi = {
  getNotifications: (params?: { page?: number; limit?: number }) =>
    apiClient.get<NotificationListResponse>('/notifications', { params }),

  markRead: (id: string) =>
    apiClient.patch<{ success: boolean; data: AppNotification; unreadCount: number }>(
      `/notifications/${id}/read`
    ),

  markAllRead: () =>
    apiClient.patch<{ success: boolean; message: string }>('/notifications/read-all'),

  deleteNotification: (id: string) =>
    apiClient.delete<{ success: boolean; message: string; unreadCount: number }>(
      `/notifications/${id}`
    ),

  clearAll: () =>
    apiClient.delete<{ success: boolean; message: string }>('/notifications/clear-all'),

  getVapidPublicKey: () =>
    apiClient.get<{ success: boolean; publicKey: string }>('/notifications/vapid-public-key'),

  subscribePush: (data: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }) =>
    apiClient.post<{ success: boolean; message: string }>('/notifications/push-subscribe', data),

  unsubscribePush: (endpoint: string) =>
    apiClient.post<{ success: boolean; message: string }>('/notifications/push-unsubscribe', { endpoint }),

  testPush: () =>
    apiClient.post<{ success: boolean; message: string; activeDevices: number }>('/notifications/test-push'),
};
