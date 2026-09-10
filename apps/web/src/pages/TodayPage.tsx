import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { effectiveRounds } from "@wod-engine/shared";
import { api } from "../lib/api";
import { DigitReadout } from "../components/DigitReadout";
import { InstructionsCaret, InstructionsPanel } from "../components/MovementInstructions";

export function TodayPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Which movement's instructions are open, by movement id. One at a time:
  // the plate is a briefing to read down, not a set of panels to leave open.
  const [openMovementId, setOpenMovementId] = useState<string | null>(null);
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
  // A ladder's own scheme sets the rounds — a 21-15-9 is three rounds whether
  // or not the WOD row happens to declare it.
  const totalRounds = effectiveRounds(wod);

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

      {/* how the workout is meant to be performed — engraved, not lit, and
          absent entirely on the WODs whose movement list already says it */}
      {wod.description && (
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">{wod.description}</p>
      )}

      {/* the readout bank — the world's signature moment */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <DigitReadout value={String(wod.timeCapMinutes).padStart(2, "0")} label="Time cap (min)" size="lg" />
        <DigitReadout value={totalRounds ? String(totalRounds) : "—"} label="Rounds" size="lg" />
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
          {wod.movements.map((m) => {
            const instructions = m.exercise.instructions;
            const isOpen = openMovementId === m.id;
            const panelId = `movement-instructions-${m.id}`;

            // No copy for this movement — a plain, inert row rather than a
            // control that opens onto nothing.
            if (!instructions) {
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderColor: "var(--border)" }}>
                  <span className="flex min-w-0 items-center gap-2">
                    {/* Holds the caret's place so a movement without copy
                        still lines up with the ones that have it. */}
                    <span aria-hidden="true" style={{ width: 12, flexShrink: 0 }} />
                    <span className="truncate font-semibold tracking-wide text-[var(--ink-soft)]" style={{ fontFamily: "var(--font-mono)" }}>
                      {m.exercise.name.toUpperCase()}
                    </span>
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}
                  >
                    {movementCount(m)}
                  </span>
                </div>
              );
            }

            return (
              <div key={m.id} style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setOpenMovementId(isOpen ? null : m.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <InstructionsCaret open={isOpen} />
                    <span className="truncate font-semibold tracking-wide text-[var(--ink-soft)]" style={{ fontFamily: "var(--font-mono)" }}>
                      {m.exercise.name.toUpperCase()}
                    </span>
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}
                  >
                    {movementCount(m)}
                  </span>
                </button>
                {isOpen && <InstructionsPanel id={panelId} text={instructions} />}
              </div>
            );
          })}
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

/**
 * What the plate shows for a movement: the ladder as prescribed ("21-15-9")
 * where there is one, otherwise the flat count. `reps` is the ladder's total,
 * which is the one number that would tell the athlete nothing.
 */
function movementCount(m: {
  reps: number;
  repScheme: number[];
  exercise: { unit: string };
}): string {
  const suffix = m.exercise.unit === "seconds" ? "s" : "";
  if (m.repScheme.length > 0) return `${m.repScheme.join("-")}${suffix}`;
  return `${m.reps}${suffix}`;
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
