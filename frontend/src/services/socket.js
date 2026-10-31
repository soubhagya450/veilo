import { io } from "socket.io-client";

const RAW_SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";
const SOCKET_URL = RAW_SOCKET_URL ? RAW_SOCKET_URL.replace(/\/+$/, "") : window.location.origin;

/**
 * Socket.IO client instance configured for cloud resilience.
 * Starts with HTTP long-polling to wake up cold-starting cloud instances (like Render),
 * then automatically upgrades to WebSocket protocol once the connection is established.
 */
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["polling", "websocket"],
  upgrade: true,
  withCredentials: false,
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
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
