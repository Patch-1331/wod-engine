import type {
  LogResultRequest,
  RoundSplit,
  ScheduleCap,
  SetRoundSplitRequest,
  SetSkillLevelRequest,
  SkillLevel,
  TodayResponse,
  WorkoutLog,
  WorkoutLogListItem,
  WorkoutSession,
} from "@wod-engine/shared";

const API_BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function postJson<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function patchJson<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type ApiExercise = {
  id: string;
  name: string;
  pattern: string;
  needsBar: boolean;
  scalable: boolean;
  unit: "reps" | "seconds";
  line: string | null;
  rung: number | null;
  altExercise: { id: string; name: string } | null;
};

export const api = {
  exercises: () => request<ApiExercise[]>("/exercises"),
  today: () => request<TodayResponse>("/today"),
  scheduleRule: () => request<ScheduleCap>("/schedule-rule"),
  skipToday: () => postJson<TodayResponse>("/today/skip"),

  startSession: (assignmentId: string) =>
    postJson<WorkoutSession>(`/assignments/${assignmentId}/session`),
  getSession: (assignmentId: string) =>
    request<WorkoutSession | null>(`/assignments/${assignmentId}/session`),
  logRound: (assignmentId: string, round: RoundSplit) =>
    postJson<WorkoutSession>(`/assignments/${assignmentId}/session/rounds`, round),
  finishSession: (assignmentId: string) =>
    postJson<WorkoutSession>(`/assignments/${assignmentId}/session/finish`),
  cancelSession: (assignmentId: string) =>
    request<void>(`/assignments/${assignmentId}/session`, { method: "DELETE" }),
  setRoundSplit: (assignmentId: string, body: SetRoundSplitRequest) =>
    postJson<WorkoutSession>(`/assignments/${assignmentId}/session/split`, body),

  saveLog: (assignmentId: string, body: LogResultRequest) =>
    postJson<WorkoutLog>(`/assignments/${assignmentId}/log`, body),
  getLog: (assignmentId: string) => request<WorkoutLog | null>(`/assignments/${assignmentId}/log`),
  logs: () => request<WorkoutLogListItem[]>("/logs"),

  skillLevels: () => request<SkillLevel[]>("/skill-levels"),
  setSkillLevel: (line: string, body: SetSkillLevelRequest) =>
    patchJson<SkillLevel>(`/skill-levels/${line}`, body),
};
