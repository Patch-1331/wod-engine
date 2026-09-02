import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { DigitReadout } from "../components/DigitReadout";

export function TodayPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["today"],
    queryFn: api.today,
  });

  if (isLoading) return <p className="p-6 text-[var(--ink-faint)]">Loading today's WOD…</p>;
  if (error) return <p className="p-6 text-[var(--danger)]">Couldn't reach the API — is it running on :3001?</p>;
  if (!data) return null;

  async function handleSkip() {
    await api.skipToday();
    await queryClient.invalidateQueries({ queryKey: ["today"] });
  }

  if (data.isRestDay || !data.assignment) {
    return (
      <div className="p-6">
        <h1 className="text-4xl font-extrabold uppercase leading-none" style={{ fontFamily: "var(--font-display)" }}>
          Rest day
        </h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Either the week's 5 training days are already used, or today was marked as rest. Come back
          tomorrow for the next WOD.
        </p>

        {/* de-energized instrument bank — the panel is still there, just unlit */}
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <DigitReadout value="--:--" label="Time cap" dim />
          <DigitReadout value="--" label="Rounds" dim />
        </div>
      </div>
    );
  }

  const { id: assignmentId, wod, status } = data.assignment;
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";
  // A session already exists once in progress, so the warm-up checklist —
  // shown before a session starts — has either already run or doesn't apply.
  const hasWarmup = data.warmupCooldownEnabled && (data.warmup?.length ?? 0) > 0;
  const startPath = !isInProgress && hasWarmup ? `/warmup/${assignmentId}` : `/workout/${assignmentId}`;
  // True whenever at least one movement is on a tracked progression line
  // (Feature #2) — the scheduler already substituted every such movement
  // for the exercise at the user's current rung before this response left
  // the API, so there's nothing left for the user to toggle or choose.
  const isAutoScaled = wod.movements.some((m) => m.exercise.line !== null);

  return (
    <div className="flex flex-1 flex-col p-6">
      <h1
        className="text-5xl font-extrabold uppercase leading-none"
        style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
      >
        {wod.name}
      </h1>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
          {wod.type.toUpperCase()}
        </p>
        {isAutoScaled && (
          <span
            className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-[0.1em]"
            style={{ fontFamily: "var(--font-mono)", color: "var(--glow)", background: "var(--glow-tint)" }}
          >
            AUTO-SCALED
          </span>
        )}
      </div>

      {/* the readout bank — the world's signature moment */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <DigitReadout value={String(wod.timeCapMinutes).padStart(2, "0")} label="Time cap (min)" size="lg" />
        <DigitReadout value={wod.rounds ? String(wod.rounds) : "—"} label="Rounds" size="lg" />
      </div>

      {/* engraved plate — the fixed layer, never editable, never lit */}
      <div className="mt-2.5" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
        <p
          className="px-4 pt-3 text-[10px] font-semibold tracking-[0.14em] text-[var(--ink-faint)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          MOVEMENTS
        </p>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {wod.movements.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <span className="font-semibold tracking-wide text-[var(--ink-soft)]" style={{ fontFamily: "var(--font-mono)" }}>
                {m.exercise.name.toUpperCase()}
              </span>
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}
              >
                {m.exercise.unit === "seconds" ? `${m.reps}s` : m.reps}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* the panel's control row — anchored to the bottom of the instrument,
          not left to drift wherever the content happens to end */}
      <div className="mt-auto pt-6">
        {isCompleted ? (
          <button
            onClick={() => navigate(`/log/${assignmentId}`)}
            className="flex w-full items-center justify-center gap-2 py-4 text-sm font-bold tracking-[0.14em]"
            style={{ fontFamily: "var(--font-mono)", background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
          >
            <CheckIcon /> VIEW RESULT
          </button>
        ) : (
          <>
            <ToggleStart
              onClick={() => navigate(startPath)}
              label={isInProgress ? "RESUME WORKOUT" : "START WORKOUT"}
              energized={isInProgress}
            />
            {!isInProgress && (
              <button
                onClick={handleSkip}
                className="mt-3 w-full text-center text-xs font-semibold tracking-[0.08em] text-[var(--ink-faint)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                MARK TODAY AS REST
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// The panel's physical toggle switch — flips lit when the session is live.
function ToggleStart({ onClick, label, energized }: { onClick: () => void; label: string; energized: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-3 py-4 text-sm font-bold tracking-[0.14em]"
      style={{
        fontFamily: "var(--font-mono)",
        background: energized ? "var(--glow-tint)" : "var(--glow)",
        color: energized ? "var(--glow)" : "var(--bg)",
        border: energized ? "1px solid var(--glow)" : "none",
      }}
    >
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: energized ? "var(--glow)" : "var(--bg)", boxShadow: energized ? "0 0 6px var(--glow)" : "none" }}
      />
      {label}
    </button>
  );
}
