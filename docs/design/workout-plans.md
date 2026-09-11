# Workout Plans — design

A **plan** is a multi-week training program the athlete enrolls in. While a
plan is active it decides what each day is — a pinned WOD, a constrained
generated WOD, or a rest day — instead of `pickWod` free-running against the
whole library.

Three decisions frame everything below:

1. **A plan day is a slot that can either pin a WOD or constrain the
   generator.** Pinned slots exist for benchmark re-tests ("Murph on day 1
   and day 28"); constrained slots are the common case, and most of them
   will exclude the named CrossFit WODs.
2. **Length scales by repeating a block.** A plan is authored as optional
   intro weeks + a repeating core block + optional peak weeks. A
   user-chosen length repeats the core block to fit.
3. **The plan owns the calendar.** `maxDaysPerWeek` and
   `patternCooldownDays` stop being rules and become caps/preferences —
   see [Settings while a plan is active](#settings-while-a-plan-is-active).

## Phase 0 is a content problem, not a code problem

The WOD library is **11 rows: 3 named, 8 unnamed**, and the unnamed ones
cover only four patterns:

| pattern | unnamed WODs | formats present |
|---|---|---|
| pull | 3 | for_time, amrap, emom |
| push | 2 | for_time, emom |
| core | 1 | amrap |
| cardio | 2 | for_time, tabata |
| **squat** | **0** | — |
| **hinge** | **0** | — |

A plan slot that says "squat emphasis, not a named WOD" has **zero
candidates today**. And a 6-week / 5-day plan is 30 sessions drawn from 8
unnamed WODs — every WOD repeats ~4x, which reads as a broken plan rather
than a program.

`docs/plan.md` describes "a template generator that assembles WODs from the
exercise pool", but it was never built: `SchedulerService.generateWodForDate`
only reads existing `Wod` rows. So there are two ways to close the gap:

- **Seed more unnamed WODs** (recommended first): ~20 more rows covering
  squat and hinge across all four formats. No schema change, no new code,
  unblocks the whole feature, and the generator later benefits plans for
  free.
- **Build the generator** — a bigger feature in its own right, and it has
  its own blocker: `Wod.name` is `@unique`, so generated rows need
  disambiguated names or that constraint has to go.

**Plans will ship feeling thin until phase 0 lands.** Everything else in
this doc is buildable in parallel, but don't put a plan in front of a user
before the library can fill it.

## Domain model

Four new models. Plans themselves are shared library content (like `Wod`);
only the enrollment is per-user.

| Entity | Key fields | Purpose |
|---|---|---|
| `Plan` | name, slug, summary, goal, minWeeks, maxWeeks, defaultWeeks | The program definition. `defaultWeeks` is the prescribed length; min/max bound what the athlete may choose. |
| `PlanWeek` | planId, order, phase, label | One week of the authored structure. `phase` is `intro \| core \| peak`; core weeks are the repeating block. |
| `PlanSlot` | planWeekId, dayOfWeek, kind, wodId?, pattern?, wodType?, allowNamed, maxTimeCapMinutes? | One day. `kind` is `rest \| pinned \| generated`. |
| `PlanEnrollment` | userId, planId, startDate, weeks, status, completedAt | The athlete's run at a plan. At most one `active` row per user. |

Plus one change to an existing model:

```prisma
model DailyAssignment {
  // ...existing fields
  enrollmentId String?         // null for a free-running (non-plan) day
  enrollment   PlanEnrollment? @relation(fields: [enrollmentId, userId], references: [id, userId])
  planSlotId   String?         // which slot produced this day
  planDayIndex Int?            // 0-based day within the plan, for display and stats
}
```

Carrying the enrollment on the assignment is what lets History say "day 12
of Bar Builder" and lets Stats scope to a plan, without a second join path.
Use the same composite `(id, userId)` foreign key the repo already uses on
`WorkoutSession`/`WorkoutLog`, so an assignment can't claim an enrollment
belonging to another user.

### Constraint fields, not a jsonb blob

`PlanSlot`'s generator constraints are explicit nullable columns rather than
jsonb. There are only four of them, they get filtered on, and the existing
schema reserves jsonb for genuinely open shapes (`roundSplits`). Null means
"unconstrained on this axis"; `allowNamed` defaults **false**, matching the
intent that plans mostly program movement, not benchmarks.

Worth a CHECK constraint per the repo's habit of making drift
unrepresentable: `kind = 'pinned'` requires `wodId` non-null, and
`kind != 'pinned'` requires it null.

### One active enrollment per user

Prisma can't express a partial unique index, so this needs raw SQL in the
migration:

```sql
CREATE UNIQUE INDEX plan_enrollment_one_active_per_user
  ON "PlanEnrollment" ("userId") WHERE status = 'active';
```

Without it, two tabs racing on "Start plan" both succeed and `getToday`
picks arbitrarily.

## How a date becomes a slot

Keep the existing **lazy** materialization: `getToday` still creates one
`DailyAssignment` on demand. Enrolling does *not* write N weeks of rows —
that would be a large write that goes stale the moment anything changes, and
it would fight the current design.

Instead, two pure functions (repo style: no DB, no `Date.now`, no
`Math.random` baked in — `apps/api/src/plans/*.logic.ts` with specs
alongside, mirroring `scheduler.logic.ts`):

**`expandPlanWeeks(weeks: PlanWeek[], chosenWeeks: number): PlanWeek[]`**
Returns exactly `chosenWeeks` entries: intro weeks in order, then core weeks
cycled to fill, then peak weeks. When `chosenWeeks` is too small to hold
intro + peak, drop intro first (a beginner ramp is more skippable than a
peak), then peak. `minWeeks` should be authored so this rarely triggers, but
the function must not throw.

**`resolveSlotForDate(enrollment, expandedWeeks, date): PlanSlot | 'past-end'`**
Anchored to the **enrollment start date**, not the calendar Monday:

```
dayIndex  = daysBetween(enrollment.startDate, date)
weekIndex = floor(dayIndex / 7)
dayOfWeek = dayIndex % 7
```

Start-date anchoring means starting a plan on a Wednesday gives you day 1
immediately, instead of a stub half-week. The cost is that plan weeks no
longer line up with `getWeekRange`'s Mon–Sun — which is fine, because the
plan owns the calendar and `maxDaysPerWeek` isn't being enforced against it.

Both functions are pure, so the same code powers a **preview** endpoint that
renders the whole plan calendar before enrolling, with no writes.

## Filling a generated slot

`pickWodForSlot` wraps the existing `pickWod` rather than replacing it:

1. **Hard filter** the candidate list by the slot's constraints —
   `dominantPattern === slot.pattern`, `type === slot.wodType`,
   `isNamed === false` unless `allowNamed`, `timeCapMinutes <=
   slot.maxTimeCapMinutes`. Nulls skip their axis.
2. **Soft preferences** inside whatever survives: the existing cooldown and
   format-alternation logic in `pickWod`, which already degrades gracefully
   instead of emptying its own pool.
3. **Relaxation ladder** when step 1 empties the pool — a plan day must
   always produce a workout, so never throw. Drop constraints in this order,
   each step re-running step 1:

   `wodType` → `maxTimeCapMinutes` → `allowNamed` → `pattern`

   Pattern goes last because the emphasis *is* the plan's intent; format is
   the most cosmetic. Return which constraints were relaxed alongside the
   WOD so this is observable (log it now, surface it to a plan author later
   — it's the signal that the library has a hole).

Pinned slots skip all of this and resolve straight to their `wodId`.

Skill-level substitution is unaffected: `scaleWodToCurrentRung` runs after
selection either way, so plans compose with the progression ladder for free.

## Settings while a plan is active

| Setting | Behavior under a plan |
|---|---|
| `maxDaysPerWeek` | **Not enforced.** The plan's rest slots are the schedule. Checked once *at enrollment* — if the plan trains more days/week than the user's cap, confirm the override before starting. |
| `patternCooldownDays` | **Soft only.** Passed to `pickWod` as a preference within the slot's filtered pool, so a "pull 3x/week" plan doesn't starve itself. |
| `warmupCooldownEnabled` | Unchanged, still per-user. |
| `autoStopAtCapEnabled` | Unchanged, still per-user and still snapshotted onto the session. |

`isRestDay(assignedDaysThisWeek, maxDaysPerWeek)` is simply not consulted on
a plan day; the slot's `kind === 'rest'` answers it instead.

## API

| Route | Purpose |
|---|---|
| `GET /plans` | The plan library. |
| `GET /plans/:id` | Detail: summary, goal, week-by-week structure, length bounds. |
| `GET /plans/:id/preview?weeks=6&startDate=YYYY-MM-DD` | The expanded slot calendar. Pure — no writes, no assignments. This is what the length picker re-renders against. |
| `GET /enrollment` | Active enrollment + progress, or `204` (the repo's existing "absent" convention). |
| `POST /enrollment` | `{ planId, weeks, startDate }`. `409` if one is already active. |
| `DELETE /enrollment` | Abandon — sets `status = 'abandoned'`, leaves completed days in history. |

`GET /today` gains one nullable field rather than a new shape:

```ts
plan: {
  enrollmentId: string;
  name: string;
  dayIndex: number;      // 0-based
  totalDays: number;
  weekIndex: number;
  weekLabel: string | null;
  slotKind: "rest" | "pinned" | "generated";
} | null
```

Null means free-running, which is every day today — so the web client's
existing paths keep working untouched while the plan UI is built.

Shared Zod schemas: `packages/shared/src/plan.ts` and `plan-enrollment.ts`,
with `planPhase` / `planSlotKind` added to `enums.ts`.

## Web surface

**Don't add a fifth tab.** The TabBar's four tabs (Today / History / Stats /
Settings) are a deliberate shape, and plans are an occasional decision, not a
daily destination. Enter them from Today instead:

- **Today** gains a plan strip above the WOD name — `BAR BUILDER · WK 2 D 3`
  in the mono/engraved treatment — tapping through to the active plan view.
  When no plan is active, the same slot is a quiet "Start a plan" affordance.
- **Rest day copy changes under a plan**: "Planned rest — day 4 of Bar
  Builder", not "the week's 5 training days are already used". The current
  copy would be actively wrong.
- **Plan browser** → **Plan detail** (summary, goal, the week-by-week
  preview, a length stepper bounded by min/max that re-previews live, Start)
  → **Active plan** (progress, the week ahead, abandon).

Routes: `/plans`, `/plans/:planId`, `/plan` (active). Outside `TabbedLayout`,
like the workout flow, or inside it — worth a design pass with the
`impeccable` skill once the data is real.

## Open questions

1. **Enrolling mid-day.** If today's assignment already exists when the user
   enrolls, does the plan claim it? Proposal: replace it if no session has
   started, otherwise the plan starts tomorrow. Needs a decision before the
   enrollment endpoint is written.
2. **Plan completion.** What happens on day N+1 — auto-return to the free
   scheduler with a "plan complete" moment on Today, prompt to repeat at a
   longer length, or auto-enroll in a follow-on plan? Affects whether
   `Plan` needs a `nextPlanId`.
3. **Progressive overload inside a plan.** Slots currently can't say "same
   WOD, more volume". The skill-rung ladder already provides progression, so
   this is probably v2 — but if plans should intensify week over week
   independently of rungs, `PlanSlot` needs an intensity/volume field and
   that's cheaper to add now than to migrate in later.
4. **Stats scoping.** `enrollmentId` on the assignment makes "how did I do
   on Bar Builder" free to query — is that in scope, or a follow-on?
5. **Plan authoring.** Seeded-only to start, same as the WOD library. A plan
   editor is the same unbuilt Program-Editor work already deferred as #20.

## Build order

- **Phase 0 — library.** Seed ~20 unnamed WODs covering squat and hinge
  across all four formats. Blocking; everything else can proceed in
  parallel but nothing should ship ahead of it.
- **Phase 1 — foundation.** Prisma models + migration (including the partial
  unique index and the pinned-slot CHECK), shared Zod schemas, and the two
  pure logic modules with specs. No behavior change, nothing user-visible.
- **Phase 2 — API.** Plans/enrollment endpoints, `pickWodForSlot` with its
  relaxation ladder, and `getToday` consulting the active enrollment.
- **Phase 3 — web.** Plan strip on Today, browser/detail/active screens,
  corrected rest-day copy.
- **Phase 4 — content.** Author 2–3 real plans against the expanded library.
- **v2** — plan editor, in-plan intensity progression, the template
  generator.
