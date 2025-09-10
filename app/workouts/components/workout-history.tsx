'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Clock, Calendar, TrendingUp, Trash2, Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { WorkoutDetailsModal } from "./workout-details-modal"
import { QuickViewModal } from "./quick-view-modal"
import { getPerformanceBadgeProps, type WorkoutPerformanceStatus } from "@/lib/workout-performance"

interface WorkoutSession {
  id: string
  name: string
  date: string | Date
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
  performanceStatus?: WorkoutPerformanceStatus
  completionRate?: number
  perfectionScore?: number
  notes?: string
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
  performanceStatus?: string
  completionRate?: number
  perfectionScore?: number
  notes?: string
}

export function WorkoutHistory({ onRepeatWorkout }: { onRepeatWorkout?: (workout: WorkoutSession) => void }) {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(null)

  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      try {
        const response = await fetch('/api/workout-sessions?limit=10')
        if (response.ok) {
          const data = await response.json()
          // Transform API data to match component expectations
          const transformedData = data.map((session: ApiWorkoutSession) => ({
            id: session.id,
            name: session.name,
            date: session.startTime,
            duration: session.duration || 0,
            exercises: session.exercises?.map(ex => ({
              exerciseId: ex.exerciseId,
              exerciseName: ex.exercise?.name || 'Unknown Exercise',
              sets: ex.sets || []
            })) || [],
            status: session.status,
            performanceStatus: session.performanceStatus as WorkoutPerformanceStatus,
            completionRate: session.completionRate,
            perfectionScore: session.perfectionScore,
            notes: session.notes,
          }))
          setWorkoutHistory(transformedData)
        }
      } catch (error) {
        console.error('Failed to fetch workout history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkoutHistory()
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getWorkoutPerformanceStatus = (workout: WorkoutSession): WorkoutPerformanceStatus => {
    if (workout.performanceStatus) {
      return workout.performanceStatus
    }
    
    // Fallback for old workouts without performance status
    if (workout.status === "completed") {
      return "completed"
    } else {
      return "unfinished"
    }
  }

  const calculateWorkoutStats = (workout: WorkoutSession) => {
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    const totalReps = workout.exercises.reduce((sum, ex) =>
      sum + ex.sets.reduce((setSum, set) => setSum + (set.completed ? set.reps : 0), 0), 0)
    const avgWeight = workout.exercises.length > 0 ?
      workout.exercises.reduce((sum, ex) =>
        sum + ex.sets.reduce((setSum, set) => setSum + (set.weight || 0), 0), 0) / totalSets : 0

    return {
      exercises: workout.exercises.length,
      totalSets,
      totalReps,
      avgWeight: avgWeight > 0 ? avgWeight : undefined,
    }
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const response = await fetch(`/api/workout-sessions/${workoutId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setWorkoutHistory(prev => prev.filter(workout => workout.id !== workoutId))
        toast.success('Workout deleted successfully')
      } else {
        throw new Error('Failed to delete workout')
      }
    } catch (error) {
      console.error('Failed to delete workout:', error)
      toast.error('Failed to delete workout')
    }
  }

  const handleRepeatWorkout = async (workoutId: string) => {
    try {
      const response = await fetch(`/api/workout-sessions/${workoutId}/repeat`, {
        method: 'POST',
      })

      if (response.ok) {
        await response.json() // Consume the response but don't store it
        toast.success('Workout repeated! Redirecting to track...')
        
        // Redirect to track page after a short delay to show the toast
        setTimeout(() => {
          window.location.href = '/track'
        }, 1000)
        
        // Call the onRepeatWorkout callback if provided (for legacy support)
        if (onRepeatWorkout) {
          const workout = workoutHistory.find(w => w.id === workoutId)
          if (workout) {
            onRepeatWorkout(workout)
          }
        }
      } else {
        throw new Error('Failed to repeat workout')
      }
    } catch (error) {
      console.error('Failed to repeat workout:', error)
      toast.error('Failed to repeat workout')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Workout History
          </CardTitle>
          <CardDescription>Your recent training sessions and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading workout history...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Workout History
        </CardTitle>
        <CardDescription>Your recent training sessions and performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workoutHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No workout history found. Start your first workout!</p>
            </div>
          ) : (
            workoutHistory.map((workout) => {
              const stats = calculateWorkoutStats(workout)
              return (
                <div key={workout.id} className="p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium mb-1">{workout.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(workout.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(workout.duration)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {(() => {
                        const performanceStatus = getWorkoutPerformanceStatus(workout)
                        const badgeProps = getPerformanceBadgeProps(performanceStatus)
                        return (
                          <Badge className={badgeProps.className}>
                            <span className="mr-1">{badgeProps.icon}</span>
                            {badgeProps.text}
                          </Badge>
                        )
                      })()}
                      {workout.performanceStatus && workout.completionRate !== undefined && (
                        <div className="text-xs text-muted-foreground text-right">
                          {workout.completionRate.toFixed(0)}% complete
                          {workout.perfectionScore !== undefined && (
                            <>
                              <br />Score: {workout.perfectionScore.toFixed(0)}/100
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-blue-600">{stats.exercises}</div>
                      <div className="text-xs text-muted-foreground">Exercises</div>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-green-600">{stats.totalSets}</div>
                      <div className="text-xs text-muted-foreground">Sets</div>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-purple-600">{stats.totalReps}</div>
                      <div className="text-xs text-muted-foreground">Reps</div>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-orange-600">
                        {stats.avgWeight ? `${stats.avgWeight.toFixed(1)}` : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Weight</div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <QuickViewModal
                      workout={workout}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Quick View
                        </Button>
                      }
                    />
                    <WorkoutDetailsModal
                      workout={selectedWorkout}
                      onRepeat={onRepeatWorkout}
                      trigger={
                        <Button variant="outline" size="sm" onClick={() => setSelectedWorkout(workout)}>
                          View Details
                        </Button>
                      }
                    />
                    <Button variant="outline" size="sm" onClick={() => handleRepeatWorkout(workout.id)}>
                      Repeat Workout
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
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
            })
          )}
        </div>

        {workoutHistory.length > 0 && (
          <div className="mt-6 text-center">
            <Button variant="outline" className="bg-transparent">
              <TrendingUp className="w-4 h-4 mr-2" />
              View All History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
