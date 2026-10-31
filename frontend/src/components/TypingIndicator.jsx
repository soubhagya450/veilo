import React from "react";

export default function TypingIndicator({ partnerAlias }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-800/60 border border-slate-700/50 w-fit backdrop-blur-sm shadow-sm animate-fade-in">
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
      </div>
      <span className="text-xs text-slate-400 font-medium">
        {partnerAlias || "Partner"} is typing...
      </span>
    </div>
  );
}
