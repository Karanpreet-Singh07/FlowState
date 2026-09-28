import { MeshGradient } from "@paper-design/shaders-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export function MeshGradientSVG({
  isSessionActive = false,
  isSlouching = false,
  isDark = false,
  clipId = "shapeClip",
}) {
  const containerRef = useRef(null);

  // Color themes for the 3 mascot states
  // Active + Good Posture = Vibrant Emerald & Mint Green
  const goodColors = ["#A7F3D0", "#34D399", "#10B981", "#047857", "#064E3B"];
  const slouchColors = ["#FF4D4D", "#F87171", "#DC2626", "#7F1D1D", "#1A1A2E"]; // Pulsing Red
  const idleColorsDark  = ["#CBD5E1", "#94A3B8", "#B0BEC5", "#E2E8F0", "#78909C"];  // Light silver for dark mode
  const idleColorsLight = ["#64748B", "#475569", "#334155", "#1E293B", "#0F172A"];  // Muted dark gray for light mode
  const idleColors = isDark ? idleColorsDark : idleColorsLight;

  const activeColors = !isSessionActive 
    ? idleColors 
    : isSlouching 
    ? slouchColors 
    : goodColors;

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Mouse sensitivity and eye tracking distance
      const deltaX = (mousePosition.x - centerX) * 0.18;
      const deltaY = (mousePosition.y - centerY) * 0.18;

      const maxOffset = 24;
      setEyeOffset({
        x: Math.max(-maxOffset, Math.min(maxOffset, deltaX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, deltaY)),
      });
    }
  }, [mousePosition]);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full max-w-[160px] mx-auto p-2 transition-all duration-500"
      animate={{
        y: isSlouching ? [0, -4, 0] : [0, -8, 0],
        scaleY: [1, 1.05, 1],
      }}
      transition={{
        duration: isSlouching ? 0.8 : 2.8,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
      style={{ transformOrigin: "top center" }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 231 289" className="w-full h-auto drop-shadow-xl">
        <defs>
          <clipPath id={clipId}>
            <path d="M230.809 115.385V249.411C230.809 269.923 214.985 287.282 194.495 288.411C184.544 288.949 175.364 285.718 168.26 280C159.746 273.154 147.769 273.461 139.178 280.23C132.638 285.384 124.381 288.462 115.379 288.462C106.377 288.462 98.1451 285.384 91.6055 280.23C82.912 273.385 70.9353 273.385 62.2415 280.23C55.7532 285.334 47.598 288.411 38.7246 288.462C17.4132 288.615 0 270.667 0 249.359V115.385C0 51.6667 51.6756 0 115.404 0C179.134 0 230.809 51.6667 230.809 115.385Z" />
          </clipPath>
        </defs>

        <foreignObject width="231" height="289" clipPath={`url(#${clipId})`}>
          <div className="w-full h-full">
            <MeshGradient colors={activeColors} className="w-full h-full" speed={isSlouching ? 3 : 1} />
          </div>
        </foreignObject>

        {/* Left Eye */}
        <motion.ellipse
          rx="20"
          ry={!isSessionActive ? "3" : "30"}
          fill="#FFFFFF"
          animate={{
            cx: 80 + eyeOffset.x,
            cy: 120 + eyeOffset.y,
          }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
        />
        {/* Right Eye */}
        <motion.ellipse
          rx="20"
          ry={!isSessionActive ? "3" : "30"}
          fill="#FFFFFF"
          animate={{
            cx: 150 + eyeOffset.x,
            cy: 120 + eyeOffset.y,
          }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
        />
      </svg>
    </motion.div>
  );
}