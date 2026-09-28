import React, { useEffect, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export function WinkingFlowie({ size = 150, clipId = "winkClip" }) {
  // Green gradient palette in FlowState theme
  const greenColors = ["#A7F3D0", "#34D399", "#10B981", "#047857", "#064E3B"];

  return (
    <motion.div
      className="relative mx-auto p-2"
      style={{ width: size, height: (size * 289) / 231 }}
      animate={{
        y: [0, -10, 0],
        rotate: [0, -3, 3, 0],
        scale: [1, 1.03, 1],
      }}
      transition={{
        duration: 2.2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 231 289"
        className="w-full h-full drop-shadow-2xl"
      >
        <defs>
          <clipPath id={clipId}>
            <path d="M230.809 115.385V249.411C230.809 269.923 214.985 287.282 194.495 288.411C184.544 288.949 175.364 285.718 168.26 280C159.746 273.154 147.769 273.461 139.178 280.23C132.638 285.384 124.381 288.462 115.379 288.462C106.377 288.462 98.1451 285.384 91.6055 280.23C82.912 273.385 70.9353 273.385 62.2415 280.23C55.7532 285.334 47.598 288.411 38.7246 288.462C17.4132 288.615 0 270.667 0 249.359V115.385C0 51.6667 51.6756 0 115.404 0C179.134 0 230.809 51.6667 230.809 115.385Z" />
          </clipPath>
        </defs>

        <foreignObject width="231" height="289" clipPath={`url(#${clipId})`}>
          <div className="w-full h-full">
            <MeshGradient colors={greenColors} className="w-full h-full" speed={1.2} />
          </div>
        </foreignObject>

        {/* Left Eye: Open & alert with a friendly sparkle */}
        <motion.ellipse
          cx="80"
          cy="120"
          rx="19"
          ry="28"
          fill="#FFFFFF"
          initial={{ scale: 0.8 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Left Eye Pupil highlight */}
        <circle cx="86" cy="114" r="5" fill="#10B981" />

        {/* Right Eye: Animated Wink (Open -> Close to wink slit -> Open) */}
        <motion.ellipse
          cx="150"
          cy="120"
          rx="19"
          fill="#FFFFFF"
          animate={{
            ry: [28, 28, 2.5, 2.5, 28, 28],
            cy: [120, 120, 122, 122, 120, 120],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            repeatDelay: 0.4,
            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
            ease: "easeInOut",
          }}
        />

        {/* Cute blush cheeks */}
        <ellipse cx="62" cy="155" rx="14" ry="7" fill="rgba(255, 255, 255, 0.35)" />
        <ellipse cx="168" cy="155" rx="14" ry="7" fill="rgba(255, 255, 255, 0.35)" />
      </svg>
    </motion.div>
  );
}

export default function ViewTransitionLoader({ targetView = "analytics", onComplete = () => {} }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Show wink animation for ~900ms before triggering smooth exit
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const exitTimer = setTimeout(() => {
        onComplete();
      }, 350);
      return () => clearTimeout(exitTimer);
    }, 850);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const title =
    targetView === "analytics"
      ? "Opening Analytics & Insights..."
      : "Launching Live Workspace...";

  const subtitle =
    targetView === "analytics"
      ? "Gathering your focus stats and posture logs"
      : "Flowie is getting your workspace ready";

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)] p-6 transition-all duration-350 ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Ambient green background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Glassmorphic Mascot Card */}
      <div className="relative w-full max-w-sm rounded-3xl border border-emerald-500/20 bg-[var(--card)]/90 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center overflow-hidden">
        
        {/* Green Sparkle Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 mb-4 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-spin" />
          <span>Flowie says hello! 😉</span>
        </div>

        {/* Winking Green Flowie Mascot */}
        <div className="my-2">
          <WinkingFlowie size={145} clipId="winkingFlowieClip" />
        </div>

        {/* Status Texts */}
        <div className="mt-4 space-y-1">
          <h2 className="text-lg font-extrabold tracking-tight text-[var(--foreground)]">
            {title}
          </h2>
          <p className="text-xs font-semibold text-[var(--muted-foreground)]">
            {subtitle}
          </p>
        </div>

        {/* Green Shimmer Progress Bar */}
        <div className="w-full mt-5 h-1.5 overflow-hidden rounded-full bg-emerald-500/20">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
