import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Calendar, Flame, Target, Apple, Droplets } from "lucide-react"
import {
  getWorkoutHistory,
  getTodaysLoggedFoods,
  getTodaysWaterIntake,
  getNutritionGoals,
  getFoodDatabase,
} from "@/lib/data-store"

export function DashboardStats() {
  const workoutHistory = getWorkoutHistory()
  const recentWorkouts = workoutHistory.slice(0, 7) // Last 7 workouts
  const completedThisWeek = recentWorkouts.filter((w) => {
    const workoutDate = new Date(w.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return workoutDate >= weekAgo && w.status === "completed"
  }).length

  const currentStreak = 12 // This would be calculated from workout history
  const avgDuration =
    recentWorkouts.length > 0
      ? Math.round(recentWorkouts.reduce((sum, w) => sum + w.duration, 0) / recentWorkouts.length)
      : 0

  const workoutStats = [
    {
      title: "Workouts This Week",
      value: completedThisWeek.toString(),
      change: "+2 from last week",
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Current Streak",
      value: `${currentStreak} days`,
      change: "Personal best!",
      icon: Flame,
      color: "text-orange-600",
    },
    {
      title: "Weekly Goal",
      value: `${Math.round((completedThisWeek / 5) * 100)}%`,
      change: `${completedThisWeek} of 5 workouts`,
      icon: Target,
      color: "text-green-600",
    },
    {
      title: "Avg Session",
      value: `${avgDuration} min`,
      change: "+8 min from last week",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ]

  const nutritionGoals = getNutritionGoals()
  const todaysLoggedFoods = getTodaysLoggedFoods()
  const foodDatabase = getFoodDatabase()
  const todaysWaterIntake = getTodaysWaterIntake()

  // Calculate today's calories from logged foods
  const todaysCalories = todaysLoggedFoods.reduce((total, loggedFood) => {
    const food = foodDatabase.find((f) => f.id === loggedFood.foodId)
    return total + (food ? food.calories * loggedFood.quantity : 0)
  }, 0)

  const nutritionStats = [
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
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Today's Nutrition</h2>
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
