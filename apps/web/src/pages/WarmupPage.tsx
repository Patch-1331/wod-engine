import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function WarmupPage() {
  const { assignmentId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: today, isLoading } = useQuery({ queryKey: ["today"], queryFn: api.today });
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const proceedMutation = useMutation({
    mutationFn: async (allChecked: boolean) => {
      await api.startSession(assignmentId);
      if (allChecked) await api.completeWarmup(assignmentId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["today"] });
      navigate(`/workout/${assignmentId}`);
    },
  });

  const warmup = today?.warmup ?? [];

  // Nothing to show — proceed straight to the timer instead of an empty screen.
  useEffect(() => {
    if (today && warmup.length === 0) {
      navigate(`/workout/${assignmentId}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, warmup.length]);

  if (isLoading || !today || warmup.length === 0) {
    return <p className="p-6 text-[var(--ink-faint)]">Loading…</p>;
  }

  const allChecked = checked.size === warmup.length;

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col p-6" style={{ background: "var(--bg)" }}>
      <h1 className="text-3xl font-extrabold uppercase leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
        Warm-up
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-faint)]">Check off each item, then start the clock.</p>

      <div className="mt-5" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {warmup.map((item) => {
            const isChecked = checked.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                style={{ borderColor: "var(--border)" }}
              >
                <CheckboxMark checked={isChecked} />
                <span
                  className="font-semibold tracking-wide"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: isChecked ? "var(--ink-faint)" : "var(--ink-soft)",
                    textDecoration: isChecked ? "line-through" : "none",
                  }}
                >
                  {item.name.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={() => proceedMutation.mutate(allChecked)}
          disabled={proceedMutation.isPending}
          className="flex w-full items-center justify-center gap-3 py-4 text-sm font-bold tracking-[0.14em]"
          style={{ fontFamily: "var(--font-mono)", background: "var(--glow)", color: "var(--bg)" }}
        >
          START WORKOUT
        </button>
        <button
          onClick={() => proceedMutation.mutate(false)}
          disabled={proceedMutation.isPending}
          className="mt-3 w-full text-center text-xs font-semibold tracking-[0.08em] text-[var(--ink-faint)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          SKIP WARM-UP
        </button>
      </div>
    </div>
  );
}

function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm"
      style={{
        border: `1.5px solid ${checked ? "var(--glow)" : "var(--border)"}`,
        background: checked ? "var(--glow-tint)" : "transparent",
      }}
    >
      {checked && (
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--glow)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </span>
  );
}
