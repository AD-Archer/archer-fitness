"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Flame, Target, Calendar } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { logger } from "@/lib/logger"

interface WorkoutSession {
  id: string
  name: string
  startTime: string
  duration: number | null
  status: string
  endTime?: string | Date | null
  workoutTemplate?: {
    id: string
    name: string
    difficulty: string
  }
  exercises: Array<{
    exerciseId: string
    exercise: {
      id: string
      name: string
    }
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
  // Performance data from API
  performanceStatus?: string
  completionRate?: number
  perfectionScore?: number
}

interface NutritionGoals {
  dailyCalories: number
  dailyWater: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

interface LoggedFood {
  id: string
  foodId: string
  quantity: number
  meal: string
  date: string
  food: {
    id: string
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

interface WaterEntry {
  id: string
  amount: number
  date: string
}

export function DashboardStats() {
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to determine if a workout is completed based on API performance status
  const isWorkoutCompleted = useCallback((session: WorkoutSession): boolean => {
    const completionRate = session.completionRate ?? 0

    if (session.performanceStatus === 'perfect') {
      return true
    }

    if (completionRate >= 50) {
      return true
    }

    return false
  }, [])



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user is authenticated first
        const authResponse = await fetch('/api/auth/session')
        const session = await authResponse.json()
        logger.info('Current session:', session)

        if (!session?.user) {
          logger.info('User not authenticated')
          setError('Please sign in to view your workout stats')
          return
        }

        // Fetch workout sessions data - use simpler query like the working components
        const workoutResponse = await fetch('/api/workout-tracker/workout-sessions?limit=20')
        logger.info('Workout API response status:', workoutResponse.status)

        if (workoutResponse.ok) {
          const workoutData = await workoutResponse.json()
          logger.info('API Response:', workoutData)
          logger.info('Number of workouts returned:', workoutData.length)
          
          // Filter out workouts that are not completed or don't have meaningful progress
          const filteredWorkouts = workoutData.filter((session: WorkoutSession) => {
            const completionRate = session.completionRate ?? 0
            const completed = isWorkoutCompleted(session)

            logger.info(`Filtering workout ${session.name}: status=${session.status}, performanceStatus=${session.performanceStatus}, completionRate=${completionRate}%, meetsThreshold=${completed}`)

            return completed
          })
          
          logger.info(`Filtered ${filteredWorkouts.length} out of ${workoutData.length} total workouts`)
          
          // Transform workout data to calculate proper completion status
          const transformedWorkouts = filteredWorkouts.map((session: WorkoutSession) => ({
            ...session,
            // Add calculated completion status for backward compatibility
            isCompleted: isWorkoutCompleted(session)
          }))
          
          logger.info('Transformed workouts:', transformedWorkouts.map((w: WorkoutSession & { isCompleted: boolean }) => ({
            id: w.id,
            name: w.name,
            status: w.status,
            performanceStatus: w.performanceStatus,
            completionRate: w.completionRate,
            isCompleted: w.isCompleted
          })))
          
          setWorkoutSessions(transformedWorkouts)
        } else {
          const errorText = await workoutResponse.text()
          logger.error('API Error:', `${workoutResponse.status} ${workoutResponse.statusText}: ${errorText}`)
          setError(`Failed to load workout data: ${workoutResponse.status}`)
        }

      } catch (error) {
        logger.error('Error fetching dashboard data:', error)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isWorkoutCompleted])

  // Calculate workout statistics
  const calculateWorkoutStats = () => {
    if (workoutSessions.length === 0) {
      return {
        workoutsThisWeek: 0,
        currentStreak: 0,
        weeklyGoal: 0,
        avgDuration: 0,
        workoutsLastWeek: 0,
        avgDurationLastWeek: 0,
      }
    }

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Filter completed workouts using the API's performance status
    const completedWorkouts = workoutSessions.filter(session => {
      const isCompleted = (session as any).isCompleted
      logger.info(`Workout ${session.name}: status=${session.status}, performanceStatus=${session.performanceStatus}, completionRate=${session.completionRate}%, isCompleted=${isCompleted}`)
      return isCompleted
    })

    logger.info(`Total workouts: ${workoutSessions.length}, Completed workouts: ${completedWorkouts.length}`)

    // This week's workouts (current week starting from Monday)
    const currentDate = new Date()
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Start of week (Monday)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // End of week (Sunday)
    endOfWeek.setHours(23, 59, 59, 999)

    logger.info(`Date ranges: This week: ${startOfWeek.toDateString()} to ${endOfWeek.toDateString()}`)
    logger.info(`Current date: ${now.toDateString()}`)

    const workoutsThisWeek = completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime)
      const isInWeek = workoutDate >= startOfWeek && workoutDate <= endOfWeek
      logger.info(`This week check for ${workout.name}: ${workoutDate.toDateString()}, inWeek=${isInWeek}`)
      return isInWeek
    }).length

    // Last week's workouts
    const workoutsLastWeek = completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime)
      return workoutDate >= twoWeeksAgo && workoutDate < weekAgo
    }).length

    // Calculate current streak
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Create a set of workout dates for efficient lookup
    const workoutDates = new Set<string>()
    completedWorkouts.forEach(workout => {
      const workoutDate = new Date(workout.startTime)
      workoutDate.setHours(0, 0, 0, 0)
      workoutDates.add(workoutDate.toDateString())
    })

    // Check consecutive days backwards from today
    for (let i = 0; i < 365; i++) { // Max streak of 365 days
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)

      if (workoutDates.has(checkDate.toDateString())) {
        currentStreak++
      } else {
        break
      }
    }

    // Average duration this week
    const thisWeekWorkoutsWithDuration = completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime)
      const isInWeek = workoutDate >= startOfWeek && workoutDate <= endOfWeek
      
      // Calculate duration with fallback
      let effectiveDuration = workout.duration || 0
      
      // If duration is 0 but we have startTime and endTime, calculate it
      if (effectiveDuration === 0 && workout.endTime) {
        const startTime = new Date(workout.startTime)
        const endTime = new Date(workout.endTime)
        effectiveDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000) // Convert to seconds
      }
      
      const hasDuration = effectiveDuration > 0
      
      logger.info(`Duration check for ${workout.name}: date=${workoutDate.toDateString()}, inWeek=${isInWeek}, duration=${workout.duration}, endTime=${workout.endTime}, effectiveDuration=${effectiveDuration}, hasDuration=${hasDuration}`)
      return isInWeek && hasDuration
    })

    logger.info(`This week workouts with duration: ${thisWeekWorkoutsWithDuration.length} out of ${completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime)
      return workoutDate >= startOfWeek && workoutDate <= endOfWeek
    }).length}`)

    const avgDuration = thisWeekWorkoutsWithDuration.length > 0
      ? Math.round(thisWeekWorkoutsWithDuration.reduce((sum: number, w) => {
          let effectiveDuration = w.duration || 0
          
          // If duration is 0 but we have startTime and endTime, calculate it
          if (effectiveDuration === 0 && w.endTime) {
            const startTime = new Date(w.startTime)
            const endTime = new Date(w.endTime)
            effectiveDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
          }
          
          return sum + effectiveDuration
        }, 0) / thisWeekWorkoutsWithDuration.length / 60)
      : 0

    // Last week's workouts and average
    const lastWeekStart = new Date(startOfWeek)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(endOfWeek)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)

    logger.info(`Date ranges: Last week: ${lastWeekStart.toDateString()} to ${lastWeekEnd.toDateString()}`)

    const lastWeekWorkoutsWithDuration = completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime)
      const isInLastWeek = workoutDate >= lastWeekStart && workoutDate <= lastWeekEnd
      
      // Calculate duration with fallback
      let effectiveDuration = workout.duration || 0
      
      // If duration is 0 but we have startTime and endTime, calculate it
      if (effectiveDuration === 0 && workout.endTime) {
        const startTime = new Date(workout.startTime)
        const endTime = new Date(workout.endTime)
        effectiveDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000) // Convert to seconds
      }
      
      const hasDuration = effectiveDuration > 0
      
      logger.info(`Last week duration check for ${workout.name}: date=${workoutDate.toDateString()}, inLastWeek=${isInLastWeek}, duration=${workout.duration}, endTime=${workout.endTime}, effectiveDuration=${effectiveDuration}, hasDuration=${hasDuration}`)
      return isInLastWeek && hasDuration
    })

    logger.info(`Last week workouts with duration: ${lastWeekWorkoutsWithDuration.length} out of ${completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime)
      return workoutDate >= lastWeekStart && workoutDate <= lastWeekEnd
    }).length}`, {
      lastWeekWorkoutsWithDuration: lastWeekWorkoutsWithDuration.length,
      totalCompletedWorkoutsLastWeek: completedWorkouts.filter(workout => {
        const workoutDate = new Date(workout.startTime)
        return workoutDate >= lastWeekStart && workoutDate <= lastWeekEnd
      }).length
    })

    const avgDurationLastWeek = lastWeekWorkoutsWithDuration.length > 0
      ? Math.round(lastWeekWorkoutsWithDuration.reduce((sum: number, w) => {
          let effectiveDuration = w.duration || 0
          
          // If duration is 0 but we have startTime and endTime, calculate it
          if (effectiveDuration === 0 && w.endTime) {
            const startTime = new Date(w.startTime)
            const endTime = new Date(w.endTime)
            effectiveDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
          }
          
          return sum + effectiveDuration
        }, 0) / lastWeekWorkoutsWithDuration.length / 60)
      : 0

    return {
      workoutsThisWeek,
      currentStreak,
      weeklyGoal: Math.round((workoutsThisWeek / 3) * 100), // Progress towards 3 workouts per week goal
      avgDuration,
      workoutsLastWeek,
      avgDurationLastWeek,
    }
  }

  const stats = calculateWorkoutStats()

  // Placeholder calculations for future nutrition features
  // const todaysCalories = loggedFoods.reduce((total, loggedFood) => {
  //   return total + (loggedFood.food.calories * loggedFood.quantity)
  // }, 0)

  // const todaysWaterIntake = waterEntries.reduce((total, entry) => total + entry.amount, 0)

  const workoutStats = [
    {
      title: "Workouts This Week",
      value: stats.workoutsThisWeek.toString(),
      change: stats.workoutsThisWeek === 0 ? "Complete your first workout!" : 
              stats.workoutsLastWeek > 0
        ? `${stats.workoutsThisWeek > stats.workoutsLastWeek ? '+' : ''}${stats.workoutsThisWeek - stats.workoutsLastWeek} from last week`
        : "First week!",
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Current Streak",
      value: `${stats.currentStreak} days`,
      change: stats.currentStreak === 0 ? "Start your workout streak!" : "Keep it up!",
      icon: Flame,
      color: "text-orange-600",
    },
    {
      title: "Weekly Goal",
      value: stats.workoutsThisWeek === 0 ? "0%" : `${Math.round((stats.workoutsThisWeek / 3) * 100)}%`,
      change: stats.workoutsThisWeek === 0 ? "Complete your first workout!" : `${stats.workoutsThisWeek} of 3 workouts completed`,
      icon: Target,
      color: "text-green-600",
    },
    {
      title: "Avg Session",
      value: stats.avgDuration === 0 ? "0 min" : `${stats.avgDuration} min`,
      change: stats.avgDuration === 0 ? "Complete a workout to see average!" :
              stats.avgDurationLastWeek > 0 && stats.avgDuration > 0
        ? `${stats.avgDuration > stats.avgDurationLastWeek ? '+' : ''}${stats.avgDuration - stats.avgDurationLastWeek} min from last week`
        : stats.avgDuration > 0 ? "First week!" : "No sessions yet",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-8 bg-muted rounded animate-pulse w-16"></div>
                <div className="h-2 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse w-12 mb-1"></div>
                <div className="h-3 bg-muted rounded animate-pulse w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-lg font-semibold mb-4">Workout Overview</h2>
        {workoutSessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">No workout data found</p>
                <p className="text-sm">Complete your first workout to see your stats!</p>
                <p className="text-xs mt-2">API Status: {error ? `Error: ${error}` : 'Connected'}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workoutStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
