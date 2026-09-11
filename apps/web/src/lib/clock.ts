/** m:ss — the workout clock's format everywhere it's shown. */
export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Whole seconds between a session's `startedAt` and a `Date.now()` — the raw
 * elapsed time both workout screens run on. Pass it through `capStateAt` for
 * the clock the athlete actually sees, which stops at the time cap.
 */
export function elapsedSecondsSince(startedAt: string, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - new Date(startedAt).getTime()) / 1000));
}
