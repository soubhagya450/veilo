import React, { useEffect } from "react";
import { PlusCircle, Shield, ArrowRight } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { VeiloIcon } from "../components/VeiloLogo";
import RoomCodeModal from "../components/RoomCodeModal";
import ChatWindow from "../components/ChatWindow";

export default function PrivateChat() {
  const {
    chatStatus,
    roomId,
    roomType,
    partnerAlias,
    roomCode,
    messages,
    isPartnerTyping,
    errorMessage,
    createPrivateRoom,
    sendMessage,
    sendTyping,
    leaveChat,
    blockPartner,
    reportPartner,
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
      />
    );
  }

  // If waiting for friend with issued code
  if (chatStatus === "waiting_for_friend" && roomCode) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-3.5 sm:p-4">
        <RoomCodeModal code={roomCode} onCancel={leaveChat} />
      </div>
    );
  }

  // Idle state
  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-3.5 sm:p-4">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg shadow-fuchsia-500/15">
          <VeiloIcon className="w-9 h-9 sm:w-10 sm:h-10" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">Create Private Room</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 sm:mb-8 leading-relaxed">
          Create an exclusive 2-person room protected by an unguessable 8-character code. No logs, no message storage.
        </p>

        {errorMessage && (
          <div className="p-3 mb-6 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        <button
          onClick={createPrivateRoom}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 active:scale-98 text-white font-bold text-sm shadow-xl shadow-fuchsia-500/20 transition-all cursor-pointer"
        >
          <span>Generate Room Code</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>Only 2 people can enter. Destroyed when either leaves.</span>
        </div>
      </div>
    </div>
  );
}
