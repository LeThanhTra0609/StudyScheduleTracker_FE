import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
    });
  }
  return socket;
};

export const connectSocket = (userId: string): void => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.emit('user:join', userId);
  }
};

export const disconnectSocket = (userId: string): void => {
  const s = getSocket();
  if (s.connected) {
    s.emit('user:leave', userId);
    s.disconnect();
  }
};
