"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Dumbbell, Repeat } from "lucide-react"
import { toast } from "sonner"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { formatWeight } from "@/lib/weight-utils"
import { logger } from "@/lib/logger"

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
  notes?: string
  templateId?: string
}

interface WorkoutDetailsModalProps {
  workout: WorkoutSession | null
  onRepeat?: (workout: WorkoutSession) => void
  trigger: React.ReactNode
}

export function WorkoutDetailsModal({ workout, onRepeat, trigger }: WorkoutDetailsModalProps) {
  const { units } = useUserPreferences()
  
  if (!workout) return null

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const handleRepeatWorkout = async () => {
    try {
      const response = await fetch(`/api/workout-tracker/workout-sessions/${workout.id}/repeat`, {
        method: 'POST',
      })

      if (response.ok) {
        await response.json() // Consume the response but don't store it
        toast.success('Workout repeated! Redirecting to track...')
        
        // Redirect to track page after a short delay to show the toast
        setTimeout(() => {
          window.location.href = '/track'
        }, 1000)
        
        // Call the onRepeat callback if provided (for legacy support)
        if (onRepeat) {
          onRepeat(workout)
        }
      } else {
        throw new Error('Failed to repeat workout')
      }
    } catch (error) {
      logger.error('Failed to repeat workout:', error)
      toast.error('Failed to repeat workout')
    }
  }

  const calculateStats = () => {
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    const completedSets = workout.exercises.reduce((sum, ex) =>
      sum + ex.sets.filter(set => set.completed).length, 0)
    const totalReps = workout.exercises.reduce((sum, ex) =>
      sum + ex.sets.reduce((setSum, set) => setSum + (set.completed ? set.reps : 0), 0), 0)
    const avgWeight = totalSets > 0 ?
      workout.exercises.reduce((sum, ex) =>
        sum + ex.sets.reduce((setSum, set) => setSum + (set.weight || 0), 0), 0) / totalSets : 0

    return { totalSets, completedSets, totalReps, avgWeight }
  }

  const stats = calculateStats()

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-600" />
            {workout.name}
          </DialogTitle>
          <DialogDescription>
            Workout completed on {formatDate(workout.date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Workout Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workout Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-blue-600">{workout.exercises.length}</div>
                  <div className="text-sm text-muted-foreground">Exercises</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-green-600">{stats.completedSets}/{stats.totalSets}</div>
                  <div className="text-sm text-muted-foreground">Sets Completed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalReps}</div>
                  <div className="text-sm text-muted-foreground">Total Reps</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.avgWeight > 0 ? formatWeight(stats.avgWeight, units) : "Bodyweight"}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Weight</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Duration: {formatDuration(workout.duration)}</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {workout.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Exercises Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exercise Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workout.exercises.map((exercise, index) => (
                  <div key={exercise.exerciseId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-lg">{exercise.exerciseName || `Exercise ${index + 1}`}</h3>
                      <Badge variant="secondary">{exercise.sets.length} sets</Badge>
                    </div>
                    <div className="space-y-2">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="flex items-center justify-between py-2 px-3 rounded bg-muted/30">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">Set {setIndex + 1}</Badge>
                            <span className="text-sm">
                              {set.reps} reps × {set.weight !== null && set.weight !== undefined ? formatWeight(set.weight, units) : "bodyweight"}
                            </span>
                          </div>
                          {set.completed && (
                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓ Completed
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {workout.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{workout.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleRepeatWorkout}
              className="flex-1 sm:flex-none"
            >
              <Repeat className="w-4 h-4 mr-2" />
              Repeat Workout
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
