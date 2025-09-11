"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Calendar, Flame, Target, Apple, Droplets } from "lucide-react"
import { useEffect, useState } from "react"

interface WorkoutSession {
  id: string
  name: string
  startTime: string
  duration: number | null
  status: string
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
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals | null>(null)
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>([])
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch workout sessions
        const sessionsResponse = await fetch('/api/workout-tracker/workout-sessions?limit=50')
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json()
          setWorkoutSessions(sessionsData)
        }

        // Fetch nutrition goals (you might need to create this endpoint)
        // For now, we'll use default values
        setNutritionGoals({
          dailyCalories: 2200,
          dailyWater: 2500,
          protein: 150,
          carbs: 250,
          fat: 75,
          fiber: 30,
        })

        // Fetch logged foods (fallback to empty if API doesn't exist)
        try {
          const foodsResponse = await fetch('/api/meals/today')
          if (foodsResponse.ok) {
            const foodsData = await foodsResponse.json()
            setLoggedFoods(foodsData.loggedFoods || [])
          }
        } catch {
          console.warn('Meals API not available, using empty nutrition data')
          setLoggedFoods([])
        }

        // Fetch water entries (fallback to empty if API doesn't exist)
        try {
          const waterResponse = await fetch('/api/health/water/today')
          if (waterResponse.ok) {
            const waterData = await waterResponse.json()
            setWaterEntries(waterData.entries || [])
          }
        } catch {
          console.warn('Water API not available, using empty water data')
          setWaterEntries([])
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

    // Filter completed workouts
    const completedWorkouts = workoutSessions.filter(session => session.status === 'completed')

    // This week's workouts
    const workoutsThisWeek = completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime)
      return workoutDate >= weekAgo
    }).length

    // Last week's workouts
    const workoutsLastWeek = completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime)
      return workoutDate >= twoWeeksAgo && workoutDate < weekAgo
    }).length

    // Calculate current streak
    let currentStreak = 0
    const sortedWorkouts = completedWorkouts
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].startTime)
      workoutDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today.getTime() - currentStreak * 24 * 60 * 60 * 1000)

      if (workoutDate.getTime() === expectedDate.getTime()) {
        currentStreak++
      } else {
        break
      }
    }

    // Average duration this week
    const thisWeekWorkouts = completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime)
      return workoutDate >= weekAgo
    })

    const avgDuration = thisWeekWorkouts.length > 0
      ? Math.round(thisWeekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / thisWeekWorkouts.length / 60)
      : 0

    // Average duration last week
    const lastWeekWorkouts = completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.startTime)
      return workoutDate >= twoWeeksAgo && workoutDate < weekAgo
    })

    const avgDurationLastWeek = lastWeekWorkouts.length > 0
      ? Math.round(lastWeekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / lastWeekWorkouts.length / 60)
      : 0

    return {
      workoutsThisWeek,
      currentStreak,
      weeklyGoal: workoutsThisWeek,
      avgDuration,
      workoutsLastWeek,
      avgDurationLastWeek,
    }
  }

  const stats = calculateWorkoutStats()

  // Calculate nutrition stats
  const todaysCalories = loggedFoods.reduce((total, loggedFood) => {
    return total + (loggedFood.food.calories * loggedFood.quantity)
  }, 0)

  const todaysWaterIntake = waterEntries.reduce((total, entry) => total + entry.amount, 0)

  const workoutStats = [
    {
      title: "Workouts This Week",
      value: stats.workoutsThisWeek.toString(),
      change: stats.workoutsLastWeek > 0
        ? `${stats.workoutsThisWeek > stats.workoutsLastWeek ? '+' : ''}${stats.workoutsThisWeek - stats.workoutsLastWeek} from last week`
        : "First week!",
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Current Streak",
      value: `${stats.currentStreak} days`,
      change: stats.currentStreak > 0 ? "Keep it up!" : "Start your streak!",
      icon: Flame,
      color: "text-orange-600",
    },
    {
      title: "Weekly Goal",
      value: stats.workoutsThisWeek > 0 ? `${Math.round((stats.workoutsThisWeek / Math.max(stats.workoutsThisWeek, 3)) * 100)}%` : "0%",
      change: stats.workoutsThisWeek > 0 ? `${stats.workoutsThisWeek} of ${Math.max(stats.workoutsThisWeek, 3)} workouts` : "Set your first goal!",
      icon: Target,
      color: "text-green-600",
    },
    {
      title: "Avg Session",
      value: stats.avgDuration > 0 ? `${stats.avgDuration} min` : "0 min",
      change: stats.avgDurationLastWeek > 0 && stats.avgDuration > 0
        ? `${stats.avgDuration > stats.avgDurationLastWeek ? '+' : ''}${stats.avgDuration - stats.avgDurationLastWeek} min from last week`
        : stats.avgDuration > 0 ? "First week!" : "No sessions yet",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ]

  const nutritionStats = nutritionGoals ? [
    {
      title: "Daily Calories",
      current: Math.round(todaysCalories),
      target: nutritionGoals.dailyCalories,
      unit: "cal",
      icon: Apple,
      color: "text-emerald-600",
    },
    {
      title: "Water Intake",
      current: todaysWaterIntake,
      target: nutritionGoals.dailyWater,
      unit: "ml",
      icon: Droplets,
      color: "text-blue-600",
    },
  ] : []

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <h2 className="text-lg font-semibold mb-4">Today&#39;s Nutrition</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {nutritionStats.map((stat) => {
            const Icon = stat.icon
            const progress = (stat.current / stat.target) * 100
            const isComplete = progress >= 100

            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{stat.current.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      / {stat.target.toLocaleString()} {stat.unit}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{Math.round(progress)}% of goal</span>
                      <span className={isComplete ? "text-green-600" : ""}>
                        {isComplete ? "Goal reached!" : `${stat.target - stat.current} ${stat.unit} remaining`}
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Workout Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {workoutStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
