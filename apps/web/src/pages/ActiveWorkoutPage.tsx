import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useWakeLock } from "../lib/useWakeLock";
import { roundCompleteCue, finishCue, capReachedCue } from "../lib/cues";
import { anchorMovement, computeRoundReps, roundsFromReps } from "../lib/roundSplit";
import { MinusIcon, PlusIcon } from "../components/StepperIcons";

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ActiveWorkoutPage() {
  const { assignmentId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Today's WOD + any existing session — the same cached query TodayPage uses.
  const { data: today, isLoading } = useQuery({ queryKey: ["today"], queryFn: api.today });

  const startMutation = useMutation({
    mutationFn: () => api.startSession(assignmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["today"] }),
  });

  const assignment = today?.assignment;
  const session = assignment?.session ?? null;
  const startedSession = startMutation.data;

  // Kick off a session the first time this screen is reached without one.
  useEffect(() => {
    if (assignmentId && !session && !startMutation.isPending && !startedSession) {
      startMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, session]);

  const activeSession = session ?? startedSession ?? null;
  const isFinished = activeSession?.status === "completed";

  useWakeLock(!isFinished && activeSession !== null);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (isFinished) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isFinished]);

  // Cues the cap once, even if the user isn't watching the screen — doesn't
  // force a stop, since AMRAP/EMOM etc. may still want a manual Finish tap.
  const capReachedRef = useRef(false);
  useEffect(() => {
    capReachedRef.current = false;
  }, [activeSession?.id]);
  useEffect(() => {
    if (!activeSession || isFinished || capReachedRef.current) return;
    const startedAtMs = new Date(activeSession.startedAt).getTime();
    const elapsed = Math.max(0, Math.floor((now - startedAtMs) / 1000));
    if (elapsed >= activeSession.capSeconds) {
      capReachedRef.current = true;
      capReachedCue();
    }
  }, [now, activeSession, isFinished]);

  const logRoundMutation = useMutation({
    mutationFn: (round: { round: number; atSeconds: number }) => api.logRound(assignmentId, round),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["today"] }),
  });

  const hasCooldown = today?.warmupCooldownEnabled && (today?.cooldown?.length ?? 0) > 0;

  const finishMutation = useMutation({
    mutationFn: () => api.finishSession(assignmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["today"] });
      finishCue();
      navigate(hasCooldown ? `/cooldown/${assignmentId}` : `/log/${assignmentId}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelSession(assignmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["today"] });
      navigate("/");
    },
  });

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const splitMutation = useMutation({
    mutationFn: (roundSplitCount: number | null) => api.setRoundSplit(assignmentId, { roundSplitCount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["today"] }),
  });

  const [splitPanelOpen, setSplitPanelOpen] = useState(false);
  const [splitMode, setSplitMode] = useState<"rounds" | "reps">("rounds");
  const [splitInput, setSplitInput] = useState(5);

  if (isLoading || !assignment || !activeSession) {
    return <p className="p-6 text-[var(--ink-faint)]">Starting your workout…</p>;
  }

  const wod = assignment.wod;
  const startedAtMs = new Date(activeSession.startedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1000));
  const progress = Math.min(1, elapsedSeconds / activeSession.capSeconds);
  const splits = [...activeSession.roundSplits].sort((a, b) => b.round - a.round);
  const currentRound = activeSession.roundSplits.length + 1;

  const anchor = anchorMovement(wod.movements);
  const roundSplitCount = activeSession.roundSplitCount;
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
      <div className="flex items-center justify-between px-5 pt-5">
        <button
          onClick={() => setCancelConfirmOpen(true)}
          disabled={cancelMutation.isPending}
          className="text-[11px] font-semibold tracking-[0.14em]"
          style={{ color: "var(--danger)", fontFamily: "var(--font-mono)" }}
        >
          CANCEL
        </button>
        <button
          onClick={() => finishMutation.mutate()}
          disabled={finishMutation.isPending}
          className="text-sm font-bold tracking-[0.14em]"
          style={{ color: "var(--glow)", fontFamily: "var(--font-mono)" }}
        >
          FINISH
        </button>
      </div>

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
          CAP {formatClock(activeSession.capSeconds)}
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

      {cancelConfirmOpen && (
        <div className="fixed inset-0 z-10 flex items-end justify-center p-5" style={{ background: "rgba(13, 9, 6, 0.7)" }}>
          <div className="w-full max-w-md p-5" style={{ background: "var(--panel)", border: "1px solid var(--danger)" }}>
            <p className="text-sm font-bold tracking-[0.06em]" style={{ color: "var(--ink)" }}>
              Cancel this workout?
            </p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--ink-soft)" }}>
              Your progress won't be saved.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setCancelConfirmOpen(false)}
                className="flex-1 py-3 text-xs font-bold tracking-[0.1em]"
                style={{ fontFamily: "var(--font-mono)", background: "var(--panel-2)", color: "var(--ink-soft)" }}
              >
                KEEP GOING
              </button>
              <button
                onClick={() => {
                  setCancelConfirmOpen(false);
                  cancelMutation.mutate();
                }}
                disabled={cancelMutation.isPending}
                className="flex-1 py-3 text-xs font-bold tracking-[0.1em]"
                style={{ fontFamily: "var(--font-mono)", background: "var(--danger)", color: "var(--bg)" }}
              >
                CANCEL WORKOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
