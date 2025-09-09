import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getWorkoutHistory } from "@/lib/data-store"

export function WeeklyProgress() {
  const workoutHistory = getWorkoutHistory()

  // Get current week's data
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Start of current week (Sunday)

  const weeklyData = []
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(startOfWeek)
    currentDay.setDate(startOfWeek.getDate() + i)

    const dayWorkout = workoutHistory.find((workout) => {
      const workoutDate = new Date(workout.date)
      return workoutDate.toDateString() === currentDay.toDateString()
    })

    // Determine if it's a planned rest day (Wednesday and Sunday in this example)
    const isRestDay = i === 0 || i === 3 // Sunday and Wednesday

    weeklyData.push({
      day: dayNames[i],
      completed: dayWorkout?.status === "completed",
      workout: dayWorkout ? dayWorkout.name : isRestDay ? "Rest Day" : "Planned",
      isRestDay,
    })
  }

  const completedWorkouts = weeklyData.filter((day) => day.completed).length
  const totalPlannedWorkouts = weeklyData.filter((day) => !day.isRestDay).length
  const progressPercentage = totalPlannedWorkouts > 0 ? (completedWorkouts / totalPlannedWorkouts) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Progress</CardTitle>
        <CardDescription>
          {completedWorkouts} of {totalPlannedWorkouts} workouts completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Weekly Goal Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weeklyData.map((day) => (
            <div key={day.day} className="text-center">
              <div className="text-xs text-muted-foreground mb-2">{day.day}</div>
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${
                  day.completed
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : day.isRestDay
                      ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                }`}
              >
                {day.completed ? "✓" : day.isRestDay ? "—" : "○"}
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {day.workout.length > 8 ? `${day.workout.substring(0, 8)}...` : day.workout}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
