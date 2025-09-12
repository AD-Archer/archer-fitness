"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExerciseSelector } from "./exercise-selector"

interface TrackedExercise {
  id: string
  exerciseId: string
  name: string
  targetSets: number
  targetReps: string
  targetType: "reps" | "time"
  instructions?: string
}

interface WorkoutTemplate {
  id: string
  name: string
  description: string
  estimatedDuration: number
  exercises: Omit<TrackedExercise, "sets" | "completed">[]
  isCustom: boolean
}

interface InitialExercise {
  id: string
  exerciseId: string
  name: string
  targetSets: number
  targetReps: string
  targetType?: "reps" | "time"
  instructions?: string
}

interface CustomWorkoutFormProps {
  onSave: (workout: WorkoutTemplate) => void
  onCancel: () => void
  initialWorkout?: Partial<WorkoutTemplate>
}

export function CustomWorkoutForm({ onSave, onCancel, initialWorkout }: CustomWorkoutFormProps) {
  const [workoutName, setWorkoutName] = useState(initialWorkout?.name ?? "")
  const [workoutDescription, setWorkoutDescription] = useState(initialWorkout?.description ?? "")
  const [estimatedDuration, setEstimatedDuration] = useState(
    initialWorkout?.estimatedDuration ? String(initialWorkout.estimatedDuration) : ""
  )
  const [exercises, setExercises] = useState<Omit<TrackedExercise, "sets" | "completed">[]>(
    initialWorkout?.exercises?.map((ex: InitialExercise) => ({
      ...ex,
      targetType: ex.targetType || "reps"
    })) ?? []
  )
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showExerciseSelector) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showExerciseSelector])

  const addExercise = () => {
    setShowExerciseSelector(true)
  }

  const handleExerciseSelect = (selectedExercise: { id: string; name: string; instructions?: string }) => {
    const newExercise: Omit<TrackedExercise, "sets" | "completed"> = {
      id: Date.now().toString(),
      exerciseId: selectedExercise.id,
      name: selectedExercise.name,
      targetSets: 3,
      targetReps: "8-12",
      targetType: "reps",
      instructions: selectedExercise.instructions || "",
    }
    setExercises((prev) => [...prev, newExercise])
    setShowExerciseSelector(false)
  }

  const updateExercise = (index: number, field: string, value: string | number) => {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)))
  }

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!workoutName.trim() || exercises.length === 0) return

    const newWorkout: WorkoutTemplate = {
      id: (initialWorkout?.id as string) || Date.now().toString(),
      name: workoutName.trim(),
      description: workoutDescription.trim(),
      estimatedDuration: Number.parseInt(estimatedDuration) || 30,
      exercises: exercises.map((ex) => ({
        ...ex,
        exerciseId: ex.exerciseId,
        name: ex.name,
        targetSets: ex.targetSets || 3,
        targetReps: ex.targetReps || "8-12",
        targetType: ex.targetType || "reps",
        instructions: ex.instructions || "",
      })),
      isCustom: true,
    }

    onSave(newWorkout)
  }

  return (
    <div className="space-y-8 w-full px-4 sm:px-6 md:px-8 lg:px-10 pb-8">
      {/* Workout Details Section */}
      <Card className="p-6 md:p-6 lg:p-6 shadow-md border-2 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6 mt-2">Workout Details</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
        <Label htmlFor="workout-name" className="text-base font-medium">Workout Name</Label>
        <Input
          id="workout-name"
          placeholder="My Custom Workout"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="w-full h-12 text-base"
        />
        </div>
          <div className="space-y-3">
            <Label htmlFor="estimated-duration" className="text-base font-medium">Estimated Duration (minutes)</Label>
            <Input
              id="estimated-duration"
              type="number"
              placeholder="45"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className="w-full h-12 text-base"
            />
          </div>
          <div className="lg:col-span-2 space-y-3">
            <Label htmlFor="workout-description" className="text-base font-medium">Description</Label>
            <Textarea
              id="workout-description"
              placeholder="Brief description of the workout"
              value={workoutDescription}
              onChange={(e) => setWorkoutDescription(e.target.value)}
              rows={4}
              className="w-full resize-none text-base"
            />
          </div>
        </div>
      </Card>

      {/* Exercises Section */}
      <Card className="p-6 md:p-6 lg:p-6 shadow-md border-2 rounded-xl">
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h3 className="text-xl font-medium">Exercises ({exercises.length})</h3>
            <Button 
              onClick={addExercise} 
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 w-full lg:w-auto h-12 px-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Exercise
            </Button>
            </div>


          {exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-muted/30 border border-dashed rounded-lg p-12 md:p-12 lg:p-12 text-center">
              <span className="mb-6 text-5xl">💪</span>
              <h3 className="text-xl font-medium mb-3">No Exercises Added Yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md text-lg">Add exercises to create your custom workout</p>
              <Button onClick={addExercise} variant="outline" className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 h-12 px-6">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Exercise
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {exercises.map((exercise, index) => (
                <Card key={exercise.id} className="p-6 md:p-6 border-l-4 border-l-blue-500 shadow-sm rounded-xl">
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-base font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-lg lg:text-xl truncate">{exercise.name}</h4>
                      </div>
                      <Button
                        onClick={() => removeExercise(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-10 w-10 p-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="space-y-3">
                        <Label className="text-base font-medium">Target Sets</Label>
                        <Input
                          type="number"
                          placeholder="3"
                          value={exercise.targetSets}
                          onChange={(e) => updateExercise(index, "targetSets", Number.parseInt(e.target.value) || 3)}
                          className="w-full h-12 text-base"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-base font-medium">Exercise Type</Label>
                        <Select
                          value={exercise.targetType}
                          onValueChange={(value: "reps" | "time") => updateExercise(index, "targetType", value)}
                        >
                          <SelectTrigger className="w-full h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reps">Reps</SelectItem>
                            <SelectItem value="time">Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3 md:col-span-2 xl:col-span-1">
                        <Label className="text-base font-medium">
                          Target {exercise.targetType === "reps" ? "Reps" : "Time"}
                        </Label>
                        <Input
                          placeholder={exercise.targetType === "reps" ? "8-12" : "30s"}
                          value={exercise.targetReps}
                          onChange={(e) => updateExercise(index, "targetReps", e.target.value)}
                          className="w-full h-12 text-base"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">Instructions (Optional)</Label>
                      <Textarea
                        placeholder="How to perform this exercise..."
                        value={exercise.instructions}
                        onChange={(e) => updateExercise(index, "instructions", e.target.value)}
                        rows={3}
                        className="w-full resize-none text-base"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <Card className="p-6 md:p-6 lg:p-6 shadow-md border-2 rounded-xl">
        <div className="flex flex-col lg:flex-row gap-4 justify-end">
          <Button 
            onClick={onCancel} 
            variant="outline" 
            className="w-full lg:w-auto h-12 px-8 text-base order-2 lg:order-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!workoutName.trim() || exercises.length === 0}
            className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 text-base order-1 lg:order-2"
          >
            {initialWorkout?.id ? 'Update Workout' : 'Save Workout'}
          </Button>
        </div>
      </Card>

      {showExerciseSelector && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center">
          <div className="w-full h-full max-w-full max-h-full bg-background shadow-2xl">
            <ExerciseSelector
              onSelect={handleExerciseSelect}
              onClose={() => setShowExerciseSelector(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
