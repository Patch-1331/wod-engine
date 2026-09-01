import type { ForTimeTrend } from "../lib/stats";
import { formatResult } from "../lib/stats";

const WIDTH = 220;
const HEIGHT = 64;
const PAD = 8;

/** Lower seconds is better, and lower seconds is also a smaller SVG y — so the line naturally trends toward the top as times improve, no inversion needed. */
function points(trend: ForTimeTrend): { x: number; y: number }[] {
  const times = trend.points.map((p) => p.seconds);
  const min = Math.min(...times);
  const max = Math.max(...times);
  const range = max - min || 1;
  const stepX = (WIDTH - PAD * 2) / (trend.points.length - 1);
  return trend.points.map((p, i) => ({
    x: PAD + i * stepX,
    y: PAD + ((p.seconds - min) / range) * (HEIGHT - PAD * 2),
  }));
}

function TrendCard({ trend }: { trend: ForTimeTrend }) {
  const coords = points(trend);
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const first = trend.points[0];
  const last = trend.points[trend.points.length - 1];

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
      <span className="font-semibold uppercase" style={{ fontFamily: "var(--font-display)" }}>
        {trend.wodName}
      </span>
      <svg role="img" aria-label={`Time trend for ${trend.wodName}`} width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2">
        <path d={path} fill="none" stroke="var(--accent-2)" strokeWidth={1.5} />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={2.5} fill="var(--accent-2)" />
        ))}
      </svg>
      <div className="mt-1 flex items-center justify-between font-mono text-xs text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        <span>{formatResult("time_seconds", String(first.seconds))}</span>
        <span className="font-semibold text-[var(--accent-strong)]">{formatResult("time_seconds", String(last.seconds))}</span>
      </div>
    </div>
  );
}

export function ForTimeTrendCharts({ trends }: { trends: ForTimeTrend[] }) {
  if (trends.length === 0) {
    return <p className="text-sm text-[var(--ink-faint)]">Repeat a For Time WOD to see its trend here.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {trends.map((t) => (
        <TrendCard key={t.wodName} trend={t} />
      ))}
    </div>
  );
}
