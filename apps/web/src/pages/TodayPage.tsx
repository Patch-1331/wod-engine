import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function TodayPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["today"],
    queryFn: api.today,
  });

  if (isLoading) return <p className="p-6 text-[var(--ink-faint)]">Loading today's WOD…</p>;
  if (error) return <p className="p-6 text-red-700">Couldn't reach the API — is it running on :3001?</p>;
  if (!data) return null;

  async function handleSkip() {
    await api.skipToday();
    await queryClient.invalidateQueries({ queryKey: ["today"] });
  }

  if (data.isRestDay || !data.assignment) {
    return (
      <div className="p-6">
        <p className="font-mono text-xs tracking-wide text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
          TODAY
        </p>
        <h1 className="mt-2 text-4xl font-extrabold uppercase leading-none" style={{ fontFamily: "var(--font-display)" }}>
          Rest day
        </h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Either the week's 5 training days are already used, or today was marked as rest. Come back
          tomorrow for the next WOD.
        </p>
      </div>
    );
  }

  const wod = data.assignment.wod;

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
          <div key={m.id} className="flex items-center justify-between py-3">
            <span className="font-mono text-lg font-semibold text-[var(--accent)]" style={{ fontFamily: "var(--font-mono)" }}>
              {String(m.reps).padStart(2, "0")}
            </span>
            <span className="font-semibold">{m.exercise.name.toUpperCase()}</span>
          </div>
        ))}
      </div>

      <button
        className="mt-6 w-full rounded-md py-3 font-mono text-sm font-semibold tracking-wide text-white"
        style={{ fontFamily: "var(--font-mono)", background: "var(--accent)" }}
      >
        START WORKOUT
      </button>
      <button
        onClick={handleSkip}
        className="mt-3 w-full text-center text-sm text-[var(--ink-faint)]"
      >
        Mark today as rest
      </button>
    </div>
  );
}
