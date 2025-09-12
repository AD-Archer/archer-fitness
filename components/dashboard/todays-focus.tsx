"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface WorkoutTemplate {
  id: string
  name: string
  description: string
  estimatedDuration: number
  difficulty: string
  exercises: Array<{
    id: string
    exercise: {
      name: string
    }
  }>
}

interface TodaysWorkoutSession {
  id: string
  name: string
  status: string
  startTime: string
  exercises: Array<{
    completed: boolean
  }>
}

export function TodaysFocus() {
  const [recommendedWorkout, setRecommendedWorkout] = useState<WorkoutTemplate | null>(null)
  const [todaysSession, setTodaysSession] = useState<TodaysWorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchTodaysFocus = async () => {
      try {
        // Check if there's an active session today
        const today = new Date().toISOString().split('T')[0]
        const sessionsResponse = await fetch(`/api/workout-tracker/workout-sessions?date=${today}`)
        
        let todaysWorkout = null
        if (sessionsResponse.ok) {
          const sessions = await sessionsResponse.json()
          todaysWorkout = sessions.find((session: TodaysWorkoutSession) => 
            session.status === 'active' || session.status === 'paused'
          )
          setTodaysSession(todaysWorkout)
        }

        // If no active session, get workout recommendations
        if (!todaysWorkout) {
          const templatesResponse = await fetch('/api/workout-tracker/workout-templates?limit=10')
          if (templatesResponse.ok) {
            const data = await templatesResponse.json()
            const allTemplates = [...(data.userTemplates || []), ...(data.predefinedTemplates || [])]
            
            if (allTemplates.length > 0) {
              // Pick a random workout for today's recommendation
              const randomWorkout = allTemplates[Math.floor(Math.random() * allTemplates.length)]
              setRecommendedWorkout(randomWorkout)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch today\'s focus:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTodaysFocus()
  }, [])

  const startWorkout = async () => {
    if (!recommendedWorkout) return

    try {
      const response = await fetch('/api/workout-tracker/workout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workoutTemplateId: recommendedWorkout.id,
          name: recommendedWorkout.name,
          description: recommendedWorkout.description,
        }),
      })

      if (response.ok) {
        const session = await response.json()
        router.push(`/track?sessionId=${session.id}`)
      }
    } catch (error) {
      console.error('Failed to start workout:', error)
    }
  }

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
    const completedExercises = todaysSession.exercises?.filter(ex => ex.completed).length || 0
    const totalExercises = todaysSession.exercises?.length || 0
    const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Continue Today&apos;s Workout</CardTitle>
          <CardDescription>You have an active session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border overflow-hidden">
            <h3 className="font-semibold text-green-900 dark:text-green-100 truncate">
              {todaysSession.name}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1 truncate">
              {totalExercises} exercises • In Progress
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completedExercises}/{totalExercises} exercises</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <Button onClick={continueWorkout} className="w-full">
            Continue Workout
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show recommended workout
  if (recommendedWorkout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today&apos;s Focus</CardTitle>
          <CardDescription>AI recommended workout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border overflow-hidden">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 truncate">
              {recommendedWorkout.name}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 truncate">
              {recommendedWorkout.estimatedDuration} min • {recommendedWorkout.exercises?.length || 0} exercises • {recommendedWorkout.difficulty}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>0/{recommendedWorkout.exercises?.length || 0} exercises</span>
            </div>
            <Progress value={0} className="h-2" />
          </div>
          <Button onClick={startWorkout} variant="outline" className="w-full bg-transparent">
            Start Workout
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Fallback when no workouts available
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Today&apos;s Focus</CardTitle>
        <CardDescription>Create your first workout</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950 border overflow-hidden">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            No workouts available
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            Create your first workout template to get started
          </p>
        </div>
        <Button 
          onClick={() => router.push('/workouts')} 
          variant="outline" 
          className="w-full bg-transparent"
        >
          Browse Workouts
        </Button>
      </CardContent>
    </Card>
  )
}
