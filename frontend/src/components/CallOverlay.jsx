import React, { useRef, useEffect } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  Shield,
  Lock,
  Wifi,
  AlertCircle,
  X,
  ShieldCheck,
} from "lucide-react";
import PermissionModal from "./PermissionModal";

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function CallOverlay({
  callStatus,
  callType,
  incomingCall,
  isMuted,
  isVideoEnabled,
  callDuration,
  connectionStatus,
  errorMessage,
  isMinimized,
  localStream,
  remoteStream,
  partnerAlias = "Friend",
  showPermissionModal = false,
  targetPermissionType = "voice",
  micPermission = "prompt",
  cameraPermission = "prompt",
  onAccept,
  onReject,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleMinimize,
  onClearError,
  onOpenPermissionModal,
  onClosePermissionModal,
  onRequestPermission,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Attach local media stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus, isMinimized, callType]);

  // Attach remote media stream to remote video/audio elements
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus, isMinimized, callType]);

  const isCallActive =
    callStatus === "calling" ||
    callStatus === "connecting" ||
    callStatus === "connected" ||
    callStatus === "ended";

  return (
    <>
      {/* Hidden remote audio element for reliable voice playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* 1. Permission or Call Error Toast with 1-Tap Allow Action */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] p-3.5 rounded-2xl bg-rose-950/95 border border-rose-500/50 shadow-2xl backdrop-blur-xl text-rose-200 text-xs flex items-center justify-between gap-3 animate-fade-in select-none">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="leading-snug truncate sm:whitespace-normal">{errorMessage}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenPermissionModal && (
              <button
                onClick={() => onOpenPermissionModal("voice")}
                className="px-2.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-[11px] shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                Allow Access
              </button>
            )}
            <button
              onClick={onClearError}
              className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Incoming Call Modal Prompt */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-sm w-full p-6 sm:p-7 rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl text-center select-none overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 -left-16 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Radar Pulsing Avatar */}
            <div className="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping"></span>
              <span className="absolute -inset-2 rounded-full bg-cyan-500/10 animate-pulse"></span>
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-xl">
                {incomingCall.callType === "video" ? (
                  <Video className="w-9 h-9" />
                ) : (
                  <PhoneIncoming className="w-9 h-9 animate-bounce" />
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-100 tracking-tight">
              {incomingCall.callerAlias || partnerAlias || "Friend"}
            </h3>
            <p className="text-xs text-cyan-400 font-mono mt-1">
              Incoming {incomingCall.callType === "video" ? "Video Call" : "Voice Call"}...
            </p>

            {/* Clear Browser Permission Tip so users expect the Allow button */}
            <div className="mt-4 p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-left flex items-start gap-2 text-[11px] text-cyan-200">
              <Mic className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Tap <strong>Allow</strong> when your browser asks for {incomingCall.callType === "video" ? "camera & microphone" : "microphone"} permission.
              </span>
            </div>

            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Peer-to-Peer Encrypted • Zero Logs</span>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-center gap-5">
              {/* Decline Button */}
              <button
                onClick={() => onReject("declined")}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all">
                  <PhoneOff className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-rose-400">
                  Decline
                </span>
              </button>

              {/* Accept Button */}
              <button
                onClick={onAccept}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all animate-pulse">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-400">
                  Accept
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Outgoing Calling Banner (While waiting for answer) */}
      {callStatus === "calling" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-sm w-full p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center select-none">
            {/* Pulsing Avatar */}
            <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping"></span>
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-xl">
                {callType === "video" ? (
                  <Video className="w-9 h-9" />
                ) : (
                  <Phone className="w-9 h-9 animate-pulse" />
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-100">{partnerAlias || "Friend"}</h3>
            <p className="text-xs text-cyan-400 font-mono mt-1 animate-pulse">
              {connectionStatus || "Calling..."}
            </p>

            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>Private 1-to-1 WebRTC Direct Link</span>
            </div>

            <div className="mt-7 flex justify-center">
              <button
                onClick={() => onReject("cancelled")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Cancel Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Minimized Pill Bar (Allows chatting during call) */}
      {isCallActive && isMinimized && callStatus !== "calling" && (
        <div className="fixed bottom-20 right-4 z-40 p-3 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-fade-in select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                {callType === "video" ? (
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{partnerAlias}</span>
              </div>
              <div className="text-[10px] font-mono text-cyan-400">
                {formatDuration(callDuration)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                isMuted
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onToggleMinimize}
              title="Expand Call View"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onEndCall}
              title="End Call"
              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Active Voice Call Full View */}
      {isCallActive && !isMinimized && callType === "voice" && callStatus !== "calling" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
          <div className="relative max-w-sm w-full p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center overflow-hidden">
            {/* Top Bar with Minimize */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>P2P Voice Session</span>
              </div>
              <button
                onClick={onToggleMinimize}
                title="Minimize (Continue Chatting)"
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Ambient Sound Equalizer Ring */}
            <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 animate-pulse"></span>
              <span
                className="absolute -inset-3 rounded-full border border-cyan-500/30 animate-spin opacity-40"
                style={{ animationDuration: "12s" }}
              ></span>
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-2xl">
                <Phone className="w-10 h-10" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-100">{partnerAlias || "Friend"}</h3>
            <div className="mt-1 text-sm font-mono font-semibold text-emerald-400">
              {formatDuration(callDuration)}
            </div>

            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-slate-300">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>{connectionStatus}</span>
            </div>

            {/* Call Controls */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-center gap-4">
              {/* Mic Mute Button */}
              <button
                onClick={onToggleMute}
                className={`p-3.5 rounded-2xl text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  isMuted
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span className="text-[10px]">{isMuted ? "Unmute" : "Mute"}</span>
              </button>

              {/* End Call Button */}
              <button
                onClick={onEndCall}
                className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-xl shadow-rose-600/30 transition-all cursor-pointer flex flex-col items-center gap-1"
              >
                <PhoneOff className="w-6 h-6" />
                <span className="text-[10px] font-bold">End Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Active Video Call View */}
      {isCallActive && !isMinimized && callType === "video" && callStatus !== "calling" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-2xl p-2 sm:p-4 select-none">
          {/* Header Controls Overlay */}
          <div className="relative z-20 flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">{partnerAlias}</h4>
                <div className="text-[10px] font-mono text-cyan-400">
                  {formatDuration(callDuration)} • {connectionStatus}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMinimize}
                title="Minimize (Continue Chatting)"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Stream Stage */}
          <div className="relative flex-1 max-w-4xl w-full mx-auto my-2 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
            {/* Remote Peer Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-3xl"
            />

            {/* Fallback avatar if remote video is disabled / not yet loaded */}
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/90">
                <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3 animate-pulse">
                  <Video className="w-8 h-8 text-cyan-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Connecting video with {partnerAlias}...</h4>
                <p className="text-xs text-slate-500 mt-1 font-mono">Negotiating direct P2P link</p>
              </div>
            )}

            {/* Local User Picture-in-Picture (PiP) Window */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 w-28 h-40 sm:w-40 sm:h-56 rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-2xl bg-slate-900">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${
                  isVideoEnabled ? "block" : "hidden"
                }`}
              />
              {!isVideoEnabled && (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-950 text-center p-2">
                  <VideoOff className="w-6 h-6 text-rose-400 mb-1" />
                  <span className="text-[9px] font-mono">Camera Off</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Floating Control Bar */}
          <div className="relative z-20 flex items-center justify-center gap-3 sm:gap-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md max-w-md mx-auto w-full">
            {/* Mic Toggle */}
            <button
              onClick={onToggleMute}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              className={`p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer ${
                isMuted
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={onToggleVideo}
              title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
              className={`p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer ${
                !isVideoEnabled
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              }`}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={onEndCall}
              title="End Video Call"
              className="px-5 py-3 sm:py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-rose-600/30 transition-all cursor-pointer"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Permission Guide Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={onClosePermissionModal}
        onRequestPermission={onRequestPermission}
        micPermission={micPermission}
        cameraPermission={cameraPermission}
        targetType={targetPermissionType}
      />
    </>
  );
}
