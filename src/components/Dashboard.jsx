import { MeshGradientSVG } from "./ui/shader-svg"
import SessionHistoryDrawer from "./SessionHistoryDrawer"
import FlowieLogo from "./ui/FlowieLogo"
import {
  Activity,
  Droplets,
  Monitor,
  Sun,
  Moon,
  AlertTriangle,
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
  sessionTime = "00:00",
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
  streak = 0,
  isDark = false,
  onToggleTheme = () => {},
  cameraFeed = null,
}) {

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
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--primary)] px-1 font-sans text-[10px] font-extrabold text-[var(--primary-foreground)]">
                  {history.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <FlowieLogo size={36} />
              <span className="text-xl font-extrabold tracking-tight">
                <span className="text-[var(--foreground)]">Flow</span>
                <span className="text-[var(--primary)]">State</span>
              </span>
            </div>
          </div>

          {/* Right Header Items */}
          <div className="flex items-center gap-3">
            
            {/* Bold, Solid High-Contrast Streak Badge */}
            <div
              title={`${streak} Day Streak`}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-sm shadow-md select-none"
            >
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
              <span className="font-sans text-sm font-bold tabular-nums text-[var(--card-foreground)]">
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
              <MeshGradientSVG isSessionActive={isSessionActive} isSlouching={isSlouching} isDark={isDark} />
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
                onClick={isSessionActive ? onLogWater : undefined}
                disabled={!isSessionActive}
                className={`mt-2.5 flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left font-bold shadow-md transition-all active:scale-[0.99] ${
                  isSessionActive
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 cursor-pointer"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
                }`}
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <Droplets className={`h-4 w-4 ${isSessionActive ? "text-[var(--secondary)]" : "text-gray-400 dark:text-gray-500"}`} />
                  Log Water
                </span>
                <span className={`flex h-6 min-w-6 items-center justify-center rounded-lg font-sans text-sm font-extrabold tabular-nums ${
                  isSessionActive ? "bg-black/25 text-white" : "bg-black/10 text-gray-500 dark:text-gray-400"
                }`}>
                  {waterCount}
                </span>
              </button>
            </div>
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
              {!isSessionActive ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="text-sm font-extrabold text-[var(--muted-foreground)]">Offline</span>
                </>
              ) : isSlouching ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-sm font-extrabold text-rose-500">Slouching detected</span>
                  <span className="text-base">⚠️</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-extrabold text-[var(--foreground)]">Looking good</span>
                  <span className="text-base">😎</span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* COLUMN 3 (Right - span 3): Posture Health, Screen Distance, Room Lighting */}
        <aside className="lg:col-span-3 flex flex-col gap-3 h-full">
          
          {/* Posture Health */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-all flex-1 flex flex-col justify-between ${
              isSessionActive && isSlouching
                ? "border-[var(--destructive)] bg-[var(--destructive)]/15 text-[var(--destructive)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Posture Health
                </span>
                {!isSessionActive ? (
                  <Activity className="h-5 w-5 text-gray-400" />
                ) : isSlouching ? (
                  <AlertTriangle className="h-5 w-5 text-[var(--destructive)]" />
                ) : (
                  <Activity className="h-5 w-5 text-[var(--secondary)]" />
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                {isSessionActive ? (
                  <>
                    <span
                      className={`font-sans text-4xl sm:text-5xl font-medium tabular-nums ${
                        isSlouching ? "text-[var(--destructive)]" : "text-[var(--foreground)]"
                      }`}
                    >
                      {postureScore}
                    </span>
                    <span className="font-sans text-sm sm:text-base font-normal text-[var(--muted-foreground)]">
                      /100
                    </span>
                  </>
                ) : (
                  <span className="font-sans text-4xl sm:text-5xl font-light text-[var(--muted-foreground)]/60">
                    --
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm font-bold text-[var(--muted-foreground)] pt-1">
              {!isSessionActive
                ? "Start session to monitor"
                : isSlouching
                ? "Slouching detected"
                : "Good alignment"}
            </p>
          </div>

          {/* Screen Distance */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Screen Distance
                </span>
                <Monitor className={`h-5 w-5 ${isSessionActive ? "text-[var(--secondary)]" : "text-gray-400"}`} />
              </div>
              <div className="mt-2">
                {isSessionActive ? (
                  <span className="text-3xl sm:text-4xl font-medium text-[var(--card-foreground)]">
                    {distanceStatus || "Optimal"}
                  </span>
                ) : (
                  <span className="font-sans text-4xl sm:text-5xl font-light text-[var(--muted-foreground)]/60">
                    --
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm font-bold text-[var(--muted-foreground)] pt-1">
              {!isSessionActive
                ? "Waiting for camera..."
                : distanceStatus === "Too close"
                ? "Move further back"
                : distanceStatus === "Too far"
                ? "Move closer to screen"
                : "Ideal viewing range"}
            </p>
          </div>

          {/* Room Lighting */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Room Lighting
                </span>
                <Sun className={`h-5 w-5 ${isSessionActive ? "text-[var(--accent)]" : "text-gray-400"}`} />
              </div>
              <div className="mt-2">
                {isSessionActive ? (
                  <span className="text-3xl sm:text-4xl font-medium text-[var(--card-foreground)]">
                    {lightingStatus || "Good"}
                  </span>
                ) : (
                  <span className="font-sans text-4xl sm:text-5xl font-light text-[var(--muted-foreground)]/60">
                    --
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm font-bold text-[var(--muted-foreground)] pt-1">
              {!isSessionActive
                ? "Waiting for camera..."
                : lightingStatus === "Too Dim"
                ? "Increase room lighting"
                : lightingStatus === "Too Bright"
                ? "Reduce glare/brightness"
                : "Balanced brightness"}
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
        user={user}
        onLogout={onLogout}
      />
    </div>
  )
}