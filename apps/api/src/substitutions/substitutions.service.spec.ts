import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { SubstitutionsService } from './substitutions.service';

/**
 * The swap is the athlete's write path onto their own level, so the service
 * guards what the UI can't: a day that's already been trained, a movement
 * from someone else's WOD, and a target that isn't scaling at all. The reps
 * stay as prescribed, which is why an off-ladder target has to be refused —
 * it would leave a rep count that means nothing.
 */

const ALICE = 'user_alice';
const ASSIGNMENT = 'assignment-1';
const MOVEMENT = 'movement-1';

type PrismaOverrides = {
  assignment?: { id: string; status: string; wodId: string | null } | null;
  movement?: {
    id: string;
    exerciseId: string;
    exercise: { line: string | null };
  } | null;
  onLine?: { id: string; altExerciseId: string | null }[];
};

function prismaWith(overrides: PrismaOverrides = {}) {
  const {
    assignment = { id: ASSIGNMENT, status: 'scheduled', wodId: 'wod-1' },
    movement = {
      id: MOVEMENT,
      exerciseId: 'negative-chin-up',
      exercise: { line: 'pull' },
    },
    onLine = [
      { id: 'negative-chin-up', altExerciseId: null },
      { id: 'chin-up', altExerciseId: 'row-under-table' },
      { id: 'pull-up', altExerciseId: null },
    ],
  } = overrides;

  const upsert = jest.fn(() => Promise.resolve({ id: 'sub-1' }));
  const deleteMany = jest.fn(() => Promise.resolve({ count: 1 }));

  const prisma = {
    dailyAssignment: { findFirst: jest.fn(() => Promise.resolve(assignment)) },
    wodMovement: { findFirst: jest.fn(() => Promise.resolve(movement)) },
    exercise: { findMany: jest.fn(() => Promise.resolve(onLine)) },
    assignmentSubstitution: { upsert, deleteMany },
  };

  return {
    service: new SubstitutionsService(prisma as unknown as PrismaService),
    upsert,
    deleteMany,
    prisma,
  };
}

describe('SubstitutionsService.set', () => {
  it('records a swap to another rung on the movement’s line', async () => {
    const { service, upsert } = prismaWith();
    await service.set(ALICE, ASSIGNMENT, MOVEMENT, 'chin-up');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          assignmentId_wodMovementId: {
            assignmentId: ASSIGNMENT,
            wodMovementId: MOVEMENT,
          },
        },
        update: { exerciseId: 'chin-up' },
      }),
    );
  });

  it('allows the no-equipment alternative of a rung on the line', async () => {
    const { service, upsert } = prismaWith();
    await service.set(ALICE, ASSIGNMENT, MOVEMENT, 'row-under-table');
    expect(upsert).toHaveBeenCalled();
  });

  it('allows swapping back to what was prescribed', async () => {
    const { service, upsert } = prismaWith();
    await service.set(ALICE, ASSIGNMENT, MOVEMENT, 'negative-chin-up');
    expect(upsert).toHaveBeenCalled();
  });

  it('upserts rather than stacking, so a second swap is a correction', async () => {
    const { service, upsert } = prismaWith();
    await service.set(ALICE, ASSIGNMENT, MOVEMENT, 'chin-up');
    await service.set(ALICE, ASSIGNMENT, MOVEMENT, 'pull-up');
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ update: { exerciseId: 'pull-up' } }),
    );
  });

  it('refuses an exercise that is not on the ladder', async () => {
    const { service, upsert } = prismaWith();
    await expect(
      service.set(ALICE, ASSIGNMENT, MOVEMENT, 'air-squat'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('refuses a movement that is not on a progression line', async () => {
    const { service } = prismaWith({
      movement: {
        id: MOVEMENT,
        exerciseId: 'burpee',
        exercise: { line: null },
      },
    });
    await expect(
      service.set(ALICE, ASSIGNMENT, MOVEMENT, 'chin-up'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a day that has already been trained', async () => {
    const { service } = prismaWith({
      assignment: { id: ASSIGNMENT, status: 'completed', wodId: 'wod-1' },
    });
    await expect(
      service.set(ALICE, ASSIGNMENT, MOVEMENT, 'chin-up'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a day marked as rest', async () => {
    const { service } = prismaWith({
      assignment: { id: ASSIGNMENT, status: 'skipped', wodId: null },
    });
    await expect(
      service.set(ALICE, ASSIGNMENT, MOVEMENT, 'chin-up'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows a swap while the session is in progress', async () => {
    const { service, upsert } = prismaWith({
      assignment: { id: ASSIGNMENT, status: 'in_progress', wodId: 'wod-1' },
    });
    await service.set(ALICE, ASSIGNMENT, MOVEMENT, 'chin-up');
    expect(upsert).toHaveBeenCalled();
  });

  it('404s on an assignment that is not this user’s', async () => {
    const { service } = prismaWith({ assignment: null });
    await expect(
      service.set(ALICE, ASSIGNMENT, MOVEMENT, 'chin-up'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('scopes the assignment lookup by user', async () => {
    const { service, prisma } = prismaWith();
    await service.set(ALICE, ASSIGNMENT, MOVEMENT, 'chin-up');
    expect(prisma.dailyAssignment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ASSIGNMENT, userId: ALICE },
      }),
    );
  });

  it('404s on a movement that is not part of today’s WOD', async () => {
    const { service } = prismaWith({ movement: null });
    await expect(
      service.set(ALICE, ASSIGNMENT, MOVEMENT, 'chin-up'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('SubstitutionsService.clear', () => {
  it('deletes the swap, scoped to the user', async () => {
    const { service, deleteMany } = prismaWith();
    await service.clear(ALICE, ASSIGNMENT, MOVEMENT);
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        userId: ALICE,
        assignmentId: ASSIGNMENT,
        wodMovementId: MOVEMENT,
      },
    });
  });

  it('404s on an assignment that is not this user’s', async () => {
    const { service } = prismaWith({ assignment: null });
    await expect(
      service.clear(ALICE, ASSIGNMENT, MOVEMENT),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
