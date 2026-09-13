import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { BellOutlined, ClockCircleOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import React from 'react';
import { getSocket } from '../socket/socket';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { playNotificationSound } from '../utils/sound';
import { registerServiceWorkerAndAutoSubscribe } from '../utils/webPush';

/**
 * Global Socket.IO & Notification listener hook.
 * Mount once at the top level (e.g. in AppLayout) to receive all server events.
 * Also silently registers Service Worker and ensures push subscription is active.
 */
export const useSocket = () => {
  const { user } = useAuthStore();
  const { addNotification, fetchNotifications } = useNotificationStore();
  const { notification } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // 1. Fetch initial unread notifications from DB
    fetchNotifications();

    // 2. Register Service Worker + ensure push subscription is active in background.
    //    This runs silently and auto-resubscribes if the subscription was lost.
    registerServiceWorkerAndAutoSubscribe().catch(console.warn);

    const socket = getSocket();

    // Helper: Play sound if user enabled it
    const tryPlaySound = () => {
      const soundEnabled = user.notificationPreferences?.soundEnabled !== false;
      if (soundEnabled) {
        playNotificationSound();
      }
    };

    // Helper: Choose icon based on notification type
    const getNotificationIcon = (type?: string) => {
      switch (type) {
        case 'reminder':
          return React.createElement(ClockCircleOutlined, { style: { color: '#1677ff' } });
        case 'attendance':
          return React.createElement(CheckCircleOutlined, { style: { color: '#52c41a' } });
        case 'payment':
          return React.createElement(DollarOutlined, { style: { color: '#faad14' } });
        default:
          return React.createElement(BellOutlined, { style: { color: '#2e5239' } });
      }
    };

    // Handler: New general notification
    const handleNewNotification = (data: {
      id?: string;
      _id?: string;
      title?: string;
      message: string;
      type?: string;
      link?: string;
      metadata?: Record<string, unknown>;
    }) => {
      tryPlaySound();

      addNotification({
        id: data._id || data.id,
        title: data.title || 'Thông báo mới',
        message: data.message,
        type: (data.type as any) || 'info',
        link: data.link,
        metadata: data.metadata,
      });

      // Show in-app banner toast (only when app is open)
      notification.open({
        message: data.title || 'Thông báo mới',
        description: data.message,
        icon: getNotificationIcon(data.type),
        placement: 'topRight',
        duration: 5,
        onClick: () => {
          if (data.link) {
            navigate(data.link);
          }
        },
      });
    };

    // Handler: Upcoming class reminder (also triggers in-app toast when app is open)
    const handleUpcomingReminder = (data: {
      scheduleId: string;
      minutesBefore: number;
      subject: string;
      startTime?: string;
      notificationId?: string;
    }) => {
      tryPlaySound();

      const targetLink = `/calendar`;
      const notifTitle = `⏰ Sắp đến giờ học: ${data.subject}`;
      const notifMsg = `Còn ${data.minutesBefore} phút nữa là đến giờ học môn ${data.subject}${data.startTime ? ` (${data.startTime})` : ''}.`;

      addNotification({
        id: data.notificationId || `remind-${data.scheduleId}-${data.minutesBefore}`,
        title: notifTitle,
        message: notifMsg,
        type: 'reminder',
        link: targetLink,
        metadata: { scheduleId: data.scheduleId, minutesBefore: data.minutesBefore },
      });

      notification.info({
        message: notifTitle,
        description: notifMsg,
        icon: React.createElement(ClockCircleOutlined, { style: { color: '#1677ff' } }),
        placement: 'topRight',
        duration: data.minutesBefore <= 15 ? 0 : 6, // Stay until dismissed for urgent reminders
        onClick: () => navigate(targetLink),
      });
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('reminder:upcoming', handleUpcomingReminder);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('reminder:upcoming', handleUpcomingReminder);
    };
  }, [user, addNotification, fetchNotifications, notification, navigate]);
};
