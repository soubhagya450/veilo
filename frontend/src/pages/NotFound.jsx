import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-4xl font-extrabold text-slate-100 mb-2 font-mono">404</h1>
        <h2 className="text-base font-semibold text-slate-300 mb-2">Unknown Destination</h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto mb-8 leading-relaxed">
          The room or page you are looking for does not exist or has expired into the ether.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700/80 active:scale-95 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return to Safety</span>
        </Link>
      </div>
    </div>
  );
}
