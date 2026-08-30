import { PrismaClient } from "@prisma/client";
import { progressionLine } from "@wod-engine/shared";

const prisma = new PrismaClient();

type ExerciseSeed = {
  name: string;
  pattern: string;
  needsBar?: boolean;
  scalable?: boolean;
  alt?: string; // name of the no-equipment substitute
  // Progression tracking (Feature #2) — line groups exercises into an
  // ordered chain; rung is this exercise's 0-indexed position in it. See
  // the "Scaling the Ladder" design doc for why these 8 lines exist instead
  // of tracking progress per `pattern`.
  line?: string;
  rung?: number;
};

const exercises: ExerciseSeed[] = [
  // Push · Horizontal
  { name: "Knee push-up", pattern: "push", line: "push_horizontal", rung: 0 },
  { name: "Push-up", pattern: "push", alt: "Knee push-up", line: "push_horizontal", rung: 1 },
  { name: "Diamond push-up", pattern: "push", line: "push_horizontal", rung: 2 },
  { name: "Archer push-up", pattern: "push", line: "push_horizontal", rung: 3 },

  // Push · Vertical
  { name: "Incline pike push-up", pattern: "push", line: "push_vertical", rung: 0 },
  { name: "Pike push-up", pattern: "push", scalable: true, alt: "Incline pike push-up", line: "push_vertical", rung: 1 },
  { name: "Handstand push-up", pattern: "push", scalable: true, alt: "Pike push-up", line: "push_vertical", rung: 2 },

  // Pull
  { name: "Supermans + reverse snow angels", pattern: "pull", line: "pull", rung: 0 },
  { name: "Negative pull-up", pattern: "pull", needsBar: true, alt: "Supermans + reverse snow angels", line: "pull", rung: 1 },
  { name: "Chin-up", pattern: "pull", needsBar: true, alt: "Supermans + reverse snow angels", line: "pull", rung: 2 },
  { name: "Pull-up", pattern: "pull", needsBar: true, alt: "Supermans + reverse snow angels", line: "pull", rung: 3 },

  // Squat
  { name: "Air squat", pattern: "squat", line: "squat", rung: 0 },
  { name: "Reverse lunge", pattern: "squat", line: "squat", rung: 1 },
  { name: "Assisted pistol", pattern: "squat", line: "squat", rung: 2 },
  { name: "Pistol squat", pattern: "squat", scalable: true, alt: "Assisted pistol", line: "squat", rung: 3 },
  // Siblings kept in the pool but not on the main squat line
  { name: "Jump squat", pattern: "squat", alt: "Air squat" },
  { name: "Walking lunge", pattern: "squat" },

  // Hinge
  { name: "Glute bridge", pattern: "hinge", line: "hinge", rung: 0 },
  { name: "Single-leg glute bridge", pattern: "hinge", alt: "Glute bridge", line: "hinge", rung: 1 },
  { name: "Superman", pattern: "hinge", line: "hinge", rung: 2 },
  { name: "Single-leg superman", pattern: "hinge", line: "hinge", rung: 3 },
  { name: "Broad jump", pattern: "hinge" },

  // Core · Dynamic (leg raises) — Hanging knee raise / Toes-to-bar were
  // previously tagged `pattern: pull` since they use the bar; they're
  // leg-raise work, not pulling, so they move to `core` here.
  { name: "Tuck-up", pattern: "core", line: "core_dynamic", rung: 0 },
  { name: "V-up", pattern: "core", alt: "Tuck-up", line: "core_dynamic", rung: 1 },
  { name: "Lying leg raise", pattern: "core", line: "core_dynamic", rung: 2 },
  { name: "Hanging knee raise", pattern: "core", needsBar: true, alt: "Lying leg raise", line: "core_dynamic", rung: 3 },
  { name: "Toes-to-bar", pattern: "core", needsBar: true, alt: "V-up", line: "core_dynamic", rung: 4 },
  { name: "Sit-up", pattern: "core" },

  // Core · Anti-extension
  { name: "Knee plank", pattern: "core", line: "core_hold", rung: 0 },
  { name: "Plank hold", pattern: "core", alt: "Knee plank", line: "core_hold", rung: 1 },
  { name: "Long-lever plank", pattern: "core", line: "core_hold", rung: 2 },

  // Core · Anti-rotation
  { name: "Knee side plank", pattern: "core", line: "core_side", rung: 0 },
  { name: "Side plank", pattern: "core", alt: "Knee side plank", line: "core_side", rung: 1 },

  // Core · not yet on a tracked line
  { name: "Hollow hold", pattern: "core", alt: "Tucked hollow hold" },
  { name: "Tucked hollow hold", pattern: "core" },

  // Cardio — not part of a progression line
  { name: "Burpee", pattern: "cardio", alt: "Squat thrust" },
  { name: "Squat thrust", pattern: "cardio" },
  { name: "Mountain climber", pattern: "cardio" },
  { name: "High knees", pattern: "cardio" },
];

type WodSeed = {
  name: string;
  type: "amrap" | "for_time" | "emom" | "tabata";
  timeCapMinutes: number;
  rounds: number | null;
  isNamed: boolean;
  dominantPattern: string;
  movements: { exercise: string; reps: number }[];
};

const wods: WodSeed[] = [
  {
    name: "Cindy",
    type: "amrap",
    timeCapMinutes: 20,
    rounds: null,
    isNamed: true,
    dominantPattern: "pull",
    movements: [
      { exercise: "Pull-up", reps: 5 },
      { exercise: "Push-up", reps: 10 },
      { exercise: "Air squat", reps: 15 },
    ],
  },
  {
    name: "Angie",
    type: "for_time",
    timeCapMinutes: 30,
    rounds: 1,
    isNamed: true,
    dominantPattern: "pull",
    movements: [
      { exercise: "Pull-up", reps: 75 },
      { exercise: "Push-up", reps: 75 },
      { exercise: "Sit-up", reps: 75 },
      { exercise: "Air squat", reps: 75 },
    ],
  },
  {
    name: "Murph, Home Cap",
    type: "for_time",
    timeCapMinutes: 30,
    rounds: 1,
    isNamed: true,
    dominantPattern: "pull",
    movements: [
      { exercise: "Pull-up", reps: 50 },
      { exercise: "Push-up", reps: 100 },
      { exercise: "Air squat", reps: 150 },
    ],
  },
  {
    name: "Ten to One",
    type: "for_time",
    timeCapMinutes: 20,
    rounds: null,
    isNamed: false,
    dominantPattern: "pull",
    movements: [
      { exercise: "Pull-up", reps: 55 }, // 10+9+...+1
      { exercise: "Burpee", reps: 55 },
    ],
  },
  {
    name: "Fran's Cousin",
    type: "for_time",
    timeCapMinutes: 10,
    rounds: null,
    isNamed: false,
    dominantPattern: "push",
    movements: [
      { exercise: "Push-up", reps: 45 }, // 21+15+9
      { exercise: "Jump squat", reps: 45 },
    ],
  },
  {
    name: "Rung by Rung",
    type: "amrap",
    timeCapMinutes: 15,
    rounds: null,
    isNamed: false,
    dominantPattern: "pull",
    movements: [
      { exercise: "Pull-up", reps: 3 },
      { exercise: "Hanging knee raise", reps: 6 },
      { exercise: "Air squat", reps: 9 },
    ],
  },
  {
    name: "Core Cindy",
    type: "amrap",
    timeCapMinutes: 12,
    rounds: null,
    isNamed: false,
    dominantPattern: "core",
    movements: [
      { exercise: "Sit-up", reps: 10 },
      { exercise: "Mountain climber", reps: 20 },
      { exercise: "Plank hold", reps: 1 },
    ],
  },
  {
    name: "Chalk Line",
    type: "for_time",
    timeCapMinutes: 15,
    rounds: 5,
    isNamed: false,
    dominantPattern: "cardio",
    movements: [
      { exercise: "Burpee", reps: 10 },
      { exercise: "Walking lunge", reps: 15 },
      { exercise: "Mountain climber", reps: 20 },
    ],
  },
  {
    name: "Bar Ladder",
    type: "emom",
    timeCapMinutes: 12,
    rounds: 12,
    isNamed: false,
    dominantPattern: "pull",
    movements: [
      { exercise: "Burpee", reps: 8 },
      { exercise: "Pull-up", reps: 1 }, // max effort per interval
    ],
  },
  {
    name: "Even Odd",
    type: "emom",
    timeCapMinutes: 16,
    rounds: 16,
    isNamed: false,
    dominantPattern: "push",
    // True to the name: even minutes push, odd minutes pull — exactly two
    // movements alternating, not a three-way rotation.
    movements: [
      { exercise: "Push-up", reps: 12 },
      { exercise: "Pull-up", reps: 8 },
    ],
  },
  {
    name: "Tabata Trio",
    type: "tabata",
    timeCapMinutes: 14,
    rounds: 24, // 8 rounds x 3 movements
    isNamed: false,
    dominantPattern: "cardio",
    movements: [
      { exercise: "Burpee", reps: 1 },
      { exercise: "Push-up", reps: 1 },
      { exercise: "Air squat", reps: 1 },
    ],
  },
];

async function main() {
  console.log("Seeding exercises...");
  const idByName = new Map<string, string>();

  for (const e of exercises) {
    const row = await prisma.exercise.upsert({
      where: { name: e.name },
      update: {
        pattern: e.pattern,
        needsBar: e.needsBar ?? false,
        scalable: e.scalable ?? false,
        line: e.line ?? null,
        rung: e.rung ?? null,
      },
      create: {
        name: e.name,
        pattern: e.pattern,
        needsBar: e.needsBar ?? false,
        scalable: e.scalable ?? false,
        line: e.line ?? null,
        rung: e.rung ?? null,
      },
    });
    idByName.set(e.name, row.id);
  }

  for (const e of exercises) {
    if (!e.alt) continue;
    const altId = idByName.get(e.alt);
    if (!altId) throw new Error(`Unknown alt exercise "${e.alt}" for "${e.name}"`);
    await prisma.exercise.update({
      where: { id: idByName.get(e.name)! },
      data: { altExerciseId: altId },
    });
  }

  console.log("Seeding WOD library...");
  for (const w of wods) {
    const existing = await prisma.wod.findUnique({ where: { name: w.name } });
    if (existing) {
      await prisma.wodMovement.deleteMany({ where: { wodId: existing.id } });
    }

    await prisma.wod.upsert({
      where: { name: w.name },
      update: {
        type: w.type,
        timeCapMinutes: w.timeCapMinutes,
        rounds: w.rounds,
        isNamed: w.isNamed,
        dominantPattern: w.dominantPattern,
        movements: {
          create: w.movements.map((m, i) => ({
            reps: m.reps,
            order: i,
            exercise: { connect: { id: idByName.get(m.exercise)! } },
          })),
        },
      },
      create: {
        name: w.name,
        type: w.type,
        timeCapMinutes: w.timeCapMinutes,
        rounds: w.rounds,
        isNamed: w.isNamed,
        dominantPattern: w.dominantPattern,
        movements: {
          create: w.movements.map((m, i) => ({
            reps: m.reps,
            order: i,
            exercise: { connect: { id: idByName.get(m.exercise)! } },
          })),
        },
      },
    });
  }

  console.log("Seeding schedule rule...");
  const rule = await prisma.scheduleRule.findFirst();
  if (!rule) {
    await prisma.scheduleRule.create({
      data: { maxDaysPerWeek: 5, patternCooldownDays: 5 },
    });
  }

  console.log("Seeding skill levels...");
  for (const line of progressionLine.options) {
    // Upsert with a no-op update so re-seeding never resets real progress.
    await prisma.skillLevel.upsert({
      where: { line },
      update: {},
      create: { line, rung: 0 },
    });
  }

  console.log(`Done: ${exercises.length} exercises, ${wods.length} WODs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
