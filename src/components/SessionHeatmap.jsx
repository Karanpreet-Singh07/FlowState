import { useState, useMemo } from "react";

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CELL = 18; // Cell size in px
const GAP = 3.5; // Gap between day cells inside a month

/**
 * Month-grouped Heatmap for FlowState.
 *
 * - Covers the entire width of the card by distributing months across the container
 * - Shows strictly up to the current month (no future months like October rendered when in Sep)
 * - Clear, identifiable visual gap between each month
 * - Uses the website's brand pink/magenta theme (`var(--primary)` = #d33682) for both light & dark modes
 * - Interactive hover with dimming, tooltips, and scale effects
 */
export default function SessionHeatmap({ history = [] }) {
  const [hot, setHot] = useState(null);

  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed (e.g. 8 for September)
  const todayStr = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, [today]);

  /* ── Session counts map ── */
  const sessionMap = useMemo(() => {
    const map = {};
    for (const s of history) {
      const raw = s.timestamp || s.date;
      if (!raw) continue;
      const d = new Date(raw);
      if (isNaN(d.getTime()) || d.getFullYear() !== currentYear) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [history, currentYear]);

  const maxCount = useMemo(
    () => Math.max(1, ...Object.values(sessionMap)),
    [sessionMap]
  );

  const totalSessions = useMemo(
    () => Object.values(sessionMap).reduce((a, b) => a + b, 0),
    [sessionMap]
  );

  /* ── Build data grouped strictly by month (0 to currentMonth) ── */
  const monthGroups = useMemo(() => {
    const groups = [];

    // Loop ONLY up to currentMonth (October and future months are never generated)
    for (let m = 0; m <= currentMonth; m++) {
      const firstDay = new Date(currentYear, m, 1);
      // Determine number of days in month
      const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
      const startDow = (firstDay.getDay() + 6) % 7; // Mon = 0, Sun = 6
      const totalSlots = startDow + daysInMonth;
      const numCols = Math.ceil(totalSlots / 7);

      const columns = [];
      for (let col = 0; col < numCols; col++) {
        const columnDays = [];
        for (let row = 0; row < 7; row++) {
          const slot = col * 7 + row;
          const day = slot - startDow + 1;

          if (day >= 1 && day <= daysInMonth) {
            const date = new Date(currentYear, m, day);
            const key = `${currentYear}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const count = sessionMap[key] || 0;
            const isToday = key === todayStr;
            const isFuture = key > todayStr;

            columnDays.push({
              valid: true,
              key,
              day,
              date,
              monthIndex: m,
              count,
              today: isToday,
              future: isFuture,
            });
          } else {
            // Padding slot before day 1 or after last day
            columnDays.push({ valid: false });
          }
        }
        columns.push(columnDays);
      }

      groups.push({
        index: m,
        name: MONTH_NAMES[m],
        columns,
      });
    }

    return groups;
  }, [sessionMap, currentYear, currentMonth, todayStr]);

  /* ── Brand pink cell background ── */
  const getCellBg = (cell, isHot) => {
    if (cell.count === 0) {
      return "color-mix(in srgb, var(--border) 24%, transparent)";
    }
    const t = Math.min(cell.count / maxCount, 1);
    const pct = Math.round(t * 60 + (isHot ? 30 : 25));
    return `color-mix(in srgb, var(--primary) ${pct}%, transparent)`;
  };

  return (
    <div className="w-full select-none font-sans">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--muted-foreground)]">
            Focus Activity — {currentYear}
          </h2>
          <span className="text-xs text-[var(--muted-foreground)]/70">
            (up to {MONTH_NAMES[currentMonth]})
          </span>
        </div>

        <div className="text-xs tabular-nums">
          {hot ? (
            <div className="flex items-center gap-1.5 font-sans">
              <span className="font-semibold text-[var(--foreground)]">
                {hot.date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="opacity-40">·</span>
              <span style={{ color: "var(--primary)" }} className="font-extrabold">
                {hot.count} {hot.count === 1 ? "session" : "sessions"}
              </span>
            </div>
          ) : (
            <span className="text-[var(--muted-foreground)] font-medium">
              <strong className="text-[var(--foreground)] font-bold">{totalSessions}</strong> session{totalSessions !== 1 ? "s" : ""} recorded
            </span>
          )}
        </div>
      </div>

      {/* Main Heatmap Container spanning the full card width */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="w-full min-w-[760px] flex items-start">
          
          {/* Day-of-week labels on the left */}
          <div
            className="flex flex-col flex-shrink-0 pt-6 mr-2.5 select-none"
            style={{ gap: `${GAP}px`, width: "26px" }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                style={{ height: `${CELL}px` }}
                className="flex items-center text-[10px] font-bold text-[var(--muted-foreground)]/70 leading-none"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Month groups evenly distributed across the entire card width */}
          <div className="w-full flex-1 flex items-start justify-between gap-2 sm:gap-3">
            {monthGroups.map((month) => (
              <div key={month.index} className="flex flex-col">
                {/* Month Name */}
                <span className="text-[11px] font-extrabold tracking-tight text-[var(--muted-foreground)] mb-2 text-center select-none">
                  {month.name}
                </span>

                {/* Weeks in this Month */}
                <div className="flex" style={{ gap: `${GAP}px` }}>
                  {month.columns.map((column, ci) => (
                    <div key={ci} className="flex flex-col" style={{ gap: `${GAP}px` }}>
                      {column.map((cell, ri) => {
                        if (!cell.valid) {
                          // Transparent placeholder for empty slots
                          return (
                            <div
                              key={ri}
                              style={{ width: `${CELL}px`, height: `${CELL}px` }}
                              className="opacity-0 pointer-events-none"
                            />
                          );
                        }

                        if (cell.future) {
                          return (
                            <div
                              key={ri}
                              style={{
                                width: `${CELL}px`,
                                height: `${CELL}px`,
                                borderRadius: "4.5px",
                                background: "color-mix(in srgb, var(--border) 10%, transparent)",
                              }}
                              className="opacity-20 cursor-default"
                            />
                          );
                        }

                        const isHot = hot?.key === cell.key;
                        const isDimmed = !!hot && !isHot;
                        const bg = getCellBg(cell, isHot);

                        return (
                          <button
                            key={ri}
                            type="button"
                            onPointerEnter={() => setHot(cell)}
                            onPointerLeave={() => setHot(null)}
                            className="grid place-items-center rounded-[4.5px] text-[9.5px] font-extrabold tabular-nums outline-none transition-all duration-150 cursor-pointer"
                            style={{
                              width: `${CELL}px`,
                              height: `${CELL}px`,
                              background: bg,
                              color: cell.count >= 1 ? "#ffffff" : "transparent",
                              outline: isHot
                                ? "2px solid var(--primary)"
                                : cell.today
                                ? "2px solid var(--primary)"
                                : "none",
                              outlineOffset: "-2px",
                              opacity: isDimmed ? 0.35 : 1,
                              transform: isHot ? "scale(1.2)" : "scale(1)",
                              zIndex: isHot ? 20 : 1,
                            }}
                            aria-label={`${cell.date.toDateString()}: ${cell.count} sessions`}
                          >
                            {cell.count >= 1 ? cell.count : ""}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Footer Legend in Brand Pink */}
      <div className="mt-4 flex items-center justify-end gap-1.5 px-0.5">
        <span className="text-[11px] font-medium text-[var(--muted-foreground)] mr-1">Less</span>
        <span
          className="inline-block rounded-[3px]"
          style={{
            width: "14px",
            height: "14px",
            background: "color-mix(in srgb, var(--border) 24%, transparent)",
          }}
        />
        {[25, 45, 68, 90].map((pct) => (
          <span
            key={pct}
            className="inline-block rounded-[3px]"
            style={{
              width: "14px",
              height: "14px",
              background: `color-mix(in srgb, var(--primary) ${pct}%, transparent)`,
            }}
          />
        ))}
        <span className="text-[11px] font-medium text-[var(--muted-foreground)] ml-1">More</span>
      </div>
    </div>
  );
}
