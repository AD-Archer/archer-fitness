"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { logger } from "@/lib/logger"

interface WorkoutSession {
  id: string
  name: string
  startTime: string
  status: string
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
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
        logger.error('Failed to fetch workout sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkoutSessions()
  }, [])

  // Helper function to calculate completion rate
  const calculateCompletionRate = (exercises: Array<{ sets: Array<{ completed: boolean }> }>) => {
    if (!exercises || exercises.length === 0) return 0

    const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
    if (totalSets === 0) return 0

    const completedSets = exercises.reduce((total, exercise) =>
      total + exercise.sets.filter(set => set.completed).length, 0)

    return Math.round((completedSets / totalSets) * 100)
  }

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

    // Calculate completion based on actual exercise/set completion
    const completionRate = dayWorkout ? calculateCompletionRate(dayWorkout.exercises || []) : 0
    const isCompleted = completionRate >= 100

    weeklyData.push({
      day: dayNames[i],
      completed: isCompleted,
      workout: dayWorkout ? dayWorkout.name : isRestDay ? "Rest Day" : "Planned",
      isRestDay,
      completionRate,
    })
  }

  const completedWorkouts = weeklyData.filter((day) => day.completed).length
  const totalPlannedWorkouts = weeklyData.filter((day) => !day.isRestDay).length

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
            <div className="h-3 bg-muted rounded animate-pulse"></div>
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
      <CardContent>
        {/* Mini Calendar View */}
        <div className="grid grid-cols-7 gap-1">
          {weeklyData.map((day, index) => {
            const isToday = new Date().toDateString() === new Date(startOfWeek.getTime() + index * 24 * 60 * 60 * 1000).toDateString()
            
            return (
              <div key={day.day} className="text-center">
                {/* Day name */}
                <div className="text-xs text-muted-foreground mb-2 font-medium">
                  {day.day}
                </div>
                
                {/* Date circle */}
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                    isToday
                      ? "border-primary bg-primary/10 text-primary"
                      : day.completed
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : day.completionRate > 0
                          ? "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                          : day.isRestDay
                            ? "border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            : "border-gray-200 bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-400"
                  }`}
                >
                  {new Date(startOfWeek.getTime() + index * 24 * 60 * 60 * 1000).getDate()}
                </div>
                
                {/* Status indicator */}
                <div className="mt-1">
                  {day.completed ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
                  ) : day.completionRate > 0 ? (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto"></div>
                  ) : day.isRestDay ? (
                    <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto"></div>
                  ) : (
                    <div className="w-2 h-2 bg-blue-400 rounded-full mx-auto"></div>
                  )}
                </div>
                
                {/* Workout name (truncated) */}
                <div className="text-xs text-muted-foreground mt-1 max-w-full truncate">
                  {day.workout.length > 8 ? `${day.workout.substring(0, 8)}...` : day.workout}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Planned</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span>Rest</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
