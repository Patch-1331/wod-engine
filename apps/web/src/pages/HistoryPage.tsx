export function HistoryPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold uppercase" style={{ fontFamily: "var(--font-display)" }}>
        History
      </h1>
      <p className="mt-3 text-[var(--ink-faint)]">
        Logged workouts will show up here once the log endpoint is wired up.
      </p>
    </div>
  );
}
