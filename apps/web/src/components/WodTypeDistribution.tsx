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
          <div className="h-2.5 flex-1 rounded-full bg-[var(--bg)]">
            <div className="h-2.5 rounded-full" style={{ width: `${s.percent}%`, background: "var(--accent)" }} />
          </div>
          <span className="font-mono text-xs text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
            {Math.round(s.percent)}%
          </span>
        </div>
      ))}
    </div>
  );
}
