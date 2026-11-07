import React, { useState } from "react";
import { Copy, Check, Share2, Shield, Users, Clock, Send } from "lucide-react";
import { VeiloIcon } from "./VeiloLogo";

export default function RoomCodeModal({ code, onCancel }) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const joinUrl = `${window.location.origin}/join?code=${code}`;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({
          title: "Join my SayHii private chat",
          text: `Join my private encrypted chat on SayHii with code: ${code}\nLink: ${joinUrl}`,
          url: joinUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-5 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl text-center">
      {/* Icon badge */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3.5 sm:mb-4 shadow-lg shadow-cyan-500/15">
        <VeiloIcon className="w-8 h-8 sm:w-9 sm:h-9" />
      </div>

      <h2 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">Private Room Created</h2>
      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
        Share this unique 8-character code with your friend.
      </p>

      {/* Code Display Card */}
      <div className="my-4 sm:my-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center relative group">
        <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-slate-400 mb-1">
          Room Code
        </span>
        <div className="text-2xl xs:text-3xl sm:text-4xl font-mono font-bold tracking-widest text-cyan-400 select-all">
          {code}
        </div>

        <div className="flex flex-col gap-2 mt-4 w-full">
          {canShare && (
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Share Code with Friend (WhatsApp / SMS)</span>
            </button>
          )}

          <div className="flex items-center gap-2 w-full">
            <button
              onClick={handleCopyCode}
              className="w-full flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 active:scale-95 text-xs font-semibold text-slate-200 border border-slate-700/60 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-400">Copied Code</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 active:scale-95 text-xs font-semibold text-slate-200 border border-slate-700/60 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-400">Copied Link</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Waiting Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-1.5 sm:py-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        Waiting for your friend to enter this code...
      </div>

      {/* Mobile-Friendly Switch App Tip */}
      <p className="text-[10px] text-slate-400 mt-1">
        📱 Feel free to switch apps to share. Your room stays open for 30 minutes.
      </p>

      {/* Info Pills */}
      <div className="flex items-center justify-center gap-4 text-[10px] sm:text-[11px] text-slate-400 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-800/60">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          Expires in 30 mins
        </span>
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-cyan-400" />
          End-to-End Ephemeral
        </span>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 sm:mt-6 text-xs text-slate-400 hover:text-slate-200 underline transition-colors cursor-pointer"
        >
          Cancel and return home
        </button>
      )}
    </div>
  );
}
