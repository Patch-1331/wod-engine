import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useWakeLock } from "../lib/useWakeLock";
import { roundCompleteCue, finishCue } from "../lib/cues";
import { anchorMovement, computeRoundReps, roundsFromReps } from "../lib/roundSplit";

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

  const logRoundMutation = useMutation({
    mutationFn: (round: { round: number; atSeconds: number }) => api.logRound(assignmentId, round),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["today"] }),
  });

  const finishMutation = useMutation({
    mutationFn: () => api.finishSession(assignmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["today"] });
      finishCue();
      navigate(`/log/${assignmentId}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelSession(assignmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["today"] });
      navigate("/");
    },
  });

  function handleCancel() {
    if (window.confirm("Cancel this workout? Your progress won't be saved.")) {
      cancelMutation.mutate();
    }
  }

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
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "#1E2422", color: "#ECEFE6" }}>
      <div className="flex items-center justify-between px-5 pt-5">
        <button
          onClick={handleCancel}
          disabled={cancelMutation.isPending}
          className="font-mono text-[11px] font-semibold tracking-wide"
          style={{ color: "#B4574E", fontFamily: "var(--font-mono)" }}
        >
          CANCEL
        </button>
        <button
          onClick={() => finishMutation.mutate()}
          disabled={finishMutation.isPending}
          className="font-mono text-sm font-semibold tracking-wide"
          style={{ color: "#E3A73C", fontFamily: "var(--font-mono)" }}
        >
          FINISH
        </button>
      </div>

      <div className="pt-5 text-center">
        <div className="font-mono text-xs tracking-wide" style={{ color: "#767E6E", fontFamily: "var(--font-mono)" }}>
          {wod.name.toUpperCase()} · {wod.type.toUpperCase()} {wod.timeCapMinutes} · CUES ON
        </div>
        <div
          className="mt-1.5 font-mono text-6xl font-bold"
          style={{ fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)" }}
        >
          {formatClock(elapsedSeconds)}
        </div>
        <div className="mx-auto mt-3.5 h-1.5 w-72 max-w-[70vw] overflow-hidden rounded-full" style={{ background: "#303A29" }}>
          <div className="h-full" style={{ width: `${progress * 100}%`, background: "#6FAA9C" }} />
        </div>
        <div className="mt-1.5 font-mono text-[11px]" style={{ color: "#767E6E", fontFamily: "var(--font-mono)" }}>
          CAP {formatClock(activeSession.capSeconds)}
        </div>
      </div>

      <div className="py-5 text-center">
        <div className="font-mono text-xs tracking-wide" style={{ color: "#767E6E", fontFamily: "var(--font-mono)" }}>
          ROUND
        </div>
        <div
          className="text-8xl font-extrabold leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {currentRound}
          {wod.rounds ? <span className="text-4xl" style={{ color: "#767E6E" }}> / {wod.rounds}</span> : null}
        </div>
      </div>

      <div className="px-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[11px] tracking-wide" style={{ color: "#767E6E", fontFamily: "var(--font-mono)" }}>
            MOVEMENTS
          </div>
          <button
            onClick={() => {
              setSplitInput(roundSplitCount ?? 5);
              setSplitMode("rounds");
              setSplitPanelOpen((v) => !v);
            }}
            className="font-mono text-[11px] font-semibold tracking-wide"
            style={{ color: roundSplitCount ? "#6FAA9C" : "#767E6E", fontFamily: "var(--font-mono)" }}
          >
            {roundSplitCount ? `SPLIT ${roundSplitCount}×` : "SPLIT"}
          </button>
        </div>

        {splitPanelOpen && (
          <div className="mt-2 rounded-lg p-3" style={{ background: "#252B24" }}>
            <div className="flex gap-2">
              <button
                onClick={() => setSplitMode("rounds")}
                className="flex-1 rounded py-1.5 font-mono text-xs font-semibold"
                style={splitMode === "rounds" ? { background: "#E3A73C", color: "#1E2422" } : { background: "#303A29", color: "#A8AF9E" }}
              >
                BY ROUNDS
              </button>
              <button
                onClick={() => setSplitMode("reps")}
                className="flex-1 rounded py-1.5 font-mono text-xs font-semibold"
                style={splitMode === "reps" ? { background: "#E3A73C", color: "#1E2422" } : { background: "#303A29", color: "#A8AF9E" }}
              >
                BY REPS
              </button>
            </div>

            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                onClick={() => setSplitInput((v) => Math.max(1, v - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full border text-sm"
                style={{ borderColor: "#767E6E", color: "#767E6E" }}
              >
                –
              </button>
              <span className="min-w-[3rem] text-center font-mono text-2xl font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                {splitInput}
              </span>
              <button
                onClick={() => setSplitInput((v) => v + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border text-sm"
                style={{ borderColor: "#E3A73C", color: "#E3A73C" }}
              >
                +
              </button>
            </div>
            <p className="mt-1 text-center font-mono text-[11px]" style={{ color: "#767E6E", fontFamily: "var(--font-mono)" }}>
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
                className="flex-1 rounded py-2 font-mono text-xs font-bold"
                style={{ background: "#E3A73C", color: "#1E2422" }}
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
                  className="rounded px-4 py-2 font-mono text-xs font-semibold"
                  style={{ background: "#303A29", color: "#A8AF9E" }}
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-2.5 flex flex-col">
          {wod.movements.map((m) => (
            <div key={m.id} className="flex items-center justify-between border-b py-2" style={{ borderColor: "#303A29" }}>
              <span className="font-mono text-sm" style={{ color: "#A8AF9E", fontFamily: "var(--font-mono)" }}>
                {m.exercise.name.toUpperCase()}
              </span>
              <span className="font-mono text-lg font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
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
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl"
          style={{ height: 168, background: "#E3A73C", color: "#1E2422" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#1E2422" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={34} height={34}>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <span className="font-mono text-base font-bold tracking-wide" style={{ fontFamily: "var(--font-mono)" }}>
            ROUND COMPLETE
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="font-mono text-[11px] tracking-wide" style={{ color: "#767E6E", fontFamily: "var(--font-mono)" }}>
          SPLITS
        </div>
        <div className="mt-2.5 flex flex-col">
          {splits.map((s) => (
            <div
              key={s.round}
              className="flex justify-between border-b py-2.5 font-mono text-sm"
              style={{ borderColor: "#303A29", fontFamily: "var(--font-mono)" }}
            >
              <span style={{ color: "#A8AF9E" }}>ROUND {s.round}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatClock(s.atSeconds)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
