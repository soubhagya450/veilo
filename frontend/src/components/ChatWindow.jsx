import React, { useRef, useEffect, useState, useCallback } from "react";
import { Shield, Lock, Phone, Video, Mic, ChevronDown, User, AlertCircle, RefreshCw, ShieldCheck, KeyRound, Eye, EyeOff, FlaskConical, LogOut } from "lucide-react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import SafetyControls from "./SafetyControls";
import AntiCaptureShield, { AntiCaptureBadge } from "./AntiCaptureShield";
import AntiCaptureTestLab from "./AntiCaptureTestLab";
import { useAntiCapture } from "../hooks/useAntiCapture";
import { useWebRTC } from "../hooks/useWebRTC";
import CallOverlay from "./CallOverlay";

export default function ChatWindow({
  roomId,
  roomType,
  partnerAlias,
  roomCode,
  messages = [],
  isPartnerTyping,
  chatStatus,
  errorMessage,
  onSendMessage,
  onTyping,
  onLeave,
  onBlock,
  onReport,
  onNext,
}) {
  const scrollContainerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [hasNewUnread, setHasNewUnread] = useState(false);
  const [showShieldModal, setShowShieldModal] = useState(false);
  const [showTestLab, setShowTestLab] = useState(false);
  const [isStealthVeilActive, setIsStealthVeilActive] = useState(true);
  const prevMessagesLengthRef = useRef(messages.length);

  const isConnected = chatStatus === "connected";
  const isPartnerLeft = chatStatus === "partner_left";
  const isEnded = chatStatus === "ended";
  const isPrivate = roomType === "private";


  // WebRTC Voice & Video Calling for Private Rooms
  const {
    callStatus,
    callType,
    incomingCall,
    isMuted,
    isVideoEnabled,
    callDuration,
    connectionStatus: callConnectionStatus,
    errorMessage: callError,
    isMinimized: isCallMinimized,
    micPermission,
    cameraPermission,
    showPermissionModal,
    targetPermissionType,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleMinimize: toggleCallMinimize,
    requestPermission,
    openPermissionModal,
    closePermissionModal,
    clearError: clearCallError,
  } = useWebRTC({
    enabled: isPrivate,
    isConnected: isConnected,
    partnerAlias: partnerAlias || "Friend",
  });

  // Anti-Screenshot & Screen Recording hook active in code rooms
  const isHoverSupported = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(hover: hover)").matches;
  const { isShielded, warningToast, clearWarning } = useAntiCapture({
    enabled: isPrivate,
    roomCode: roomCode || "",
    blockOnMouseLeave: isPrivate && isHoverSupported,
  });

  // Intelligent auto-scroll
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 140;

    const lastMessage = messages[messages.length - 1];
    const isSelfMessage = lastMessage?.isSelf;
    const isNewMessageAdded = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (isSelfMessage || isAtBottom || isPartnerLeft) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: isNewMessageAdded ? "smooth" : "auto",
      });
      setHasNewUnread(false);
    } else if (isNewMessageAdded) {
      setHasNewUnread(true);
    }
  }, [messages, isPartnerTyping, isPartnerLeft]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isUp);
    if (!isUp) {
      setHasNewUnread(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
      setShowScrollBottom(false);
      setHasNewUnread(false);
    }
  };

  return (
    <div
      className={`flex flex-col h-[calc(100dvh-4rem)] max-w-4xl mx-auto bg-slate-900/60 border-x border-slate-800/80 shadow-2xl relative w-full overflow-hidden ${
        isPrivate ? "anti-capture-lock select-none" : ""
      }`}
      onContextMenu={(e) => {
        if (isPrivate) e.preventDefault();
      }}
      onDragStart={(e) => {
        if (isPrivate) e.preventDefault();
      }}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-md z-10 shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center text-slate-300 shadow-sm relative shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            {isConnected && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500 border-2 border-slate-950"></span>
              </span>
            )}
            {isPartnerLeft && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-rose-500 border-2 border-slate-950 shadow-sm"></span>
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                {partnerAlias || "Anonymous"}
              </h2>

              <span
                className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                  isPrivate
                    ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                    : "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400"
                }`}
              >
                {isPrivate ? `Code: ${roomCode || "Private"}` : "Stranger"}
              </span>

              {/* Anti-Capture Shield Badge in Private Friend Room */}
              {isPrivate && (
                <>
                  <AntiCaptureBadge onClick={() => setShowShieldModal(true)} />

                  {/* Stealth Veil Toggle - Always visible on all screens (mobile & desktop) */}
                  <button
                    onClick={() => setIsStealthVeilActive(!isStealthVeilActive)}
                    title={isStealthVeilActive ? "Turn OFF Stealth Veil" : "Turn ON Stealth Veil"}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-medium transition-all cursor-pointer border shrink-0 ${
                      isStealthVeilActive
                        ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/20"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {isStealthVeilActive ? (
                      <EyeOff className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <Eye className="w-3 h-3 text-slate-400" />
                    )}
                    <span className="font-semibold">{isStealthVeilActive ? "Veil: ON" : "Veil: OFF"}</span>
                  </button>

                  {/* Test Lab Pill */}
                  <button
                    onClick={() => setShowTestLab(true)}
                    title="Open Anti-Capture Test Lab"
                    className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-800/80 border border-slate-700 transition-all cursor-pointer"
                  >
                    <FlaskConical className="w-3 h-3 text-cyan-400" />
                    <span>Test Lab</span>
                  </button>
                </>
              )}
            </div>

            <div className="text-[10px] sm:text-[11px] truncate">
              {isConnected ? (
                <span className="text-slate-400">
                  {isPrivate
                    ? isStealthVeilActive
                      ? "Connected • Stealth Veil Active (Tap/Hold to read)"
                      : "Connected • Anti-Capture Protection Active"
                    : "Active stranger conversation"}
                </span>
              ) : isPartnerLeft ? (
                <span className="text-rose-400 font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {partnerAlias || "Partner"} has left the conversation
                </span>
              ) : (
                <span className="text-slate-500">Disconnected</span>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* WebRTC Voice & Video Call Controls (Exclusively in Private Rooms) */}
          {isPrivate && isConnected && (
            <div className="flex items-center gap-1 sm:gap-1.5 mr-0.5 sm:mr-1 pr-1 sm:pr-2 border-r border-slate-800">
              {/* Voice Call Button */}
              <button
                onClick={() => startCall("voice")}
                disabled={callStatus !== "idle"}
                title="Start Voice Call"
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                  callStatus !== "idle"
                    ? "bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 shadow-sm shadow-cyan-500/10"
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Voice</span>
              </button>

              {/* Video Call Button */}
              <button
                onClick={() => startCall("video")}
                disabled={callStatus !== "idle"}
                title="Start Video Call"
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                  callStatus !== "idle"
                    ? "bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 hover:border-fuchsia-500/50 shadow-sm shadow-fuchsia-500/10"
                }`}
              >
                <Video className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="hidden sm:inline">Video</span>
              </button>

              {/* One-Tap Microphone Permission Helper */}
              <button
                onClick={() => openPermissionModal("voice")}
                title={
                  micPermission === "granted"
                    ? "Microphone access allowed & ready"
                    : "Tap to allow Microphone & Camera access"
                }
                className={`hidden xs:inline-flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[11px] font-mono transition-all active:scale-95 cursor-pointer ${
                  micPermission === "granted"
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25 animate-pulse"
                }`}
              >
                <Mic className="w-3 h-3" />
                <span className="hidden md:inline">{micPermission === "granted" ? "Mic Ready" : "Allow Mic"}</span>
              </button>
            </div>
          )}

          {/* Safety & Action Controls */}
          <SafetyControls
            onLeave={onLeave}
            onBlock={onBlock}
            onReport={onReport}
            onNext={onNext}
            isRandom={!isPrivate}
            partnerAlias={partnerAlias || "Stranger"}
          />
        </div>
      </div>

      {/* Immediate Partner Left Banner Alert */}
      {isPartnerLeft ? (
        <div className="bg-rose-500/20 border-b border-rose-500/40 px-3 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-rose-300 text-center shrink-0 animate-fade-in shadow-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
          <span>{partnerAlias || "Your partner"} has left the chat. This conversation has ended.</span>
        </div>
      ) : (
        /* Ephemeral & Security Notice Banner with Direct Veil Control */
        <div className="bg-slate-950/60 border-b border-slate-800/60 px-3 py-1.5 flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-400 shrink-0 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 truncate">
            <Lock className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">
              {isPrivate
                ? isStealthVeilActive
                  ? "Stealth Veil: Tap or hold message to reveal • Screenshots blocked"
                  : "Messages visible • Ephemeral RAM only • Screenshots blocked"
                : "Ephemeral: Messages live in RAM only and vanish on exit."}
            </span>
          </div>

          {isPrivate && (
            <button
              onClick={() => setIsStealthVeilActive(!isStealthVeilActive)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                isStealthVeilActive
                  ? "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
              }`}
            >
              {isStealthVeilActive ? (
                <>
                  <Eye className="w-2.5 h-2.5" />
                  <span>Turn OFF Veil</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-2.5 h-2.5" />
                  <span>Turn ON Veil</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-rose-500/90 text-white text-xs font-medium shadow-xl flex items-center gap-2 backdrop-blur-md animate-bounce max-w-[90%]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">{errorMessage}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 relative overscroll-contain transition-all ${
          isShielded ? "filter blur-2xl opacity-10 pointer-events-none" : ""
        }`}
      >
        {/* Anti-Capture Background Watermark & Privacy Overlay */}
        {isPrivate && (
          <AntiCaptureShield
            isShielded={isShielded}
            warningToast={warningToast}
            onDismissWarning={clearWarning}
            roomCode={roomCode}
          />
        )}

        {/* Welcome Card for Fresh Private Code Rooms */}
        {isPrivate && messages.length <= 2 && (
          <div className="my-4 p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-cyan-500/20 text-center max-w-sm sm:max-w-md mx-auto shadow-lg backdrop-blur-sm select-none">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-2.5">
              <KeyRound className="w-5 h-5 text-cyan-400" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-100">
              Private Code Chat
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              You are connected with <span className="text-cyan-300 font-semibold">{partnerAlias || "your friend"}</span>.
              Messages are never written to disk, and anti-screenshot & anti-screen-recording shields are active.
            </p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isPrivate={isPrivate}
            isStealthVeilActive={isStealthVeilActive}
          />
        ))}

        {isPartnerTyping && (
          <div className="py-1">
            <TypingIndicator partnerAlias={partnerAlias} />
          </div>
        )}

        {/* Partner Left Action Prompt */}
        {isPartnerLeft && (
          <div className="my-6 p-5 sm:p-6 rounded-3xl bg-slate-950/90 border border-rose-500/30 text-center max-w-sm sm:max-w-md mx-auto shadow-2xl select-none animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/15">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Conversation Ended</h3>
            <p className="text-xs text-slate-300 mt-1.5 mb-5 leading-relaxed">
              <span className="font-semibold text-rose-300">{partnerAlias || "Your partner"}</span> has left the conversation. All session messages have been permanently cleared from RAM.
            </p>
            <div className="flex items-center justify-center gap-3">
              {!isPrivate ? (
                <button
                  onClick={onNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Find New Stranger
                </button>
              ) : (
                <button
                  onClick={onLeave}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  Leave Room
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Jump to bottom button with unread indicator */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute right-4 sm:right-6 bottom-20 sm:bottom-24 z-20 p-2.5 rounded-full bg-slate-800/95 text-slate-200 border border-slate-700 shadow-xl hover:bg-slate-700 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          title="Scroll to latest"
          aria-label="Scroll to latest"
        >
          {hasNewUnread && (
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
          )}
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Message Input Bar */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        disabled={!isConnected}
      />


      {/* WebRTC 1-to-1 Voice & Video Call Overlay (Private Room ONLY) */}
      {isPrivate && (
        <CallOverlay
          callStatus={callStatus}
          callType={callType}
          incomingCall={incomingCall}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          callDuration={callDuration}
          connectionStatus={callConnectionStatus}
          errorMessage={callError}
          isMinimized={isCallMinimized}
          localStream={localStream}
          remoteStream={remoteStream}
          partnerAlias={partnerAlias || "Friend"}
          showPermissionModal={showPermissionModal}
          targetPermissionType={targetPermissionType}
          micPermission={micPermission}
          cameraPermission={cameraPermission}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEndCall={endCall}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleMinimize={toggleCallMinimize}
          onClearError={clearCallError}
          onOpenPermissionModal={openPermissionModal}
          onClosePermissionModal={closePermissionModal}
          onRequestPermission={requestPermission}
        />
      )}

      {/* Interactive Anti-Capture Test Lab Modal */}
      <AntiCaptureTestLab
        isOpen={showTestLab}
        onClose={() => setShowTestLab(false)}
      />
    </div>
  );
}
