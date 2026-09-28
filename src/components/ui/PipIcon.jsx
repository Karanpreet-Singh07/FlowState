import React from "react";

/**
 * PipIcon
 * Renders a crisp Picture-in-Picture icon matching the design specifications:
 * an outer display frame, a diagonal entry arrow pointing down-right, and a corner mini-window.
 */
export default function PipIcon({ className = "w-4 h-4", active = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer monitor / window frame with corner cutout for mini-window */}
      <path
        d="M10 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4H18C19.1046 4 20 4.89543 20 6V11"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Diagonal arrow shaft pointing towards the mini PiP window */}
      <path
        d="M5.5 5.5L11 11"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Arrowhead pointing down-right */}
      <path
        d="M6.5 11H11V6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Miniature PiP floating window */}
      <rect
        x="12"
        y="13"
        width="10"
        height="7.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2.2"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}
