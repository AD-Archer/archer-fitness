"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dumbbell, Clock, Calendar, Target, CheckCircle2, Circle, FileText } from "lucide-react"
import { ReactNode } from "react"
import { formatWeight } from "@/lib/weight-utils"
import { useUserPreferences } from "@/hooks/use-user-preferences"

interface WorkoutSession {
  id: string
  name: string
  date: string | Date
  duration: number
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    targetSets?: number
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
  status: "active" | "completed" | "paused" | "cancelled" | "skipped" | "in_progress"
  notes?: string
}

interface QuickViewModalProps {
  workout: WorkoutSession
  trigger: ReactNode
  // If a newer workout has started after this one, suppress "In Progress" and show "Incomplete"
  hasNewerStarted?: boolean
}

export function QuickViewModal({ workout, trigger, hasNewerStarted = false }: QuickViewModalProps) {
  const { units } = useUserPreferences()
  
  const formatDate = (date: string | Date) => {
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
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }

  const getStatusDisplay = (status: string, exercises: Array<{ targetSets?: number; sets: Array<{ completed: boolean }> }>) => {
    const totalTargetSets = exercises.reduce((total, exercise) => total + (exercise.targetSets ?? exercise.sets.length), 0)

    if (totalTargetSets === 0) {
      return hasNewerStarted ? "Incomplete" : status === "completed" ? "Completed" : "In Progress"
    }

    const completedSets = exercises.reduce((total, exercise) =>
      total + exercise.sets.filter(set => set.completed).length, 0)
    const completionRate = Math.round((completedSets / totalTargetSets) * 100)

    if (completionRate >= 50) {
      return "Completed"
    }

    if (completionRate > 0) {
      return hasNewerStarted ? "Incomplete" : "In Progress"
    }

    return hasNewerStarted ? "Incomplete" : "Not Started"
  }

  const calculateSetStats = (sets: Array<{ reps: number; weight?: number; completed: boolean }>) => {
    const completedSets = sets.filter(set => set.completed)
    const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0)
    const avgWeight = completedSets.length > 0
      ? completedSets.reduce((sum, set) => sum + (set.weight || 0), 0) / completedSets.length
      : 0

    return {
      completedSets: completedSets.length,
      totalSets: sets.length,
      totalReps,
      avgWeight: avgWeight > 0 ? avgWeight : undefined,
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl w-[90vw] max-h-[85vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              {workout.name}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(workout.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(workout.duration)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {getStatusDisplay(workout.status, workout.exercises)}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-md border p-3 bg-muted/40">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Target className="w-4 h-4" /> Exercises
              </div>
              <div className="text-xl font-semibold">{workout.exercises.length}</div>
            </div>
            <div className="rounded-md border p-3 bg-muted/40">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Total Sets
              </div>
              <div className="text-xl font-semibold">
                {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
              </div>
            </div>
            <div className="rounded-md border p-3 bg-muted/40">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Completed
              </div>
              <div className="text-xl font-semibold">
                {workout.exercises.reduce((total, ex) => total + ex.sets.filter(s => s.completed).length, 0)}
              </div>
            </div>
            <div className="rounded-md border p-3 bg-muted/40">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Duration
              </div>
              <div className="text-xl font-semibold">{Math.round(workout.duration / 60)}m</div>
            </div>
          </div>

          {/* Exercises */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Dumbbell className="w-4 h-4" /> Exercise details
            </h3>

            {workout.exercises.map((exercise, exerciseIndex) => {
              const exerciseName = exercise.exerciseName
              const stats = calculateSetStats(exercise.sets)
              const completionRate = stats.totalSets > 0 ? (stats.completedSets / stats.totalSets) * 100 : 0

              return (
                <Card key={exerciseIndex} className="overflow-hidden">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="font-medium">{exerciseName}</span>
                      <div className="flex gap-2 text-xs">
                        <Badge variant="secondary">
                          {stats.completedSets}/{stats.totalSets} sets
                        </Badge>
                        <Badge variant="outline">
                          {stats.totalReps} reps
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mb-3">
                      <Progress value={completionRate} className="h-2" />
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {Math.round(completionRate)}% completed
                      </div>
                    </div>

                    <div className="space-y-2">
                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className="flex items-center justify-between p-3 rounded-md border"
                        >
                          <div className="flex items-center gap-3">
                            {set.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                            <div>
                              <span className="font-medium">Set {setIndex + 1}</span>
                              <div className="text-sm text-muted-foreground">
                                {set.reps} reps
                                {set.weight && ` • ${formatWeight(set.weight, units)}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {stats.avgWeight && (
                      <div className="mt-4 pt-3 border-t">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Target className="w-4 h-4" />
                          <span>
                            Average weight: <span className="font-semibold text-foreground">{formatWeight(stats.avgWeight, units)}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Notes */}
          {workout.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {workout.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
