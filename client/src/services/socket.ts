import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      timeout: 10000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ [WebSocket Connected] Live IoT link established:', socket?.id);
    });

    socket.on('reconnect', (attempt) => {
      console.log('🔄 [WebSocket Reconnected] Successfully re-established on attempt:', attempt);
    });

    socket.on('connect_error', (err) => {
      // Quiet reconnection
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [WebSocket Disconnected]:', reason);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
