import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ExerciseSeed = {
  name: string;
  pattern: string;
  needsBar?: boolean;
  scalable?: boolean;
  alt?: string; // name of the no-equipment substitute
};

const exercises: ExerciseSeed[] = [
  { name: "Push-up", pattern: "push", alt: "Knee push-up" },
  { name: "Knee push-up", pattern: "push" },
  { name: "Pike push-up", pattern: "push", scalable: true, alt: "Incline pike push-up" },
  { name: "Incline pike push-up", pattern: "push" },
  { name: "Handstand push-up", pattern: "push", scalable: true, alt: "Pike push-up" },
  { name: "Pull-up", pattern: "pull", needsBar: true, alt: "Supermans + reverse snow angels" },
  { name: "Chin-up", pattern: "pull", needsBar: true, alt: "Supermans + reverse snow angels" },
  { name: "Supermans + reverse snow angels", pattern: "pull" },
  { name: "Hanging knee raise", pattern: "pull", needsBar: true, alt: "Lying leg raise" },
  { name: "Lying leg raise", pattern: "core" },
  { name: "Toes-to-bar", pattern: "pull", needsBar: true, alt: "V-up" },
  { name: "Air squat", pattern: "squat" },
  { name: "Jump squat", pattern: "squat", alt: "Air squat" },
  { name: "Walking lunge", pattern: "squat" },
  { name: "Reverse lunge", pattern: "squat" },
  { name: "Pistol squat", pattern: "squat", scalable: true, alt: "Assisted pistol" },
  { name: "Assisted pistol", pattern: "squat" },
  { name: "Glute bridge", pattern: "hinge" },
  { name: "Single-leg glute bridge", pattern: "hinge", alt: "Glute bridge" },
  { name: "Superman", pattern: "hinge" },
  { name: "Broad jump", pattern: "hinge" },
  { name: "Sit-up", pattern: "core" },
  { name: "V-up", pattern: "core", alt: "Tuck-up" },
  { name: "Tuck-up", pattern: "core" },
  { name: "Plank hold", pattern: "core", alt: "Knee plank" },
  { name: "Knee plank", pattern: "core" },
  { name: "Side plank", pattern: "core", alt: "Knee side plank" },
  { name: "Knee side plank", pattern: "core" },
  { name: "Hollow hold", pattern: "core", alt: "Tucked hollow hold" },
  { name: "Tucked hollow hold", pattern: "core" },
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
      update: { pattern: e.pattern, needsBar: e.needsBar ?? false, scalable: e.scalable ?? false },
      create: { name: e.name, pattern: e.pattern, needsBar: e.needsBar ?? false, scalable: e.scalable ?? false },
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
