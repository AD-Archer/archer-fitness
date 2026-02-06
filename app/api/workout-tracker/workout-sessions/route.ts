import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateWorkoutPerformance } from "@/lib/workout-performance";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status"); // "active", "completed", "paused"
    const date = searchParams.get("date"); // YYYY-MM-DD format
    const timeRange = searchParams.get("timeRange"); // "7days", "4weeks", "3months", "6months", "1year"

    let dateFilter = {};
    if (date) {
      // Parse the date in UTC to avoid timezone issues
      const year = parseInt(date.split("-")[0]);
      const month = parseInt(date.split("-")[1]) - 1; // JavaScript months are 0-indexed
      const day = parseInt(date.split("-")[2]);

      const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

      dateFilter = {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    } else if (timeRange) {
      // Calculate date filter based on time range
      const now = new Date();
      let daysAgo = 0;

      switch (timeRange) {
        case "7days":
          daysAgo = 7;
          break;
        case "4weeks":
          daysAgo = 28;
          break;
        case "3months":
          daysAgo = 90;
          break;
        case "6months":
          daysAgo = 180;
          break;
        case "1year":
          daysAgo = 365;
          break;
        default:
          daysAgo = 90; // Default to 3 months
      }

      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysAgo);

      dateFilter = {
        startTime: {
          gte: startDate,
        },
      };
    }

    const workoutSessions = await prisma.workoutSession.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status }),
        ...dateFilter,
      },
      include: {
        workoutTemplate: true,
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
            sets: {
              orderBy: {
                setNumber: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
      take: limit,
    });

    // Calculate performance metrics for each workout session
    const workoutSessionsWithPerformance = workoutSessions.map(
      (session: any) => {
        // If the session already has performance data stored, use it
        if (
          session.performanceStatus &&
          session.completionRate !== null &&
          session.perfectionScore !== null
        ) {
          return session;
        }

        // Otherwise, calculate performance metrics on-the-fly
        // Transform the data to match our performance calculation interface
        const transformedSession = {
          ...session,
          exercises: session.exercises.map((ex: any) => ({
            id: ex.id,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetType: ex.targetType,
            completed: ex.completed,
            completedSets: ex.sets.filter((set: any) => set.completed).length,
            sets: ex.sets,
          })),
        };

        const performance = calculateWorkoutPerformance(transformedSession);

        // Return session with calculated performance data
        return {
          ...session,
          performanceStatus: performance.performanceStatus,
          completionRate: performance.completionRate,
          perfectionScore: performance.perfectionScore,
        };
      },
    );

    return NextResponse.json(workoutSessionsWithPerformance);
  } catch (error) {
    logger.error("Error fetching workout sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout sessions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      workoutTemplateId,
      name,
      description,
      exercises,
      startTime,
      endTime,
      duration,
      status,
      notes,
      isArchived,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Resolve exercise IDs (validate provided IDs; else find by name; else create for user)
    const resolvedExercises: Array<{
      exerciseId: string;
      targetSets: number;
      targetReps: string;
      targetType: string;
      notes?: string | null;
      sets?: Array<{
        reps?: number | null;
        weight?: number | null;
        duration?: number | null;
        restTime?: number | null;
        notes?: string | null;
      }>;
    }> = [];
    const seenExerciseIds = new Set<string>();

    for (let i = 0; i < (exercises?.length || 0); i++) {
      const ex = exercises[i];
      let exerciseId: string | undefined = ex.exerciseId;
      // If an ID was provided, validate it exists; if not, fall back to name resolution
      if (exerciseId) {
        const exists = await prisma.exercise.findUnique({
          where: { id: exerciseId },
          select: { id: true },
        });
        if (!exists) {
          exerciseId = undefined;
        }
      }
      if (!exerciseId) {
        const nameFromBody: string | undefined = ex.name;
        if (!nameFromBody) {
          return NextResponse.json(
            {
              error: `Exercise at position ${i + 1} missing exerciseId or name`,
            },
            { status: 400 },
          );
        }
        // Try to reuse an existing user exercise with the same name
        const userMatch = await prisma.exercise.findFirst({
          where: { userId: session.user.id, name: nameFromBody },
          select: { id: true },
        });
        if (userMatch) {
          exerciseId = userMatch.id;
        } else {
          // Or a predefined exercise with the same name
          const predefinedMatch = await prisma.exercise.findFirst({
            where: { isPredefined: true, name: nameFromBody },
            select: { id: true },
          });
          if (predefinedMatch) {
            exerciseId = predefinedMatch.id;
          } else {
            // Otherwise create a new user exercise
            const created = await prisma.exercise.create({
              data: {
                userId: session.user.id,
                name: nameFromBody,
                description: ex.description,
                instructions: ex.instructions,
              },
              select: { id: true },
            });
            exerciseId = created.id;
          }
        }
      }

      // Skip if this exerciseId already added to prevent unique constraint violation
      if (exerciseId && seenExerciseIds.has(exerciseId)) {
        continue;
      }
      if (exerciseId) {
        seenExerciseIds.add(exerciseId);
      }

      resolvedExercises.push({
        exerciseId: exerciseId!,
        targetSets: ex.targetSets || 3,
        targetReps: ex.targetReps || "8-12",
        targetType: ex.targetType || "reps",
        notes: ex.notes ?? null,
        sets: Array.isArray(ex.sets) ? ex.sets : undefined,
      });
    }

    const parsedStartTime = startTime ? new Date(startTime) : new Date();
    const parsedEndTime = endTime ? new Date(endTime) : undefined;

    // Create the workout session
    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        workoutTemplateId,
        name,
        description,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        duration: typeof duration === "number" ? duration : undefined,
        status: status || "active",
        notes: notes || undefined,
        isArchived: typeof isArchived === "boolean" ? isArchived : undefined,
        exercises: {
          create: resolvedExercises.map((ex, index) => ({
            exerciseId: ex.exerciseId,
            order: index,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetType: ex.targetType,
            notes: ex.notes || undefined,
            sets: ex.sets
              ? {
                  create: ex.sets.map((set: any, setIndex: number) => ({
                    setNumber: setIndex + 1,
                    reps: set.reps ?? null,
                    weight: set.weight ?? null,
                    duration: set.duration ?? null,
                    restTime: set.restTime ?? null,
                    completed: true,
                    notes: set.notes ?? null,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: {
        workoutTemplate: true,
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
            sets: { orderBy: { setNumber: "asc" } },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(workoutSession, { status: 201 });
  } catch (error) {
    logger.error("Error creating workout session:", error);
    return NextResponse.json(
      { error: "Failed to create workout session" },
      { status: 500 },
    );
  }
}
