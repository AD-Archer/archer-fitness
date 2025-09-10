import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const originalSessionId = params.id

    // Get the original workout session
    const originalSession = await prisma.workoutSession.findFirst({
      where: {
        id: originalSessionId,
        userId: session.user.id
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true
          },
          orderBy: { order: "asc" }
        }
      }
    })

    if (!originalSession) {
      return NextResponse.json({ error: "Original workout session not found" }, { status: 404 })
    }

    // Create a new workout session based on the original
    const newSession = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        workoutTemplateId: originalSession.workoutTemplateId,
        name: `${originalSession.name} (Repeat)`,
        description: originalSession.description,
        status: "active",
        exercises: {
          create: originalSession.exercises.map((exercise, index) => ({
            exerciseId: exercise.exerciseId,
            order: index,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
            targetType: exercise.targetType,
            notes: exercise.notes,
            // Optionally pre-fill with previous performance data
            sets: {
              create: exercise.sets.map((set, setIndex) => ({
                setNumber: setIndex + 1,
                reps: set.reps,
                weight: set.weight,
                duration: set.duration,
                completed: false, // Start fresh, not completed
                notes: set.notes
              }))
            }
          }))
        }
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true
          },
          orderBy: { order: "asc" }
        }
      }
    })

    return NextResponse.json(newSession, { status: 201 })
  } catch (error) {
    console.error("Error repeating workout:", error)
    return NextResponse.json(
      { error: "Failed to repeat workout" },
      { status: 500 }
    )
  }
}
