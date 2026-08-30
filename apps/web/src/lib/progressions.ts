import type { SkillLevel } from "@wod-engine/shared";
import type { ApiExercise } from "./api";

const LINE_LABELS: Record<string, string> = {
  push_horizontal: "Push · Horizontal",
  push_vertical: "Push · Vertical",
  pull: "Pull",
  squat: "Squat",
  hinge: "Hinge",
  core_dynamic: "Core · Dynamic",
  core_hold: "Core · Anti-extension",
  core_side: "Core · Anti-rotation",
};

export function lineLabel(line: string): string {
  return LINE_LABELS[line] ?? line;
}

export type LadderRung = {
  rung: number;
  name: string;
  status: "done" | "current" | "locked";
};

export type Ladder = {
  line: string;
  rungs: LadderRung[];
  /** True when the automatic advancement rule (#7) moved this line up today. */
  justAdvancedToday: boolean;
};

/** One ladder per SkillLevel row, its rungs sourced from every exercise seeded on that line. */
export function buildLadders(
  exercises: ApiExercise[],
  skillLevels: SkillLevel[],
  todayIsoDate: string,
): Ladder[] {
  const exercisesByLine = new Map<string, ApiExercise[]>();
  for (const e of exercises) {
    if (!e.line || e.rung === null) continue;
    const list = exercisesByLine.get(e.line) ?? [];
    list.push(e);
    exercisesByLine.set(e.line, list);
  }

  return skillLevels
    .slice()
    .sort((a, b) => a.line.localeCompare(b.line))
    .map((skill) => {
      const lineExercises = (exercisesByLine.get(skill.line) ?? [])
        .slice()
        .sort((a, b) => (a.rung ?? 0) - (b.rung ?? 0));

      const rungs: LadderRung[] = lineExercises.map((e) => {
        const rung = e.rung ?? 0;
        const status: LadderRung["status"] =
          rung < skill.rung ? "done" : rung === skill.rung ? "current" : "locked";
        return { rung, name: e.name, status };
      });

      return {
        line: skill.line,
        rungs,
        justAdvancedToday:
          skill.lastChange === "advanced" && skill.updatedAt.slice(0, 10) === todayIsoDate,
      };
    });
}
