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
    <div className="p-4" style={{ background: "var(--panel-2)", border: "1px solid var(--border)" }}>
      <span className="font-semibold uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
        {trend.wodName}
      </span>
      <svg role="img" aria-label={`Time trend for ${trend.wodName}`} width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2">
        <path d={path} fill="none" stroke="var(--glow)" strokeWidth={1.5} style={{ filter: "drop-shadow(0 0 3px var(--glow-tint))" }} />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={2.5} fill="var(--glow)" />
        ))}
      </svg>
      <div
        className="mt-1 flex items-center justify-between text-xs"
        style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--ink-faint)" }}
      >
        <span>{formatResult("time_seconds", String(first.seconds))}</span>
        <span className="font-semibold" style={{ color: "var(--glow)", textShadow: "0 0 6px var(--glow-tint)" }}>
          {formatResult("time_seconds", String(last.seconds))}
        </span>
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
