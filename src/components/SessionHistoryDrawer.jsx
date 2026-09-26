import React from "react";
import { X, History, LayoutDashboard, Clock, Activity, Droplets, Calendar, Trash2 } from "lucide-react";

export default function SessionHistoryDrawer({
  isOpen,
  onClose,
  history = [],
  onClearHistory,
  onOpenDashboard,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Left Drawer Panel */}
      <div className="relative w-full max-w-xs sm:max-w-sm h-full bg-[var(--card)] text-[var(--foreground)] shadow-2xl border-r border-[var(--border)] flex flex-col z-10 transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm font-bold">
              FS
            </div>
            <div>
              <h2 className="text-base font-bold">FlowState Menu</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Navigation & History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation & Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Section 1: Navigation Links */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] px-1">
              Menu
            </span>
            <button
              onClick={() => {
                onOpenDashboard();
                onClose();
              }}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-all font-bold text-sm text-[var(--foreground)] cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4 text-[var(--primary)]" />
              <span>View Dashboard & Analytics</span>
            </button>
          </div>

          <hr className="border-[var(--border)]" />

          {/* Section 2: Past Sessions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Past Sessions ({history.length})
              </span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-6 text-[var(--muted-foreground)]">
                <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No recorded sessions yet.</p>
              </div>
            ) : (
              history.map((session) => (
                <div
                  key={session.id}
                  className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-[var(--primary)]" />
                      <span>{session.date}</span>
                    </div>
                    <span className="text-emerald-500 font-bold text-[10px]">Done</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                    <div className="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                      <span className="block text-[8px] uppercase font-bold text-[var(--muted-foreground)]">Time</span>
                      <span className="text-[11px] font-extrabold">{session.duration}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                      <span className="block text-[8px] uppercase font-bold text-[var(--muted-foreground)]">Posture</span>
                      <span className="text-[11px] font-extrabold text-emerald-500">{session.avgPosture}%</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                      <span className="block text-[8px] uppercase font-bold text-[var(--muted-foreground)]">Water</span>
                      <span className="text-[11px] font-extrabold text-blue-500">{session.waterCount}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]">
            <button
              onClick={onClearHistory}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}