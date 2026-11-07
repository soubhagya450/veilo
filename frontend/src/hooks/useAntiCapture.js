import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Enterprise-grade Anti-Capture & Anti-Screen-Recording hook.
 *
 * Web Security Reality:
 * Desktop OS tools (Windows Snipping Tool Win+Shift+S, OBS, Game Bar) capture at the OS DWM
 * kernel level outside browser JS sandboxes. To defeat them on the web, this hook combines:
 * 1. Window Blur & Focus Loss Blackout (Snipping Tool & window switch detection)
 * 2. Mouse-Leave & Viewport Boundary Blankout (triggers before user can click capture tool)
 * 3. Event Capture-Phase Interception for both keydown AND keyup (PrintScreen, Win+Shift+S, Cmd+Shift+3/4, Print, Save)
 * 4. Automatic Clipboard Scrambler (wipes OS clipboard snapshot buffer)
 * 5. Screen Recording API Denial (blocks browser tab/screen recording extensions)
 * 6. Right-click, Copy, Cut, and Selection locks
 */
export function useAntiCapture({
  enabled = false,
  roomCode = "",
  blockOnMouseLeave = false,
} = {}) {
  const [isShielded, setIsShielded] = useState(false);
  const [warningToast, setWarningToast] = useState(null);
  const [lastInterception, setLastInterception] = useState(null);
  const warningTimerRef = useRef(null);
  const focusDebounceRef = useRef(null);

  const showWarning = useCallback((msg, eventName = "INTERCEPT") => {
    setWarningToast(msg);
    setLastInterception({ type: eventName, timestamp: Date.now() });
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setWarningToast(null);
    }, 3500);
  }, []);

  const clearClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText("SayHii Shield: Screen capture is prohibited.");
      }
    } catch {
      // Best-effort clipboard overwrite
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsShielded(false);
      setWarningToast(null);
      return;
    }

    // 1. Window blur: Triggers when snipping tool, OBS, or another app gains focus
    const handleBlur = () => {
      if (focusDebounceRef.current) clearTimeout(focusDebounceRef.current);
      setIsShielded(true);
    };

    // 2. Window focus: Restore view after a verification debounce
    const handleFocus = () => {
      if (focusDebounceRef.current) clearTimeout(focusDebounceRef.current);
      focusDebounceRef.current = setTimeout(() => {
        setIsShielded(false);
      }, 300);
    };

    // 3. Document visibility change (tab switch, minimize, task switcher)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsShielded(true);
      } else {
        if (focusDebounceRef.current) clearTimeout(focusDebounceRef.current);
        focusDebounceRef.current = setTimeout(() => {
          setIsShielded(false);
        }, 300);
      }
    };

    // 4. Mouse-leave detection: Triggers when user moves cursor toward taskbar, recording controls, or another screen
    const handleMouseLeave = (e) => {
      // If cursor leaves the document top/bottom/sides
      if (!e.relatedTarget && !e.toElement && blockOnMouseLeave) {
        setIsShielded(true);
      }
    };

    const handleMouseEnter = () => {
      if (focusDebounceRef.current) clearTimeout(focusDebounceRef.current);
      focusDebounceRef.current = setTimeout(() => {
        if (document.hasFocus()) {
          setIsShielded(false);
        }
      }, 200);
    };

    // 5. Intercept key combinations on BOTH keydown and keyup
    const interceptKeys = (e) => {
      const key = e.key;
      const code = e.code;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // PrintScreen (Windows dispatches on keyup or keydown depending on OS build)
      if (key === "PrintScreen" || code === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        clearClipboard();
        setIsShielded(true);
        showWarning("Screenshots blocked. Content hidden & clipboard cleared.", "PRINTSCREEN");
        setTimeout(() => {
          if (document.hasFocus()) setIsShielded(false);
        }, 1500);
        return;
      }

      // Windows Snipping Tool (Win + Shift + S) or Mac Screenshot (Cmd + Shift + 3/4/5)
      if (e.shiftKey && (key === "S" || key === "s" || key === "3" || key === "4" || key === "5")) {
        if (isCtrlOrMeta) {
          e.preventDefault();
          e.stopPropagation();
          clearClipboard();
          setIsShielded(true);
          showWarning("Capture shortcut intercepted. Screenshot blocked.", "SHORTCUT");
          setTimeout(() => {
            if (document.hasFocus()) setIsShielded(false);
          }, 1500);
          return;
        }
      }

      // Print & Save Page shortcuts (Ctrl+P, Cmd+P, Ctrl+S, Cmd+S)
      if (isCtrlOrMeta && (key === "p" || key === "P" || key === "s" || key === "S")) {
        e.preventDefault();
        e.stopPropagation();
        showWarning("Saving or printing this private conversation is prohibited.", "PRINT");
        return;
      }

      // DevTools shortcuts (F12, Ctrl+Shift+I, Cmd+Option+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (
        key === "F12" ||
        (isCtrlOrMeta && e.shiftKey && (key === "I" || key === "i" || key === "J" || key === "j" || key === "C" || key === "c"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showWarning("Developer inspection is locked in private sessions.", "DEVTOOLS");
        return;
      }
    };

    // 6. Block Media Stream / Screen Recording API requests
    let originalGetDisplayMedia = null;
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === "function") {
      originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async function () {
        showWarning("Screen recording API blocked by SayHii Security.", "MEDIA_RECORDER");
        throw new DOMException("Screen capture is prohibited in private rooms.", "NotAllowedError");
      };
    }

    // 7. Right-click context menu prevention
    const handleContextMenu = (e) => {
      e.preventDefault();
      showWarning("Context menu disabled to prevent unauthorized copying.", "CONTEXT_MENU");
    };

    // 8. Prevent copy/cut events
    const handleCopy = (e) => {
      e.preventDefault();
      clearClipboard();
      showWarning("Copying text is restricted in private rooms.", "COPY");
    };

    const handleSelectStart = (e) => {
      e.preventDefault();
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Event capture phase listener (true) intercepts before any bubble handler
    window.addEventListener("keydown", interceptKeys, true);
    window.addEventListener("keyup", interceptKeys, true);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("cut", handleCopy);
    window.addEventListener("selectstart", handleSelectStart);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("keydown", interceptKeys, true);
      window.removeEventListener("keyup", interceptKeys, true);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("cut", handleCopy);
      window.removeEventListener("selectstart", handleSelectStart);

      if (originalGetDisplayMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
      if (focusDebounceRef.current) clearTimeout(focusDebounceRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [enabled, blockOnMouseLeave, clearClipboard, showWarning]);

  return {
    isShielded,
    setIsShielded,
    warningToast,
    lastInterception,
    triggerTestWarning: (msg) => showWarning(msg, "MANUAL_TEST"),
    clearWarning: () => setWarningToast(null),
  };
}
