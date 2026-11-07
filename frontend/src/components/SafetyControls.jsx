import React, { useState } from "react";
import { LogOut, UserX, Flag, ArrowRight, X, AlertTriangle } from "lucide-react";

export default function SafetyControls({
  onLeave,
  onBlock,
  onReport,
  onNext,
  isRandom = false,
  partnerAlias = "Stranger",
}) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("inappropriate");
  const [showBlockModal, setShowBlockModal] = useState(false);

  const handleConfirmReport = () => {
    onReport(reportReason);
    setShowReportModal(false);
  };

  const handleConfirmBlock = () => {
    onBlock();
    setShowBlockModal(false);
  };

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Next Stranger Button (for random chat) */}
        {isRandom && (
          <button
            onClick={onNext}
            title="Skip to next stranger"
            className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 active:scale-95 text-xs font-medium text-slate-200 border border-slate-700/60 transition-all cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Next</span>
          </button>
        )}

        {/* Block Button */}
        <button
          onClick={() => setShowBlockModal(true)}
          title="Block partner"
          className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/70 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95 text-xs font-medium text-slate-300 border border-slate-700/60 hover:border-rose-500/30 transition-all cursor-pointer"
        >
          <UserX className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Block</span>
        </button>

        {/* Report Button */}
        <button
          onClick={() => setShowReportModal(true)}
          title="Report user"
          className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/70 hover:bg-amber-500/10 hover:text-amber-400 active:scale-95 text-xs font-medium text-slate-300 border border-slate-700/60 hover:border-amber-500/30 transition-all cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Report</span>
        </button>

        {/* Leave Chat Button */}
        <button
          onClick={onLeave}
          title="Leave conversation"
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 text-xs font-medium text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-xs">Leave</span>
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm sm:text-base">
                <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                Report {partnerAlias}
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              SayHii does not store message history. Submitting a report will record an anonymous abuse signal, automatically block this user, and immediately terminate the chat.
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-medium text-slate-300">Reason for report</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { id: "inappropriate", label: "Inappropriate Content" },
                  { id: "harassment", label: "Harassment / Abuse" },
                  { id: "spam", label: "Spam / Advertising" },
                  { id: "bot", label: "Bot / Automation" },
                  { id: "other", label: "Other Violation" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReportReason(item.id)}
                    className={`px-3 py-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      reportReason === item.id
                        ? "bg-amber-500/20 border-amber-500/60 text-amber-300 font-medium"
                        : "bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReport}
                className="px-4 py-2.5 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-semibold shadow-md transition-all cursor-pointer"
              >
                Submit Report & End Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center my-auto">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <UserX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Block {partnerAlias}?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              You will not be paired with this user again for the remainder of your session. This will end the current chat immediately.
            </p>

            <div className="flex items-center justify-center gap-2.5 mt-6">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBlock}
                className="px-4 py-2.5 rounded-xl text-xs font-medium bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-semibold shadow-md transition-all cursor-pointer"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
