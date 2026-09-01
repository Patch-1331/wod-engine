import type { PatternWeekVolume } from "../lib/stats";

const SERIES_COLORS: Record<string, string> = {
  squat: "var(--accent)",
  hinge: "var(--accent-2)",
  push: "#7a6a9c",
  pull: "#b0555c",
  core: "#4d7ea8",
  carry: "#8a8340",
  monostructural: "var(--ink-faint)",
};

const CHART_HEIGHT = 120;
const BAR_WIDTH = 22;
const BAR_GAP = 12;
// Room for the week-label text either side of the outermost bars — without it,
// a chart with only 1-2 weeks is narrower than the label text and clips it.
const SIDE_PAD = 18;

function formatWeekLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function PatternVolumeTrendChart({ weeks }: { weeks: PatternWeekVolume[] }) {
  if (weeks.length === 0) return null;

  const patterns = Array.from(new Set(weeks.flatMap((w) => Object.keys(w.counts))));
  const maxTotal = Math.max(...weeks.map((w) => Object.values(w.counts).reduce((sum, c) => sum + c, 0)));
  const chartWidth = weeks.length * (BAR_WIDTH + BAR_GAP) + SIDE_PAD * 2;

  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--ink-soft)]">
        {patterns.map((p) => (
          <span key={p} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: SERIES_COLORS[p] ?? "var(--ink-faint)" }} />
            {p}
          </span>
        ))}
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg
          role="img"
          aria-label="Weekly WODs logged per movement pattern"
          width={chartWidth}
          height={CHART_HEIGHT + 24}
          viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT + 24}`}
        >
          {weeks.map((week, i) => {
            const x = SIDE_PAD + i * (BAR_WIDTH + BAR_GAP);
            let yOffset = CHART_HEIGHT;
            return (
              <g key={week.weekStart}>
                {patterns.map((pattern) => {
                  const count = week.counts[pattern] ?? 0;
                  if (count === 0) return null;
                  const height = (count / maxTotal) * CHART_HEIGHT;
                  yOffset -= height;
                  return (
                    <rect
                      key={pattern}
                      x={x}
                      y={yOffset}
                      width={BAR_WIDTH}
                      height={height}
                      fill={SERIES_COLORS[pattern] ?? "var(--ink-faint)"}
                    />
                  );
                })}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={CHART_HEIGHT + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fill="var(--ink-faint)"
                >
                  {formatWeekLabel(week.weekStart)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
