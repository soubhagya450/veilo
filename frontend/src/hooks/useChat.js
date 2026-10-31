import { useState, useEffect, useCallback, useRef } from "react";
import { socket, connectSocket } from "../services/socket";

export function useChat() {
  const [chatStatus, setChatStatus] = useState("idle");
  // 'idle' | 'searching' | 'waiting_for_friend' | 'connected' | 'partner_left' | 'ended'
  const [roomId, setRoomId] = useState(null);
  const [roomType, setRoomType] = useState(null);
  const [partnerAlias, setPartnerAlias] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const typingTimeoutRef = useRef(null);

  // Play subtle audio chime on message if user allows
  const playChime = useCallback((type = "message") => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "matched") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
      // Audio not supported or muted
    }
  }, []);

  const ensureConnected = useCallback(() => {
    if (!socket.connected) {
      const token = sessionStorage.getItem("veilo_token");
      connectSocket(token);
    }
  }, []);

  useEffect(() => {
    function onSearching() {
      setChatStatus("searching");
      setMessages([]);
    }

    function onSearchCancelled() {
      setChatStatus("idle");
    }

    function onRoomCreated(data) {
      setRoomId(data.roomId);
      setRoomCode(data.roomCode);
      setRoomType("private");
      setChatStatus("waiting_for_friend");
      setMessages([]);
    }

    function onMatched(data) {
      setRoomId(data.roomId);
      setRoomType(data.roomType);
      setPartnerAlias(data.partnerAlias || "Stranger");
      if (data.roomCode) setRoomCode(data.roomCode);
      setChatStatus("connected");
      setIsPartnerTyping(false);
      setMessages([
        {
          id: "sys-init",
          text: `Connected with ${data.partnerAlias || "Stranger"}. Say hello!`,
          isSystem: true,
          systemType: "info",
          timestamp: Date.now(),
        },
      ]);
      playChime("matched");
    }

    function onPartnerJoined(data) {
      setPartnerAlias(data.partnerAlias || "Friend");
      setChatStatus("connected");
      setIsPartnerTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-joined-${Date.now()}`,
          text: `${data.partnerAlias || "Your friend"} entered the room.`,
          isSystem: true,
          systemType: "info",
          timestamp: Date.now(),
        },
      ]);
      playChime("matched");
    }

    function onReceiveMessage(msg) {
      const isSelf = msg.senderSid === socket.id;
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id || String(Date.now()),
          text: msg.text,
          senderAlias: msg.senderAlias,
          timestamp: msg.timestamp || Date.now(),
          isSelf,
          isSystem: !!msg.isSystem,
          systemType: msg.systemType || "info",
        },
      ]);
      if (!isSelf && !msg.isSystem) {
        setIsPartnerTyping(false);
        playChime("message");
      }
    }

    function onPartnerTyping(data) {
      setIsPartnerTyping(!!data?.isTyping);
      if (data?.isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsPartnerTyping(false);
        }, 3000);
      }
    }

    function onPartnerLeft(data) {
      setIsPartnerTyping(false);
      setChatStatus("partner_left");
      const reasonText =
        data?.reason === "blocked"
          ? "You have blocked this partner."
          : data?.reason === "reported"
          ? "Report submitted. Conversation closed."
          : `${partnerAlias || "Stranger"} has left the conversation.`;

      setMessages((prev) => [
        ...prev,
        {
          id: `sys-left-${Date.now()}`,
          text: reasonText,
          isSystem: true,
          systemType: "warning",
          timestamp: Date.now(),
        },
      ]);
    }

    function onChatEnded() {
      setChatStatus("ended");
      setIsPartnerTyping(false);
      setRoomId(null);
      setPartnerAlias(null);
      setRoomCode(null);
    }

    function onErrorEvent(err) {
      setErrorMessage(err.message || "An error occurred.");
      const t = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(t);
    }

    socket.on("searching", onSearching);
    socket.on("search_cancelled", onSearchCancelled);
    socket.on("room_created", onRoomCreated);
    socket.on("matched", onMatched);
    socket.on("partner_joined", onPartnerJoined);
    socket.on("receive_message", onReceiveMessage);
    socket.on("partner_typing", onPartnerTyping);
    socket.on("partner_left", onPartnerLeft);
    socket.on("chat_ended", onChatEnded);
    socket.on("error_event", onErrorEvent);

    return () => {
      socket.off("searching", onSearching);
      socket.off("search_cancelled", onSearchCancelled);
      socket.off("room_created", onRoomCreated);
      socket.off("matched", onMatched);
      socket.off("partner_joined", onPartnerJoined);
      socket.off("receive_message", onReceiveMessage);
      socket.off("partner_typing", onPartnerTyping);
      socket.off("partner_left", onPartnerLeft);
      socket.off("chat_ended", onChatEnded);
      socket.off("error_event", onErrorEvent);
    };
  }, [partnerAlias, playChime]);

  const findStranger = useCallback(() => {
    ensureConnected();
    setErrorMessage(null);
    setChatStatus("searching");
    setMessages([]);
    socket.emit("find_stranger");
  }, [ensureConnected]);

  const cancelSearch = useCallback(() => {
    socket.emit("cancel_search");
    setChatStatus("idle");
  }, []);

  const createPrivateRoom = useCallback(() => {
    ensureConnected();
    setErrorMessage(null);
    setMessages([]);
    socket.emit("create_room");
  }, [ensureConnected]);

  const joinPrivateRoom = useCallback((code) => {
    ensureConnected();
    setErrorMessage(null);
    setMessages([]);
    socket.emit("join_room_code", { code: code.trim().toUpperCase() });
  }, [ensureConnected]);

  const sendMessage = useCallback((text) => {
    if (!text || !text.trim()) return;
    socket.emit("send_message", { text: text.trim() });
    socket.emit("typing", { isTyping: false });
  }, []);

  const sendTyping = useCallback((isTyping) => {
    socket.emit("typing", { isTyping });
  }, []);

  const leaveChat = useCallback(() => {
    socket.emit("leave_chat");
    setChatStatus("idle");
    setRoomId(null);
    setPartnerAlias(null);
    setRoomCode(null);
    setMessages([]);
    setIsPartnerTyping(false);
  }, []);

  const blockPartner = useCallback(() => {
    socket.emit("block_user");
    setChatStatus("ended");
    setRoomId(null);
    setPartnerAlias(null);
    setRoomCode(null);
    setMessages([]);
    setIsPartnerTyping(false);
  }, []);

  const reportPartner = useCallback((reason) => {
    socket.emit("report_user", { reason });
    setChatStatus("ended");
    setRoomId(null);
    setPartnerAlias(null);
    setRoomCode(null);
    setMessages([]);
    setIsPartnerTyping(false);
  }, []);

  const nextStranger = useCallback(() => {
    findStranger();
  }, [findStranger]);

  return {
    chatStatus,
    roomId,
    roomType,
    partnerAlias,
    roomCode,
    messages,
    isPartnerTyping,
    errorMessage,
    findStranger,
    cancelSearch,
    createPrivateRoom,
    joinPrivateRoom,
    sendMessage,
    sendTyping,
    leaveChat,
    blockPartner,
    reportPartner,
    nextStranger,
  };
}
