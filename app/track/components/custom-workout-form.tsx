"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TrackedExercise {
  id: string
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

  const addExercise = () => {
    const newExercise: Omit<TrackedExercise, "sets" | "completed"> = {
      id: Date.now().toString(),
      name: "",
      targetSets: 3,
      targetReps: "8-12",
      targetType: "reps",
      instructions: "",
    }
    setExercises((prev) => [...prev, newExercise])
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
        name: ex.name.trim() || "Push-ups",
        targetSets: ex.targetSets || 3,
        targetReps: ex.targetReps || "8-12",
        targetType: ex.targetType || "reps",
        instructions: ex.instructions || "",
      })).filter((ex) => ex.name.trim()),
      isCustom: true,
    }

    onSave(newWorkout)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="workout-name">Workout Name</Label>
          <Input
            id="workout-name"
            placeholder="My Custom Workout"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="workout-description">Description</Label>
          <Input
            id="workout-description"
            placeholder="Brief description of the workout"
            value={workoutDescription}
            onChange={(e) => setWorkoutDescription(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="estimated-duration">Estimated Duration (minutes)</Label>
          <Input
            id="estimated-duration"
            type="number"
            placeholder="45"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Exercises</h3>
        </div>

        {exercises.map((exercise, index) => (
          <Card key={exercise.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Exercise {index + 1}</h4>
                <Button
                  onClick={() => removeExercise(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-3">
                <div>
                  <Label>Exercise Name</Label>
                  <Input
                    placeholder="Push-ups"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, "name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Target Sets</Label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={exercise.targetSets}
                      onChange={(e) => updateExercise(index, "targetSets", Number.parseInt(e.target.value) || 3)}
                    />
                  </div>
                  <div>
                    <Label>Exercise Type</Label>
                    <Select
                      value={exercise.targetType}
                      onValueChange={(value: "reps" | "time") => updateExercise(index, "targetType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reps">Reps</SelectItem>
                        <SelectItem value="time">Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>
                    Target {exercise.targetType === "reps" ? "Reps" : "Time"}
                  </Label>
                  <Input
                    placeholder={exercise.targetType === "reps" ? "8-12" : "30s"}
                    value={exercise.targetReps}
                    onChange={(e) => updateExercise(index, "targetReps", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Instructions</Label>
                  <Textarea
                    placeholder="How to perform this exercise..."
                    value={exercise.instructions}
                    onChange={(e) => updateExercise(index, "instructions", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Add Exercise Button at the bottom */}
        <div className="flex justify-center pt-4">
          <Button onClick={addExercise} variant="outline" className="bg-transparent">
            <Plus className="w-4 h-4 mr-1" />
            Add Exercise
          </Button>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={!workoutName.trim() || exercises.length === 0}>
          Save Workout
        </Button>
        <Button onClick={onCancel} variant="outline" className="bg-transparent">
          Cancel
        </Button>
      </div>
    </div>
  )
}
