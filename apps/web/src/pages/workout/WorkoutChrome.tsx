import { useState } from "react";

/** The CANCEL / FINISH bar and its confirmation sheet — identical on every workout format. */
export function WorkoutChrome({
  onFinish,
  finishPending,
  onCancel,
  cancelPending,
}: {
  onFinish: () => void;
  finishPending: boolean;
  onCancel: () => void;
  cancelPending: boolean;
}) {
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5">
        <button
          onClick={() => setCancelConfirmOpen(true)}
          disabled={cancelPending}
          className="text-[11px] font-semibold tracking-[0.14em]"
          style={{ color: "var(--danger)", fontFamily: "var(--font-mono)" }}
        >
          CANCEL
        </button>
        <button
          onClick={onFinish}
          disabled={finishPending}
          className="text-sm font-bold tracking-[0.14em]"
          style={{ color: "var(--glow)", fontFamily: "var(--font-mono)" }}
        >
          FINISH
        </button>
      </div>

      {cancelConfirmOpen && (
        <div className="fixed inset-0 z-10 flex items-end justify-center p-5" style={{ background: "rgba(13, 9, 6, 0.7)" }}>
          <div className="w-full max-w-md p-5" style={{ background: "var(--panel)", border: "1px solid var(--danger)" }}>
            <p className="text-sm font-bold tracking-[0.06em]" style={{ color: "var(--ink)" }}>
              Cancel this workout?
            </p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--ink-soft)" }}>
              Your progress won't be saved.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setCancelConfirmOpen(false)}
                className="flex-1 py-3 text-xs font-bold tracking-[0.1em]"
                style={{ fontFamily: "var(--font-mono)", background: "var(--panel-2)", color: "var(--ink-soft)" }}
              >
                KEEP GOING
              </button>
              <button
                onClick={() => {
                  setCancelConfirmOpen(false);
                  onCancel();
                }}
                disabled={cancelPending}
                className="flex-1 py-3 text-xs font-bold tracking-[0.1em]"
                style={{ fontFamily: "var(--font-mono)", background: "var(--danger)", color: "var(--bg)" }}
              >
                CANCEL WORKOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
