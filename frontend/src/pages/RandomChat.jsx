import React, { useEffect } from "react";
import { MessageSquare, RefreshCw, X, ShieldAlert, Sparkles } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { VeiloIcon } from "../components/VeiloLogo";
import ChatWindow from "../components/ChatWindow";

export default function RandomChat() {
  const {
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
    sendMessage,
    sendTyping,
    leaveChat,
    blockPartner,
    reportPartner,
    nextStranger,
  } = useChat();

  // If in active chat or partner left, render ChatWindow
  if (chatStatus === "connected" || chatStatus === "partner_left") {
    return (
      <ChatWindow
        roomId={roomId}
        roomType={roomType}
        partnerAlias={partnerAlias}
        roomCode={roomCode}
        messages={messages}
        isPartnerTyping={isPartnerTyping}
        chatStatus={chatStatus}
        errorMessage={errorMessage}
        onSendMessage={sendMessage}
        onTyping={sendTyping}
        onLeave={leaveChat}
        onBlock={blockPartner}
        onReport={reportPartner}
        onNext={nextStranger}
      />
    );
  }

  // If searching for stranger in matchmaking queue
  if (chatStatus === "searching") {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-3.5 sm:p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center relative overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Radar Waves Animation */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
            <span className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-cyan-500/20 animate-radar"></span>
            <span
              className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-cyan-500/30 animate-radar"
              style={{ animationDelay: "600ms" }}
            ></span>
            <span
              className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-cyan-500/40 animate-radar"
              style={{ animationDelay: "1200ms" }}
            ></span>

            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 relative z-10 animate-pulseSlow">
              <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-cyan-400" style={{ animationDuration: "3s" }} />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">Searching for Stranger...</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6 sm:mb-8 leading-relaxed">
            Scanning for an available person in the queue. You will be placed into a temporary room with a randomized alias.
          </p>

          <button
            onClick={cancelSearch}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:scale-95 text-xs font-semibold text-slate-300 border border-slate-700 mx-auto transition-all cursor-pointer"
          >
            <X className="w-4 h-4 text-rose-400" />
            Cancel Search
          </button>
        </div>
      </div>
    );
  }

  // Idle state
  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-3.5 sm:p-4">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg shadow-cyan-500/15">
          <VeiloIcon className="w-9 h-9 sm:w-10 sm:h-10" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">Random Stranger Chat</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 sm:mb-8 leading-relaxed">
          Match with another stranger anywhere in the world. Once you leave, the chat is destroyed forever.
        </p>

        {/* Safety Warning Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left mb-6 sm:mb-8 flex gap-3 text-xs text-slate-300">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-200">Safety Notice</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Never share real names, phone numbers, passwords, or personal credentials. You can skip or block anyone at any moment.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 mb-6 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        <button
          onClick={findStranger}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Start Random Chat
        </button>
      </div>
    </div>
  );
}
