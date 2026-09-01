import type { WodTypeShare } from "../lib/stats";

const WOD_TYPE_LABELS: Record<WodTypeShare["wodType"], string> = {
  amrap: "AMRAP",
  for_time: "For Time",
  emom: "EMOM",
  tabata: "Tabata",
};

export function WodTypeDistribution({ shares }: { shares: WodTypeShare[] }) {
  return (
    <div className="space-y-2">
      {shares.map((s) => (
        <div key={s.wodType} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-sm text-[var(--ink-soft)]">{WOD_TYPE_LABELS[s.wodType]}</span>
          <div className="h-2.5 flex-1" style={{ background: "var(--panel-2)", border: "1px solid var(--border)" }}>
            <div
              className="h-full"
              style={{ width: `${s.percent}%`, background: "var(--glow)", boxShadow: "0 0 6px var(--glow-tint)" }}
            />
          </div>
          <span
            className="text-xs"
            style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--ink-faint)" }}
          >
            {Math.round(s.percent)}%
          </span>
        </div>
      ))}
    </div>
  );
}
