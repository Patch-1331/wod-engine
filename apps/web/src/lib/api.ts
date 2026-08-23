const API_BASE = "/api";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
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

export type ApiWodMovement = {
  reps: number;
  order: number;
  exercise: { id: string; name: string };
};

export type ApiWod = {
  id: string;
  name: string;
  type: string;
  timeCapMinutes: number;
  rounds: number | null;
  isNamed: boolean;
  dominantPattern: string;
  movements: ApiWodMovement[];
};

export const api = {
  exercises: () => request<ApiExercise[]>("/exercises"),
  wods: () => request<ApiWod[]>("/wods"),
};
