import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

const MAX_CHARS = 500;

export default function MessageInput({ onSendMessage, onTyping, disabled = false }) {
  const [text, setText] = useState("");
  const typingTimerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-focus on desktop devices when active
  useEffect(() => {
    if (!disabled && inputRef.current && window.innerWidth > 768) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Dynamic textarea height resizing
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const scrollH = inputRef.current.scrollHeight;
      // Scale smoothly up to 128px (max 4 lines)
      inputRef.current.style.height = `${Math.min(Math.max(scrollH, 44), 128)}px`;
    }
  }, [text]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setText(val);

      if (onTyping) {
        onTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          onTyping(false);
        }, 1500);
      }
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setText("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (onTyping) onTyping(false);
  };

  const handleKeyDown = (e) => {
    // Send on Enter, preserve Shift+Enter for multiline, ignore IME composition
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const remaining = MAX_CHARS - text.length;
  const isNearLimit = remaining <= 50;

  return (
    <div className="relative border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md p-2.5 sm:p-4 pb-[calc(0.65rem+env(safe-area-inset-bottom,0px))] z-20">
      <div className="flex items-end gap-2 sm:gap-2.5 max-w-4xl mx-auto">
        <div className="relative flex-1 bg-slate-900/90 border border-slate-700/60 rounded-2xl focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? "Conversation ended. Leave or find a new chat."
                : "Type a secret message... (Enter to send, Shift+Enter for line)"
            }
            /* text-base on mobile prevents iOS Safari auto-zoom on input focus */
            className="w-full bg-transparent pl-3.5 sm:pl-4 pr-14 py-3 text-base sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
          />

          {/* Character Counter positioned cleanly without colliding with text */}
          <div className="absolute right-3 bottom-2 text-[10px] font-mono pointer-events-none select-none">
            <span
              className={
                isNearLimit ? "text-amber-400 font-semibold" : "text-slate-500"
              }
            >
              {text.length}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Send Button with minimum 44px touch target */}
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          title="Send message"
          aria-label="Send message"
          className="h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all shrink-0 cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
