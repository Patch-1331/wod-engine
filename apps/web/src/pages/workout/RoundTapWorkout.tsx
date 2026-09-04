import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Wod, WorkoutSession } from "@wod-engine/shared";
import { api } from "../../lib/api";
import { formatClock } from "../../lib/clock";
import { roundCompleteCue, capReachedCue } from "../../lib/cues";
import { anchorMovement, computeRoundReps, roundsFromReps } from "../../lib/roundSplit";
import { MinusIcon, PlusIcon } from "../../components/StepperIcons";
import { useNow } from "./useWorkoutSession";
import { WorkoutChrome } from "./WorkoutChrome";

/**
 * The AMRAP / For Time screen: a running stopwatch the athlete taps once
 * per round. EMOM and Tabata advance themselves instead — see
 * IntervalWorkout.
 */
export function RoundTapWorkout({
  assignmentId,
  wod,
  session,
  isFinished,
  chrome,
}: {
  assignmentId: string;
  wod: Wod;
  session: WorkoutSession;
  isFinished: boolean;
  chrome: React.ReactElement<typeof WorkoutChrome>;
}) {
  const queryClient = useQueryClient();
  const now = useNow(1000, !isFinished);

  // Cues the cap once, even if the user isn't watching the screen — doesn't
  // force a stop, since an AMRAP may still want a manual Finish tap.
  const capReachedRef = useRef(false);
  useEffect(() => {
    capReachedRef.current = false;
  }, [session.id]);
  useEffect(() => {
    if (isFinished || capReachedRef.current) return;
    const startedAtMs = new Date(session.startedAt).getTime();
    const elapsed = Math.max(0, Math.floor((now - startedAtMs) / 1000));
    if (elapsed >= session.capSeconds) {
      capReachedRef.current = true;
      capReachedCue();
    }
  }, [now, session, isFinished]);

  const logRoundMutation = useMutation({
    mutationFn: (round: { round: number; atSeconds: number }) => api.logRound(assignmentId, round),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["today"] }),
  });

  const splitMutation = useMutation({
    mutationFn: (roundSplitCount: number | null) => api.setRoundSplit(assignmentId, { roundSplitCount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["today"] }),
  });

  const [splitPanelOpen, setSplitPanelOpen] = useState(false);
  const [splitMode, setSplitMode] = useState<"rounds" | "reps">("rounds");
  const [splitInput, setSplitInput] = useState(5);

  const startedAtMs = new Date(session.startedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1000));
  const progress = Math.min(1, elapsedSeconds / session.capSeconds);
  const splits = [...session.roundSplits].sort((a, b) => b.round - a.round);
  const currentRound = session.roundSplits.length + 1;

  const anchor = anchorMovement(wod.movements);
  const roundSplitCount = session.roundSplitCount;
  const splitRoundIndex = roundSplitCount ? Math.min(currentRound - 1, roundSplitCount - 1) : 0;

  function repsForMovement(m: (typeof wod.movements)[number]) {
    if (!roundSplitCount) return m.reps;
    return computeRoundReps(m.reps, roundSplitCount)[splitRoundIndex];
  }

  function handleRoundComplete() {
    roundCompleteCue();
    logRoundMutation.mutate({ round: currentRound, atSeconds: elapsedSeconds });
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      {chrome}

      <div className="pt-5 text-center">
        <div className="text-xs font-semibold tracking-[0.14em]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
          {wod.name.toUpperCase()} · {wod.type.toUpperCase()} {wod.timeCapMinutes} · CUES ON
        </div>
        <div
          className="mt-1.5 text-6xl font-bold"
          style={{
            fontVariantNumeric: "tabular-nums",
            fontFamily: "var(--font-mono)",
            color: "var(--glow)",
            textShadow: "0 0 16px var(--glow-tint), 0 0 3px var(--glow)",
          }}
        >
          {formatClock(elapsedSeconds)}
        </div>
        <div className="mx-auto mt-3.5 h-1.5 w-72 max-w-[70vw] overflow-hidden" style={{ background: "var(--panel-2)", border: "1px solid var(--border)" }}>
          <div className="h-full" style={{ width: `${progress * 100}%`, background: "var(--glow)", boxShadow: "0 0 8px var(--glow)" }} />
        </div>
        <div className="mt-1.5 text-[11px]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
          CAP {formatClock(session.capSeconds)}
        </div>
      </div>

      <div className="py-5 text-center">
        <div className="text-xs font-semibold tracking-[0.14em]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
          ROUND
        </div>
        <div
          className="text-8xl font-extrabold leading-none"
          style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--glow)", textShadow: "0 0 16px var(--glow-tint), 0 0 3px var(--glow)" }}
        >
          {currentRound}
          {wod.rounds ? (
            <span className="text-4xl" style={{ color: "var(--ink-faint)", textShadow: "none" }}> / {wod.rounds}</span>
          ) : null}
        </div>
      </div>

      <div className="px-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold tracking-[0.14em]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
            MOVEMENTS
          </div>
          <button
            onClick={() => {
              setSplitInput(roundSplitCount ?? 5);
              setSplitMode("rounds");
              setSplitPanelOpen((v) => !v);
            }}
            className="text-[11px] font-semibold tracking-[0.14em]"
            style={{ color: roundSplitCount ? "var(--glow)" : "var(--ink-faint)", fontFamily: "var(--font-mono)" }}
          >
            {roundSplitCount ? `SPLIT ${roundSplitCount}×` : "SPLIT"}
          </button>
        </div>

        {splitPanelOpen && (
          <div className="mt-2 p-3" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
            <div className="flex gap-2">
              <button
                onClick={() => setSplitMode("rounds")}
                className="flex-1 py-1.5 text-xs font-semibold"
                style={
                  splitMode === "rounds"
                    ? { background: "var(--glow)", color: "var(--bg)", fontFamily: "var(--font-mono)" }
                    : { background: "var(--panel-2)", color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }
                }
              >
                BY ROUNDS
              </button>
              <button
                onClick={() => setSplitMode("reps")}
                className="flex-1 py-1.5 text-xs font-semibold"
                style={
                  splitMode === "reps"
                    ? { background: "var(--glow)", color: "var(--bg)", fontFamily: "var(--font-mono)" }
                    : { background: "var(--panel-2)", color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }
                }
              >
                BY REPS
              </button>
            </div>

            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                onClick={() => setSplitInput((v) => Math.max(1, v - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border"
                style={{ borderColor: "var(--ink-faint)", color: "var(--ink-faint)" }}
              >
                <MinusIcon color="var(--ink-faint)" />
              </button>
              <span
                className="min-w-[3rem] text-center text-2xl font-semibold"
                style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--glow)" }}
              >
                {splitInput}
              </span>
              <button
                onClick={() => setSplitInput((v) => v + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border"
                style={{ borderColor: "var(--glow)", color: "var(--glow)" }}
              >
                <PlusIcon color="var(--glow)" />
              </button>
            </div>
            <p className="mt-1 text-center text-[11px]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              {splitMode === "rounds"
                ? `${splitInput} rounds`
                : `${splitInput} reps of ${anchor.exercise.name} → ${roundsFromReps(anchor.reps, splitInput)} rounds`}
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  const rounds = splitMode === "rounds" ? splitInput : roundsFromReps(anchor.reps, splitInput);
                  splitMutation.mutate(rounds);
                  setSplitPanelOpen(false);
                }}
                disabled={splitMutation.isPending}
                className="flex-1 py-2 text-xs font-bold"
                style={{ background: "var(--glow)", color: "var(--bg)", fontFamily: "var(--font-mono)" }}
              >
                APPLY
              </button>
              {roundSplitCount !== null && (
                <button
                  onClick={() => {
                    splitMutation.mutate(null);
                    setSplitPanelOpen(false);
                  }}
                  disabled={splitMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold"
                  style={{ background: "var(--panel-2)", color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-2.5 flex flex-col">
          {wod.movements.map((m) => (
            <div key={m.id} className="flex items-center justify-between border-b py-2" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}>
                {m.exercise.name.toUpperCase()}
              </span>
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}
              >
                {m.exercise.unit === "seconds" ? `${repsForMovement(m)}s` : repsForMovement(m)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5">
        <button
          onClick={handleRoundComplete}
          disabled={logRoundMutation.isPending || isFinished}
          className="flex w-full flex-col items-center justify-center gap-2"
          style={{ height: 168, background: "var(--glow)", color: "var(--bg)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={34} height={34}>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <span className="text-base font-bold tracking-[0.14em]" style={{ fontFamily: "var(--font-mono)" }}>
            ROUND COMPLETE
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="text-[11px] font-semibold tracking-[0.14em]" style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
          SPLITS
        </div>
        <div className="mt-2.5 flex flex-col">
          {splits.map((s) => (
            <div
              key={s.round}
              className="flex justify-between border-b py-2.5 text-sm"
              style={{ borderColor: "var(--border)", fontFamily: "var(--font-mono)" }}
            >
              <span style={{ color: "var(--ink-soft)" }}>ROUND {s.round}</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{formatClock(s.atSeconds)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
