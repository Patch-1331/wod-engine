import type { TodayResponse } from "@wod-engine/shared";

const API_BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${path}`);
  }
  return res.json();
}

export type ApiExercise = {
  id: string;
  name: string;
  pattern: string;
  needsBar: boolean;
  scalable: boolean;
  altExercise: { id: string; name: string } | null;
};

export const api = {
  exercises: () => request<ApiExercise[]>("/exercises"),
  today: () => request<TodayResponse>("/today"),
  skipToday: () => request<TodayResponse>("/today/skip", { method: "POST" }),
};
