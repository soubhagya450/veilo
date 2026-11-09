import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { KeyRound, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Lock } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { validateRoomCode as checkCodeApi } from "../services/api";
import { VeiloIcon } from "../components/VeiloLogo";
import ChatWindow from "../components/ChatWindow";

export default function JoinRoom() {
  const [searchParams] = useSearchParams();
  const rawQueryCode = searchParams.get("code") || "";
  const initialCode = rawQueryCode.trim().toUpperCase().replace(/[^A-Z2-9]/g, "");

  const [code, setCode] = useState(initialCode);
  const [localError, setLocalError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const autoJoinAttemptedRef = useRef(false);

  const {
    chatStatus,
    roomId,
    roomType,
    partnerAlias,
    roomCode,
    messages,
    isPartnerTyping,
    errorMessage,
    joinPrivateRoom,
    sendMessage,
    sendTyping,
    leaveChat,
    blockPartner,
    reportPartner,
  } = useChat();

  // If a valid 8-character code is provided in the URL, automatically initiate join!
  useEffect(() => {
    if (initialCode && initialCode.length === 8 && !autoJoinAttemptedRef.current) {
      autoJoinAttemptedRef.current = true;
      setCode(initialCode);
      setLocalError(null);
      // Auto-join via real-time socket
      joinPrivateRoom(initialCode);
    }
  }, [initialCode, joinPrivateRoom]);

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "");
    if (val.length <= 8) {
      setCode(val);
      setLocalError(null);
    }
  };

  const handleJoin = async (e) => {
    e?.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z2-9]/g, "");
    if (cleanCode.length !== 8) {
      setLocalError("Please enter an 8-character room code.");
      return;
    }

    setIsValidating(true);
    setLocalError(null);

    // Optional pre-check without blocking on cold start
    try {
      const res = await checkCodeApi(cleanCode);
      if (res && res.valid === false) {
        setIsValidating(false);
        setLocalError(res.message || "Invalid room code format.");
        return;
      }
      if (res && res.available === false && res.status === 409) {
        setIsValidating(false);
        setLocalError(res.message || "This room is already full (2 participants).");
        return;
      }
    } catch {
      // Proceed to authoritative socket validation
    }

    setIsValidating(false);
    // Join room via real-time Socket.IO
    joinPrivateRoom(cleanCode);
  };

  // If connected or partner left, render ChatWindow
  if (chatStatus === "connected" || chatStatus === "partner_left") {
    return (
      <ChatWindow
        roomId={roomId}
        roomType={roomType}
        partnerAlias={partnerAlias}
        roomCode={roomCode || code}
        messages={messages}
        isPartnerTyping={isPartnerTyping}
        chatStatus={chatStatus}
        errorMessage={errorMessage}
        onSendMessage={sendMessage}
        onTyping={sendTyping}
        onLeave={leaveChat}
        onBlock={blockPartner}
        onReport={reportPartner}
      />
    );
  }

  // Connecting state when joining via share link
  const isAutoConnecting =
    initialCode.length === 8 &&
    !errorMessage &&
    !localError &&
    (chatStatus === "idle" || isValidating);

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-3.5 sm:p-4">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg shadow-cyan-500/15">
          <VeiloIcon className="w-9 h-9 sm:w-10 sm:h-10" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">Join Private Room</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 sm:mb-8 leading-relaxed">
          {initialCode.length === 8
            ? "Connecting you directly to your friend's private conversation."
            : "Enter the 8-character code shared by your friend to join their private conversation."}
        </p>

        {isAutoConnecting && (
          <div className="mb-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-center gap-2.5 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
            <span>Connecting to room <strong>{code}</strong>...</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <input
              type="text"
              maxLength={8}
              value={code}
              onChange={handleCodeChange}
              placeholder="e.g. 7K9AFX2M"
              autoFocus
              className="w-full text-center text-xl sm:text-2xl font-mono font-bold tracking-wider sm:tracking-widest px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-cyan-400 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 uppercase"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 px-1">
              <span>Unambiguous uppercase characters</span>
              <span className="font-mono">{code.length}/8</span>
            </div>
          </div>

          {(localError || errorMessage) && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{localError || errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={code.length !== 8 || isValidating}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Connecting to Room...</span>
              </>
            ) : (
              <>
                <span>Enter Private Room</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Brute-force protected. Disappears on leave.</span>
        </div>
      </div>
    </div>
  );
}
