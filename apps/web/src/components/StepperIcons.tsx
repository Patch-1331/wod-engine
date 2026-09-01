// Authored stroke icons for stepper controls — matches the round-complete
// plus and the log-result checkmark's stroke weight rather than falling
// back to a text glyph.
export function MinusIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" width={14} height={14}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function PlusIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" width={14} height={14}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
