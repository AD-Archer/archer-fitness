"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Eye, PlusCircle, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExerciseSelector } from "./exercise-selector"
import type { WorkoutTemplate } from "../types/workout"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface ExerciseAssociation {
  id: string
  name: string
}

interface TrackedExercise {
  id: string
  exerciseId: string
  name: string
  targetSets: number | string
  targetReps: string
  targetType: "reps" | "time"
  instructions?: string
  description?: string
  gifUrl?: string
  bodyParts?: Array<{ bodyPart: ExerciseAssociation }>
  muscles?: Array<{ muscle: ExerciseAssociation; isPrimary: boolean }>
  equipments?: Array<{ equipment: ExerciseAssociation }>
}

type SelectedExercise = {
  id: string
  name: string
  description?: string
  instructions?: string
  gifUrl?: string
  bodyParts?: Array<{ bodyPart: { id: string; name: string } }>
  muscles?: Array<{ muscle: { id: string; name: string }; isPrimary: boolean }>
  equipments?: Array<{ equipment: { id: string; name: string } }>
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
    initialWorkout?.exercises?.map((ex) => ({
      id: ex.id,
      exerciseId: 'exerciseId' in ex ? (ex as any).exerciseId : ex.exercise?.id || ex.id,
      name: ex.name,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetType: ex.targetType || "reps",
      instructions: ex.instructions ?? ex.exercise?.instructions,
      description: ex.exercise?.description ?? (ex as any).description,
      gifUrl: ex.exercise?.gifUrl ?? (ex as any).gifUrl,
      bodyParts: ex.exercise?.bodyParts ?? (ex as any).bodyParts,
      muscles: ex.exercise?.muscles ?? (ex as any).muscles,
      equipments: ex.exercise?.equipments ?? (ex as any).equipments,
    })) ?? []
  )
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)
  const [previewExercise, setPreviewExercise] = useState<TrackedExercise | null>(null)

  const addExercise = () => {
    setShowExerciseSelector(true)
  }

  const handleExerciseSelect = (selectedExercise: SelectedExercise) => {
    const newExercise: Omit<TrackedExercise, "sets" | "completed"> = {
      id: Date.now().toString(),
      exerciseId: selectedExercise.id,
      name: selectedExercise.name,
      targetSets: 3,
      targetReps: "8-12",
      targetType: "reps",
      instructions: selectedExercise.instructions || "",
      description: selectedExercise.description,
      gifUrl: selectedExercise.gifUrl,
      bodyParts: selectedExercise.bodyParts,
      muscles: selectedExercise.muscles,
      equipments: selectedExercise.equipments,
    }
    setExercises((prev) => [...prev, newExercise])
    setShowExerciseSelector(false)
  }

  const updateExercise = (index: number, field: string, value: string | number) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== index) return ex
      return { ...ex, [field]: value }
    }))
  }

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  const handleViewExercise = (exercise: TrackedExercise) => {
    setPreviewExercise(exercise)
  }

  const handleClosePreview = (open: boolean) => {
    if (!open) {
      setPreviewExercise(null)
    }
  }

  const handleSave = () => {
    if (!workoutName.trim() || exercises.length === 0) return

    const newWorkout: WorkoutTemplate = {
      id: (initialWorkout?.id as string) || Date.now().toString(),
      name: workoutName.trim(),
      description: workoutDescription.trim(),
      estimatedDuration: Number.parseInt(estimatedDuration) || 30,
      exercises: exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        targetSets: typeof ex.targetSets === 'string' ? parseInt(ex.targetSets, 10) || 3 : (ex.targetSets || 3),
        targetReps: ex.targetReps || "8-12",
        targetType: ex.targetType || "reps",
        instructions: ex.instructions || "",
      })),
      isCustom: true,
    }

    onSave(newWorkout)
  }

  return (
  <div className="space-y-6 w-full px-4 sm:px-6 lg:px-10 xl:px-12 pb-10">
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
              className="w-full lg:w-auto h-9 md:h-10 px-4"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add
            </Button>
            </div>


          {exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-muted/30 border border-dashed rounded-lg p-10 md:p-12 text-center">
              <span className="mb-4 text-4xl">💪</span>
              <h3 className="text-lg font-medium mb-2 tracking-tight">No Exercises Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md text-sm">Add exercises to create your custom workout.</p>
              <Button onClick={addExercise} variant="outline" className="h-9 md:h-10 px-4">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add your first exercise
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {exercises.map((exercise, index) => (
                <Card key={exercise.id} className="relative p-4 md:p-5 lg:pt-14 border rounded-lg shadow-sm transition-colors hover:bg-muted/40">
                  <span className="hidden lg:inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary absolute left-4 top-4">
                    {index + 1}
                  </span>
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 lg:pl-12">
                        <h4 className="font-semibold tracking-tight text-base lg:text-lg truncate">
                          {exercise.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewExercise(exercise)}
                          variant="ghost"
                          size="icon"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex-shrink-0 h-8 w-8"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => removeExercise(index)}
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      <div className="space-y-2">
                      <Label className="text-sm font-medium">Target Sets</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="3"
                        value={exercise.targetSets || ''}
                        onChange={(e) => updateExercise(index, "targetSets", e.target.value)}
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

      <Dialog open={showExerciseSelector} onOpenChange={setShowExerciseSelector}>
        <DialogContent className="w-[96vw] sm:w-[90vw] lg:w-[75vw] xl:w-[70vw] max-w-6xl p-0 overflow-y-auto rounded-2xl max-h-[95vh]">
          <ExerciseSelector
            onSelect={handleExerciseSelect}
            onClose={() => setShowExerciseSelector(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewExercise)} onOpenChange={handleClosePreview}>
        <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Eye className="w-5 h-5 text-blue-600" />
              {previewExercise?.name}
            </DialogTitle>
            <DialogDescription>
              Review the details for this exercise before saving it to your workout template.
            </DialogDescription>
          </DialogHeader>

          {previewExercise?.gifUrl ? (
            <div className="w-full rounded-lg border bg-muted/40">
              <div className="max-h-[70vh] overflow-y-auto">
                <img
                  src={previewExercise.gifUrl}
                  alt={`${previewExercise.name} demonstration`}
                  className="w-full h-auto"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 py-10 text-center text-sm text-muted-foreground">
              <span className="text-lg font-medium">No demo available</span>
              <span>There isn&apos;t a GIF associated with this exercise.</span>
            </div>
          )}

          <div className="space-y-4">
            {previewExercise?.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Description</h4>
                <p className="text-sm leading-relaxed text-muted-foreground/90">
                  {previewExercise.description}
                </p>
              </div>
            )}

            {previewExercise?.instructions && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Instructions</h4>
                <p className="text-sm leading-relaxed text-muted-foreground/90 whitespace-pre-line">
                  {previewExercise.instructions}
                </p>
              </div>
            )}

            {(previewExercise?.bodyParts?.length || previewExercise?.muscles?.length || previewExercise?.equipments?.length) && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {previewExercise?.bodyParts?.map((bp) => (
                    <Badge key={bp.bodyPart.id} variant="outline" className="border-blue-200 text-blue-700">
                      {bp.bodyPart.name}
                    </Badge>
                  ))}
                  {previewExercise?.muscles?.filter((m) => m.isPrimary).map((m) => (
                    <Badge key={m.muscle.id} variant="outline" className="border-green-200 text-green-700">
                      {m.muscle.name}
                    </Badge>
                  ))}
                  {previewExercise?.equipments?.map((eq) => (
                    <Badge key={eq.equipment.id} variant="outline" className="border-orange-200 text-orange-700">
                      {eq.equipment.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setPreviewExercise(null)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
