import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get basic session info
    const sessionCount = await prisma.workoutSession.count({
      where: { userId: session.user.id },
    });

    const completedCount = await prisma.workoutSession.count({
      where: {
        userId: session.user.id,
        status: "completed",
      },
    });

    // Get a sample session with full data
    const sampleSession = await prisma.workoutSession.findFirst({
      where: { userId: session.user.id },
      include: {
        exercises: {
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
            sets: true,
          },
        },
      },
    });

    // Get muscle count
    const muscleCount = await prisma.muscle.count();
    const equipmentCount = await prisma.equipment.count();

    // Check if we have any exercises with GIF URLs
    const exercisesWithGifs = await prisma.exercise.count({
      where: {
        gifUrl: {
          not: null,
        },
      },
    });

    return NextResponse.json({
      sessionCount,
      completedCount,
      muscleCount,
      equipmentCount,
      exercisesWithGifs,
      sampleSession: sampleSession
        ? {
            id: sampleSession.id,
            status: sampleSession.status,
            exerciseCount: sampleSession.exercises.length,
            firstExercise: sampleSession.exercises[0]
              ? {
                  name: sampleSession.exercises[0].exercise.name,
                  gifUrl: sampleSession.exercises[0].exercise.gifUrl,
                  muscleCount:
                    sampleSession.exercises[0].exercise.muscles.length,
                  muscles: sampleSession.exercises[0].exercise.muscles.map(
                    (m: any) => ({
                      name: m.muscle.name,
                      isPrimary: m.isPrimary,
                    }),
                  ),
                  equipmentCount:
                    sampleSession.exercises[0].exercise.equipments.length,
                  equipments:
                    sampleSession.exercises[0].exercise.equipments.map(
                      (e: any) => ({
                        name: e.equipment.name,
                      }),
                    ),
                  setCount: sampleSession.exercises[0].sets.length,
                  completedSets: sampleSession.exercises[0].sets.filter(
                    (s: any) => s.completed,
                  ).length,
                }
              : null,
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch debug data" },
      { status: 500 },
    );
  }
}
