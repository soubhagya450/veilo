import { useState, useEffect, useCallback } from "react";
import { socket, connectSocket, disconnectSocket } from "../services/socket";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isConnecting, setIsConnecting] = useState(false);
  const [alias, setAlias] = useState(() => sessionStorage.getItem("veilo_alias") || "Anonymous");
  const [sessionToken, setSessionToken] = useState(() => sessionStorage.getItem("veilo_token") || null);
  const [socketId, setSocketId] = useState(socket.id || null);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setIsConnecting(false);
      setSocketId(socket.id);
    }

    function onDisconnect() {
      setIsConnected(false);
      setIsConnecting(false);
      setSocketId(null);
    }

    function onConnectError() {
      setIsConnected(false);
      setIsConnecting(false);
    }

    function onSessionReady(data) {
      if (data?.alias) {
        setAlias(data.alias);
        sessionStorage.setItem("veilo_alias", data.alias);
      }
      if (data?.token) {
        setSessionToken(data.token);
        sessionStorage.setItem("veilo_token", data.token);
      }
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("session_ready", onSessionReady);

    // Initial check
    if (socket.connected) {
      setIsConnected(true);
      setSocketId(socket.id);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("session_ready", onSessionReady);
    };
  }, []);

  const connect = useCallback(() => {
    if (!socket.connected) {
      setIsConnecting(true);
      const token = sessionStorage.getItem("veilo_token");
      connectSocket(token);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  return {
    isConnected,
    isConnecting,
    alias,
    sessionToken,
    socketId,
    connect,
    disconnect,
  };
}
