/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; exerciseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
  const { reps, weight, duration, notes } = body

    if (!reps && !duration) {
      return NextResponse.json(
        { error: "Either reps or duration is required" },
        { status: 400 }
      )
    }

  const prismaAny = prisma as any

    // Verify the session exercise belongs to the user's session
    const sessionExercise = await prismaAny.workoutSessionExercise.findFirst({
      where: {
        id: params.exerciseId,
        workoutSessionId: params.id,
        workoutSession: { userId: session.user.id },
      },
    })

    if (!sessionExercise) {
      return NextResponse.json({ error: "Session exercise not found" }, { status: 404 })
    }

    // Determine next set number
    const setCount = await prismaAny.exerciseSet.count({
      where: { workoutSessionExerciseId: params.exerciseId },
    })

  const createdSet = await prismaAny.exerciseSet.create({
      data: {
        workoutSessionExerciseId: params.exerciseId,
        setNumber: setCount + 1,
        reps: reps ?? null,
    weight: weight === undefined || weight === "" ? null : weight,
        duration: duration ?? null,
        completed: true,
        notes: notes ?? null,
      },
    })

    // Return updated session exercise with sets
    const updatedExercise = await prismaAny.workoutSessionExercise.findFirst({
      where: { id: params.exerciseId },
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

    return NextResponse.json({ set: createdSet, exercise: updatedExercise }, { status: 201 })
  } catch (error) {
    console.error("Error adding set:", error)
    return NextResponse.json(
      { error: "Failed to add set" },
      { status: 500 }
    )
  }
}
