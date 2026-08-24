import { useEffect, useRef } from "react";

/** Keeps the screen from sleeping while `active` is true. Degrades silently if unsupported/refused. */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let released = false;
    navigator.wakeLock
      .request("screen")
      .then((sentinel) => {
        if (released) {
          void sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
      })
      .catch(() => {
        // e.g. low battery, backgrounded tab, unsupported — nothing actionable to do.
      });

    return () => {
      released = true;
      void sentinelRef.current?.release();
      sentinelRef.current = null;
    };
  }, [active]);
}
