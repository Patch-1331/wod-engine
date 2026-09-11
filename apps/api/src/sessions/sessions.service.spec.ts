import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from './sessions.service';

/**
 * A rep scheme prescribes the rounds, so a scheme-driven WOD has nothing left
 * to split — and an even split over the ladder's total would walk the athlete
 * through 15-15-15 where the workout says 21-15-9. The client hides the
 * control; these cover the endpoint, which is reachable without it.
 */

const ALICE = 'user_alice';

function prismaWith(movements: { reps: number; repScheme: number[] }[]) {
  const update = jest.fn((args: unknown) => {
    void args;
    return Promise.resolve({
      id: 'session-1',
      assignmentId: 'assignment-1',
      startedAt: new Date(),
      capSeconds: 600,
      roundSplits: [],
      status: 'in_progress',
      finishedAtSeconds: null,
      roundSplitCount: null,
      warmupCompletedAt: null,
      cooldownCompletedAt: null,
      intervalIndex: null,
      intervalStartedAtSeconds: null,
    });
  });

  const prisma = {
    workoutSession: {
      findFirst: jest.fn(() =>
        Promise.resolve({
          id: 'session-1',
          assignmentId: 'assignment-1',
          assignment: { wod: { movements } },
        }),
      ),
      update,
    },
  };

  return { prisma: prisma as unknown as PrismaService, update };
}

const ladder = [
  { reps: 45, repScheme: [21, 15, 9] },
  { reps: 45, repScheme: [21, 15, 9] },
];
const flat = [{ reps: 45, repScheme: [] }];

describe('SessionsService.setRoundSplit', () => {
  it('refuses a split on a WOD whose rep scheme already sets the rounds', async () => {
    const { prisma, update } = prismaWith(ladder);

    await expect(
      new SessionsService(prisma).setRoundSplit(ALICE, 'assignment-1', 3),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('still allows clearing a split on a scheme-driven WOD', async () => {
    // Null is "no split", which is where a scheme-driven session already is —
    // rejecting it would strand a session that set one before the WOD gained
    // its scheme.
    const { prisma, update } = prismaWith(ladder);

    await new SessionsService(prisma).setRoundSplit(
      ALICE,
      'assignment-1',
      null,
    );
    expect(update).toHaveBeenCalled();
  });

  it('allows a split on a flat WOD', async () => {
    const { prisma, update } = prismaWith(flat);

    await new SessionsService(prisma).setRoundSplit(ALICE, 'assignment-1', 5);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { roundSplitCount: 5 } }),
    );
  });
});

/**
 * The clock stops at the time cap, so nothing downstream of it may score past
 * the cap: a FINISH that lands late records the cap, a second finish doesn't
 * overwrite the first, and a round tapped after the cap has no second to have
 * happened in.
 */

const CAP_SECONDS = 20 * 60;

function prismaWithSession(overrides: {
  startedAt: Date;
  status?: string;
  finishedAtSeconds?: number | null;
}) {
  const session = {
    id: 'session-1',
    assignmentId: 'assignment-1',
    userId: ALICE,
    startedAt: overrides.startedAt,
    capSeconds: CAP_SECONDS,
    roundSplits: [],
    status: overrides.status ?? 'in_progress',
    finishedAtSeconds: overrides.finishedAtSeconds ?? null,
    roundSplitCount: null,
    warmupCompletedAt: null,
    cooldownCompletedAt: null,
    intervalIndex: null,
    intervalStartedAtSeconds: null,
  };

  const update = jest.fn((args: { data: Record<string, unknown> }) =>
    Promise.resolve({ ...session, ...args.data }),
  );

  const prisma = {
    workoutSession: {
      findFirst: jest.fn(() => Promise.resolve(session)),
      update,
    },
  };

  return { prisma: prisma as unknown as PrismaService, update };
}

function secondsAgo(seconds: number): Date {
  return new Date(Date.now() - seconds * 1000);
}

describe('SessionsService.finish', () => {
  it('records the elapsed time for a finish inside the cap', async () => {
    const { prisma, update } = prismaWithSession({
      startedAt: secondsAgo(487),
    });

    const session = await new SessionsService(prisma).finish(
      ALICE,
      'assignment-1',
    );

    expect(session.finishedAtSeconds).toBe(487);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'completed', finishedAtSeconds: 487 },
      }),
    );
  });

  it('records the cap for a finish that lands after it', async () => {
    // A phone locked past the cap: the athlete's clock stopped at 20:00, so
    // that is the score — not the 25 minutes the wall clock ran.
    const { prisma } = prismaWithSession({
      startedAt: secondsAgo(CAP_SECONDS + 300),
    });

    const session = await new SessionsService(prisma).finish(
      ALICE,
      'assignment-1',
    );

    expect(session.finishedAtSeconds).toBe(CAP_SECONDS);
  });

  it('leaves an already-finished session alone', async () => {
    // The cap finishes the session itself, and the screen still offers the
    // tap that leads to the log. That tap must not restamp the time.
    const { prisma, update } = prismaWithSession({
      startedAt: secondsAgo(CAP_SECONDS + 120),
      status: 'completed',
      finishedAtSeconds: CAP_SECONDS,
    });

    const session = await new SessionsService(prisma).finish(
      ALICE,
      'assignment-1',
    );

    expect(session.finishedAtSeconds).toBe(CAP_SECONDS);
    expect(update).not.toHaveBeenCalled();
  });
});

describe('SessionsService.logRound', () => {
  it('accepts a round tapped on the cap second itself', async () => {
    const { prisma, update } = prismaWithSession({
      startedAt: secondsAgo(CAP_SECONDS),
    });

    await new SessionsService(prisma).logRound(ALICE, 'assignment-1', {
      round: 1,
      atSeconds: CAP_SECONDS,
    });

    expect(update).toHaveBeenCalled();
  });

  it('refuses a round tapped past the cap', async () => {
    const { prisma, update } = prismaWithSession({
      startedAt: secondsAgo(CAP_SECONDS + 60),
    });

    await expect(
      new SessionsService(prisma).logRound(ALICE, 'assignment-1', {
        round: 1,
        atSeconds: CAP_SECONDS + 30,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });
});
