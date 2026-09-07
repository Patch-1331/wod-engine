import { useParams } from "react-router-dom";
import { resolveIntervalConfig } from "@wod-engine/shared";
import { IntervalWorkout } from "./workout/IntervalWorkout";
import { RoundTapWorkout } from "./workout/RoundTapWorkout";
import { WorkoutChrome } from "./workout/WorkoutChrome";
import { useWorkoutSession } from "./workout/useWorkoutSession";

/**
 * Picks the screen the WOD's format needs (Feature #30): EMOM and Tabata get
 * the auto-advancing interval countdown, AMRAP and For Time the round-tap
 * stopwatch. Both share the session, the wake lock, and the finish/cancel bar.
 */
export function ActiveWorkoutPage() {
  const { assignmentId = "" } = useParams();
  const { isLoading, wod, session, isFinished, finish, finishPending, cancel, cancelPending } =
    useWorkoutSession(assignmentId);

  if (isLoading || !wod || !session) {
    return <p className="p-6 text-[var(--ink-faint)]">Starting your workout…</p>;
  }

  const chrome = (
    <WorkoutChrome
      onFinish={finish}
      finishPending={finishPending}
      onCancel={cancel}
      cancelPending={cancelPending}
    />
  );

  const intervalConfig = resolveIntervalConfig(wod);

  if (intervalConfig) {
    return (
      <IntervalWorkout
        assignmentId={assignmentId}
        wod={wod}
        session={session}
        config={intervalConfig}
        isFinished={isFinished}
        chrome={chrome}
      />
    );
  }

  return (
    <RoundTapWorkout
      assignmentId={assignmentId}
      wod={wod}
      session={session}
      isFinished={isFinished}
      chrome={chrome}
    />
  );
}
