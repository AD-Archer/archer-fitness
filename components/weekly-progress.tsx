"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

interface WorkoutSession {
  id: string
  name: string
  startTime: string
  status: string
}

export function WeeklyProgress() {
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkoutSessions = async () => {
      try {
        const response = await fetch('/api/workout-tracker/workout-sessions?limit=50')
        if (response.ok) {
          const data = await response.json()
          setWorkoutSessions(data)
        }
      } catch (error) {
        console.error('Failed to fetch workout sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkoutSessions()
  }, [])

  // Get current week's data
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Start of current week (Sunday)

  const weeklyData = []
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(startOfWeek)
    currentDay.setDate(startOfWeek.getDate() + i)

    const dayWorkout = workoutSessions.find((workout) => {
      const workoutDate = new Date(workout.startTime)
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Progress</CardTitle>
          <CardDescription>Loading workout data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Weekly Goal Progress</span>
              <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
            </div>
            <Progress value={0} className="h-3" />
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="text-center min-w-0">
                <div className="text-xs text-muted-foreground mb-1 sm:mb-2">...</div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto rounded-full bg-muted animate-pulse"></div>
                <div className="text-xs text-muted-foreground mt-1">
                  <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

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

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weeklyData.map((day) => (
            <div key={day.day} className="text-center min-w-0">
              <div className="text-xs text-muted-foreground mb-1 sm:mb-2">{day.day}</div>
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${
                  day.completed
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : day.isRestDay
                      ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                }`}
              >
                {day.completed ? "✓" : day.isRestDay ? "—" : "○"}
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate max-w-full">
                {day.workout.length > 6 ? `${day.workout.substring(0, 6)}...` : day.workout}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
