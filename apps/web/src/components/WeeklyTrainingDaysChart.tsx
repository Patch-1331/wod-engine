import type { WeekTrainingDays } from "../lib/stats";

const CHART_HEIGHT = 100;
const BAR_WIDTH = 22;
const BAR_GAP = 12;
// Room for the week-label text either side of the outermost bars — without it,
// a chart with only 1-2 weeks is narrower than the label text and clips it.
const SIDE_PAD = 18;

function formatWeekLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function WeeklyTrainingDaysChart({ weeks, cap }: { weeks: WeekTrainingDays[]; cap: number }) {
  if (weeks.length === 0) return null;

  const scaleMax = Math.max(cap, ...weeks.map((w) => w.days));
  const chartWidth = weeks.length * (BAR_WIDTH + BAR_GAP) + SIDE_PAD * 2;
  const capY = CHART_HEIGHT - (cap / scaleMax) * CHART_HEIGHT;

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
        <span className="h-0 w-3 border-t-2 border-dashed" style={{ borderColor: "var(--ink-faint)" }} />
        {cap}-day cap
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg
          role="img"
          aria-label="Training days per week against the scheduler's weekly cap"
          width={chartWidth}
          height={CHART_HEIGHT + 24}
          viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT + 24}`}
        >
          <line
            x1={0}
            y1={capY}
            x2={chartWidth}
            y2={capY}
            stroke="var(--ink-faint)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          {weeks.map((week, i) => {
            const x = SIDE_PAD + i * (BAR_WIDTH + BAR_GAP);
            const height = (week.days / scaleMax) * CHART_HEIGHT;
            const overCap = week.days > cap;
            return (
              <g key={week.weekStart}>
                <rect
                  x={x}
                  y={CHART_HEIGHT - height}
                  width={BAR_WIDTH}
                  height={height}
                  fill={overCap ? "var(--danger)" : "var(--glow)"}
                  style={overCap ? undefined : { filter: "drop-shadow(0 0 4px var(--glow-tint))" }}
                />
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
