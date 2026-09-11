# Programs — design

The app becomes program-based. A **program** decides what each training day
is; the athlete picks one at signup and can change it later. "Just WODs" —
how the app works today — is itself a program, not the absence of one.

Alongside that, one principle changes how progression works:

> **The app decides what you do. You decide how hard it is.**

The scheduler still removes the daily planning burden. What it stops doing
is forming an opinion about the athlete's capability from behind their back.

## Where this leaves the current product doc

`apps/web/PRODUCT.md` principle 1 reads "The app decides so the user doesn't
have to — no daily workout-planning burden." That stays true of
*programming* and stops being true of *level*, so it needs amending rather
than deleting, with the principle above added beside it.

## 1. Program as the unit

### Just WODs is a program

The load-bearing decision. Seed the default WOD behaviour as a `Plan` row and
give every user a `PlanEnrollment` at provisioning, so `getToday` keeps one
path instead of growing an `if (enrolled) … else …` that would spread into
the scheduler, the today response, History and Stats.

### Model

| Entity | Key fields | Purpose |
|---|---|---|
| `Plan` | name, summary, goal, scheduleMode, min/maxDaysPerWeek, defaultDays, minWeeks, maxWeeks, defaultWeeks | The program definition. Shared library content, like `Wod`. |
| `PlanWeek` | planId, order, phase, label | One authored week. `phase` is `intro \| core \| peak`; core weeks are the block that repeats. |
| `PlanSlot` | planWeekId, dayOfWeek, kind, priority, wodId?, prescription fields | One day. `kind` is `rest \| wod_pinned \| wod_generated \| movements`. |
| `PlanEnrollment` | userId, planId, startDate, weeks, status, completedAt | The athlete's run at a program. At most one `active` per user. |

`DailyAssignment` gains `enrollmentId`, `planSlotId` and `planDayIndex`, all
nullable, using the same composite `(id, userId)` foreign key the repo
already uses on `WorkoutSession`/`WorkoutLog` so an assignment can't claim an
enrollment belonging to another user.

Prisma can't express a partial unique index, so one active enrollment per
user needs raw SQL in the migration:

```sql
CREATE UNIQUE INDEX plan_enrollment_one_active_per_user
  ON "PlanEnrollment" ("userId") WHERE status = 'active';
```

Without it, two tabs racing on "Start program" both succeed.

### A day is not always a WOD

`PlanSlot.kind` is the fork:

- `rest` — the program's own rest day.
- `wod_pinned` — a specific WOD, for benchmark re-tests.
- `wod_generated` — constraints (`pattern`, `wodType`, `allowNamed`,
  `maxTimeCapMinutes`) that the existing `pickWod` resolves against the
  library. `allowNamed` defaults **false**: programs mostly program movement,
  not benchmarks.
- `movements` — prescribed movements with sets, reps and rest. **This is the
  shape that doesn't exist today** and it's most of the build (see §3).

Constraint fields are explicit nullable columns rather than jsonb — there are
few, they get filtered on, and the schema reserves jsonb for genuinely open
shapes (`roundSplits`). A CHECK constraint should hold `kind = 'wod_pinned'`
⇒ `wodId` non-null, and null otherwise.

### Filling a `wod_generated` slot

`pickWodForSlot` wraps `pickWod` rather than replacing it: hard-filter the
candidates by the slot's constraints, then let the existing cooldown and
format-alternation preferences work inside whatever survives.

When the filter empties the pool, **never throw** — a program day must always
produce a workout. Relax in this order, re-filtering each time:

`wodType` → `maxTimeCapMinutes` → `allowNamed` → `pattern`

Pattern goes last because the emphasis *is* the program's intent. Return
which constraints were relaxed so it's observable — that signal is how a
library hole gets noticed.

### Fixed vs. flexible schedules

`Plan.scheduleMode` decides whether the cadence screen is an input or a
readout.

- **`flexible`** carries `minDaysPerWeek`/`maxDaysPerWeek` and a default. The
  athlete picks inside that range, which writes the existing
  `ScheduleRule.maxDaysPerWeek` — no new field.
- **`fixed`** carries none of them. The slot layout *is* the schedule, so
  days-per-week is just a count of its non-rest slots. This lets a program
  insist on *spacing*, not merely frequency — heavy pull days wanting 48
  hours between them is Mon/Tue/Thu/Fri, which "4 days a week" can't express.

A CHECK constraint should keep the modes from blurring: `fixed` ⇒ min/max
null; `flexible` ⇒ both non-null.

`PlanSlot.priority` decides which days survive when a flexible program runs
at fewer days than it was authored for — without it, dropping from 5 days to
3 removes whichever days happen to fall last in the week, which could delete
the program's main session.

### Length scales by repeating the core block

`expandPlanWeeks(weeks, chosenWeeks)` returns exactly `chosenWeeks` entries:
intro weeks in order, core weeks cycled to fill, then peak weeks. When
`chosenWeeks` can't hold intro + peak, drop intro first (a beginner ramp is
more skippable than a peak), then peak. It must not throw.

### Date → slot

Keep **lazy** materialization: enrolling writes no assignments, and
`getToday` still creates one row on demand. `resolveSlotForDate` is anchored
to the enrollment start date, not the calendar Monday:

```
dayIndex  = daysBetween(enrollment.startDate, date)
weekIndex = floor(dayIndex / 7)
dayOfWeek = dayIndex % 7
```

Starting a program on a Wednesday then gives you day 1 immediately instead of
a stub half-week. Plan weeks no longer align with `getWeekRange`'s Mon–Sun,
which is fine — the program owns the calendar.

Both functions are pure (repo style: `apps/api/src/plans/*.logic.ts` with
specs alongside, mirroring `scheduler.logic.ts`), so the same code powers a
preview endpoint that renders a program's whole calendar before enrolling,
with no writes.

### Settings while a program is active

| Setting | Behaviour |
|---|---|
| `maxDaysPerWeek` | Written by a flexible program's cadence step. **Overridden** by a fixed program — Settings should show it paused, with the reason, rather than accepting a number that silently does nothing. |
| `patternCooldownDays` | **Soft only** — a preference inside a slot's filtered pool, so a "pull 3x/week" program doesn't starve itself. |
| `warmupCooldownEnabled` | Unchanged. |
| `autoStopAtCapEnabled` | Unchanged, still snapshotted onto the session. |

`isRestDay(assignedDaysThisWeek, maxDaysPerWeek)` isn't consulted on a program
day; the slot's `kind === 'rest'` answers it.

## 2. Athlete-owned progression

`SkillLevel` stays. What changes is **who writes it**.

Today `computeRungChanges` infers capability from rounds completed in a
metcon and silently advances or drops a line. The inference is noisy, and the
drop path means a bad Tuesday quietly makes tomorrow easier without asking.

### Substitution is the write path

Tap a movement on the Today plate before starting → see that line's whole
ladder, plus the movement's `altExerciseId` (the no-equipment substitute,
which exists in the schema today and is currently read only by
`GET /exercises`). Pick one. It applies to **today**, one tap, no modal — the
athlete is about to train, not configure.

### The permanent change is confirmed from something real

If the session was trained at a rung other than the one on record, the
completion screen offers it: *"You did chin-ups today. Make that your pull
movement?"* One tap, dismissible. The rung moves because of what the athlete
actually did — a far better signal than metcon-round inference, and it is
what makes the progression feel like theirs.

### Advancement is demoted, not deleted

`computeRungChanges` stops writing rungs and starts proposing them — "you've
hit 3x8 here three sessions running, ready to try pull-ups?" — offered before
a workout and accepted by swapping. The encouragement survives; the authority
doesn't.

**The drop rule doesn't survive at all.** The app never demotes an athlete;
struggling is answered by swapping down. `HOLD_FLOOR`/`HOLD_FLOOR_SECONDS`
and their branch come out.

`SkillLevel.lastChange` (`advanced | dropped`, powering the Stats banner)
needs revisiting: every change is now athlete-initiated, so the banner
becomes a record of what they did rather than a verdict the app handed down.

### Consequences elsewhere

- **No onboarding calibration.** Everyone starts at rung 0 and fixes it in
  one tap on day one against a real workout — less setup friction than asking
  someone to self-assess in the abstract, and a more honest answer. This is
  also what fixes the rung-0 provisioning problem (see below).
- **`scaleWodToCurrentRung` is untouched.** It reads athlete-authored rungs
  instead of algorithm-authored ones.
- **Programs need this either way.** A `movements` slot saying "5x3 pull" has
  to resolve to a movement, which requires persisted per-line state whatever
  design wins.

### The provisioning problem this replaces

`user-provisioning.service.ts` creates every user at rung 0 on all eight
lines — knee push-ups, supermans, air squats, knee planks. Someone who can
already do ten pull-ups gets weeks of wrong workouts and has to grind up
through the 3x8 rule to escape. Cheap substitution solves this without a
wizard: the first workout is one tap from correct.

## 3. The `movements` day — where the work is

Prescribed movements with sets and reps. This is the part with no existing
machinery:

- **A third runner.** `WorkoutSession` is clock-shaped (`capSeconds`,
  `roundSplits`, `intervalIndex`). A straight-sets session's state is
  "movement 2, set 3 of 5, resting 90s" — neither `RoundTapWorkout` nor
  `IntervalWorkout` fits, and the session model needs non-clock fields.
- **A new log shape.** `WorkoutLog.resultType` is
  `time_seconds | rounds_reps | total_reps`, all metcon scores. A sets/reps
  session has no single scalar result; the honest record is per-set actual
  reps — a `WorkoutSetLog` table, which also feeds the 3x8 threshold its
  native input instead of `totalRepsForMovement`'s inference.
- **History and Stats.** `workoutLogListItemSchema` requires
  `wodName`/`wodType`/`dominantPattern`, so a non-WOD row needs its own
  shape.

### Prescribing by line, not by exercise

A `movements` slot should name the **progression line** ("pull, 5x3"), not a
specific exercise, so one program fits every athlete and resolves through the
rung the athlete owns. Pinning an exercise stays possible for cases where the
specific variation is the point — a nullable `exerciseId` and a nullable
`line` with a CHECK that exactly one is set.

## 4. Content gap

The WOD library is **11 rows: 3 named, 8 unnamed**, covering only pull (3),
push (2), core (1) and cardio (2) among the unnamed ones — **zero squat, zero
hinge**. A `wod_generated` slot asking for squat emphasis has nothing to pick
today, and a 6-week/5-day program drawn from 8 WODs repeats everything ~4x.

This matters much less than it would have under a WOD-only design, because
`movements` days now carry most program content. But it still gates any
program that mixes in conditioning days. Seed ~20 more unnamed WODs covering
squat and hinge across all four formats.

`docs/plan.md` describes "a template generator that assembles WODs from the
exercise pool" — never built; `generateWodForDate` only reads existing rows.
It stays deferred, and has its own blocker: `Wod.name` is `@unique`, so
generated rows need disambiguated names.

## Build order

- **Phase 1 — athlete-owned progression.** Substitution UI on Today, the
  post-session confirm, demote `computeRungChanges`, delete the drop rule.
  Ships standalone value, no new models, and settles the principle before
  programs are built on it.
- **Phase 2 — program foundation.** Prisma models + migration (partial unique
  index, the two CHECKs), shared Zod schemas, `expandPlanWeeks` and
  `resolveSlotForDate` with specs. Nothing user-visible.
- **Phase 3 — programs over WOD days only.** Seed Just WODs as a real `Plan`,
  enroll every user, onboarding (program → days → go), `pickWodForSlot`.
  Exercises all the plumbing without needing the new runner.
- **Phase 4 — the `movements` day.** Third runner, `WorkoutSetLog`, History
  and Stats shapes.
- **Phase 5 — content.** Library expansion, then 2–3 real programs.
- **Later** — program editor (the deferred #20), in-program intensity
  progression, the template generator.

## Open questions

1. **Enrolling mid-day.** If today's assignment exists when the athlete
   switches programs, does the new program claim it? Proposal: replace it
   unless a session has started, else start tomorrow.
2. **Program completion.** Day N+1: return to Just WODs with a completion
   moment, offer a repeat at a longer length, or chain to a follow-on program
   (which would need `Plan.nextPlanId`)?
3. **In-program overload.** Slots can't yet say "same movements, more
   volume". Athlete-owned rungs cover progression at the movement level, so
   this is probably later — but an intensity field on `PlanSlot` is cheaper
   to add now than to migrate in.
4. **`lastChange` semantics** under athlete ownership — what the Stats banner
   becomes when every change is the athlete's own.
5. **Stats scoped to a program.** `enrollmentId` on the assignment makes "how
   did Pull-Up Builder go" free to query — in scope, or follow-on?
