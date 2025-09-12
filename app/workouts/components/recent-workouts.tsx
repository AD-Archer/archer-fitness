import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Clock, CheckCircle, Trash2, Eye, RotateCcw, XCircle } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { WorkoutDetailsModal } from "./workout-details-modal"
import { QuickViewModal } from "./quick-view-modal"
import { logger } from "@/lib/logger"

interface WorkoutSession {
  id: string
  name: string
  date: Date | string
  duration: number
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
  status: "completed" | "in_progress" | "skipped"
  notes?: string
  templateId?: string
}

interface WorkoutTemplate {
  id: string
  name: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: number
  exercises: Array<{
    id: string
    name: string
  }>
}

interface ApiWorkoutSession {
  id: string
  name: string
  startTime: string
  duration: number | null
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
  status: string
  notes?: string
  workoutTemplateId?: string
  workoutTemplate?: {
    id: string
    name: string
    difficulty: string
    exercises: Array<{
      id: string
      name: string
    }>
  }
}

interface ApiWorkoutTemplate {
  id: string
  name: string
  description?: string
  estimatedDuration?: number
  difficulty: string
  exercises?: Array<{
    exercise?: {
      id: string
      name: string
    }
    exerciseId: string
  }>
}

interface ApiTemplatesResponse {
  userTemplates: ApiWorkoutTemplate[]
  predefinedTemplates: ApiWorkoutTemplate[]
}

export function RecentWorkouts({ onRepeatWorkout }: { onRepeatWorkout?: (workout: WorkoutSession) => void }) {
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([])
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(null)

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
  const getStatusFromCompletion = useCallback((status: string, exercises: Array<{ sets: Array<{ completed: boolean }> }>): "completed" | "in_progress" | "skipped" => {
    const completionRate = calculateCompletionRate(exercises)

    if (completionRate >= 100) {
      return "completed"
    } else if (completionRate > 0) {
      return "in_progress"
    } else {
      return "in_progress" // No sets completed yet
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent workout sessions
        const sessionsResponse = await fetch('/api/workout-tracker/workout-sessions?limit=3')
        let sessionsData: ApiWorkoutSession[] = []
        if (sessionsResponse.ok) {
          sessionsData = await sessionsResponse.json()
        }

        // Fetch workout templates
        const templatesResponse = await fetch('/api/workout-tracker/workout-templates?limit=10')
        let templatesData: ApiTemplatesResponse = { userTemplates: [], predefinedTemplates: [] }
        if (templatesResponse.ok) {
          templatesData = await templatesResponse.json()
        }

        // Transform sessions data
        const transformedSessions = sessionsData.map((session) => {
          // Map status values properly based on completion
          const exercises = session.exercises?.map(ex => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exercise?.name || 'Unknown Exercise',
            sets: ex.sets || []
          })) || []

          const status = getStatusFromCompletion(session.status, exercises)

          return {
            id: session.id,
            name: session.name,
            date: new Date(session.startTime),
            duration: session.duration || 0,
            exercises,
            status,
            notes: session.notes,
            templateId: session.workoutTemplateId,
          }
        })

        setRecentWorkouts(transformedSessions)

        // Transform templates data
        const allTemplates = [...templatesData.userTemplates, ...templatesData.predefinedTemplates]
        const transformedTemplates = allTemplates.map((template: ApiWorkoutTemplate) => ({
          id: template.id,
          name: template.name,
          description: template.description || template.name,
          difficulty: template.difficulty as "beginner" | "intermediate" | "advanced",
          duration: template.estimatedDuration || 0,
          exercises: template.exercises?.map((ex) => ({
            id: ex.exercise?.id || ex.exerciseId,
            name: ex.exercise?.name || "Unknown Exercise",
          })) || [],
        }))

        setWorkoutTemplates(transformedTemplates)

      } catch (error) {
        logger.error('Failed to fetch recent workouts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [getStatusFromCompletion])

  // Helper function to format date
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateObj.toDateString() === today.toDateString()) return "Today"
    if (dateObj.toDateString() === yesterday.toDateString()) return "Yesterday"

    const daysAgo = Math.floor((today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
    return `${daysAgo} days ago`
  }

  // Helper function to calculate total sets
  const calculateTotalSets = (exercises: Array<{ sets: Array<{ reps: number; weight?: number; completed: boolean }> }>) => {
    return exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
  }

  // Helper function to get template info
  const getTemplateInfo = (templateId?: string) => {
    if (!templateId) {
      return {
        difficulty: "intermediate" as const,
        exercises: [],
      }
    }
    const template = workoutTemplates.find((t) => t.id === templateId)
    return template || {
      difficulty: "intermediate" as const,
      exercises: [],
    }
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const response = await fetch(`/api/workout-tracker/workout-sessions/${workoutId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRecentWorkouts(prev => prev.filter(workout => workout.id !== workoutId))
        toast.success('Workout deleted successfully')
      } else {
        throw new Error('Failed to delete workout')
      }
    } catch (error) {
      logger.error('Failed to delete workout:', error)
      toast.error('Failed to delete workout')
    }
  }

  const handleRepeatWorkout = async (workoutId: string) => {
    try {
      const response = await fetch(`/api/workout-tracker/workout-sessions/${workoutId}/repeat`, {
        method: 'POST',
      })

      if (response.ok) {
        const newSession = await response.json()
        toast.success('Workout repeated! Redirecting to track...')
        
        // Redirect to track page after a short delay to show the toast
        setTimeout(() => {
          window.location.href = '/track'
        }, 1000)
        
        // Call the onRepeatWorkout callback if provided (for legacy support)
        if (onRepeatWorkout) {
          onRepeatWorkout({
            id: newSession.id,
            name: newSession.name,
            date: new Date(newSession.startTime),
            duration: newSession.duration || 0,
            exercises: newSession.exercises?.map((ex: {
              exerciseId: string
              exercise?: { name?: string }
              sets: Array<{
                reps: number
                weight?: number
                completed: boolean
              }>
            }) => ({
              exerciseId: ex.exerciseId,
              exerciseName: ex.exercise?.name || 'Unknown Exercise',
              sets: ex.sets || []
            })) || [],
            status: newSession.status,
            notes: newSession.notes,
            templateId: newSession.workoutTemplateId,
          })
        }
      } else {
        throw new Error('Failed to repeat workout')
      }
    } catch (error) {
      logger.error('Failed to repeat workout:', error)
      toast.error('Failed to repeat workout')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
          <CardDescription>Your latest training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading recent workouts...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Workouts</CardTitle>
        <CardDescription>Your latest training sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentWorkouts.map((workout, idx) => {
            const template = getTemplateInfo(workout.templateId)
            // Determine if a newer workout exists after this one in the list
            // Assuming recentWorkouts is sorted desc by date (most recent first)
            const hasNewerStarted = recentWorkouts.some((w, i) => i < idx && new Date(w.date).getTime() > new Date(workout.date).getTime())
            const completionRate = calculateCompletionRate(workout.exercises)
            const isCompleted = completionRate >= 100
            return (
              <div key={workout.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 rounded-lg border bg-card/50 gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate text-sm sm:text-base">{workout.name}</h3>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                      <span className="whitespace-nowrap">{formatDate(workout.date)}</span>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {workout.duration ? Math.round(workout.duration / 60) : 0} min
                      </div>
                      <span className="whitespace-nowrap">{workout.exercises.length} exercises</span>
                      <span className="whitespace-nowrap">{calculateTotalSets(workout.exercises)} sets</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  <Badge variant="outline" className="capitalize text-xs">
                    {template.difficulty}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRepeatWorkout(workout.id)}
                    className="text-xs px-1 py-1 h-6 sm:h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Repeat</span>
                  </Button>
                  <QuickViewModal
                    workout={workout}
                    hasNewerStarted={hasNewerStarted}
                    trigger={
                      <Button variant="ghost" size="sm" className="text-xs px-1 py-1 h-6 sm:h-8">
                        <Eye className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Quick View</span>
                      </Button>
                    }
                  />
                  <WorkoutDetailsModal
                    workout={selectedWorkout}
                    onRepeat={onRepeatWorkout}
                    trigger={
                      <Button variant="ghost" size="sm" className="text-xs px-1 py-1 h-6 sm:h-8" onClick={() => setSelectedWorkout(workout)}>
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">Details</span>
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-1 py-1 h-6 sm:h-8">
                        <Trash2 className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workout</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this workout? This action cannot be undone.
                          <br />
                          <strong>{workout.name}</strong> from {formatDate(workout.date)}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Workout
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}
          {recentWorkouts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent workouts found. Start your first workout!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
