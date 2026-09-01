// A glowing instrument-panel digit bank — the signature readout of the
// Nixie Laboratory Counter world. Used anywhere the product's real content
// is a live or fixed number: time caps, round counts, streaks, PRs.
export function DigitReadout({
  value,
  label,
  size = "md",
  dim = false,
}: {
  value: string;
  label: string;
  size?: "sm" | "md" | "lg";
  dim?: boolean;
}) {
  const valueSize = size === "lg" ? "text-6xl" : size === "md" ? "text-4xl" : "text-2xl";
  return (
    <div
      className="flex flex-col items-center justify-center gap-1.5 px-3 py-4"
      style={{ background: "var(--panel-2)", border: "1px solid var(--border)" }}
    >
      <span
        className={`${valueSize} font-bold leading-none`}
        style={{
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          color: dim ? "var(--glow-dim)" : "var(--glow)",
          textShadow: dim ? "none" : "0 0 12px var(--glow-tint), 0 0 2px var(--glow)",
        }}
      >
        {value}
      </span>
      <span
        className="text-[10px] font-semibold tracking-[0.14em]"
        style={{ fontFamily: "var(--font-mono)", color: "var(--ink-faint)" }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
}
