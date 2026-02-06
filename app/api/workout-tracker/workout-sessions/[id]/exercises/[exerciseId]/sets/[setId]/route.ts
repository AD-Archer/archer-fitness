import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

const prismaAny = prisma as any;

async function ensureSetOwnership(
  userId: string,
  params: { id: string; exerciseId: string; setId: string },
) {
  return prismaAny.exerciseSet.findFirst({
    where: {
      id: params.setId,
      workoutSessionExerciseId: params.exerciseId,
      workoutSessionExercise: {
        workoutSessionId: params.id,
        workoutSession: { userId },
      },
    },
  });
}

async function getUpdatedExercise(exerciseId: string) {
  return prismaAny.workoutSessionExercise.findFirst({
    where: { id: exerciseId },
    include: {
      exercise: {
        include: {
          muscles: { include: { muscle: true } },
          equipments: { include: { equipment: true } },
        },
      },
      sets: { orderBy: { setNumber: "asc" } },
    },
  });
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; exerciseId: string; setId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, exerciseId, setId } = await params;

    const existingSet = await ensureSetOwnership(session.user.id, {
      id,
      exerciseId,
      setId,
    });
    if (!existingSet) {
      return NextResponse.json(
        { error: "Exercise set not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { reps, weight, duration, notes } = body;

    const updatedSet = await prismaAny.exerciseSet.update({
      where: { id: setId },
      data: {
        reps: reps === undefined ? existingSet.reps : reps,
        weight: weight === undefined || weight === "" ? null : weight,
        duration: duration === undefined ? existingSet.duration : duration,
        notes: notes === undefined ? existingSet.notes : notes,
      },
    });

    const updatedExercise = await getUpdatedExercise(exerciseId);

    return NextResponse.json(
      { set: updatedSet, exercise: updatedExercise },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error updating set:", error);
    return NextResponse.json(
      { error: "Failed to update set" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; exerciseId: string; setId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, exerciseId, setId } = await params;

    const existingSet = await ensureSetOwnership(session.user.id, {
      id,
      exerciseId,
      setId,
    });
    if (!existingSet) {
      return NextResponse.json(
        { error: "Exercise set not found" },
        { status: 404 },
      );
    }

    await prismaAny.$transaction(async (tx: any) => {
      await tx.exerciseSet.delete({ where: { id: setId } });

      const remainingSets = await tx.exerciseSet.findMany({
        where: { workoutSessionExerciseId: exerciseId },
        orderBy: { setNumber: "asc" },
      });

      await Promise.all(
        remainingSets.map(
          (set: { id: string; setNumber: number }, index: number) =>
            set.setNumber === index + 1
              ? null
              : tx.exerciseSet.update({
                  where: { id: set.id },
                  data: { setNumber: index + 1 },
                }),
        ),
      );
    });

    const updatedExercise = await getUpdatedExercise(exerciseId);

    return NextResponse.json(
      { success: true, exercise: updatedExercise },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error deleting set:", error);
    return NextResponse.json(
      { error: "Failed to delete set" },
      { status: 500 },
    );
  }
}
