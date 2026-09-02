# WOD Engine — plan

A daily bodyweight workout generator and training log. Local-first web app
for v1, architected to grow into hosted web, iOS, and Android without a
rewrite.

## Scope (v1)

**In:** curated + generated bodyweight WOD library; a 5-day/week,
30-minute-cap scheduler; an in-workout stopwatch + tap-to-log round
tracker (AMRAP/For Time) with sound + vibration cues; logging results
pre-filled from the tracked session; history and PRs. Runs entirely on
localhost, SQLite as the database.

**Out (for now):** accounts/auth, hosted deployment, weighted/equipment-
heavy movements, and iOS/Android apps. See the GitHub Project (linked
below) for what's since moved from "out" to active work, like the
program-editor UI and EMOM/Tabata's auto-advancing interval timer.

## Program design

Two sources feed the scheduler: a curated library of benchmark WODs
adapted to stay bar-and-bodyweight-only, and a template generator that
assembles WODs from the exercise pool. Scheduling rules: max 5 days/week,
every WOD fits a 30-minute cap, the dominant movement pattern has a
5–7 day cooldown before repeating, formats (AMRAP/For Time/EMOM/Tabata)
roughly alternate, and every pull-up-bar movement has a documented
no-equipment substitute.

See [`apps/api/prisma/seed.ts`](../apps/api/prisma/seed.ts) for the full
seeded exercise pool (24 movements) and WOD library (11 WODs).

## Domain model

| Entity | Key fields | Purpose |
|---|---|---|
| `Exercise` | pattern, needsBar, scalable, altExerciseId | The movement pool; `altExerciseId` is the no-equipment substitute. |
| `Wod` | type, timeCapMinutes, movements, isNamed, dominantPattern | A reusable workout definition. |
| `ScheduleRule` | maxDaysPerWeek, patternCooldownDays | Config the scheduler reads. |
| `DailyAssignment` | date, wodId, status | "Today's WOD" — scheduled → in_progress → completed. |
| `WorkoutSession` | startedAt, capSeconds, roundSplits, status | The live timer's state, autosaved on every round tap. |
| `WorkoutLog` | resultType, resultValue, rpe, notes | What actually happened — pre-filled from the finished session. |
| `User` | id | v1 stub; unlocks multi-user/auth later without a migration. |

## Architecture

TypeScript everywhere, npm workspaces monorepo — see
[ADR 0001](adr/0001-tech-stack.md).

```
wod-engine/
  apps/
    api/          NestJS server, Prisma schema + seed, scheduler/generator logic
    web/          React + Vite + Tailwind client
  packages/
    shared/       Zod schemas — DTOs shared by web now, mobile later
  docs/           This plan, ADRs
```

## Roadmap

Tracked as features/stories on the
[WOD Engine GitHub Project](https://github.com/users/Patch-1331/projects/1) —
that board is the source of truth for what's shipped, in progress, and
planned. This doc stays high-level (stack, domain model, architecture)
and doesn't try to mirror it.

## Design references

Static mockups of the core loop (Today → Start Workout → Log Result →
History/Stats) were drafted before this scaffold — ask in the project
chat history for the current link, since design canvases live outside
this repo.
