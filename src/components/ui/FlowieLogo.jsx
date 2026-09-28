/**
 * FlowieLogo & FlowState Brand Components
 * Mascot is Flowie with the top-right pink sparks cropped from the brand asset.
 * Text uses two-tone: "Flow" (foreground) + "State" (magenta primary #d33682).
 */

export default function FlowieLogo({ size = 32, className = "" }) {
  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <img
        src="/flowie-logo.png"
        alt="FlowState Mascot"
        className="w-full h-full object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-200 hover:scale-105"
      />
    </div>
  );
}

/**
 * Reusable branded FlowState text component
 * "Flow" in theme foreground (deep dark teal in light, crisp silver/cream in dark)
 * "State" in vibrant magenta pink (#d33682)
 */
export function FlowStateText({ className = "text-xl", showState = true }) {
  return (
    <span className={`font-extrabold tracking-tight select-none font-sans ${className}`}>
      <span className="text-[var(--foreground)]">Flow</span>
      {showState && <span className="text-[var(--primary)]">State</span>}
    </span>
  );
}

/**
 * Combined Logo icon + Two-tone FlowState Text
 */
export function FlowStateBrand({ size = 34, textSize = "text-xl", subtitle = "", className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <FlowieLogo size={size} />
      <div className="flex items-center gap-2">
        <FlowStateText className={textSize} />
        {subtitle && (
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] px-2 py-0.5 rounded-md bg-[var(--card)] border border-[var(--border)]">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
