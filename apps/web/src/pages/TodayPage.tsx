import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function TodayPage() {
  const { data: wods, isLoading, error } = useQuery({
    queryKey: ["wods"],
    queryFn: api.wods,
  });

  if (isLoading) return <p className="p-6 text-[var(--ink-faint)]">Loading today's WOD…</p>;
  if (error) return <p className="p-6 text-red-700">Couldn't reach the API — is it running on :3001?</p>;

  // Scheduler picks the day's WOD; for the scaffold, just surface the first seeded one.
  const wod = wods?.[0];
  if (!wod) return <p className="p-6 text-[var(--ink-faint)]">No WODs seeded yet.</p>;

  return (
    <div className="p-6">
      <p className="font-mono text-xs tracking-wide text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        TODAY
      </p>
      <h1
        className="mt-2 text-5xl font-extrabold uppercase leading-none"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {wod.name}
      </h1>
      <p className="mt-2 font-mono text-xs text-[var(--accent-strong)]" style={{ fontFamily: "var(--font-mono)" }}>
        {wod.type.toUpperCase()} · {wod.timeCapMinutes} MIN
      </p>

      <div className="mt-6 divide-y divide-[var(--border)] rounded-md border border-[var(--border)] bg-[var(--surface)] px-5">
        {wod.movements.map((m) => (
          <div key={m.order} className="flex items-center justify-between py-3">
            <span className="font-mono text-lg font-semibold text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>
              {String(m.reps).padStart(2, "0")}
            </span>
            <span className="font-semibold">{m.exercise.name.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
