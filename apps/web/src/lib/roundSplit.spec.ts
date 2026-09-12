import { describe, expect, it } from "vitest";
import {
  anchorMovement,
  computeRoundReps,
  effectiveRounds,
  hasRepScheme,
  repsForRound,
  roundsFromReps,
  schemeRoundCount,
  totalRepsForMovement,
} from "@regimen-works/shared";

// Fran's Cousin: 21-15-9 of push-ups and jump squats, 45 total each.
const ladder = { reps: 45, repScheme: [21, 15, 9] };
const flat = { reps: 45, repScheme: [] };

describe("hasRepScheme", () => {
  it("is true when any movement carries a ladder", () => {
    expect(hasRepScheme([flat, ladder])).toBe(true);
  });

  it("is false for a WOD of flat movements", () => {
    expect(hasRepScheme([flat, { reps: 10, repScheme: [] }])).toBe(false);
  });
});

describe("schemeRoundCount / effectiveRounds", () => {
  it("reads the rounds off the scheme's length", () => {
    expect(schemeRoundCount([ladder, ladder])).toBe(3);
  });

  it("is null when nothing prescribes a scheme", () => {
    expect(schemeRoundCount([flat])).toBeNull();
  });

  it("prefers the scheme over the WOD's own rounds", () => {
    // Fran's Cousin is seeded with rounds: null — the ladder is what makes
    // it three rounds, and the Today readout should say 3, not "—".
    expect(effectiveRounds({ rounds: null, movements: [ladder, ladder] })).toBe(3);
  });

  it("falls back to the WOD's rounds without a scheme", () => {
    expect(effectiveRounds({ rounds: 5, movements: [flat] })).toBe(5);
    expect(effectiveRounds({ rounds: null, movements: [flat] })).toBeNull();
  });
});

describe("repsForRound", () => {
  it("walks the ladder as prescribed", () => {
    expect([0, 1, 2].map((i) => repsForRound(ladder, i, null))).toEqual([21, 15, 9]);
  });

  it("ignores a manual split when a scheme is set", () => {
    // The regression this whole field exists to prevent: an even 3-way split
    // of 45 is 15/15/15, which is not the workout.
    expect([0, 1, 2].map((i) => repsForRound(ladder, i, 3))).toEqual([21, 15, 9]);
  });

  it("splits a flat movement evenly, front-loading the remainder", () => {
    expect([0, 1, 2].map((i) => repsForRound({ reps: 20, repScheme: [] }, i, 3))).toEqual([7, 7, 6]);
  });

  it("shows the full count for a flat movement with no split", () => {
    expect(repsForRound(flat, 0, null)).toBe(45);
  });

  it("clamps past the last round rather than blanking the display", () => {
    expect(repsForRound(ladder, 7, null)).toBe(9);
  });
});

describe("totalRepsForMovement", () => {
  it("credits the ladder's first round, not an even share of the total", () => {
    // A 21-15-9 abandoned after one round is 21 reps performed. An even
    // 3-way split of 45 would have credited 15.
    expect(totalRepsForMovement(ladder, 1, null)).toBe(21);
  });

  it("sums the ladder as far as it was actually taken", () => {
    expect(totalRepsForMovement(ladder, 2, null)).toBe(36);
    expect(totalRepsForMovement(ladder, 3, null)).toBe(45);
  });

  it("counts a stale split by the scheme instead", () => {
    // A session that set roundSplitCount before its WOD gained a scheme:
    // the scheme wins, so this is 21, not the split's 15.
    expect(totalRepsForMovement(ladder, 1, 3)).toBe(21);
  });

  it("caps a ladder at its own total, however many taps arrive", () => {
    expect(totalRepsForMovement(ladder, 9, null)).toBe(45);
  });

  it("multiplies reps by rounds for a flat, unsplit movement", () => {
    expect(totalRepsForMovement({ reps: 8, repScheme: [] }, 3, null)).toBe(24);
  });

  it("is zero when no rounds were completed", () => {
    expect(totalRepsForMovement({ reps: 8, repScheme: [] }, 0, null)).toBe(0);
  });

  it("sums front-loaded split chunks instead of the full per-round reps", () => {
    // 20 reps split into 6 rounds -> 4,4,3,3,3,3. Two taps is 4+4=8, not 40.
    expect(totalRepsForMovement({ reps: 20, repScheme: [] }, 2, 6)).toBe(8);
  });

  it("caps split-tap counting at the number of split rounds that exist", () => {
    const all6 = totalRepsForMovement({ reps: 20, repScheme: [] }, 6, 6);
    expect(totalRepsForMovement({ reps: 20, repScheme: [] }, 7, 6)).toBe(all6);
    expect(all6).toBe(20);
  });
});

describe("computeRoundReps / anchorMovement / roundsFromReps", () => {
  it("divides evenly, front-loading the remainder", () => {
    expect(computeRoundReps(20, 6)).toEqual([4, 4, 3, 3, 3, 3]);
  });

  it("is the whole total in one round when asked for one or fewer", () => {
    expect(computeRoundReps(45, 1)).toEqual([45]);
  });

  it("anchors on the movement with the most reps", () => {
    expect(anchorMovement([{ reps: 10 }, { reps: 45 }, { reps: 20 }])).toEqual({ reps: 45 });
  });

  it("rounds up to fit the requested chunk size", () => {
    expect(roundsFromReps(45, 9)).toBe(5);
    expect(roundsFromReps(45, 10)).toBe(5);
  });
});
