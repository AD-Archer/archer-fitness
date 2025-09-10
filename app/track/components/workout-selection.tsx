"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Dumbbell, Play, Plus, Trash2 } from "lucide-react"
import { CustomWorkoutForm } from "./custom-workout-form"

interface TrackedExercise {
  id: string
  name: string
  targetSets: number
  targetReps: string
  instructions?: string
}

interface WorkoutTemplate {
  id: string
  name: string
  description?: string
  estimatedDuration: number
  exercises: Omit<TrackedExercise, "sets" | "completed">[]
  isCustom: boolean
}

interface WorkoutSelectionProps {
  availableWorkouts: WorkoutTemplate[]
  onStartWorkout: (workout: WorkoutTemplate) => void
  onDeleteWorkout: (workoutId: string) => void
  onSaveCustomWorkout: (workout: WorkoutTemplate) => void
  onEditCustomWorkout?: (workout: WorkoutTemplate) => void
}

export function WorkoutSelection({
  availableWorkouts,
  onStartWorkout,
  onDeleteWorkout,
  onSaveCustomWorkout,
  onEditCustomWorkout,
}: WorkoutSelectionProps) {
  const [showCustomWorkoutDialog, setShowCustomWorkoutDialog] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<WorkoutTemplate | null>(null)
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Dumbbell className="w-6 h-6 text-blue-600" />
            Choose Your Workout
          </CardTitle>
          <CardDescription>Select from predefined workouts or create your own</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableWorkouts.map((workout) => (
              <Card key={workout.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{workout.name}</CardTitle>
                      <CardDescription className="text-sm">{workout.description}</CardDescription>
                    </div>
                    {workout.isCustom && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingWorkout(workout)
                            setShowCustomWorkoutDialog(true)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteWorkout(workout.id)
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Exercises:</span>
                      <span>{workout.exercises.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duration:</span>
                      <span>~{workout.estimatedDuration} min</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => onStartWorkout(workout)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Workout
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Dialog open={showCustomWorkoutDialog} onOpenChange={(open) => { if (!open) { setEditingWorkout(null) } setShowCustomWorkoutDialog(open) }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Workout
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingWorkout ? "Edit Custom Workout" : "Create Custom Workout"}</DialogTitle>
                  <DialogDescription>Design your own workout with custom exercises and targets</DialogDescription>
                </DialogHeader>
                <CustomWorkoutForm
                  initialWorkout={editingWorkout ?? undefined}
                  onSave={(workout) => {
                    if (editingWorkout) {
                      onEditCustomWorkout?.(workout)
                    } else {
                      onSaveCustomWorkout(workout)
                    }
                    setShowCustomWorkoutDialog(false)
                    setEditingWorkout(null)
                  }}
                  onCancel={() => setShowCustomWorkoutDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
