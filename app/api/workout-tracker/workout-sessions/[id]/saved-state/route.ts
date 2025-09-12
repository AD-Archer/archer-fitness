import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

// Save workout state
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessionId = params.id
    const body = await request.json()
    const {
      currentExerciseIndex,
      timer,
      exerciseTimer,
      isTimerRunning,
      isResting,
      restTimer,
      lastSetData
    } = body

    // Verify the workout session belongs to the user
    const workoutSession = await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id
      }
    })

    if (!workoutSession) {
      return NextResponse.json({ error: "Workout session not found" }, { status: 404 })
    }

    // Save or update the workout state
    const savedState = await prisma.savedWorkoutState.upsert({
      where: {
        workoutSessionId: sessionId
      },
      update: {
        currentExerciseIndex,
        timer,
        exerciseTimer,
        isTimerRunning,
        isResting,
        restTimer,
        lastSetData
      },
      create: {
        userId: session.user.id,
        workoutSessionId: sessionId,
        currentExerciseIndex,
        timer,
        exerciseTimer,
        isTimerRunning,
        isResting,
        restTimer,
        lastSetData
      }
    })

    return NextResponse.json(savedState)
  } catch (error) {
    logger.error("Error saving workout state:", error)
    return NextResponse.json(
      { error: "Failed to save workout state" },
      { status: 500 }
    )
  }
}

// Get saved workout state
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessionId = params.id

    const savedState = await prisma.savedWorkoutState.findUnique({
      where: {
        workoutSessionId: sessionId
      }
    })

    if (!savedState) {
      return NextResponse.json({ error: "No saved state found" }, { status: 404 })
    }

    // Verify the saved state belongs to the user
    if (savedState.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(savedState)
  } catch (error) {
    logger.error("Error getting saved workout state:", error)
    return NextResponse.json(
      { error: "Failed to get saved workout state" },
      { status: 500 }
    )
  }
}

// Delete saved workout state
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessionId = params.id

    const savedState = await prisma.savedWorkoutState.findUnique({
      where: {
        workoutSessionId: sessionId
      }
    })

    if (!savedState) {
      return NextResponse.json({ error: "No saved state found" }, { status: 404 })
    }

    // Verify the saved state belongs to the user
    if (savedState.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.savedWorkoutState.delete({
      where: {
        workoutSessionId: sessionId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Error deleting saved workout state:", error)
    return NextResponse.json(
      { error: "Failed to delete saved workout state" },
      { status: 500 }
    )
  }
}
