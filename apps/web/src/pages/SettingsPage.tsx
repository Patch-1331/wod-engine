import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading, error } = useQuery({ queryKey: ["settings"], queryFn: api.settings });

  const toggleMutation = useMutation({
    mutationFn: (warmupCooldownEnabled: boolean) => api.updateSettings({ warmupCooldownEnabled }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["settings"], updated);
      await queryClient.invalidateQueries({ queryKey: ["today"] });
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
        Settings
      </h1>

      {isLoading && <p className="mt-3 text-[var(--ink-faint)]">Loading…</p>}
      {error && <p className="mt-3 text-[var(--danger)]">Couldn't reach the API — is it running on :3001?</p>}

      {settings && (
        <div className="mt-5 flex items-center justify-between gap-4 p-4" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
          <div>
            <p className="font-semibold uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
              Warm-up / cool-down
            </p>
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              Show a short checklist before and after each workout.
            </p>
          </div>
          <ToggleSwitch
            checked={settings.warmupCooldownEnabled}
            disabled={toggleMutation.isPending}
            onChange={(checked) => toggleMutation.mutate(checked)}
          />
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50"
      style={{
        background: checked ? "var(--glow)" : "var(--panel-2)",
        border: "1px solid var(--border)",
        boxShadow: checked ? "0 0 8px var(--glow-tint)" : "none",
      }}
    >
      <span
        className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}
