import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET all exercises for a session
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const exercises = await prisma.workoutSessionExercise.findMany({
      where: {
        workoutSessionId: id,
        workoutSession: { userId: session.user.id },
      },
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
        sets: {
          orderBy: { setNumber: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(exercises);
  } catch (error) {
    logger.error("Error fetching session exercises:", error);
    return NextResponse.json(
      { error: "Failed to fetch session exercises" },
      { status: 500 },
    );
  }
}

// POST add an exercise to a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const {
      exerciseId,
      targetSets = 3,
      targetReps = "8-12",
      targetType = "reps",
      notes,
    } = body;

    if (!exerciseId) {
      return NextResponse.json(
        { error: "exerciseId is required" },
        { status: 400 },
      );
    }

    // Verify session ownership
    const workoutSession = await prisma.workoutSession.findFirst({
      where: { id: id, userId: session.user.id },
    });
    if (!workoutSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Determine next order
    const count = await prisma.workoutSessionExercise.count({
      where: { workoutSessionId: id },
    });

    const created = await prisma.workoutSessionExercise.create({
      data: {
        workoutSessionId: id,
        exerciseId,
        order: count,
        targetSets,
        targetReps,
        targetType,
        notes,
      },
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
        sets: {
          orderBy: { setNumber: "asc" },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    logger.error("Error adding exercise to session:", error);
    return NextResponse.json(
      { error: "Failed to add exercise to session" },
      { status: 500 },
    );
  }
}
