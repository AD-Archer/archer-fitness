 
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

// PUT update an exercise in a session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; exerciseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { targetSets, targetReps, targetType, notes } = body

    const prismaAny = prisma as any

    // Verify session ownership and exercise exists
    const workoutSessionExercise = await prismaAny.workoutSessionExercise.findFirst({
      where: {
        id: params.exerciseId,
        workoutSessionId: params.id,
        workoutSession: { userId: session.user.id },
      },
    })

    if (!workoutSessionExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }

    // Update the exercise
    const updated = await prismaAny.workoutSessionExercise.update({
      where: { id: params.exerciseId },
      data: {
        ...(targetSets !== undefined && { targetSets }),
        ...(targetReps !== undefined && { targetReps }),
        ...(targetType !== undefined && { targetType }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        exercise: true,
        sets: {
          orderBy: { setNumber: "asc" },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    logger.error("Error updating session exercise:", error)
    return NextResponse.json(
      { error: "Failed to update session exercise" },
      { status: 500 }
    )
  }
}

// DELETE remove an exercise from a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; exerciseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const prismaAny = prisma as any

    // Verify session ownership and exercise exists
    const workoutSessionExercise = await prismaAny.workoutSessionExercise.findFirst({
      where: {
        id: params.exerciseId,
        workoutSessionId: params.id,
        workoutSession: { userId: session.user.id },
      },
    })

    if (!workoutSessionExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }

    // Delete all sets for this exercise first
    await prismaAny.exerciseSet.deleteMany({
      where: {
        workoutSessionExerciseId: params.exerciseId,
      },
    })

    // Delete the exercise from the session
    await prismaAny.workoutSessionExercise.delete({
      where: { id: params.exerciseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Error removing session exercise:", error)
    return NextResponse.json(
      { error: "Failed to remove session exercise", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
