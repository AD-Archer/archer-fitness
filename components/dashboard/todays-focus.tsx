"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface ScheduledWorkout {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  day: number
  duration?: number
  category?: string
  difficulty?: string
  type: string
  generatorData?: {
    exercises: Array<{
      name: string
      sets: number
      reps: string
      instructions?: string
      targetMuscles?: string[]
    }>
  }
}

interface TodaysWorkoutSession {
  id: string
  name: string
  status: string
  startTime: string
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

interface ApiTodaysWorkoutSession {
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

export function TodaysFocus() {
  // Helper function to calculate completion percentage
  const calculateCompletionRate = (exercises: Array<{ sets: Array<{ completed: boolean }> }>) => {
    if (exercises.length === 0) return 0

    const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
    if (totalSets === 0) return 0

    const completedSets = exercises.reduce((total, exercise) =>
      total + exercise.sets.filter(set => set.completed).length, 0)

    return Math.round((completedSets / totalSets) * 100)
  }

  // Helper function to get status based on completion
  const getStatusFromCompletion = useCallback((status: string, exercises: Array<{ sets: Array<{ completed: boolean }> }>): "completed" | "in_progress" => {
    const completionRate = calculateCompletionRate(exercises)

    if (completionRate >= 100) {
      return "completed"
    } else {
      return "in_progress"
    }
  }, [])
  const [todaysWorkouts, setTodaysWorkouts] = useState<ScheduledWorkout[]>([])
  const [todaysSession, setTodaysSession] = useState<TodaysWorkoutSession | null>(null)
  const [completedToday, setCompletedToday] = useState(false)
  const [allWorkoutsCompleted, setAllWorkoutsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchTodaysFocus = async () => {
      try {
        // Check if there's an active session today
        const today = new Date().toISOString().split('T')[0]
        const sessionsResponse = await fetch(`/api/workout-tracker/workout-sessions?date=${today}`)
        
        let todaysWorkout = null
        let hasCompletedToday = false
        let todaysScheduledWorkouts: ScheduledWorkout[] = []
        let todaysCompletedSessions: TodaysWorkoutSession[] = []
        
        if (sessionsResponse.ok) {
          const sessions: ApiTodaysWorkoutSession[] = await sessionsResponse.json()
          
          // Transform sessions to match our interface
          const transformedSessions = sessions.map((session) => ({
            ...session,
            exercises: session.exercises?.map((ex) => ({
              exerciseId: ex.exerciseId,
              exerciseName: ex.exercise?.name || 'Unknown Exercise',
              sets: ex.sets || []
            })) || []
          }))
          
          // Find the most recent session (active, paused, or completed)
          const recentSession = transformedSessions.find((session) => 
            session.status === 'active' || session.status === 'paused' || session.status === 'completed'
          )
          
          todaysWorkout = recentSession || null
          
          // Check completion status
          const completedSessions = transformedSessions.filter((session) => 
            session.status === 'completed' || getStatusFromCompletion(session.status, session.exercises) === 'completed'
          )
          
          hasCompletedToday = completedSessions.length > 0
          
          setTodaysSession(todaysWorkout)
          setCompletedToday(hasCompletedToday)
          
          // Store completed sessions for later matching
          todaysCompletedSessions = completedSessions
        }

        // Get today's scheduled workouts
        const todayDate = new Date()
        const weekStart = new Date(todayDate)
        weekStart.setDate(todayDate.getDate() - todayDate.getDay()) // Start of week (Sunday)
        const weekStartStr = weekStart.toISOString().split('T')[0]
        
        const scheduleResponse = await fetch(`/api/schedule?weekStart=${weekStartStr}`)
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json()
          const todayDayOfWeek = todayDate.getDay() // 0 = Sunday, 1 = Monday, etc.
          
          // Filter workouts for today
          todaysScheduledWorkouts = scheduleData.schedule?.items?.filter((item: ScheduledWorkout) => 
            item.day === todayDayOfWeek && item.type === 'workout'
          ) || []
          
          setTodaysWorkouts(todaysScheduledWorkouts)
        }
        
        // Check if all scheduled workouts are completed
        if (todaysScheduledWorkouts.length > 0 && todaysCompletedSessions.length > 0) {
          // Match completed sessions to scheduled workouts
          const matchedCompletedWorkouts = new Set<string>()
          
          todaysCompletedSessions.forEach((session: TodaysWorkoutSession) => {
            // Try to match by name/title similarity
            todaysScheduledWorkouts.forEach((scheduled: ScheduledWorkout) => {
              // Simple name matching - could be improved with more sophisticated matching
              const sessionName = session.name.toLowerCase().trim()
              const scheduledTitle = scheduled.title.toLowerCase().trim()
              
              // Check for exact match or if scheduled title is contained in session name
              if (sessionName === scheduledTitle || 
                  sessionName.includes(scheduledTitle) || 
                  scheduledTitle.includes(sessionName)) {
                matchedCompletedWorkouts.add(scheduled.id)
              }
            })
          })
          
          // Check if all scheduled workouts have been completed
          const allScheduledCompleted = todaysScheduledWorkouts.every((scheduled: ScheduledWorkout) => 
            matchedCompletedWorkouts.has(scheduled.id)
          )
          
          setAllWorkoutsCompleted(allScheduledCompleted)
        }
      } catch (error) {
        console.error('Failed to fetch today\'s focus:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTodaysFocus()
  }, [getStatusFromCompletion])

  const continueWorkout = () => {
    if (todaysSession) {
      router.push(`/track?sessionId=${todaysSession.id}`)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today&apos;s Focus</CardTitle>
          <CardDescription>Loading recommendation...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 rounded-lg bg-muted animate-pulse">
            <div className="h-5 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="h-4 bg-muted rounded w-16"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
            </div>
            <Progress value={0} className="h-2" />
          </div>
          <div className="h-10 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  // If there's an active session today, show continue option
  if (todaysSession) {
    const completedExercises = todaysSession.exercises?.filter(ex => ex.sets.some(set => set.completed)).length || 0
    const totalExercises = todaysSession.exercises?.length || 0
    const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0
    const completionRate = calculateCompletionRate(todaysSession.exercises)
    const actualStatus = getStatusFromCompletion(todaysSession.status, todaysSession.exercises)

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {actualStatus === 'completed' ? "Today's Completed Workout" : "Continue Today's Workout"}
          </CardTitle>
          <CardDescription>
            {actualStatus === 'completed' ? "Great job! Workout completed." : "You have an active session"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className={`p-3 sm:p-4 rounded-lg border overflow-hidden ${
            actualStatus === 'completed' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200' 
              : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950'
          }`}>
            <h3 className="font-semibold text-green-900 dark:text-green-100 truncate">
              {todaysSession.name}
            </h3>
            <p className={`text-sm mt-1 truncate ${
              actualStatus === 'completed' 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-blue-700 dark:text-blue-300'
            }`}>
              {totalExercises} exercises • {actualStatus === 'completed' ? 'Completed' : 'In Progress'}
              {actualStatus === 'completed' && <span className="ml-2 text-green-600">✓</span>}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completedExercises}/{totalExercises} exercises ({completionRate}%)</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <Button onClick={continueWorkout} className="w-full">
            {actualStatus === 'completed' ? 'View Completed Workout' : 'Continue Workout'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show today's scheduled workouts
  if (todaysWorkouts.length > 0) {
    // If all workouts are completed, show congratulatory message
    if (allWorkoutsCompleted) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Focus</CardTitle>
            <CardDescription>All workouts completed! Well done! 🎉</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 overflow-hidden">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                All Planned Workouts Completed!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Great job finishing all your scheduled workouts today. Check out your progress in the workout history.
              </p>
            </div>
            <Button onClick={() => router.push('/workouts')} className="w-full">
              Check Out History
            </Button>
          </CardContent>
        </Card>
      )
    }
    
    // Show remaining scheduled workouts
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today&apos;s Focus</CardTitle>
          <CardDescription>
            {completedToday 
              ? "Some workouts completed! Great job!" 
              : `${todaysWorkouts.length} workout${todaysWorkouts.length > 1 ? 's' : ''} scheduled`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {todaysWorkouts.map((workout) => (
            <div 
              key={workout.id} 
              className={`p-3 sm:p-4 rounded-lg border overflow-hidden ${
                completedToday 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200' 
                  : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950'
              }`}
            >
              <h3 className={`font-semibold truncate ${
                completedToday 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-blue-900 dark:text-blue-100'
              }`}>
                {workout.title}
                {completedToday && <span className="ml-2 text-green-600">✓</span>}
              </h3>
              <p className={`text-sm mt-1 truncate ${
                completedToday 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-blue-700 dark:text-blue-300'
              }`}>
                {workout.startTime} - {workout.endTime}
                {workout.duration && ` • ${workout.duration} min`}
                {workout.difficulty && ` • ${workout.difficulty}`}
                {completedToday && ' • Completed'}
              </p>
              {workout.description && (
                <p className={`text-xs mt-2 truncate ${
                  completedToday 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {workout.description}
                </p>
              )}
            </div>
          ))}
          <Button 
            onClick={() => router.push('/workouts')} 
            variant="outline" 
            className="w-full bg-transparent"
          >
            {completedToday ? 'View Workouts' : 'Start Workout'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Fallback when no workouts scheduled for today
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Today&apos;s Focus</CardTitle>
        <CardDescription>No workouts scheduled for today</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950 border overflow-hidden">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Rest Day or Free Day
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            No workouts scheduled for today. Enjoy your rest or add workouts to your schedule.
          </p>
        </div>
        <Button 
          onClick={() => router.push('/schedule')} 
          variant="outline" 
          className="w-full bg-transparent"
        >
          View Schedule
        </Button>
      </CardContent>
    </Card>
  )
}
