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
    const type = searchParams.get("type") // "strength", "volume", "records", "all"
    const limit = parseInt(searchParams.get("limit") || "100")
    const timeRange = searchParams.get("timeRange") // "7days", "4weeks", "3months", "6months", "1year"

    // Calculate date filter based on time range
    let dateFilter = {}
    if (timeRange) {
      const now = new Date()
      let daysAgo = 0
      
      switch (timeRange) {
        case "7days":
          daysAgo = 7
          break
        case "4weeks":
          daysAgo = 28
          break
        case "3months":
          daysAgo = 90
          break
        case "6months":
          daysAgo = 180
          break
        case "1year":
          daysAgo = 365
          break
        default:
          daysAgo = 90 // Default to 3 months
      }
      
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - daysAgo)
      
      dateFilter = {
        startTime: {
          gte: startDate
        }
      }
    }

    // Get all workout sessions with exercise and set data
    const workoutSessions = await prisma.workoutSession.findMany({
      where: {
        userId: session.user.id,
        ...dateFilter,
      },
      include: {
        exercises: {
          include: {
            exercise: {
              include: {
                muscles: {
                  include: {
                    muscle: true
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
      orderBy: {
        startTime: "desc",
      },
      take: limit,
    })

    // Process data based on type
    const analytics = {
      personalRecords: {},
      strengthProgress: {},
      volumeMetrics: {},
      generalStats: {},
      workoutSessions: workoutSessions // Include full session data for duration calculations
    }

    // Calculate personal records and strength metrics
    const exerciseRecords = new Map<string, {
      maxWeight: number
      maxReps: number
      maxVolume: number
      totalSets: number
      totalReps: number
      totalVolume: number
      lastWorkout: string
      frequency: number
      muscleGroups: string[]
    }>()

    let totalCompletedSets = 0
    let totalWorkoutTime = 0
    let totalVolume = 0
    const workoutDates = new Set<string>()

    workoutSessions.forEach(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0]
      workoutDates.add(sessionDate)
      
      if (session.duration) {
        totalWorkoutTime += session.duration
      }

      session.exercises.forEach(sessionEx => {
        const exerciseName = sessionEx.exercise.name
        const completedSets = sessionEx.sets.filter(set => set.completed)
        totalCompletedSets += completedSets.length

        if (!exerciseRecords.has(exerciseName)) {
          exerciseRecords.set(exerciseName, {
            maxWeight: 0,
            maxReps: 0,
            maxVolume: 0,
            totalSets: 0,
            totalReps: 0,
            totalVolume: 0,
            lastWorkout: sessionDate,
            frequency: 0,
            muscleGroups: sessionEx.exercise.muscles.map(m => m.muscle.name)
          })
        }

        const record = exerciseRecords.get(exerciseName)!
        record.frequency += 1
        record.totalSets += completedSets.length

        completedSets.forEach(set => {
          if (set.weight && set.weight > record.maxWeight) {
            record.maxWeight = set.weight
          }
          if (set.reps && set.reps > record.maxReps) {
            record.maxReps = set.reps
          }
          if (set.reps) {
            record.totalReps += set.reps
          }
          if (set.weight && set.reps) {
            const setVolume = set.weight * set.reps
            record.totalVolume += setVolume
            totalVolume += setVolume
            if (setVolume > record.maxVolume) {
              record.maxVolume = setVolume
            }
          }
        })

        if (sessionDate > record.lastWorkout) {
          record.lastWorkout = sessionDate
        }
      })
    })

    // Convert to response format
    analytics.personalRecords = Object.fromEntries(
      Array.from(exerciseRecords.entries()).map(([name, data]) => [
        name,
        {
          maxWeight: data.maxWeight,
          maxReps: data.maxReps,
          maxVolume: data.maxVolume,
          averageReps: data.totalSets > 0 ? Math.round(data.totalReps / data.totalSets) : 0,
          averageVolume: data.totalSets > 0 ? Math.round(data.totalVolume / data.totalSets) : 0,
          frequency: data.frequency,
          lastWorkout: data.lastWorkout,
          muscleGroups: data.muscleGroups
        }
      ])
    )

    analytics.generalStats = {
      totalWorkouts: workoutDates.size,
      totalSets: totalCompletedSets,
      totalVolume,
      averageWorkoutTime: workoutDates.size > 0 ? Math.round(totalWorkoutTime / workoutDates.size) : 0,
      averageSetsPerWorkout: workoutDates.size > 0 ? Math.round(totalCompletedSets / workoutDates.size) : 0,
      averageVolumePerWorkout: workoutDates.size > 0 ? Math.round(totalVolume / workoutDates.size) : 0,
      uniqueExercises: exerciseRecords.size,
      workoutFrequency: workoutDates.size // Could calculate per week if needed
    }

    // Strength progression (last 12 weeks)
    const strengthProgress = new Map<string, Array<{date: string, weight: number, reps: number}>>()
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

    workoutSessions
      .filter(session => new Date(session.startTime) >= twelveWeeksAgo)
      .forEach(session => {
        const sessionDate = session.startTime
        session.exercises.forEach(sessionEx => {
          const exerciseName = sessionEx.exercise.name
          const bestSet = sessionEx.sets
            .filter(set => set.completed && set.weight && set.reps)
            .reduce((best, current) => {
              const currentScore = (current.weight || 0) * (current.reps || 1)
              const bestScore = (best?.weight || 0) * (best?.reps || 1)
              return currentScore > bestScore ? current : best
            }, null as typeof sessionEx.sets[0] | null)

          if (bestSet && bestSet.weight && bestSet.reps) {
            if (!strengthProgress.has(exerciseName)) {
              strengthProgress.set(exerciseName, [])
            }
            strengthProgress.get(exerciseName)!.push({
              date: new Date(sessionDate).toISOString(),
              weight: bestSet.weight,
              reps: bestSet.reps
            })
          }
        })
      })

    analytics.strengthProgress = Object.fromEntries(
      Array.from(strengthProgress.entries()).map(([name, progress]) => [
        name,
        progress.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      ])
    )

    // Volume metrics by week (last 8 weeks)
    const weeklyVolume = new Map<string, {volume: number, workouts: number, sets: number}>()
    const eightWeeksAgo = new Date()
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    workoutSessions
      .filter(session => new Date(session.startTime) >= eightWeeksAgo)
      .forEach(session => {
        const sessionDate = new Date(session.startTime)
        const weekStart = new Date(sessionDate)
        weekStart.setDate(sessionDate.getDate() - sessionDate.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]

        let sessionVolume = 0
        let sessionSets = 0
        session.exercises.forEach(exercise => {
          const completedSets = exercise.sets.filter(set => set.completed)
          sessionSets += completedSets.length
          completedSets.forEach(set => {
            if (set.weight && set.reps) {
              sessionVolume += set.weight * set.reps
            }
          })
        })

        const current = weeklyVolume.get(weekKey) || { volume: 0, workouts: 0, sets: 0 }
        weeklyVolume.set(weekKey, {
          volume: current.volume + sessionVolume,
          workouts: current.workouts + 1,
          sets: current.sets + sessionSets
        })
      })

    analytics.volumeMetrics = Object.fromEntries(
      Array.from(weeklyVolume.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([week, data]) => [week, data])
    )

    // Filter response based on type parameter
    if (type === "strength") {
      return NextResponse.json({ 
        strengthProgress: analytics.strengthProgress,
        personalRecords: analytics.personalRecords,
        workoutSessions: analytics.workoutSessions
      })
    } else if (type === "volume") {
      return NextResponse.json({ 
        volumeMetrics: analytics.volumeMetrics,
        generalStats: analytics.generalStats,
        workoutSessions: analytics.workoutSessions
      })
    } else if (type === "records") {
      return NextResponse.json({ 
        personalRecords: analytics.personalRecords,
        workoutSessions: analytics.workoutSessions
      })
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching workout analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout analytics" },
      { status: 500 }
    )
  }
}