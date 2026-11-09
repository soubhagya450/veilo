import React, { useState, useEffect } from "react";
import {
  Mic,
  Video,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Laptop,
  X,
  Lock,
  RefreshCw,
  Sliders,
  ChevronRight,
} from "lucide-react";

export default function PermissionModal({
  isOpen,
  onClose,
  onRequestPermission,
  micPermission = "prompt", // 'prompt' | 'granted' | 'denied' | 'unknown'
  cameraPermission = "prompt",
  targetType = "voice", // 'voice' | 'video'
}) {
  const [activeTab, setActiveTab] = useState("mobile"); // 'mobile' | 'desktop'
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestResult, setRequestResult] = useState(null); // 'success' | 'denied' | null

  // Auto-detect mobile vs desktop
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      setActiveTab(isMobileDevice ? "mobile" : "desktop");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndAllow = async () => {
    setIsRequesting(true);
    setRequestResult(null);
    try {
      const ok = await onRequestPermission(targetType);
      if (ok) {
        setRequestResult("success");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setRequestResult("denied");
      }
    } catch {
      setRequestResult("denied");
    } finally {
      setIsRequesting(false);
    }
  };

  const isGranted = micPermission === "granted" || requestResult === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto select-none">
      <div className="relative max-w-md w-full my-auto rounded-3xl bg-slate-900 border border-cyan-500/30 p-5 sm:p-7 shadow-2xl text-left overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              {targetType === "video" ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                {targetType === "video" ? "Camera & Microphone Access" : "Microphone Access"}
              </h3>
              <p className="text-[11px] text-cyan-300 font-mono">
                Required for 1-to-1 Voice & Video Calls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Permission Status Banner */}
        <div className="my-4">
          {isGranted ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold">Access Granted & Ready!</span>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">
                  Your device is configured. You can start and receive calls anytime.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-3 text-cyan-200 text-xs">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-100">Private & Secure Direct Calls</span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  SayHii uses direct peer-to-peer WebRTC. Your audio and video stream directly between you and your friend. Nothing is stored on any server.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 1-Tap Trigger Button */}
        {!isGranted && (
          <button
            onClick={handleTestAndAllow}
            disabled={isRequesting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/20 transition-all cursor-pointer mb-5"
          >
            {isRequesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Waiting for Browser Prompt...</span>
              </>
            ) : (
              <>
                {targetType === "video" ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>Allow Microphone & Camera</span>
              </>
            )}
          </button>
        )}

        {/* If Blocked or Denied: Step-by-Step Recovery Guide */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>How to allow if blocked</span>
            </span>

            {/* Platform Switcher */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[10px] font-mono">
              <button
                onClick={() => setActiveTab("mobile")}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === "mobile"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </button>
              <button
                onClick={() => setActiveTab("desktop")}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === "desktop"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Laptop className="w-3 h-3" />
                <span>Desktop</span>
              </button>
            </div>
          </div>

          {/* Guide Steps */}
          <div className="space-y-2 text-xs text-slate-300">
            {activeTab === "mobile" ? (
              <>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">Look at the top URL bar</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tap the <strong>lock 🔒 or tune/settings 🎚️</strong> icon next to the website address.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">Open Permissions</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tap <strong>Permissions</strong> (or <em>Site Settings</em> / <em>Website Settings</em>).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">Switch Microphone to "Allow"</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Turn <strong>Microphone</strong> (and <strong>Camera</strong>) to <strong>Allow</strong>, then tap the button above to test!
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">Click the Lock 🔒 icon</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click the padlock or tune icon on the far left of your browser address bar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">Toggle Microphone & Camera to ON</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Change the switch next to <strong>Microphone</strong> from Blocked to <strong>Allow</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">Reload / Retest</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click <strong>Allow Microphone</strong> above to confirm it works.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Lock className="w-3 h-3 text-cyan-500/60" />
            <span>End-to-End P2P Encrypted</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
          >
            {isGranted ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
