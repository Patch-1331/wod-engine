import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResultType, WorkoutLog, WorkoutSession, Wod } from "@wod-engine/shared";
import { api } from "../lib/api";
import { MinusIcon, PlusIcon } from "../components/StepperIcons";

function resultTypeForWod(wodType: string): ResultType {
  return wodType === "for_time" ? "time_seconds" : "rounds_reps";
}

function splitMMSS(totalSeconds: number) {
  return { m: Math.floor(totalSeconds / 60), s: totalSeconds % 60 };
}

const inputStyle = { borderColor: "var(--border)", background: "var(--panel-2)", color: "var(--ink)" };

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
      <button onClick={() => navigate(-1)} aria-label="Back" className="mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
          <path d="M14.5 5 8 12l6.5 7" />
        </svg>
      </button>

      <h1 className="text-4xl font-extrabold uppercase leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
        {wod.name}
      </h1>
      <p className="mt-1 text-xs font-semibold tracking-[0.1em] text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        {wod.type.toUpperCase()} · {wod.timeCapMinutes} MIN
      </p>

      {session && !existingLog && (
        <div
          className="mt-4 flex items-center gap-2 px-3 py-2 text-xs"
          style={{ border: "1px solid var(--glow)", background: "var(--glow-tint)", color: "var(--glow)", fontFamily: "var(--font-mono)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--glow)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Synced from your timer — review and save
        </div>
      )}

      <p className="mt-6 text-xs font-semibold tracking-[0.14em] text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        RESULT
      </p>

      {resultType === "time_seconds" ? (
        <div className="mt-3 flex items-center gap-3">
          <input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(Math.max(0, Number(e.target.value)))}
            className="w-20 border px-3 py-2 text-center text-xl"
            style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
          />
          <span className="text-xl" style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => setSeconds(Math.min(59, Math.max(0, Number(e.target.value))))}
            className="w-20 border px-3 py-2 text-center text-xl"
            style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
          />
        </div>
      ) : (
        <div className="mt-3 flex gap-3">
          <Stepper label="ROUNDS" value={rounds} onChange={setRounds} />
          <Stepper label="+ REPS" value={reps} onChange={setReps} />
        </div>
      )}

      <p className="mt-6 text-xs font-semibold tracking-[0.14em] text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        EFFORT (RPE)
      </p>
      <div className="mt-3 grid grid-cols-10 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setRpe(n)}
            className="py-2 text-sm font-semibold"
            style={
              rpe === n
                ? { background: "var(--glow)", color: "var(--bg)", fontFamily: "var(--font-mono)" }
                : { background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }
            }
          >
            {n}
          </button>
        ))}
      </div>

      <p className="mt-6 text-xs font-semibold tracking-[0.14em] text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        NOTES
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="How did it feel?"
        className="mt-3 w-full border p-3 text-sm"
        style={inputStyle}
      />

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="mt-6 w-full py-4 text-sm font-bold tracking-[0.14em]"
        style={{ background: "var(--glow)", color: "var(--bg)", fontFamily: "var(--font-mono)" }}
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
    <div className="flex-1 border p-4 text-center" style={inputStyle}>
      <p className="text-[11px] font-semibold tracking-[0.1em] text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
      <div className="mt-2 flex items-center justify-center gap-4">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border"
          style={{ borderColor: "var(--border)", color: "var(--ink-faint)" }}
        >
          <MinusIcon color="var(--ink-faint)" />
        </button>
        <span
          className="min-w-[2rem] text-2xl font-bold"
          style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--glow)", textShadow: "0 0 8px var(--glow-tint)" }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border"
          style={{ borderColor: "var(--glow)", color: "var(--glow)" }}
        >
          <PlusIcon color="var(--glow)" />
        </button>
      </div>
    </div>
  );
}
