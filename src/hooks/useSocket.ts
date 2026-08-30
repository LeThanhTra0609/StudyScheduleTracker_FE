import { useEffect } from 'react';
import { getSocket } from '../socket/socket';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

/**
 * Global Socket.IO listener hook.
 * Mount once at the top level (e.g. in AppLayout) to receive all server events.
 */
export const useSocket = () => {
  const { user } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    // notification:new → add to notification store
    socket.on('notification:new', (data: { type: string; message: string; link?: string }) => {
      addNotification({
        type: data.type as 'attendance' | 'payment' | 'reminder' | 'info',
        message: data.message,
        link: data.link,
      });
    });

    // reminder:upcoming → also add as reminder notification
    socket.on('reminder:upcoming', (data: { scheduleId: string; minutesBefore: number; subject: string }) => {
      addNotification({
        type: 'reminder',
        message: `Còn ${data.minutesBefore} phút nữa: ${data.subject}`,
        link: `/schedules/${data.scheduleId}`,
      });
    });

    return () => {
      socket.off('notification:new');
      socket.off('reminder:upcoming');
    };
  }, [user, addNotification]);
};
