import React from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function ConnectionStatus({ isConnected, isConnecting }) {
  if (isConnecting) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] sm:text-xs font-medium tracking-wide">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="hidden xs:inline">Connecting...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] sm:text-xs font-medium tracking-wide">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Wifi className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Live</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] sm:text-xs font-medium tracking-wide">
      <span className="h-2 w-2 rounded-full bg-rose-500"></span>
      <WifiOff className="w-3.5 h-3.5" />
      <span className="hidden xs:inline">Offline</span>
    </div>
  );
}
