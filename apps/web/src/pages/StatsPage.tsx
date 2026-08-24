import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { computePRs, computePatternBalance, computeStreaks, formatResult } from "../lib/stats";

const PATTERN_LABELS: Record<string, string> = {
  squat: "Squat",
  hinge: "Hinge",
  push: "Push",
  pull: "Pull",
  core: "Core",
  carry: "Carry",
  monostructural: "Monostructural",
};

export function StatsPage() {
  const { data: logs, isLoading: logsLoading, error } = useQuery({ queryKey: ["logs"], queryFn: api.logs });
  const { data: today } = useQuery({ queryKey: ["today"], queryFn: api.today });

  if (logsLoading) return <p className="p-6 text-[var(--ink-faint)]">Loading stats…</p>;
  if (error) return <p className="p-6 text-red-700">Couldn't reach the API — is it running on :3001?</p>;

  if (!logs || logs.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-extrabold uppercase" style={{ fontFamily: "var(--font-display)" }}>
          Stats
        </h1>
        <p className="mt-3 text-[var(--ink-faint)]">
          Streaks, PRs, and pattern balance land here once you've logged a workout.
        </p>
      </div>
    );
  }

  const anchorDate = today?.date ?? logs[0].date;
  const streaks = computeStreaks(logs.map((l) => l.date), anchorDate);
  const prs = computePRs(logs);
  const balance = computePatternBalance(logs);
  const maxBalance = Math.max(...balance.map((b) => b.count));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold uppercase" style={{ fontFamily: "var(--font-display)" }}>
        Stats
      </h1>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatTile label="Current streak" value={streaks.current} unit="days" />
        <StatTile label="Longest streak" value={streaks.longest} unit="days" />
        <StatTile label="Logged" value={logs.length} unit="WODs" />
      </div>

      <p className="mt-8 font-mono text-xs tracking-wide text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        PERSONAL RECORDS
      </p>
      <div className="mt-3 divide-y divide-[var(--border)] rounded-md border border-[var(--border)] bg-[var(--surface)]">
        {prs.map((pr) => (
          <div key={pr.wodName} className="flex items-center justify-between px-4 py-3">
            <span className="font-semibold uppercase" style={{ fontFamily: "var(--font-display)" }}>
              {pr.wodName}
            </span>
            <span className="font-mono text-lg font-semibold text-[var(--accent-strong)]" style={{ fontFamily: "var(--font-mono)" }}>
              {formatResult(pr.resultType, pr.resultValue)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-8 font-mono text-xs tracking-wide text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        MOVEMENT PATTERN BALANCE
      </p>
      <div className="mt-3 space-y-2 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
        {balance.map((b) => (
          <div key={b.pattern} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-sm text-[var(--ink-soft)]">
              {PATTERN_LABELS[b.pattern] ?? b.pattern}
            </span>
            <div className="h-2.5 flex-1 rounded-full bg-[var(--bg)]">
              <div
                className="h-2.5 rounded-full"
                style={{ width: `${(b.count / maxBalance) * 100}%`, background: "var(--accent-2)" }}
              />
            </div>
            <span className="font-mono text-xs text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
              {b.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
      <p className="font-mono text-3xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
        {value}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{unit}</p>
      <p className="mt-2 text-xs text-[var(--ink-soft)]">{label}</p>
    </div>
  );
}
