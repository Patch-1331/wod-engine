import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResultType, WorkoutLog, WorkoutSession, Wod } from "@wod-engine/shared";
import { api } from "../lib/api";

function resultTypeForWod(wodType: string): ResultType {
  return wodType === "for_time" ? "time_seconds" : "rounds_reps";
}

function splitMMSS(totalSeconds: number) {
  return { m: Math.floor(totalSeconds / 60), s: totalSeconds % 60 };
}

const inputStyle = { borderColor: "var(--border)" };

export function LogResultPage() {
  const { assignmentId = "" } = useParams();

  const { data: today, isLoading: todayLoading } = useQuery({ queryKey: ["today"], queryFn: api.today });
  const { data: existingLog, isLoading: logLoading } = useQuery({
    queryKey: ["log", assignmentId],
    queryFn: () => api.getLog(assignmentId),
    enabled: assignmentId !== "",
  });

  const wod = today?.assignment?.wod;

  if (todayLoading || logLoading || !wod) {
    return <p className="p-6 text-[var(--ink-faint)]">Loading…</p>;
  }

  return (
    <LogResultForm
      assignmentId={assignmentId}
      wod={wod}
      session={today?.assignment?.session ?? null}
      existingLog={existingLog ?? null}
    />
  );
}

function LogResultForm({
  assignmentId,
  wod,
  session,
  existingLog,
}: {
  assignmentId: string;
  wod: Wod;
  session: WorkoutSession | null;
  existingLog: WorkoutLog | null;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resultType = resultTypeForWod(wod.type);

  // Computed once at mount from whatever's already loaded — a timer session's
  // rounds/finish time, an existing log being edited, or a blank slate.
  const initial = deriveInitialValues(resultType, session, existingLog);

  const [rounds, setRounds] = useState(initial.rounds);
  const [reps, setReps] = useState(initial.reps);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [seconds, setSeconds] = useState(initial.seconds);
  const [rpe, setRpe] = useState<number | null>(existingLog?.rpe ?? null);
  const [notes, setNotes] = useState(existingLog?.notes ?? "");

  const saveMutation = useMutation({
    mutationFn: () => {
      const resultValue =
        resultType === "time_seconds" ? String(minutes * 60 + seconds) : `${rounds}+${reps}`;
      return api.saveLog(assignmentId, { resultType, resultValue, rpe, notes: notes || null });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["today"] });
      await queryClient.invalidateQueries({ queryKey: ["logs"] });
      navigate("/history");
    },
  });

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
            <path d="M14.5 5 8 12l6.5 7" />
          </svg>
        </button>
        <span className="font-mono text-xs tracking-wide text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
          LOG RESULT
        </span>
      </div>

      <h1 className="text-4xl font-extrabold uppercase leading-none" style={{ fontFamily: "var(--font-display)" }}>
        {wod.name}
      </h1>
      <p className="mt-1 font-mono text-xs text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        {wod.type.toUpperCase()} · {wod.timeCapMinutes} MIN
      </p>

      {session && !existingLog && (
        <div
          className="mt-4 flex items-center gap-2 rounded border px-3 py-2 font-mono text-xs"
          style={{ borderColor: "var(--accent-2)", background: "var(--accent-2-tint)", color: "var(--accent-2)", fontFamily: "var(--font-mono)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Synced from your timer — review and save
        </div>
      )}

      <p className="mt-6 font-mono text-xs tracking-wide text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        RESULT
      </p>

      {resultType === "time_seconds" ? (
        <div className="mt-3 flex items-center gap-3">
          <input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(Math.max(0, Number(e.target.value)))}
            className="w-20 rounded border px-3 py-2 text-center font-mono text-xl"
            style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
          />
          <span className="font-mono text-xl" style={{ fontFamily: "var(--font-mono)" }}>:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => setSeconds(Math.min(59, Math.max(0, Number(e.target.value))))}
            className="w-20 rounded border px-3 py-2 text-center font-mono text-xl"
            style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
          />
        </div>
      ) : (
        <div className="mt-3 flex gap-3">
          <Stepper label="ROUNDS" value={rounds} onChange={setRounds} />
          <Stepper label="+ REPS" value={reps} onChange={setReps} />
        </div>
      )}

      <p className="mt-6 font-mono text-xs tracking-wide text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        EFFORT (RPE)
      </p>
      <div className="mt-3 grid grid-cols-10 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setRpe(n)}
            className="rounded py-2 font-mono text-sm font-semibold"
            style={
              rpe === n
                ? { background: "var(--accent)", color: "#fff", fontFamily: "var(--font-mono)" }
                : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }
            }
          >
            {n}
          </button>
        ))}
      </div>

      <p className="mt-6 font-mono text-xs tracking-wide text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        NOTES
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="How did it feel?"
        className="mt-3 w-full rounded border p-3 text-sm"
        style={inputStyle}
      />

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="mt-6 w-full rounded-md py-3 font-mono text-sm font-semibold tracking-wide text-white"
        style={{ background: "var(--accent)", fontFamily: "var(--font-mono)" }}
      >
        SAVE RESULT
      </button>
    </div>
  );
}

function deriveInitialValues(resultType: ResultType, session: WorkoutSession | null, existingLog: WorkoutLog | null) {
  if (existingLog) {
    if (existingLog.resultType === "time_seconds") {
      const { m, s } = splitMMSS(Number(existingLog.resultValue) || 0);
      return { minutes: m, seconds: s, rounds: 0, reps: 0 };
    }
    const [r, x] = existingLog.resultValue.split("+").map((v) => Number(v) || 0);
    return { minutes: 0, seconds: 0, rounds: r ?? 0, reps: x ?? 0 };
  }

  if (session) {
    if (resultType === "time_seconds") {
      const total = session.finishedAtSeconds ?? session.roundSplits.at(-1)?.atSeconds ?? 0;
      const { m, s } = splitMMSS(total);
      return { minutes: m, seconds: s, rounds: 0, reps: 0 };
    }
    return { minutes: 0, seconds: 0, rounds: session.roundSplits.length, reps: 0 };
  }

  return { minutes: 0, seconds: 0, rounds: 0, reps: 0 };
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex-1 rounded border p-4 text-center" style={inputStyle}>
      <p className="font-mono text-[11px] text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
      <div className="mt-2 flex items-center justify-center gap-4">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border text-sm"
          style={{ borderColor: "var(--border)", color: "var(--ink-faint)" }}
        >
          –
        </button>
        <span className="min-w-[2rem] font-mono text-2xl font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border text-sm"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
        >
          +
        </button>
      </div>
    </div>
  );
}
