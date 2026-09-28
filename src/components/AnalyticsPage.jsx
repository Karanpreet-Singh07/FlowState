import React from "react";
import { Zap, Flame, ArrowLeft, Calendar, Clock, Activity, Droplets, Sun, Moon } from "lucide-react";

export default function AnalyticsPage({
  user = { name: "there", goal: "Stay focused" },
  streak = 0,
  history = [],
  onBackToWorkspace,
  isDark,
  onToggleTheme,
}) {
  // Generate multi-column activity grid matching your layout
  const generateActivityGrid = () => {
    const weeks = [];
    for (let w = 0; w < 20; w++) {
      const daysInWeek = [];
      for (let d = 0; d < 7; d++) {
        const rand = Math.random();
        const level = rand > 0.7 ? 3 : rand > 0.4 ? 2 : rand > 0.25 ? 1 : 0;
        daysInWeek.push({ level });
      }
      weeks.push(daysInWeek);
    }
    return weeks;
  };

  const gridWeeks = generateActivityGrid();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--sidebar)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button
            onClick={onBackToWorkspace}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Workspace</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Bold, Solid High-Contrast Streak Badge */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-xs shadow-md">
              <Flame className="h-4 w-4 fill-white text-white animate-pulse" />
              <span>{streak}</span>
            </div>

            <button
              onClick={onToggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-sm cursor-pointer"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[var(--primary)]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        
        {/* Title Section */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Analytics & Stats</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Track your long-term focus habits, session streaks, and posture improvements.
          </p>
        </div>

        {/* Theme-Adaptive Activity Heatmap Card */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Focus Consistency Calendar</h2>
              <p className="text-xs text-[var(--muted-foreground)]">{history.length * 12 + 45} sessions recorded in the past year</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500 text-white font-extrabold text-xs shadow-sm">
              <Flame className="h-3.5 w-3.5 fill-white text-white" />
              <span>{streak} Streak</span>
            </div>
          </div>

          {/* Heatmap Grid Box */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[500px] space-y-2">
              {/* Month Labels */}
              <div className="flex justify-between text-[11px] text-[var(--muted-foreground)] px-1 font-sans font-semibold">
                <span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                <span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                <span>Jan</span><span>Feb</span>
              </div>

              {/* Grid Columns */}
              <div className="flex gap-1.5 justify-between">
                {gridWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1.5">
                    {week.map((day, dIdx) => (
                      <div
                        key={dIdx}
                        className={`h-3.5 w-3.5 rounded-[3px] transition-all ${
                          day.level === 3 ? "bg-emerald-500 shadow-sm shadow-emerald-500/30" :
                          day.level === 2 ? "bg-emerald-600/70" :
                          day.level === 1 ? "bg-emerald-800/40" : "bg-[var(--background)] border border-[var(--border)]"
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend Footer */}
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
            <span>Keep your posture streak active daily</span>
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-[2px] bg-[var(--background)] border border-[var(--border)]" />
                <div className="h-3 w-3 rounded-[2px] bg-emerald-800/40" />
                <div className="h-3 w-3 rounded-[2px] bg-emerald-600/70" />
                <div className="h-3 w-3 rounded-[2px] bg-emerald-500" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Past Sessions Breakdown */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Complete History Log
          </h2>

          {history.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)] py-4 text-center">No completed sessions found.</p>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{session.date}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Successful Focus Run</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[var(--muted-foreground)]" /> {session.duration}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--card)] text-emerald-500 flex items-center gap-1">
                      <Activity className="h-3 w-3" /> {session.avgPosture}%
                    </span>
                    <span className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--card)] text-blue-500 flex items-center gap-1">
                      <Droplets className="h-3 w-3" /> {session.waterCount}
                    </span>
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