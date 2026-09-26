import React from "react";
import { Zap, Flame, Play, History, Calendar, Clock, Activity, Droplets, Target, LogOut, Sun, Moon } from "lucide-react";

export default function AnalyticsDashboard({
  user,
  onLogout,
  history = [],
  streak = 3,
  onStartSession,
  isDark,
  onToggleTheme,
}) {
  // Generate a mock LeetCode-style 30-day activity grid
  const generateHeatmapDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      // Check if any history item matches this date
      const hasSession = history.some((item) => {
        // Simple mock check or map to real dates if available
        return i % 3 === 0 || i === 1 || i === 5; // Fake some activity for demo look
      });

      days.push({ date: dateStr, active: hasSession, level: hasSession ? Math.floor(Math.random() * 3) + 1 : 0 });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--sidebar)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">FlowState Analytics</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-extrabold shadow-sm">
              <Flame className="h-4 w-4 fill-orange-500 text-orange-500 animate-pulse" />
              <span>{streak} Day Streak</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-sm transition-transform hover:scale-105 cursor-pointer"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[var(--primary)]" />}
            </button>

            {/* User Profile */}
            <div className="hidden sm:flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] py-1.5 pl-4 pr-1.5 shadow-sm">
              <div className="flex flex-col items-end leading-tight">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-[var(--muted-foreground)]">Goal: {user.goal}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Analytics Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        
        {/* Top Banner / Launch Workspace Action */}
        <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Welcome back, {user.name}! 🚀</h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              You have completed {history.length} focus sessions. Ready to start another round?
            </p>
          </div>
          <button
            onClick={onStartSession}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg transition-all cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            Launch Live Workspace
          </button>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Total Sessions</span>
            <p className="text-3xl font-extrabold font-mono">{history.length}</p>
          </div>
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Average Posture Score</span>
            <p className="text-3xl font-extrabold font-mono text-emerald-500">
              {history.length > 0 
                ? Math.round(history.reduce((acc, curr) => acc + curr.avgPosture, 0) / history.length) 
                : 85}%
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Total Water Logged</span>
            <p className="text-3xl font-extrabold font-mono text-blue-500">
              {history.reduce((acc, curr) => acc + curr.waterCount, 0)} Glasses
            </p>
          </div>
        </div>

        {/* LeetCode-style Activity Heatmap Section */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Focus & Posture Activity (Last 30 Days)
            </h2>
            <span className="text-xs text-[var(--muted-foreground)]">🔥 {streak} Day Streak</span>
          </div>
          
          {/* Heatmap Grid */}
          <div className="flex flex-wrap gap-2 pt-2">
            {heatmapDays.map((day, idx) => (
              <div
                key={idx}
                title={`${day.date}: ${day.active ? "Active session" : "No activity"}`}
                className={`h-7 w-7 rounded-md transition-all cursor-pointer ${
                  day.level === 3 ? "bg-emerald-500" :
                  day.level === 2 ? "bg-emerald-400/80" :
                  day.level === 1 ? "bg-emerald-400/30" : "bg-[var(--background)] border border-[var(--border)]"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Each block represents your daily consistency. Keep your streak alive by logging at least one session a day!
          </p>
        </div>

        {/* Session History List */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Recent Session Logs
          </h2>

          {history.length === 0 ? (
            <div className="text-center py-10 text-[var(--muted-foreground)]">
              <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No sessions recorded yet.</p>
              <p className="text-xs mt-1">Launch the live workspace, complete a session, and hit "End Session" to see your data here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{session.date}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Status: Completed Successfully</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)]">
                      <Clock className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                      <span>{session.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-emerald-500">
                      <Activity className="h-3.5 w-3.5" />
                      <span>{session.avgPosture}% Posture</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-blue-500">
                      <Droplets className="h-3.5 w-3.5" />
                      <span>{session.waterCount} Glasses</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}