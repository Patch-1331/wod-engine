import type { ProposedRungChange } from "@wod-engine/shared";
import { lineLabel } from "../lib/progressions";

/**
 * The offer to make today's swap permanent (WOD-6).
 *
 * A swap applies to today only, so without this the athlete would re-swap
 * every session forever. The rung moves because of what they actually did —
 * a far better signal than an inference drawn from metcon rounds, and the
 * thing that makes the progression feel like theirs rather than assigned.
 *
 * Deliberately not a modal. The session is already logged and declining
 * changes nothing, so this must never stand between the athlete and the save
 * button — it sits in the page and is ignorable.
 */

export function RungChangeCard({
  proposals,
  onAccept,
  onDismiss,
  isSaving,
}: {
  proposals: ProposedRungChange[];
  onAccept: () => void;
  onDismiss: () => void;
  isSaving: boolean;
}) {
  if (proposals.length === 0) return null;

  // One card however many lines changed. Several prompts stacked down the
  // page would turn a small offer into a form to get through.
  const single = proposals.length === 1 ? proposals[0] : null;

  return (
    <div
      className="mt-4 p-4"
      style={{ border: "1px solid var(--glow)", background: "var(--glow-tint)" }}
    >
      <p
        className="text-[10px] font-semibold tracking-[0.14em]"
        style={{ fontFamily: "var(--font-mono)", color: "var(--glow)" }}
      >
        WHAT YOU TRAINED
      </p>

      {single ? (
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]">
          You did <strong>{single.exerciseName.toLowerCase()}</strong> today. Make
          that your {lineLabel(single.line).toLowerCase()} movement?
        </p>
      ) : (
        <>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]">
            You trained these instead of what was on record. Make them yours?
          </p>
          <ul className="mt-2.5 flex flex-col gap-1">
            {proposals.map((p) => (
              <li
                key={p.line}
                className="flex items-baseline justify-between gap-3 text-[13px]"
                style={{ fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}
              >
                <span className="truncate">{p.exerciseName}</span>
                <span className="shrink-0 text-[11px] tracking-[0.08em] text-[var(--ink-faint)]">
                  {lineLabel(p.line).toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={onAccept}
          disabled={isSaving}
          className="flex-1 py-2.5 text-xs font-bold tracking-[0.14em]"
          style={{ fontFamily: "var(--font-mono)", background: "var(--glow)", color: "var(--bg)" }}
        >
          {proposals.length === 1 ? "YES, MAKE IT MINE" : "YES, MAKE THEM MINE"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="px-2 py-2.5 text-xs font-semibold tracking-[0.08em] text-[var(--ink-faint)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          NOT NOW
        </button>
      </div>
    </div>
  );
}
