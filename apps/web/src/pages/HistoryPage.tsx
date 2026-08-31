import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatResult } from "../lib/stats";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({ queryKey: ["logs"], queryFn: api.logs });

  if (isLoading) return <p className="p-6 text-[var(--ink-faint)]">Loading history…</p>;
  if (error) return <p className="p-6 text-red-700">Couldn't reach the API — is it running on :3001?</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold uppercase" style={{ fontFamily: "var(--font-display)" }}>
        History
      </h1>

      {!data || data.length === 0 ? (
        <p className="mt-3 text-[var(--ink-faint)]">
          Logged workouts will show up here once you finish and save your first WOD.
        </p>
      ) : (
        <div className="mt-5 divide-y divide-[var(--border)] rounded-md border border-[var(--border)] bg-[var(--surface)]">
          {data.map((log) => (
            <button
              key={log.id}
              onClick={() => navigate(`/log/${log.assignmentId}`)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="font-mono text-[11px] tracking-wide text-[var(--ink-faint)]" style={{ fontFamily: "var(--font-mono)" }}>
                  {formatDate(log.date)}
                </p>
                <p className="truncate font-semibold uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {log.wodName}
                </p>
                {log.notes && <p className="mt-0.5 truncate text-sm text-[var(--ink-soft)]">{log.notes}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {log.rpe !== null && (
                  <span
                    className="rounded px-2 py-1 font-mono text-xs font-semibold"
                    style={{ background: "var(--accent-tint)", color: "var(--accent-strong)", fontFamily: "var(--font-mono)" }}
                  >
                    RPE {log.rpe}
                  </span>
                )}
                <span className="font-mono text-lg font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                  {formatResult(log.resultType, log.resultValue)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
