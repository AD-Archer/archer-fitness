import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; exerciseId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, exerciseId } = await params;

    const body = await request.json();
    const { reps, weight, duration, restTime, notes } = body;

    if (!reps && !duration) {
      return NextResponse.json(
        { error: "Either reps or duration is required" },
        { status: 400 },
      );
    }

    // Verify the session exercise belongs to the user's session
    const sessionExercise = await prisma.workoutSessionExercise.findFirst({
      where: {
        id: exerciseId,
        workoutSessionId: id,
        workoutSession: { userId: session.user.id },
      },
    });

    if (!sessionExercise) {
      return NextResponse.json(
        { error: "Session exercise not found" },
        { status: 404 },
      );
    }

    // Determine next set number
    const setCount = await prisma.exerciseSet.count({
      where: { workoutSessionExerciseId: exerciseId },
    });

    const createdSet = await prisma.exerciseSet.create({
      data: {
        workoutSessionExerciseId: exerciseId,
        setNumber: setCount + 1,
        reps: reps ?? null,
        weight: weight === undefined || weight === "" ? null : weight,
        duration: duration ?? null,
        completed: true,
        restTime: restTime ?? null,
        notes: notes ?? null,
      },
    });

    // Return updated session exercise with sets
    const updatedExercise = await prisma.workoutSessionExercise.findFirst({
      where: { id: exerciseId },
      include: {
        exercise: {
          include: {
            muscles: {
              include: {
                muscle: true,
              },
            },
            equipments: {
              include: {
                equipment: true,
              },
            },
          },
        },
        sets: { orderBy: { setNumber: "asc" } },
      },
    });

    return NextResponse.json(
      { set: createdSet, exercise: updatedExercise },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Error adding set:", error);
    return NextResponse.json({ error: "Failed to add set" }, { status: 500 });
  }
}
