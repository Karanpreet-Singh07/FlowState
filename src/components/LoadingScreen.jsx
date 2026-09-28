import React, { useState, useEffect } from "react"
import { MeshGradientSVG } from "./ui/shader-svg"
import FlowieLogo from "./ui/FlowieLogo"
import { Sparkles, CheckCircle2 } from "lucide-react"

export default function LoadingScreen({ user, onComplete = () => {} }) {
  const [progress, setProgress] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)

  const userName = user?.name || "FlowState User"

  const statusSteps = [
    "Waking up Flowie mascot...",
    "Calibrating posture vision engine...",
    "Setting up ergonomic focus space...",
    "Entering Flow State...",
  ]

  useEffect(() => {
    // Smooth progress bar increment
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        // Accelerate smoothly
        const diff = 100 - prev
        const step = Math.max(1.8, Math.min(8, diff * 0.12))
        return Math.min(100, prev + step)
      })
    }, 30)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress < 25) {
      setStatusIndex(0)
    } else if (progress < 60) {
      setStatusIndex(1)
    } else if (progress < 90) {
      setStatusIndex(2)
    } else {
      setStatusIndex(3)
    }

    if (progress >= 100) {
      const timeout = setTimeout(() => {
        setIsFadingOut(true)
        const exitTimeout = setTimeout(() => {
          onComplete()
        }, 400)
        return () => clearTimeout(exitTimeout)
      }, 350)
      return () => clearTimeout(timeout)
    }
  }, [progress, onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)] p-6 transition-all duration-400 ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Loading Card */}
      <div className="relative w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--card)]/90 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center overflow-hidden">
        
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 mb-5 shadow-sm animate-bounce duration-1000">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-spin" />
          <span>Setting up your workspace</span>
        </div>

        {/* Animated Flowie Mascot with Breathing / Floating Effect */}
        <div className="relative my-2 flex justify-center items-center">
          <div className="absolute -inset-4 rounded-full bg-emerald-400/20 blur-xl animate-pulse" />
          <div className="relative transform transition-transform duration-500 hover:scale-105">
            <MeshGradientSVG isSessionActive={true} isSlouching={false} />
          </div>
        </div>

        {/* Greeting & Branding */}
        <div className="mt-4">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--foreground)]">
            Welcome, <span className="text-emerald-600 dark:text-emerald-400">{userName}</span>!
          </h2>
          <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)] min-h-[18px] transition-all duration-300">
            {statusSteps[statusIndex]}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full mt-6">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--muted-foreground)] mb-2 px-1">
            <span className="uppercase tracking-wider">Loading System</span>
            <span className="tabular-nums font-extrabold text-emerald-600 dark:text-emerald-400">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--border)]/60 p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 shadow-sm transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Bottom micro branding */}
        <div className="mt-6 flex items-center justify-center gap-1.5 opacity-70">
          <FlowieLogo size={16} />
          <span className="text-[11px] font-extrabold tracking-wide uppercase text-[var(--muted-foreground)]">
            FlowState AI Engine
          </span>
        </div>
      </div>
    </div>
  )
}
