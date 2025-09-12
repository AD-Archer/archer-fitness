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
  <div className="space-y-6 w-full max-w-3xl mx-auto px-0 sm:px-0 md:px-0 pb-6 relative">
    {/* Workout Details Section */}
  <Card className="p-5 md:p-6 pt-6 md:pt-8 border rounded-xl shadow-sm bg-card">
    <h2 className="text-xl font-semibold tracking-tight mb-4 mt-1">Workout Details</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2.5">
        <Label htmlFor="workout-name" className="text-sm font-medium">Workout Name</Label>
        <Input
          id="workout-name"
          placeholder="My Custom Workout"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="w-full h-9 md:h-10 text-sm"
        />
        </div>
          <div className="space-y-2.5">
            <Label htmlFor="estimated-duration" className="text-sm font-medium">Estimated Duration (minutes)</Label>
            <Input
              id="estimated-duration"
              type="number"
              placeholder="45"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className="w-full h-9 md:h-10 text-sm"
            />
          </div>
          <div className="lg:col-span-2 space-y-2.5">
            <Label htmlFor="workout-description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="workout-description"
              placeholder="Brief description of the workout"
              value={workoutDescription}
              onChange={(e) => setWorkoutDescription(e.target.value)}
              rows={3}
              className="w-full resize-none text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Exercises Section */}
      <Card className="p-5 md:p-6 border rounded-xl shadow-sm bg-card">
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <h3 className="text-lg font-medium">Exercises ({exercises.length})</h3>
            <Button 
              onClick={addExercise} 
              variant="outline"
              className="w-full lg:w-auto h-9 md:h-10 px-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
            </div>


          {exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-muted/30 border border-dashed rounded-lg p-10 md:p-12 text-center">
              <span className="mb-4 text-4xl">💪</span>
              <h3 className="text-lg font-medium mb-2 tracking-tight">No Exercises Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md text-sm">Add exercises to create your custom workout.</p>
              <Button onClick={addExercise} variant="outline" className="h-9 md:h-10 px-4">
                <Plus className="w-4 h-4 mr-2" />
                Add your first exercise
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <Card key={exercise.id} className="p-4 md:p-5 border rounded-lg shadow-sm transition-colors hover:bg-muted/40">
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-muted text-foreground/70 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold tracking-tight text-base lg:text-lg truncate">{exercise.name}</h4>
                      </div>
                      <Button
                        onClick={() => removeExercise(index)}
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Target Sets</Label>
                        <Input
                          type="number"
                          placeholder="3"
                          value={exercise.targetSets}
                          onChange={(e) => updateExercise(index, "targetSets", Number.parseInt(e.target.value) || 3)}
                          className="w-full h-9 md:h-10 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Exercise Type</Label>
                        <Select
                          value={exercise.targetType}
                          onValueChange={(value: "reps" | "time") => updateExercise(index, "targetType", value)}
                        >
                          <SelectTrigger className="w-full h-9 md:h-10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reps">Reps</SelectItem>
                            <SelectItem value="time">Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2 xl:col-span-1">
                        <Label className="text-sm font-medium">
                          Target {exercise.targetType === "reps" ? "Reps" : "Time"}
                        </Label>
                        <Input
                          placeholder={exercise.targetType === "reps" ? "8-12" : "30s"}
                          value={exercise.targetReps}
                          onChange={(e) => updateExercise(index, "targetReps", e.target.value)}
                          className="w-full h-9 md:h-10 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Instructions (Optional)</Label>
                      <Textarea
                        placeholder="How to perform this exercise..."
                        value={exercise.instructions}
                        onChange={(e) => updateExercise(index, "instructions", e.target.value)}
                        rows={3}
                        className="w-full resize-none text-sm"
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
      <Card className="p-4 md:p-5 border rounded-xl shadow-sm bg-card">
        <div className="flex flex-col lg:flex-row gap-4 justify-end">
          <Button 
            onClick={onCancel} 
            variant="outline" 
            className="w-full lg:w-auto h-9 md:h-10 px-6 text-sm order-2 lg:order-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!workoutName.trim() || exercises.length === 0}
            className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white h-9 md:h-10 px-6 text-sm order-1 lg:order-2"
          >
            {initialWorkout?.id ? 'Update Workout' : 'Save Workout'}
          </Button>
        </div>
      </Card>

      {showExerciseSelector && (
        <div className="absolute inset-0 z-[60] bg-black/60 flex items-center justify-center">
          <div className="w-full h-full max-w-full max-h-full bg-background shadow-2xl overflow-auto">
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
