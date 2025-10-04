import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateWorkoutPerformance } from "@/lib/workout-performance"
import { logger } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workoutSession = await prisma.workoutSession.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        workoutTemplate: true,
        exercises: {
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
    })

    if (!workoutSession) {
      return NextResponse.json({ error: "Workout session not found" }, { status: 404 })
    }

    // Calculate performance metrics if not already stored
    let sessionWithPerformance = workoutSession
    if (!workoutSession.performanceStatus || workoutSession.completionRate === null || workoutSession.perfectionScore === null) {
      // Transform the data to match our performance calculation interface
      const transformedSession = {
        ...workoutSession,
        exercises: workoutSession.exercises.map(ex => ({
          id: ex.id,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          targetType: ex.targetType,
          completed: ex.completed,
          completedSets: ex.sets.filter(set => set.completed).length,
          sets: ex.sets
        }))
      }
      
      const performance = calculateWorkoutPerformance(transformedSession)
      
      sessionWithPerformance = {
        ...workoutSession,
        performanceStatus: performance.performanceStatus,
        completionRate: performance.completionRate,
        perfectionScore: performance.perfectionScore,
      }
    }

    return NextResponse.json(sessionWithPerformance)
  } catch (error) {
    logger.error("Error fetching workout session:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout session" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, endTime, duration, notes, isArchived } = body

    // If completing the workout, calculate performance metrics
    let performanceData = {}
    if (status === "completed") {
      // First get the workout session with all exercises and sets
      const workoutSession = await prisma.workoutSession.findFirst({
        where: {
          id: params.id,
          userId: session.user.id,
        },
        include: {
          exercises: {
            include: {
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
      })

      if (workoutSession) {
        // Transform the data to match our performance calculation interface
        const transformedSession = {
          ...workoutSession,
          exercises: workoutSession.exercises.map(ex => ({
            ...ex,
            completedSets: ex.sets.filter(set => set.completed).length,
          }))
        }
        
        const performance = calculateWorkoutPerformance(transformedSession)
        
        performanceData = {
          performanceStatus: performance.performanceStatus,
          completionRate: performance.completionRate,
          perfectionScore: performance.perfectionScore,
        }

        // Update individual exercise scores and completed sets count
        // Note: perfectionScore and completedSets will be available after DB migration
        // for (const exerciseScore of performance.exerciseScores) {
        //   await prisma.workoutSessionExercise.update({
        //     where: { id: exerciseScore.exerciseId },
        //     data: {
        //       perfectionScore: exerciseScore.score,
        //       completedSets: exerciseScore.completedSets,
        //     },
        //   })
        // }
      }
    }

    const updateData: any = {
      status,
      endTime: endTime ? new Date(endTime) : undefined,
      duration,
      notes,
      ...performanceData,
      updatedAt: new Date(),
    }

    // Handle archive status
    if (isArchived !== undefined) {
      updateData.isArchived = isArchived
      if (isArchived) {
        updateData.archivedAt = new Date()
      } else {
        updateData.archivedAt = null
      }
    }

    const workoutSession = await prisma.workoutSession.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: updateData,
      include: {
        workoutTemplate: true,
        exercises: {
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
    })

    return NextResponse.json(workoutSession)
  } catch (error) {
    logger.error("Error updating workout session:", error)
    return NextResponse.json(
      { error: "Failed to update workout session" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if workout exists
    const workoutSession = await prisma.workoutSession.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!workoutSession) {
      return NextResponse.json({ error: "Workout session not found" }, { status: 404 })
    }

    // Delete the workout session
    await prisma.workoutSession.delete({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: "Workout session deleted successfully" })
  } catch (error) {
    logger.error("Error deleting workout session:", error)
    return NextResponse.json(
      { error: "Failed to delete workout session" },
      { status: 500 }
    )
  }
}
