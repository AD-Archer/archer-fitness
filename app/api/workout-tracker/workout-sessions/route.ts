import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") // "active", "completed", "paused"

    const workoutSessions = await prisma.workoutSession.findMany({
      where: {
  userId: session.user.id,
        ...(status && { status }),
      },
      include: {
        workoutTemplate: true,
        exercises: {
          include: {
            exercise: true,
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
    })

    return NextResponse.json(workoutSessions)
  } catch (error) {
    console.error("Error fetching workout sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout sessions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { workoutTemplateId, name, description, exercises } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Resolve exercise IDs (validate provided IDs; else find by name; else create for user)
    const resolvedExercises: Array<{
      exerciseId: string
      targetSets: number
      targetReps: string
      targetType: string
      notes?: string | null
    }> = []
    const seenExerciseIds = new Set<string>()

    for (let i = 0; i < (exercises?.length || 0); i++) {
      const ex = exercises[i]
      let exerciseId: string | undefined = ex.exerciseId
      // If an ID was provided, validate it exists; if not, fall back to name resolution
      if (exerciseId) {
        const exists = await prisma.exercise.findUnique({ where: { id: exerciseId }, select: { id: true } })
        if (!exists) {
          exerciseId = undefined
        }
      }
      if (!exerciseId) {
        const nameFromBody: string | undefined = ex.name
        if (!nameFromBody) {
          return NextResponse.json(
            { error: `Exercise at position ${i + 1} missing exerciseId or name` },
            { status: 400 }
          )
        }
        // Try to reuse an existing user exercise with the same name
        const userMatch = await prisma.exercise.findFirst({
          where: { userId: session.user.id, name: nameFromBody },
          select: { id: true },
        })
        if (userMatch) {
          exerciseId = userMatch.id
        } else {
          // Or a predefined exercise with the same name
          const predefinedMatch = await prisma.exercise.findFirst({
            where: { isPredefined: true, name: nameFromBody },
            select: { id: true },
          })
          if (predefinedMatch) {
            exerciseId = predefinedMatch.id
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
            })
            exerciseId = created.id
          }
        }
      }

      // Skip if this exerciseId already added to prevent unique constraint violation
      if (seenExerciseIds.has(exerciseId)) {
        continue
      }
      seenExerciseIds.add(exerciseId)

      resolvedExercises.push({
        exerciseId: exerciseId!,
        targetSets: ex.targetSets || 3,
        targetReps: ex.targetReps || "8-12",
        targetType: ex.targetType || "reps",
        notes: ex.notes ?? null,
      })
    }

    // Create the workout session
    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        workoutTemplateId,
        name,
        description,
        exercises: {
          create: resolvedExercises.map((ex, index) => ({
            exerciseId: ex.exerciseId,
            order: index,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetType: ex.targetType,
            notes: ex.notes || undefined,
          })),
        },
      },
      include: {
        workoutTemplate: true,
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: "asc" } },
          },
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(workoutSession, { status: 201 })
  } catch (error) {
    console.error("Error creating workout session:", error)
    return NextResponse.json(
      { error: "Failed to create workout session" },
      { status: 500 }
    )
  }
}