import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, EyeOff, Lock, AlertTriangle, X, CheckCircle2 } from "lucide-react";

/**
 * AntiCaptureShield renders:
 * 1. The privacy overlay when capture tools or window blur are detected.
 * 2. The security warning toast when screenshot shortcuts are intercepted.
 * 3. The anti-leak diagonal watermark pattern.
 * 4. The status badge & info modal for private friend rooms.
 */
export default function AntiCaptureShield({
  isShielded,
  warningToast,
  onDismissWarning,
  roomCode,
}) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      {/* 1. Full Privacy Overlay on Unfocus / Screen Recording Detection */}
      {isShielded && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-[#070A10]/95 backdrop-blur-2xl text-center select-none animate-fade-in">
          <div className="relative mb-5">
            <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/30 to-fuchsia-500/30 rounded-full blur-xl animate-pulse"></div>
            <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-2xl">
              <EyeOff className="w-8 h-8 animate-pulse text-cyan-400" />
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight mb-2">
            Anti-Capture Shield Active
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed mb-5">
            Screen recording, snipping tools, and screenshots are prohibited in private code chats. Content is blurred while window is out of focus.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click or focus this window to resume</span>
          </div>
        </div>
      )}

      {/* 2. Floating Warning Toast on Intercepted Screenshot Shortcut */}
      {warningToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-rose-950/95 border border-rose-500/50 text-rose-200 text-xs font-medium shadow-2xl flex items-center gap-2.5 backdrop-blur-xl animate-bounce max-w-[92%] sm:max-w-md select-none">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="flex-1 leading-snug">{warningToast}</span>
          {onDismissWarning && (
            <button
              onClick={onDismissWarning}
              className="p-1 rounded-lg hover:bg-rose-900/50 text-rose-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 3. Repeating Anti-Leak Watermark Background */}
      <div
        className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 opacity-[0.035] flex flex-wrap content-start items-start justify-around gap-12 p-4 rotate-[-12deg] scale-125"
        aria-hidden="true"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="text-[11px] font-mono font-bold tracking-widest text-slate-200 uppercase whitespace-nowrap"
          >
            SAYHII SECURE • CODE {roomCode || "PRIVATE"} • NO LOGS
          </span>
        ))}
      </div>

      {/* 4. Security Info Modal (Triggered by Header Badge) */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl my-auto text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                Anti-Capture Security Suite
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              This private room is hardened with five active client-side defenses to protect conversations with your friend from interception:
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-200">Anti-Screen Recording Blur</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Automatically blacks out and blurs chat content the moment screen recording or snipping tools steal focus.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-200">Screenshot & Clipboard Scrambler</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Intercepts PrintScreen and capture key combinations, suppressing the action and flushing the system clipboard.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-200">Print & Save-As-PDF Immunity</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Hardware print style sheets strip and hide all chat elements if browser print is invoked.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-200">Text Selection & Drag Lock</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Disables text highlighting, dragging, and context menus so private messages cannot be scraped.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-200">Session Watermarking</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Watermarks the chat background with the room code to identify leaks from external camera photos.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * AntiCaptureBadge renders the pill in the chat header
 */
export function AntiCaptureBadge({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Anti-Screenshot & Recording Shield Active. Click for details."
      className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-mono font-medium transition-all cursor-pointer shadow-sm"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span>Anti-Capture</span>
    </button>
  );
}
