"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
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

interface ApiWorkoutSession {
  id: string
  name: string
  status: string
  startTime: string
  exercises: Array<{
    exerciseId: string
    exercise: {
      name: string
    }
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
}

interface CompletedDay {
  id: string
  userId: string
  date: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export function WeeklyProgress() {
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([])
  const [completedDays, setCompletedDays] = useState<CompletedDay[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<{ day: string; date: Date; workouts: WorkoutSession[] } | null>(null)
  const [showDayDialog, setShowDayDialog] = useState(false)
  const [markingComplete, setMarkingComplete] = useState(false)
  const router = useRouter()

  // Helper function to calculate completion percentage
  const calculateCompletionRate = (exercises: Array<{ sets: Array<{ completed: boolean }> }>) => {
    if (exercises.length === 0) return 0

    const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
    if (totalSets === 0) return 0

    const completedSets = exercises.reduce((total, exercise) =>
      total + exercise.sets.filter(set => set.completed).length, 0)

    return Math.round((completedSets / totalSets) * 100)
  }

  // Helper function to get status based on completion (from today's focus logic)
  const getStatusFromCompletion = useCallback((status: string, exercises: Array<{ sets: Array<{ completed: boolean }> }>): "completed" | "in_progress" => {
    const completionRate = calculateCompletionRate(exercises)

    if (completionRate >= 100) {
      return "completed"
    } else {
      return "in_progress"
    }
  }, [])

  // Handle day click to show workouts for that day
  const handleDayClick = (dayIndex: number) => {
    const currentDay = new Date(startOfWeek.getTime() + dayIndex * 24 * 60 * 60 * 1000)

    // Create date range for the entire day (from start to end)
    const dayStart = new Date(currentDay)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(currentDay)
    dayEnd.setHours(23, 59, 59, 999)

    const dayWorkouts = workoutSessions.filter((workout) => {
      const workoutDate = new Date(workout.startTime)
      return workoutDate >= dayStart && workoutDate <= dayEnd
    })

    logger.info(`Day ${dayNames[dayIndex]} clicked - found ${dayWorkouts.length} workouts - Date: ${currentDay.toISOString().split('T')[0]} - Valid: ${!isNaN(currentDay.getTime())}`)

    // Always show dialog, even if no workouts (for rest days or to mark complete)
    setSelectedDay({
      day: dayNames[dayIndex],
      date: currentDay,
      workouts: dayWorkouts
    })
    setShowDayDialog(true)
  }

  // Helper function to check if a day is marked as completed
  const isDayCompleted = (date: Date) => {
    return completedDays.some((completedDay) => {
      const completedDate = new Date(completedDay.date)
      // Normalize both dates to start of day for comparison
      const normalizedCompletedDate = new Date(completedDate)
      normalizedCompletedDate.setHours(0, 0, 0, 0)
      const normalizedDate = new Date(date)
      normalizedDate.setHours(0, 0, 0, 0)
      return normalizedCompletedDate.getTime() === normalizedDate.getTime() && completedDay.status === "completed"
    })
  }

  // Mark all workouts for a day as completed or incomplete (toggle)
  const markDayComplete = async () => {
    if (!selectedDay) return

    setMarkingComplete(true)
    const currentlyCompleted = isDayCompleted(selectedDay.date)

    try {
      // Compute local-midnight for the selected day to avoid UTC/local timezone drift
      const localMidnight = new Date(
        selectedDay.date.getFullYear(),
        selectedDay.date.getMonth(),
        selectedDay.date.getDate(),
        0, 0, 0, 0
      )
      const dateMsLocal = localMidnight.getTime()

      if (currentlyCompleted) {
        // Mark as incomplete - delete the completed day record
        const deleteResponse = await fetch('/api/schedule/completed-days', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Send the user's local midnight timestamp to ensure correct day selection on server
            dateMsLocal,
          }),
        })

        if (deleteResponse.ok) {
          // Re-fetch completed days to ensure UI is in sync
          const refreshResponse = await fetch('/api/schedule/completed-days')
          if (refreshResponse.ok) {
            const refreshedData: CompletedDay[] = await refreshResponse.json()
            setCompletedDays(refreshedData)
          }

          logger.info(`Day marked as incomplete: ${selectedDay.day} - Date: ${selectedDay.date.toDateString()}`)
        } else {
          throw new Error('Failed to mark day as incomplete')
        }
      } else {
        // Mark as complete - create/update the completed day record
        // First, mark all workouts for this day as completed
        const updatePromises = selectedDay.workouts.map(async (workout) => {
          const response = await fetch(`/api/workout-tracker/workout-sessions/${workout.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "completed",
              endTime: new Date().toISOString(),
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to update workout ${workout.id}`)
          }

          return response.json()
        })

        await Promise.all(updatePromises)

        // Create a completed day record in the database
        const completedDayResponse = await fetch('/api/schedule/completed-days', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Send the user's local midnight timestamp to ensure correct day selection on server
            dateMsLocal,
            status: 'completed',
            notes: `Marked complete from weekly progress on ${new Date().toLocaleDateString()}`
          }),
        })

        logger.info(`Marking day as completed: ${selectedDay.day} - Date: ${selectedDay.date.toDateString()} - localMidnightMs: ${dateMsLocal}`)

        if (completedDayResponse.ok) {
          // Re-fetch completed days to ensure UI is in sync
          const refreshResponse = await fetch('/api/schedule/completed-days')
          if (refreshResponse.ok) {
            const refreshedData: CompletedDay[] = await refreshResponse.json()
            setCompletedDays(refreshedData)
          }

          logger.info(`Day marked as completed: ${selectedDay.day}`)
        }
      }

      setShowDayDialog(false)
    } catch (error) {
      logger.error('Error toggling day completion:', error)
    } finally {
      setMarkingComplete(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch workout sessions
        const sessionsResponse = await fetch('/api/workout-tracker/workout-sessions?limit=100')
        if (sessionsResponse.ok) {
          const data: ApiWorkoutSession[] = await sessionsResponse.json()
          
          // Transform sessions to match our interface (same as today's focus)
          const transformedSessions = data.map((session) => ({
            ...session,
            exercises: session.exercises?.map((ex) => ({
              exerciseId: ex.exerciseId,
              exerciseName: ex.exercise?.name || 'Unknown Exercise',
              sets: ex.sets || []
            })) || []
          }))
          
          setWorkoutSessions(transformedSessions)
        }

        // Fetch completed days
        const completedDaysResponse = await fetch('/api/schedule/completed-days')
        if (completedDaysResponse.ok) {
          const completedDaysData: CompletedDay[] = await completedDaysResponse.json()
          setCompletedDays(completedDaysData)
        }
      } catch (error) {
        logger.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get current week's data
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Start of current week (Sunday)

  const weeklyData = []
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000)

    // Find ALL workout sessions for this day
    const dayWorkouts = workoutSessions.filter((workout) => {
      const workoutDate = new Date(workout.startTime)
      return workoutDate.toDateString() === currentDay.toDateString()
    })

    // Determine if it's a planned rest day (Wednesday and Sunday in this example)
    const isRestDay = i === 0 || i === 3 // Sunday and Wednesday

    // Check if any workout has been started (has completed sets)
    const hasAnyProgress = dayWorkouts.some((workout) => 
      workout.exercises?.some((exercise) => 
        exercise.sets?.some((set) => set.completed)
      )
    )

    // Check if this day is marked as completed in the database
    const dayCompletedInDb = completedDays.some((completedDay) => {
      const completedDate = new Date(completedDay.date)
      // Normalize both dates to start of day for comparison
      const normalizedCompletedDate = new Date(completedDate)
      normalizedCompletedDate.setHours(0, 0, 0, 0)
      const normalizedCurrentDay = new Date(currentDay)
      normalizedCurrentDay.setHours(0, 0, 0, 0)
      return normalizedCompletedDate.getTime() === normalizedCurrentDay.getTime() && completedDay.status === "completed"
    })

    // Check if all workouts for this day are completed
    const allWorkoutsCompleted = dayWorkouts.length > 0 && dayWorkouts.every((workout) => {
      const completionRate = calculateCompletionRate(workout.exercises || [])
      const actualStatus = getStatusFromCompletion(workout.status, workout.exercises || [])
      return actualStatus === "completed" || completionRate >= 100
    })

    // A day is considered completed if it's marked as completed in DB OR all workouts are completed
    const isDayCompleted = dayCompletedInDb || allWorkoutsCompleted

    // Determine the display workout (most recent one)
    const dayWorkout = dayWorkouts.length > 0 ? dayWorkouts[dayWorkouts.length - 1] : null

    // Calculate overall completion rate for the day
    const completionRate = dayWorkout ? calculateCompletionRate(dayWorkout.exercises || []) : 0

    weeklyData.push({
      day: dayNames[i],
      completed: isDayCompleted,
      hasProgress: hasAnyProgress,
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
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[280px] sm:min-w-0">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="text-center min-w-0 flex-shrink-0">
                  <div className="text-xs text-muted-foreground mb-1 sm:mb-2">...</div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto rounded-full bg-muted animate-pulse"></div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Weekly Progress</CardTitle>
          <CardDescription>
            {completedWorkouts} of {totalPlannedWorkouts} workouts completed • {completedDays.length} total days completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mini Calendar View */}
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[280px] sm:min-w-0">
              {weeklyData.map((day, index) => {
                const currentDay = new Date(startOfWeek.getTime() + index * 24 * 60 * 60 * 1000)
                const isToday = (() => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const normalizedCurrent = new Date(currentDay)
                  normalizedCurrent.setHours(0, 0, 0, 0)
                  return today.getTime() === normalizedCurrent.getTime()
                })()
                
                return (
                  <div key={day.day} className="text-center min-w-0 flex-shrink-0">
                    {/* Day name */}
                    <div className="text-xs text-muted-foreground mb-1 font-medium">
                      {day.day}
                    </div>
                    
                    {/* Date circle */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full flex items-center justify-center text-xs sm:text-sm font-medium border-2 transition-colors cursor-pointer hover:scale-105 ${
                        isToday
                          ? "border-primary bg-primary/10 text-primary"
                          : markingComplete && selectedDay?.date && currentDay && (() => {
                              const normalizedSelected = new Date(selectedDay.date)
                              normalizedSelected.setHours(0, 0, 0, 0)
                              const normalizedCurrent = new Date(currentDay)
                              normalizedCurrent.setHours(0, 0, 0, 0)
                              return normalizedSelected.getTime() === normalizedCurrent.getTime()
                            })()
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse"
                            : day.completed
                              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                              : day.hasProgress
                                ? "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                              : day.isRestDay
                                ? "border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                : "border-gray-200 bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-400"
                      }`}
                      onClick={() => handleDayClick(index)}
                    >
                      {markingComplete && selectedDay?.date && currentDay && (() => {
                          const normalizedSelected = new Date(selectedDay.date)
                          normalizedSelected.setHours(0, 0, 0, 0)
                          const normalizedCurrent = new Date(currentDay)
                          normalizedCurrent.setHours(0, 0, 0, 0)
                          return normalizedSelected.getTime() === normalizedCurrent.getTime()
                        })() ? "..." : currentDay.getDate()}
                    </div>
                    
                    {/* Status indicator */}
                    <div className="mt-1">
                      {day.completed ? (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mx-auto"></div>
                      ) : day.hasProgress ? (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full mx-auto"></div>
                      ) : day.isRestDay ? (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full mx-auto"></div>
                      ) : (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mx-auto"></div>
                      )}
                    </div>
                    
                    {/* Workout name (truncated) */}
                    <div className="text-xs text-muted-foreground mt-1 max-w-full truncate hidden sm:block">
                      {day.workout.length > 6 ? `${day.workout.substring(0, 6)}...` : day.workout}
                    </div>
                  </div>
                )
              })}
            </div>
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

      {/* Day Workouts Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl">
              {selectedDay && `${selectedDay.day}, ${selectedDay.date && !isNaN(selectedDay.date.getTime()) ? selectedDay.date.toLocaleDateString() : 'Invalid Date'}`}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedDay && selectedDay.workouts.length > 0
                ? `${selectedDay.workouts.length} workout${selectedDay.workouts.length !== 1 ? 's' : ''} for this day`
                : "No workouts scheduled for this day"
              }
              {selectedDay && isDayCompleted(selectedDay.date) && selectedDay.date && !isNaN(selectedDay.date.getTime()) && (
                <span className="block mt-2 text-green-600 font-medium">
                  ✓ This day is marked as completed
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => {
                  setShowDayDialog(false)
                  // Navigate to history/workouts page
                  router.push('/workouts')
                }}
                variant="outline"
                className="h-12"
              >
                View History
              </Button>
              <Button 
                onClick={markDayComplete}
                disabled={markingComplete}
                className={`h-12 ${
                  selectedDay && isDayCompleted(selectedDay.date)
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } disabled:opacity-50`}
              >
                {markingComplete ? (
                  "Processing..."
                ) : selectedDay && isDayCompleted(selectedDay.date) ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Mark Day Incomplete
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Mark Day Complete
                  </>
                )}
              </Button>
            </div>

            {/* Workout List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selectedDay && selectedDay.workouts.length > 0 ? (
                selectedDay.workouts.map((workout, index) => {
                  const completionRate = calculateCompletionRate(workout.exercises || [])
                  const actualStatus = getStatusFromCompletion(workout.status, workout.exercises || [])
                  const isCompleted = actualStatus === "completed" || completionRate >= 100

                  return (
                    <div 
                      key={workout.id} 
                      className={`p-3 rounded-lg border ${
                        isCompleted 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                          : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-medium text-sm truncate block max-w-[120px]" title={workout.name}>
                              {workout.name}
                            </span>
                            {isCompleted && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {workout.exercises?.length || 0} exercises • {completionRate}% complete
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <div className="text-sm">
                    {selectedDay && (selectedDay.date.getDay() === 0 || selectedDay.date.getDay() === 3)
                      ? "Rest day - no workouts scheduled"
                      : "No workouts found for this day"
                    }
                  </div>
                  <div className="text-xs mt-2">
                    You can still mark this day as complete if you did other activities
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}