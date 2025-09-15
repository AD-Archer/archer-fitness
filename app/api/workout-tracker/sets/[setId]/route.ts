import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

// PUT - Edit a set
export async function PUT(
  request: NextRequest,
  { params }: { params: { setId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reps, weight } = body

    if (!reps) {
      return NextResponse.json(
        { error: "Reps is required" },
        { status: 400 }
      )
    }

    const prismaAny = prisma as any

    // Verify the set belongs to the user's session
    const existingSet = await prismaAny.exerciseSet.findFirst({
      where: {
        id: params.setId,
        workoutSessionExercise: {
          workoutSession: { userId: session.user.id },
        },
      },
      include: {
        workoutSessionExercise: true,
      },
    })

    if (!existingSet) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }

    // Update the set
    const updatedSet = await prismaAny.exerciseSet.update({
      where: { id: params.setId },
      data: {
        reps: reps,
        weight: weight === undefined || weight === "" ? null : weight,
      },
    })

    // Return updated session exercise with all sets
    const updatedExercise = await prismaAny.workoutSessionExercise.findFirst({
      where: { id: existingSet.workoutSessionExerciseId },
      include: {
        exercise: {
          include: {
            muscles: {
              include: {
                muscle: true
              }
            },
            equipments: {
              include: {
                equipment: true
              }
            }
          }
        },
        sets: { orderBy: { setNumber: "asc" } },
      },
    })

    return NextResponse.json({ set: updatedSet, exercise: updatedExercise })
  } catch (error) {
    logger.error("Error updating set:", error)
    return NextResponse.json(
      { error: "Failed to update set" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a set
export async function DELETE(
  request: NextRequest,
  { params }: { params: { setId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const prismaAny = prisma as any

    // Verify the set belongs to the user's session
    const existingSet = await prismaAny.exerciseSet.findFirst({
      where: {
        id: params.setId,
        workoutSessionExercise: {
          workoutSession: { userId: session.user.id },
        },
      },
      include: {
        workoutSessionExercise: true,
      },
    })

    if (!existingSet) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }

    // Delete the set
    await prismaAny.exerciseSet.delete({
      where: { id: params.setId },
    })

    // Update set numbers for remaining sets
    await prismaAny.exerciseSet.updateMany({
      where: {
        workoutSessionExerciseId: existingSet.workoutSessionExerciseId,
        setNumber: { gt: existingSet.setNumber },
      },
      data: {
        setNumber: { decrement: 1 },
      },
    })

    // Return updated session exercise with all sets
    const updatedExercise = await prismaAny.workoutSessionExercise.findFirst({
      where: { id: existingSet.workoutSessionExerciseId },
      include: {
        exercise: {
          include: {
            muscles: {
              include: {
                muscle: true
              }
            },
            equipments: {
              include: {
                equipment: true
              }
            }
          }
        },
        sets: { orderBy: { setNumber: "asc" } },
      },
    })

    return NextResponse.json({ exercise: updatedExercise })
  } catch (error) {
    logger.error("Error deleting set:", error)
    return NextResponse.json(
      { error: "Failed to delete set" },
      { status: 500 }
    )
  }
}