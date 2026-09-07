import type { IntervalConfig, WodType } from "@wod-engine/shared";

export type IntervalPhase = "work" | "rest";

export type IntervalState = {
  /** 0-based interval in progress; equals `intervalCount` once the sequence has run out. */
  index: number;
  phase: IntervalPhase;
  /** Length of the phase currently running. */
  phaseSeconds: number;
  /** Whole seconds left in that phase — what the countdown shows. */
  secondsRemaining: number;
  /** Seconds already spent in it — what the phase progress bar fills to. */
  secondsElapsedInPhase: number;
  isComplete: boolean;
};

/**
 * Where the interval sequence is `secondsSinceStart` after it began.
 *
 * Derived from elapsed time rather than counted down tick by tick, so a
 * backgrounded tab, a throttled timer, or a locked screen all come back to
 * the right interval instead of however many ticks they managed to fire.
 */
export function intervalStateAt(
  secondsSinceStart: number,
  config: IntervalConfig,
): IntervalState {
  const cycleSeconds = config.workSeconds + config.restSeconds;
  const elapsed = Math.max(0, Math.floor(secondsSinceStart));

  if (elapsed >= cycleSeconds * config.intervalCount) {
    // The sequence is spent — hold on the last phase at zero rather than
    // rolling into an interval that doesn't exist.
    const phase: IntervalPhase = config.restSeconds > 0 ? "rest" : "work";
    const phaseSeconds = phase === "rest" ? config.restSeconds : config.workSeconds;
    return {
      index: config.intervalCount,
      phase,
      phaseSeconds,
      secondsRemaining: 0,
      secondsElapsedInPhase: phaseSeconds,
      isComplete: true,
    };
  }

  const index = Math.floor(elapsed / cycleSeconds);
  const secondsIntoCycle = elapsed - index * cycleSeconds;
  const isWork = secondsIntoCycle < config.workSeconds;

  const phaseSeconds = isWork ? config.workSeconds : config.restSeconds;
  const secondsElapsedInPhase = isWork
    ? secondsIntoCycle
    : secondsIntoCycle - config.workSeconds;

  return {
    index,
    phase: isWork ? "work" : "rest",
    phaseSeconds,
    secondsRemaining: phaseSeconds - secondsElapsedInPhase,
    secondsElapsedInPhase,
    isComplete: false,
  };
}

/**
 * Elapsed-seconds mark at which interval 0 began, reconstructed from the
 * interval the session was last known to be on.
 *
 * The timer doesn't start with the session — the athlete taps START — so
 * the sequence's origin has to be recovered from the autosaved interval
 * rather than assumed to be zero. Intervals are all the same length, so
 * the saved interval's start minus the ones before it lands on the origin.
 */
export function timelineOriginSeconds(
  config: IntervalConfig,
  intervalIndex: number,
  intervalStartedAtSeconds: number,
): number {
  const cycleSeconds = config.workSeconds + config.restSeconds;
  return Math.max(0, intervalStartedAtSeconds - intervalIndex * cycleSeconds);
}

/**
 * How a WOD's movements map onto its intervals.
 *
 * EMOM rotates one movement per interval (minute 1 push, minute 2 pull, …),
 * while Tabata runs a whole block of intervals on one movement before
 * moving to the next — 8 rounds of burpees, then 8 of push-ups.
 */
export type MovementRotation = "cycle" | "block";

export function rotationForWodType(type: WodType): MovementRotation {
  return type === "tabata" ? "block" : "cycle";
}

/** The movement worked in interval `index`, or null for a WOD with none. */
export function movementForInterval<T>(
  movements: T[],
  index: number,
  intervalCount: number,
  rotation: MovementRotation,
): T | null {
  if (movements.length === 0) return null;

  if (rotation === "cycle") {
    return movements[index % movements.length];
  }

  const intervalsPerMovement = Math.max(
    1,
    Math.ceil(intervalCount / movements.length),
  );
  const movementIndex = Math.floor(index / intervalsPerMovement);
  return movements[Math.min(movementIndex, movements.length - 1)];
}
