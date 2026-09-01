import type { PatternWeekVolume } from "../lib/stats";

// Stable order so a given pattern always gets the same fill, regardless of
// which patterns happen to appear in a given week's data.
const PATTERN_ORDER = ["squat", "hinge", "push", "pull", "core", "carry", "monostructural"];

// The theme has one accent hue (--glow) and status is meant to read by mark
// or fill texture, not by color alone — so each series gets a distinct
// pattern (solid / diagonal / dots / cross-hatch) at one of two tones
// instead of a rainbow of hues.
type FillKind = "solid" | "hatch" | "dots" | "cross";
const FILL_STYLES: { kind: FillKind; tone: "glow" | "dim" }[] = [
  { kind: "solid", tone: "glow" },
  { kind: "hatch", tone: "glow" },
  { kind: "dots", tone: "glow" },
  { kind: "solid", tone: "dim" },
  { kind: "hatch", tone: "dim" },
  { kind: "dots", tone: "dim" },
  { kind: "cross", tone: "dim" },
];

function fillIdFor(pattern: string): string {
  const index = PATTERN_ORDER.indexOf(pattern);
  const style = FILL_STYLES[index >= 0 ? index : 0];
  return `pv-${style.kind}-${style.tone}`;
}

function PatternFillDefs() {
  return (
    <defs>
      {FILL_STYLES.map(({ kind, tone }) => {
        const id = `pv-${kind}-${tone}`;
        const mark = tone === "glow" ? "var(--glow)" : "var(--glow-dim)";
        if (kind === "solid") {
          return null; // solid fills reference the color directly, no pattern needed
        }
        return (
          <pattern key={id} id={id} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="var(--glow-tint)" />
            {kind === "hatch" && <line x1="0" y1="6" x2="6" y2="0" stroke={mark} strokeWidth="1.6" />}
            {kind === "dots" && <circle cx="3" cy="3" r="1.3" fill={mark} />}
            {kind === "cross" && (
              <>
                <line x1="0" y1="6" x2="6" y2="0" stroke={mark} strokeWidth="1.2" />
                <line x1="0" y1="0" x2="6" y2="6" stroke={mark} strokeWidth="1.2" />
              </>
            )}
          </pattern>
        );
      })}
    </defs>
  );
}

function fillFor(pattern: string): string {
  const index = PATTERN_ORDER.indexOf(pattern);
  const style = FILL_STYLES[index >= 0 ? index : 0];
  return style.kind === "solid" ? (style.tone === "glow" ? "var(--glow)" : "var(--glow-dim)") : `url(#${fillIdFor(pattern)})`;
}

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
      {/* Pattern fill defs are declared once and referenced by id from both the legend
          swatches and the chart bars below — SVG resolves url(#id) document-wide, so
          duplicating the <defs> per swatch would just create invalid duplicate ids. */}
      <svg width="0" height="0" aria-hidden="true">
        <PatternFillDefs />
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--ink-soft)]">
        {patterns.map((p) => (
          <span key={p} className="flex items-center gap-1.5">
            <svg width="10" height="10" aria-hidden="true">
              <rect width="10" height="10" fill={fillFor(p)} stroke="var(--border)" strokeWidth="0.5" />
            </svg>
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
                      fill={fillFor(pattern)}
                      stroke="var(--panel)"
                      strokeWidth="0.5"
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
