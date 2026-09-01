import type { WeekTrainingDays } from "../lib/stats";

const CHART_HEIGHT = 100;
const BAR_WIDTH = 22;
const BAR_GAP = 12;

function formatWeekLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function WeeklyTrainingDaysChart({ weeks, cap }: { weeks: WeekTrainingDays[]; cap: number }) {
  if (weeks.length === 0) return null;

  const scaleMax = Math.max(cap, ...weeks.map((w) => w.days));
  const chartWidth = weeks.length * (BAR_WIDTH + BAR_GAP);
  const capY = CHART_HEIGHT - (cap / scaleMax) * CHART_HEIGHT;

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
        <span className="h-0 w-3 border-t-2 border-dashed" style={{ borderColor: "var(--accent-strong)" }} />
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
            stroke="var(--accent-strong)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          {weeks.map((week, i) => {
            const x = i * (BAR_WIDTH + BAR_GAP);
            const height = (week.days / scaleMax) * CHART_HEIGHT;
            const overCap = week.days > cap;
            return (
              <g key={week.weekStart}>
                <rect
                  x={x}
                  y={CHART_HEIGHT - height}
                  width={BAR_WIDTH}
                  height={height}
                  fill={overCap ? "var(--accent-strong)" : "var(--accent-2)"}
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
