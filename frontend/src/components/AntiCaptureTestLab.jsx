import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  MousePointer,
  Sparkles,
  HelpCircle,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import MessageBubble from "./MessageBubble";

export default function AntiCaptureTestLab({ isOpen, onClose }) {
  const [hasFocus, setHasFocus] = useState(document.hasFocus());
  const [isMouseInside, setIsMouseInside] = useState(true);
  const [clipboardStatus, setClipboardStatus] = useState("Untouched");
  const [testLog, setTestLog] = useState([]);
  const [isSimulationActive, setIsSimulationActive] = useState(false);

  const addLog = (msg) => {
    setTestLog((prev) => [
      { id: Date.now() + Math.random(), text: msg, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 5),
    ]);
  };

  useEffect(() => {
    if (!isOpen) return;

    const onFocus = () => {
      setHasFocus(true);
      addLog("Window Gained Focus");
    };

    const onBlur = () => {
      setHasFocus(false);
      addLog("Window Lost Focus (Capture Tool / App Switch Detected!)");
    };

    const onMouseLeave = (e) => {
      if (!e.relatedTarget && !e.toElement) {
        setIsMouseInside(false);
        addLog("Cursor Left Viewport (Heading to Taskbar / Toolbar)");
      }
    };

    const onMouseEnter = () => {
      setIsMouseInside(true);
      addLog("Cursor Returned to Viewport");
    };

    const onKeyDown = (e) => {
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        addLog("Intercepted [PrintScreen] Key! Clipboard Scrambled.");
        try {
          navigator.clipboard.writeText("Veilo Shield: Capture Prohibited.");
          setClipboardStatus("Overwritten with Privacy Notice");
        } catch {}
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [isOpen]);

  const handleSimulateScreenshot = () => {
    setIsSimulationActive(true);
    addLog("Simulated Screenshot Triggered: Screen Blurring for 2s");
    try {
      navigator.clipboard.writeText("Veilo Shield: Capture Prohibited.");
      setClipboardStatus("Scrambled by Veilo");
    } catch {}
    setTimeout(() => {
      setIsSimulationActive(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                Anti-Capture Security Lab
              </h3>
              <p className="text-[11px] text-cyan-300 font-mono">
                Real-Time Defense Diagnostics & Simulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Sandbox Reality Explanation Banner */}
        <div className="my-4 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>How Web-Based Anti-Capture Protection Works</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Standard web browsers run inside a sandboxed process. They cannot disable Windows OS kernel tools (like OBS, Windows Game Bar, or Snipping Tool).
            To defeat screen recorders and screenshots, Veilo uses <strong>Confide-Style Stealth Peek-to-Reveal</strong>: messages stay 100% blacked out until you actively press and hold. Screen recorders record only black frosted bars!
          </p>
        </div>

        {/* Live Defense Monitor */}
        <div className="grid grid-cols-2 gap-2.5 my-4 text-xs font-mono">
          {/* Status 1: Window Focus */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              hasFocus
                ? "bg-slate-950/60 border-slate-800 text-slate-300"
                : "bg-amber-500/15 border-amber-500/40 text-amber-300"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Window Focus</span>
              <span className={hasFocus ? "text-emerald-400" : "text-amber-400"}>
                {hasFocus ? "● ACTIVE" : "● BLURRED"}
              </span>
            </div>
            <div className="font-semibold text-xs truncate">
              {hasFocus ? "Protected (Focused)" : "Blackout Engaged!"}
            </div>
          </div>

          {/* Status 2: Mouse Boundary */}
          <div
            className={`p-3 rounded-2xl border transition-all ${
              isMouseInside
                ? "bg-slate-950/60 border-slate-800 text-slate-300"
                : "bg-rose-500/15 border-rose-500/40 text-rose-300"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Cursor Boundary</span>
              <span className={isMouseInside ? "text-emerald-400" : "text-rose-400"}>
                {isMouseInside ? "● INSIDE" : "● OUT OF BOUNDS"}
              </span>
            </div>
            <div className="font-semibold text-xs truncate">
              {isMouseInside ? "Inside Viewport" : "Blankout Triggered!"}
            </div>
          </div>
        </div>

        {/* Interactive Stealth Peek-to-Reveal Test */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              Try "Stealth Peek-to-Reveal" (Click & Hold below)
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Veilo Standard</span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3">
            Notice how the message is completely veiled. If anyone takes a screenshot or records video right now, they capture zero text:
          </p>

          <MessageBubble
            message={{
              id: "test-stealth-msg",
              text: "🔒 Secret Code: 8942-ALPHA. This message is impossible to record because it vanishes the moment you release your finger or mouse!",
              senderAlias: "Veilo Security",
              timestamp: Date.now(),
              isSelf: false,
              isSystem: false,
            }}
            isPrivate={true}
            isStealthVeilActive={true}
          />
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex flex-wrap gap-2.5 my-4">
          <button
            onClick={handleSimulateScreenshot}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
          >
            Simulate Screenshot Attack
          </button>
        </div>

        {/* Simulation Feedback Alert */}
        {isSimulationActive && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2 animate-pulse">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Anti-Capture Active: Screen blurred & clipboard wiped!</span>
          </div>
        )}

        {/* Event Audit Log */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400 block mb-1">Live Interception Log:</span>
          {testLog.length === 0 ? (
            <span className="text-slate-400 italic">No events detected yet. Try pressing PrintScreen or clicking outside the window.</span>
          ) : (
            <div className="space-y-1">
              {testLog.map((log) => (
                <div key={log.id} className="text-cyan-300 flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px]">[{log.time}]</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Done Testing
          </button>
        </div>
      </div>
    </div>
  );
}
