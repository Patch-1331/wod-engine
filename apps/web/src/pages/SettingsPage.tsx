import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateSettings } from "@wod-engine/shared";
import { api } from "../lib/api";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading, error } = useQuery({ queryKey: ["settings"], queryFn: api.settings });

  // One mutation for every toggle: the PATCH carries only the switch that was
  // flipped, so the others keep whatever the server has for them.
  const toggleMutation = useMutation({
    mutationFn: (patch: UpdateSettings) => api.updateSettings(patch),
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
        <div className="mt-5 flex flex-col gap-3">
          <SettingRow
            title="Warm-up / cool-down"
            description="Show a short checklist before and after each workout."
            checked={settings.warmupCooldownEnabled}
            pending={toggleMutation.isPending}
            onChange={(warmupCooldownEnabled) => toggleMutation.mutate({ warmupCooldownEnabled })}
          />
          <SettingRow
            title="Stop at the time cap"
            description="End the workout when its time cap runs out. Turn this off to keep the clock running past the cap and finish it yourself."
            checked={settings.autoStopAtCapEnabled}
            pending={toggleMutation.isPending}
            onChange={(autoStopAtCapEnabled) => toggleMutation.mutate({ autoStopAtCapEnabled })}
          />
          {/* A workout already under way keeps the rule it started with, so
              say so rather than leaving the athlete to find out at the cap. */}
          <p className="text-[11px] text-[var(--ink-faint)]">
            A change takes effect on your next workout — one already in progress keeps the setting it started with.
          </p>
        </div>
      )}
    </div>
  );
}

function SettingRow({
  title,
  description,
  checked,
  pending,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  pending: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
      <div>
        <p className="font-semibold uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
          {title}
        </p>
        <p className="mt-1 text-xs text-[var(--ink-faint)]">{description}</p>
      </div>
      <ToggleSwitch checked={checked} disabled={pending} onChange={onChange} />
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
