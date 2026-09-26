import { useState, useEffect } from "react"
import { MeshGradientSVG } from "./ui/shader-svg"
import SessionHistoryDrawer from "./SessionHistoryDrawer"
import {
  Activity,
  Droplets,
  Monitor,
  Sun,
  Moon,
  AlertTriangle,
  Zap,
  Play,
  Target,
  LogOut,
  Power,
  PanelLeft,
  Flame,
} from "lucide-react"

export default function Dashboard({
  postureScore = 85,
  waterCount = 2,
  isSlouching = false,
  isSessionActive = false,
  distanceStatus = "Optimal",
  lightingStatus = "Good",
  sessionTime = "45:00",
  user = { name: "there", goal: "Stay focused" },
  onLogout = () => {},
  onLogWater = () => {},
  onTestSlouch = () => {},
  onToggleSession = () => {},
  history = [],
  isHistoryOpen = false,
  onOpenHistory = () => {},
  onCloseHistory = () => {},
  onClearHistory = () => {},
  onOpenDashboard = () => {},
  streak = 3,
  isDark = false,
  onToggleTheme = () => {},
  cameraFeed = null,
}) {
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans antialiased overflow-hidden transition-colors duration-200">
      {/* Header */}
      <header className="flex-none border-b border-[var(--border)] bg-[var(--sidebar)]/80 backdrop-blur-md z-20">
        <div className="mx-auto flex max-w-[99%] items-center justify-between px-3.5 py-2.5">
          
          {/* Left Header Items: Sidebar Trigger + Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenHistory}
              aria-label="Open sidebar menu"
              title="Menu & History"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <PanelLeft className="h-4 w-4 text-[var(--primary)]" />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--primary)] px-1 font-mono text-[10px] font-extrabold text-[var(--primary-foreground)]">
                  {history.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                FlowState
              </span>
            </div>
          </div>

          {/* Right Header Items */}
          <div className="flex items-center gap-3">
            
            {/* Bold, Solid High-Contrast Streak Badge */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-sm shadow-md">
              <Flame className="h-4 w-4 fill-white text-white animate-pulse" />
              <span>{streak}</span>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-[var(--primary)]" />
              )}
            </button>

            {/* Live Timer */}
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5 shadow-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isSessionActive ? "animate-pulse bg-emerald-500" : "bg-gray-400"
                }`}
              />
              <span className="font-mono text-sm font-bold tabular-nums text-[var(--card-foreground)]">
                {sessionTime}
              </span>
            </div>

            {/* User Profile Badge */}
            <div className="hidden items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] py-1.5 pl-3.5 pr-1.5 shadow-sm sm:flex">
              <div className="flex flex-col items-end leading-tight">
                <span className="text-sm font-semibold text-[var(--card-foreground)]">
                  Welcome back, {user.name}!
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)]">
                  <Target className="h-3 w-3 text-[var(--secondary)]" />
                  Goal: {user.goal}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] transition-colors hover:bg-[var(--destructive)] hover:text-white cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dense 3-Column Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden max-w-[99%] mx-auto w-full">
        
        {/* COLUMN 1 (Left - span 3): AI Companion & Quick Actions */}
        <aside className="lg:col-span-3 flex flex-col gap-3 h-full">
          
          {/* AI Companion Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-foreground)]">
                AI Companion
              </span>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  !isSessionActive
                    ? "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    : isSlouching
                    ? "bg-rose-500/20 text-rose-500 animate-pulse"
                    : "bg-emerald-500/20 text-emerald-500"
                }`}
              >
                {!isSessionActive ? "ASLEEP" : isSlouching ? "ALERT" : "ACTIVE"}
              </span>
            </div>

            {/* Ghost Mascot */}
            <div className="py-1 w-full flex justify-center scale-75 origin-center">
              <MeshGradientSVG isSessionActive={isSessionActive} isSlouching={isSlouching} />
            </div>

            <p className="text-xs font-semibold text-[var(--muted-foreground)] -mt-2">
              {!isSessionActive
                ? "Start a session to wake up Flowie"
                : isSlouching
                ? "Fix your posture to calm Flowie down!"
                : "Flowie is keeping an eye on your focus"}
            </p>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-foreground)]">
                Quick Actions
              </h2>

              <button
                type="button"
                onClick={onToggleSession}
                className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
                  isSessionActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <Power className="h-4 w-4" />
                {isSessionActive ? "End Session" : "Start Session"}
              </button>

              <button
                type="button"
                onClick={onLogWater}
                className="mt-2.5 flex w-full items-center justify-between rounded-xl bg-[var(--primary)] px-4 py-2.5 text-left font-bold text-[var(--primary-foreground)] shadow-md transition-all hover:opacity-90 active:scale-[0.99] cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <Droplets className="h-4 w-4 text-[var(--secondary)]" />
                  Log Water
                </span>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-black/25 font-mono text-sm font-extrabold tabular-nums text-white">
                  {waterCount}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onTestSlouch}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-bold text-[var(--foreground)] shadow-sm transition-all hover:bg-[var(--sidebar)] cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current text-[var(--secondary)]" />
              Test Slouch Modal
            </button>
          </div>
        </aside>

        {/* COLUMN 2 (Center - span 6): Main Camera Feed + Status Banner */}
        <section className="lg:col-span-6 flex flex-col gap-3 h-full">
          {/* Camera Feed Box */}
          <div className={`relative flex-1 flex flex-col items-center justify-center rounded-2xl border-2 ${cameraFeed ? 'border-[var(--border)]' : 'border-dashed border-[var(--border)]'} bg-[var(--card)]/50 shadow-sm backdrop-blur-sm overflow-hidden min-h-[320px]`}>
            {cameraFeed ? (
              cameraFeed
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-sm mb-2.5">
                  <Monitor className="h-6 w-6" />
                </div>
                <p className="text-base font-bold text-[var(--foreground)]">
                  Camera Feed Offline
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                  Enable your webcam to begin real-time monitoring
                </p>
              </div>
            )}
          </div>

          {/* Status Banner */}
          <div className="flex items-center justify-between px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <span className="text-xs font-extrabold text-[var(--muted-foreground)] uppercase tracking-wider">
              Status
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-extrabold text-[var(--foreground)]">Looking good</span>
              <span className="text-base">😎</span>
            </div>
          </div>
        </section>

        {/* COLUMN 3 (Right - span 3): Posture Health, Screen Distance, Room Lighting */}
        <aside className="lg:col-span-3 flex flex-col gap-3 h-full">
          
          {/* Posture Health */}
          <div
            className={`rounded-2xl border p-4 shadow-sm transition-all flex-1 flex flex-col justify-between ${
              isSlouching
                ? "border-[var(--destructive)] bg-[var(--destructive)]/15 text-[var(--destructive)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Posture Health
                </span>
                {isSlouching ? (
                  <AlertTriangle className="h-5 w-5 text-[var(--destructive)]" />
                ) : (
                  <Activity className="h-5 w-5 text-[var(--secondary)]" />
                )}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  className={`font-mono text-3xl font-extrabold tabular-nums ${
                    isSlouching ? "text-[var(--destructive)]" : "text-[var(--foreground)]"
                  }`}
                >
                  {postureScore}
                </span>
                <span className="font-mono text-xs font-bold text-[var(--muted-foreground)]">
                  /100
                </span>
              </div>
            </div>
            <p className="text-xs font-bold text-[var(--muted-foreground)] pt-1">
              {isSlouching ? "Slouching detected" : "Good alignment"}
            </p>
          </div>

          {/* Screen Distance */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Screen Distance
                </span>
                <Monitor className="h-5 w-5 text-[var(--secondary)]" />
              </div>
              <div className="mt-1">
                <span className="text-xl font-extrabold text-[var(--card-foreground)]">
                  {distanceStatus}
                </span>
              </div>
            </div>
            <p className="text-xs font-bold text-[var(--muted-foreground)] pt-1">
              Ideal viewing range
            </p>
          </div>

          {/* Room Lighting */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Room Lighting
                </span>
                <Sun className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div className="mt-1">
                <span className="text-xl font-extrabold text-[var(--card-foreground)]">
                  {lightingStatus}
                </span>
              </div>
            </div>
            <p className="text-xs font-bold text-[var(--muted-foreground)] pt-1">
              Balanced brightness
            </p>
          </div>

        </aside>

      </main>

      {/* Left Sidebar Drawer */}
      <SessionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={onCloseHistory}
        history={history}
        onClearHistory={onClearHistory}
        onOpenDashboard={onOpenDashboard}
      />
    </div>
  )
}