import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, MessageSquare, PlusCircle, KeyRound, Lock, EyeOff, Zap, Trash2, ShieldAlert, FlaskConical } from "lucide-react";
import AntiCaptureTestLab from "../components/AntiCaptureTestLab";

export default function Home() {
  const [showTestLab, setShowTestLab] = useState(false);
  return (
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col justify-between py-6 sm:py-12 px-3.5 sm:px-6 relative overflow-hidden bg-grid-pattern">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-60 sm:w-80 h-60 sm:h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto w-full text-center relative z-10">
        {/* Veilo Hero Logo Showcase */}
        <div className="flex flex-col items-center justify-center mb-5 sm:mb-6">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-fuchsia-500/20 rounded-full blur-2xl opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <img
              src="/logo.png"
              alt="Veilo — Connect without revealing"
              className="relative w-28 h-28 xs:w-36 xs:h-36 sm:w-44 sm:h-44 object-contain drop-shadow-[0_12px_40px_rgba(0,114,255,0.4)] group-hover:scale-105 transition-transform duration-300 rounded-3xl"
            />
          </div>
        </div>

        {/* Stealth Security Tag */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] sm:text-xs font-mono font-medium mb-4 sm:mb-6 backdrop-blur-md">
          <EyeOff className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">Zero-Knowledge • Real-Time • Ephemeral</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl xs:text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4 sm:mb-6 leading-tight">
          Connect without <br />
          <span className="bg-gradient-to-r from-[#00F5FF] via-[#00A2FF] to-[#E024C3] bg-clip-text text-transparent">
            revealing identity.
          </span>
        </h1>

        <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
          Veilo is an anonymous, real-time chat platform. Chat with random strangers or create private rooms with friends. No accounts, no cookies, and no stored history. Conversations vanish when you leave.
        </p>

        {/* Live Anti-Capture & Anti-Recording Shield Test Button */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <button
            onClick={() => setShowTestLab(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 text-xs font-semibold shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer backdrop-blur-md group"
          >
            <ShieldAlert className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Test Anti-Capture & Anti-Recording Shield</span>
            <span className="text-[10px] text-cyan-300 font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30">
              Live Lab
            </span>
          </button>
        </div>

        {/* Primary Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 max-w-3xl mx-auto mb-12 sm:mb-16 text-left">
          {/* Random Chat Card */}
          <Link
            to="/random"
            className="group relative p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-1">Random Chat</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instantly pair with an available stranger in a private, throwaway chat session.
              </p>
            </div>
            <div className="mt-4 sm:mt-5 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <span>Start searching</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Create Room Card */}
          <Link
            to="/private"
            className="group relative p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-fuchsia-500/50 hover:bg-slate-900 transition-all shadow-xl hover:shadow-fuchsia-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-1">Create Room</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate an 8-character code with Stealth Veil (Hold-to-Reveal) and Anti-Capture defense.
              </p>
            </div>
            <div className="mt-4 sm:mt-5 flex items-center gap-1.5 text-xs font-semibold text-fuchsia-400">
              <span>Generate code</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Join Room Card */}
          <Link
            to="/join"
            className="group relative p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all shadow-xl flex flex-col justify-between sm:col-span-2 lg:col-span-1"
          >
            <div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <KeyRound className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-1">Join Room</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Have a code from a friend? Enter your 8-character key to join their conversation.
              </p>
            </div>
            <div className="mt-4 sm:mt-5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <span>Enter room</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="max-w-4xl mx-auto pt-6 sm:pt-8 border-t border-slate-800/80">
          <h2 className="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-widest text-slate-400 mb-6 sm:mb-8">
            The Veilo Privacy Standard
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
              <Lock className="w-5 h-5 text-cyan-400 mb-2" />
              <h4 className="text-sm font-semibold text-slate-200">Zero Accounts</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                No email, phone number, password, or profile information is ever asked or recorded.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
              <Trash2 className="w-5 h-5 text-teal-400 mb-2" />
              <h4 className="text-sm font-semibold text-slate-200">RAM-Only Relay</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Messages exist exclusively in volatile memory and are cleared when anyone leaves.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
              <Zap className="w-5 h-5 text-fuchsia-400 mb-2" />
              <h4 className="text-sm font-semibold text-slate-200">Instant Socket.IO</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Sub-millisecond messaging with automatic WebSocket transport and fallback.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
              <Shield className="w-5 h-5 text-blue-400 mb-2" />
              <h4 className="text-sm font-semibold text-slate-200">Built-in Safety</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                One-click blocking, abuse reporting, rate limits, and spam flood protection.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="text-center text-[11px] sm:text-xs text-slate-400 pt-8 sm:pt-12 relative z-10">
        <p>Veilo — Connect without revealing. No message logs. No persistence.</p>
      </footer>

      {/* Interactive Anti-Capture Security Test Lab */}
      <AntiCaptureTestLab
        isOpen={showTestLab}
        onClose={() => setShowTestLab(false)}
      />
    </div>
  );
}
