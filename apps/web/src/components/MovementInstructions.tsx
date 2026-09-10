/**
 * The disclosure for a movement's instructions (Exercise.instructions).
 *
 * Two pieces rather than one row component, because the surfaces that show a
 * movement don't share a row: Today lists name + count, the warm-up and
 * cool-down screens list a checkbox that has to keep toggling on tap. Both
 * own their row and their open/closed state; these just keep the caret and
 * the prose looking the same wherever they land.
 */

/** Caret for a row that can expand — points right when closed, down when open. */
export function InstructionsCaret({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink-faint)"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={12}
      height={12}
      aria-hidden="true"
      style={{
        transform: open ? "rotate(90deg)" : "none",
        transition: "transform 120ms ease-out",
        flexShrink: 0,
      }}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * The prose itself. Rendered only when a row is open, and only ever for a
 * movement that has copy — a null `instructions` means the row doesn't
 * expand at all rather than opening onto an empty panel.
 */
export function InstructionsPanel({ id, text }: { id: string; text: string }) {
  return (
    <div
      id={id}
      className="px-4 pb-3.5 pt-0.5"
      style={{ background: "var(--panel-2)" }}
    >
      <p
        className="border-l-2 pl-3 text-[13px] leading-relaxed"
        style={{ borderColor: "var(--glow-dim)", color: "var(--ink-soft)" }}
      >
        {text}
      </p>
    </div>
  );
}
