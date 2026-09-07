import { describe, expect, it } from "vitest";
import { resolveIntervalConfig } from "@wod-engine/shared";
import {
  intervalStateAt,
  movementForInterval,
  rotationForWodType,
  timelineOriginSeconds,
} from "./intervals";

const emom = { workSeconds: 60, restSeconds: 0, intervalCount: 12 };
const tabata = { workSeconds: 20, restSeconds: 10, intervalCount: 8 };

describe("intervalStateAt", () => {
  it("starts on the first interval's work phase", () => {
    expect(intervalStateAt(0, emom)).toMatchObject({
      index: 0,
      phase: "work",
      secondsRemaining: 60,
      isComplete: false,
    });
  });

  it("counts down within an interval", () => {
    expect(intervalStateAt(15, emom).secondsRemaining).toBe(45);
  });

  it("rolls into the next interval exactly on the boundary", () => {
    expect(intervalStateAt(59, emom).index).toBe(0);
    expect(intervalStateAt(60, emom)).toMatchObject({
      index: 1,
      phase: "work",
      secondsRemaining: 60,
    });
  });

  it("switches to rest once the work phase is spent", () => {
    expect(intervalStateAt(19, tabata)).toMatchObject({ phase: "work", secondsRemaining: 1 });
    expect(intervalStateAt(20, tabata)).toMatchObject({
      index: 0,
      phase: "rest",
      secondsRemaining: 10,
    });
    expect(intervalStateAt(29, tabata)).toMatchObject({ phase: "rest", secondsRemaining: 1 });
    expect(intervalStateAt(30, tabata)).toMatchObject({ index: 1, phase: "work" });
  });

  it("lands on the right interval after a gap, not however many ticks were missed", () => {
    // a backgrounded tab that fired no timers for four minutes
    expect(intervalStateAt(245, emom)).toMatchObject({ index: 4, secondsRemaining: 55 });
  });

  it("holds at complete once the last interval runs out", () => {
    const lastSecond = intervalStateAt(30 * 8 - 1, tabata);
    expect(lastSecond).toMatchObject({ index: 7, isComplete: false });

    expect(intervalStateAt(30 * 8, tabata)).toMatchObject({
      index: 8,
      secondsRemaining: 0,
      isComplete: true,
    });
    // and stays there rather than rolling into a ninth interval
    expect(intervalStateAt(30 * 20, tabata)).toMatchObject({ index: 8, isComplete: true });
  });
});

describe("timelineOriginSeconds", () => {
  it("recovers the sequence's start from a mid-sequence interval", () => {
    // interval 3 of an EMOM began 200s into the session → it started at 20s
    expect(timelineOriginSeconds(emom, 3, 200)).toBe(20);
  });

  it("round-trips: state derived from a recovered origin matches the live one", () => {
    const origin = 20;
    const elapsed = 215; // 195s into the sequence → interval 3, 45s left
    const live = intervalStateAt(elapsed - origin, emom);

    const recovered = timelineOriginSeconds(emom, live.index, origin + live.index * 60);
    expect(intervalStateAt(elapsed - recovered, emom)).toEqual(live);
  });

  it("never reports a negative origin", () => {
    expect(timelineOriginSeconds(emom, 5, 0)).toBe(0);
  });
});

describe("movementForInterval", () => {
  const movements = ["burpee", "push-up", "air squat"];

  it("rotates one movement per interval for EMOM", () => {
    const picks = [0, 1, 2, 3, 4].map((i) => movementForInterval(movements, i, 12, "cycle"));
    expect(picks).toEqual(["burpee", "push-up", "air squat", "burpee", "push-up"]);
  });

  it("runs a whole block of intervals per movement for Tabata", () => {
    const picks = [0, 7, 8, 15, 16, 23].map((i) =>
      movementForInterval(movements, i, 24, "block"),
    );
    expect(picks).toEqual([
      "burpee",
      "burpee",
      "push-up",
      "push-up",
      "air squat",
      "air squat",
    ]);
  });

  it("stays on the last movement if the blocks don't divide evenly", () => {
    expect(movementForInterval(movements, 9, 10, "block")).toBe("air squat");
  });

  it("has nothing to show for a WOD with no movements", () => {
    expect(movementForInterval([], 0, 8, "cycle")).toBeNull();
  });

  it("picks the rotation from the WOD type", () => {
    expect(rotationForWodType("tabata")).toBe("block");
    expect(rotationForWodType("emom")).toBe("cycle");
  });
});

describe("resolveIntervalConfig", () => {
  const base = { timeCapMinutes: 12, rounds: null, workSeconds: null, restSeconds: null, intervalCount: null };

  it("uses the WOD's own structure when it has one", () => {
    expect(
      resolveIntervalConfig({
        ...base,
        type: "tabata",
        workSeconds: 30,
        restSeconds: 15,
        intervalCount: 6,
      }),
    ).toEqual({ workSeconds: 30, restSeconds: 15, intervalCount: 6 });
  });

  it("falls back to a minute per interval for an EMOM seeded before the fields existed", () => {
    expect(resolveIntervalConfig({ ...base, type: "emom", rounds: 12 })).toEqual({
      workSeconds: 60,
      restSeconds: 0,
      intervalCount: 12,
    });
  });

  it("falls back to the time cap when such an EMOM has no round count either", () => {
    expect(resolveIntervalConfig({ ...base, type: "emom" })?.intervalCount).toBe(12);
  });

  it("falls back to classic 20/10 x 8 for a Tabata", () => {
    expect(resolveIntervalConfig({ ...base, type: "tabata" })).toEqual({
      workSeconds: 20,
      restSeconds: 10,
      intervalCount: 8,
    });
  });

  it("has no interval structure for the round-tapped formats", () => {
    expect(resolveIntervalConfig({ ...base, type: "amrap" })).toBeNull();
    expect(resolveIntervalConfig({ ...base, type: "for_time" })).toBeNull();
  });
});
