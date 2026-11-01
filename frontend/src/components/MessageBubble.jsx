import React, { useState, useEffect, useRef } from "react";
import { Info, AlertTriangle, ShieldCheck, Eye, EyeOff, Lock, Clock } from "lucide-react";

/**
 * MessageBubble renders chat messages.
 * In Private Code Rooms, it supports "Stealth Veil" (Peek-to-Reveal) mode:
 * Messages remain hidden behind an obsidian privacy veil until actively tapped or held.
 * On mobile, tapping reveals the message for 6 seconds with an automatic countdown,
 * or holding reveals it for as long as pressed.
 */
export default function MessageBubble({
  message,
  isPrivate = false,
  isStealthVeilActive = true,
}) {
  const { text, senderAlias, timestamp, isSelf, isSystem, systemType } = message;
  const [isRevealed, setIsRevealed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const autoHideTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const pointerDownTimeRef = useRef(0);
  const isPointerActiveRef = useRef(false);

  // Format timestamp (hh:mm A)
  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const clearTimers = () => {
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    autoHideTimerRef.current = null;
    countdownIntervalRef.current = null;
    setCountdown(0);
  };

  // Reset peek if window blurs or visibility changes
  useEffect(() => {
    const handleBlur = () => {
      setIsRevealed(false);
      clearTimers();
    };
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
      clearTimers();
    };
  }, []);

  if (isSystem) {
    const isWarning = systemType === "warning";
    return (
      <div className="flex justify-center my-3 px-4 select-none">
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md ${
            isWarning
              ? "bg-amber-500/10 border-amber-500/25 text-amber-300"
              : "bg-slate-800/80 border-slate-700/60 text-slate-300"
          }`}
        >
          {isWarning ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          )}
          <span>{text}</span>
        </div>
      </div>
    );
  }

  const useVeil = isPrivate && isStealthVeilActive;

  const handlePointerDown = () => {
    if (!useVeil) return;
    pointerDownTimeRef.current = Date.now();
    isPointerActiveRef.current = true;
    clearTimers();
    setIsRevealed(true);
  };

  const handlePointerUp = () => {
    if (!useVeil) return;
    const holdDuration = Date.now() - pointerDownTimeRef.current;
    isPointerActiveRef.current = false;

    // If held for less than 300ms, treat as a quick tap on mobile -> keep revealed for 6 seconds
    if (holdDuration < 300) {
      triggerTemporaryReveal(6);
    } else {
      // Long press release -> conceal
      setIsRevealed(false);
      clearTimers();
    }
  };

  const handlePointerLeave = () => {
    if (!useVeil) return;
    // Only conceal if not in tap countdown mode
    if (isPointerActiveRef.current && countdown === 0) {
      isPointerActiveRef.current = false;
      setIsRevealed(false);
    }
  };

  const triggerTemporaryReveal = (seconds = 6) => {
    clearTimers();
    setIsRevealed(true);
    setCountdown(seconds);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    autoHideTimerRef.current = setTimeout(() => {
      setIsRevealed(false);
      clearTimers();
    }, seconds * 1000);
  };

  const handleToggleClick = (e) => {
    if (!useVeil) return;
    // If already revealed and user taps again, immediately re-veil
    if (isRevealed && countdown > 0) {
      e.stopPropagation();
      clearTimers();
      setIsRevealed(false);
    }
  };

  return (
    <div className={`flex flex-col mb-3.5 ${isSelf ? "items-end" : "items-start"}`}>
      {/* Sender Alias Label */}
      <span className="text-[11px] font-medium text-slate-400 mb-1 px-1 select-none flex items-center gap-1.5">
        <span>{isSelf ? "You" : senderAlias || "Stranger"}</span>
        {useVeil && (
          <span className="text-[9px] text-cyan-400/80 font-mono flex items-center gap-0.5">
            <Lock className="w-2.5 h-2.5" />
            <span>Veiled</span>
          </span>
        )}
      </span>

      {/* Bubble Container */}
      <div
        onClick={handleToggleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={(e) => {
          if (isPrivate) e.preventDefault();
        }}
        style={{
          touchAction: "manipulation",
          WebkitTouchCallout: "none",
        }}
        className={`max-w-[88%] sm:max-w-[72%] px-4 py-2.5 rounded-2xl shadow-sm break-words relative transition-all duration-200 select-none ${
          isPrivate ? "anti-capture-lock" : "select-text"
        } ${
          isSelf
            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs"
            : "bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-xs"
        } ${
          useVeil && !isRevealed
            ? "cursor-pointer hover:border-cyan-500/40 active:scale-[0.99] border border-cyan-500/25"
            : ""
        }`}
        title={
          useVeil
            ? isRevealed
              ? "Tap to re-veil message"
              : "Tap or hold to peek message"
            : ""
        }
      >
        {/* Stealth Veil Masking Layer */}
        {useVeil && !isRevealed ? (
          <div className="py-1 flex items-center justify-between gap-3 text-cyan-300 min-w-[170px] sm:min-w-[190px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-mono font-medium tracking-wide">
                [ Tap / Hold to Reveal ]
              </span>
            </div>
            <Eye className="w-4 h-4 text-cyan-400/80 shrink-0 animate-pulse" />
          </div>
        ) : (
          /* Revealed Message Content */
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap animate-fade-in">
              {text}
            </p>

            <div
              className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] select-none ${
                isSelf ? "text-emerald-200/80" : "text-slate-400"
              }`}
            >
              {isPrivate && <ShieldCheck className="w-2.5 h-2.5 text-emerald-300/70" />}
              {useVeil && isRevealed && (
                <span className="text-[9px] text-cyan-300 font-mono flex items-center gap-1">
                  {countdown > 0 ? (
                    <>
                      <Clock className="w-2.5 h-2.5 text-cyan-400" />
                      <span>{countdown}s (tap to hide)</span>
                    </>
                  ) : (
                    <span>Peeking</span>
                  )}
                </span>
              )}
              <span>{timeStr}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
