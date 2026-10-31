import React from "react";
import { Shield, Lock, EyeOff, Trash2, Server, Key, AlertTriangle } from "lucide-react";

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-12 px-3.5 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] sm:text-xs font-mono font-medium mb-4">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Full Architectural Transparency</span>
        </div>
        <h1 className="text-2xl xs:text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3 sm:mb-4">
          Veilo Privacy Guarantee
        </h1>
        <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed px-2">
          We built Veilo on a zero-persistence model: conversations cannot leak or be retrieved because they simply do not exist once you leave.
        </p>
      </div>

      {/* Main Pillars */}
      <div className="space-y-4 sm:space-y-6">
        {/* Pillar 1: No Storage */}
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1">Zero Message Storage</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Messages exist only in volatile server memory during the instant they are relayed over Socket.IO to the other participant. <strong>No database, disk file, or permanent cache stores your chat text.</strong> Once a message is sent, the server forgets it immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 2: Ephemeral State */}
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1">Instant Memory Scrubbing</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Every temporary session identifier and room record is assigned a strict Time-to-Live (TTL). When you click <strong>Leave</strong> or close your browser tab, the server runs an automatic sweep that drops all socket mappings, frees the room, and wipes any temporary pairing records.
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 3: No Personal Data */}
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
              <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1">No Accounts & No Identity Profiling</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Veilo requires no registration, email, phone number, or profile creation. Each connection is assigned an anonymous, ephemeral handle (like <code>Guest-7A9B</code>). Sockets never broadcast your real IP, user agent, or device identifiers to other users.
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 4: Privacy-First Abuse Control */}
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1">Salted Hashing for Spam Prevention</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                To prevent automated bots and denial-of-service spam, IP addresses are transformed into one-way cryptographic salted hashes with short expiration windows. Raw IP addresses are never written to log files.
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 5: Anti-Capture & Anti-Screen-Recording */}
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1">Client-Side Anti-Capture Shield</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                When talking to a friend using an 8-character room code, Veilo activates a multi-layered shield: PrintScreen interception with clipboard sanitization, window unfocus blackout blurs against OBS / Snipping Tool screen recording, print style eradication, text drag/copy locks, and digital session watermarking.
              </p>
            </div>
          </div>
        </div>

        {/* User Responsibility Advisory */}
        <div className="p-4 sm:p-6 rounded-3xl bg-amber-500/10 border border-amber-500/25">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-300 mb-1">Your Anonymity is in Your Hands</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                While Veilo safeguards your network identity and scrubs server-side history, true anonymity requires caution. <strong>Never disclose your legal name, location, social media links, financial info, or passwords in chat.</strong> If anyone violates your comfort or trust, use the built-in <strong>Block</strong> or <strong>Report</strong> controls immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
