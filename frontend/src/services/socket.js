import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  withCredentials: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
});

/**
 * Connect the socket with an optional session token in auth.
 */
export function connectSocket(token = null) {
  if (token) {
    socket.auth = { token };
  }
  if (!socket.connected) {
    socket.connect();
  }
}

/**
 * Disconnect socket cleanly.
 */
export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
