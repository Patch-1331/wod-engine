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
      roundSplits: '[]',
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
