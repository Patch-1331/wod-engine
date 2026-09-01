# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Minimal-equipment training generalists: people who want structured,
CrossFit-inspired daily workouts but train with only bodyweight plus a
pull-up bar (no gym membership, no equipment stack). They're doing this
at home, on the road, or anywhere they don't have access to a gym, and
they want the session to be short (≤30 min) and to fit into a normal
week (≤5 days).

## Product Purpose

WOD Engine generates a scheduled bodyweight workout each day, runs a
live in-workout timer/round tracker for it, and logs the result so the
user can see history and PRs over time. Success is a user who opens the
app, gets today's WOD without having to plan it themselves, completes it
with the tracker, and can see their training history build up.

## Positioning

The differentiator is structured programming, not a random workout
generator: a scheduler enforces real training-program rules (max 5
days/week, a 5–7 day cooldown before a dominant movement pattern
repeats, formats roughly alternating between AMRAP/For Time/EMOM/Tabata,
every bar movement backed by a documented no-equipment substitute) over
a curated + generated WOD library. It behaves like a coach programming
your week, not a list of random exercises.

## Operating Context

Core loop: Today (see/receive the scheduled WOD) → Start Workout (live
stopwatch + tap-to-log round tracker, autosaved every round, sound +
vibration cues, ends at the time cap) → Log Result (pre-filled from the
tracked session, editable) → History/Stats (past sessions, PRs,
progressions).

Runs local-first for v1: SQLite-backed API on localhost, no accounts or
hosted deployment yet (planned later per the roadmap in
`docs/plan.md`). Architected so the same shared schema layer
(`packages/shared`) can support a future React Native mobile client
without a rewrite.

## Capabilities and Constraints

- Bodyweight + pull-up bar only; no weighted/equipment-heavy movements
  in v1.
- Every WOD fits a 30-minute time cap; max 5 scheduled days/week.
- WOD formats: AMRAP, For Time, EMOM, Tabata (EMOM/Tabata's
  auto-advancing interval timer is explicitly out of scope for v1 — see
  `docs/plan.md`).
- No accounts/auth in v1 (single implicit user, `User` is a v1 stub for
  future multi-user support).
- No program-editor UI in v1 — the schedule/library isn't user-editable.
- Terminology: "WOD" (workout of the day), "AMRAP", "For Time", "EMOM",
  "Tabata", "dominant movement pattern", "time cap", "PR".

## Evidence on Hand

- `docs/plan.md` — full v1 scope, domain model, and roadmap.
- `apps/api/prisma/seed.ts` — seeded exercise pool (24 movements) and
  WOD library (11 WODs), the real content the app ships with.
- Static mockups of the core loop (Today → Start Workout → Log Result →
  History/Stats) were drafted before this scaffold, referenced in
  `docs/plan.md` as living outside the repo (design canvas link not
  currently available in this session — treat as unconfirmed, do not
  assume specific visual decisions from it).
- No logo, brand name treatment, or marketing copy exists yet beyond the
  plain "WOD Engine" name; current `index.html` title is still the Vite
  default ("web") and `src/assets` only has placeholder Vite/React
  icons — nothing to preserve as brand evidence there.

## Product Principles

1. The app decides so the user doesn't have to — no daily
   workout-planning burden.
2. Every generated/scheduled WOD must respect real training constraints
   (time cap, weekly frequency, movement-pattern cooldown, no-equipment
   substitutes) — programming integrity over novelty.
3. The live tracker is the moment of truth: it must stay fast, low
   -friction (tap-to-log), and reliable (autosave every round) since
   it's used mid-workout, not at a desk.
4. Logging should never duplicate work already captured live — results
   are pre-filled from the tracked session, not re-entered from scratch.
5. Build local-first now, but don't foreclose the roadmap (hosted
   deploy, mobile) — avoid decisions that would force a rewrite.
