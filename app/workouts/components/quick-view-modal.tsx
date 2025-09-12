"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dumbbell, Clock, Calendar, Target } from "lucide-react"
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
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
  status: "completed" | "in_progress" | "skipped"
  notes?: string
}

interface QuickViewModalProps {
  workout: WorkoutSession
  trigger: ReactNode
}

export function QuickViewModal({ workout, trigger }: QuickViewModalProps) {
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

  const getStatusDisplay = (status: string, exercises: Array<{ sets: Array<{ completed: boolean }> }>) => {
    // Calculate completion rate
    const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
    if (totalSets === 0) return "In Progress"

    const completedSets = exercises.reduce((total, exercise) =>
      total + exercise.sets.filter(set => set.completed).length, 0)
    const completionRate = Math.round((completedSets / totalSets) * 100)

    if (completionRate >= 100) {
      return "Completed"
    } else if (completionRate > 0) {
      return "In Progress"
    } else {
      return "Not Started"
    }
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
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            {workout.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(workout.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(workout.duration)}
            </span>
            <Badge 
              variant="outline" 
              className={`capitalize ${
                getStatusDisplay(workout.status, workout.exercises) === "Completed" 
                  ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700" 
                  : ""
              }`}
            >
              {getStatusDisplay(workout.status, workout.exercises)}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {workout.exercises.map((exercise, exerciseIndex) => {
              const exerciseName = exercise.exerciseName
              const stats = calculateSetStats(exercise.sets)

              return (
                <Card key={exerciseIndex} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{exerciseName}</span>
                      <div className="flex gap-2 text-sm">
                        <Badge variant="secondary">
                          {stats.completedSets}/{stats.totalSets} sets
                        </Badge>
                        <Badge variant="outline">
                          {stats.totalReps} reps
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            set.completed
                              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                              : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              set.completed ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <span className="font-medium">Set {setIndex + 1}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              <span>{set.reps} reps</span>
                            </div>
                            {set.weight && (
                              <div className="flex items-center gap-1">
                                <Dumbbell className="w-3 h-3" />
                                <span>{formatWeight(set.weight, units)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {stats.avgWeight && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm text-muted-foreground text-center">
                          Average weight: <span className="font-semibold text-foreground">{formatWeight(stats.avgWeight, units)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {workout.notes && (
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{workout.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
