"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, PlusCircle, Trash2, Dumbbell } from "lucide-react";
import { ExerciseSelector } from "./exercise-selector";
import { ExerciseTypeSelector } from "./exercise-type-selector";
import type { WorkoutTemplate } from "../types/workout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ExerciseAssociation {
  id: string;
  name: string;
}

interface TrackedExercise {
  id: string;
  exerciseId: string;
  name: string;
  targetSets: number | string;
  targetReps: string;
  targetType: "reps" | "time";
  instructions?: string;
  description?: string;
  gifUrl?: string;
  bodyParts?: Array<{ bodyPart: ExerciseAssociation }>;
  muscles?: Array<{ muscle: ExerciseAssociation; isPrimary: boolean }>;
  equipments?: Array<{ equipment: ExerciseAssociation }>;
}

type SelectedExercise = {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  gifUrl?: string;
  bodyParts?: Array<{ bodyPart: { id: string; name: string } }>;
  muscles?: Array<{ muscle: { id: string; name: string }; isPrimary: boolean }>;
  equipments?: Array<{ equipment: { id: string; name: string } }>;
};

interface CustomWorkoutFormProps {
  onSave: (workout: WorkoutTemplate) => void;
  onCancel: () => void;
  initialWorkout?: Partial<WorkoutTemplate>;
}

export function CustomWorkoutForm({
  onSave,
  onCancel,
  initialWorkout,
}: CustomWorkoutFormProps) {
  const [workoutName, setWorkoutName] = useState(initialWorkout?.name ?? "");
  const [workoutDescription, setWorkoutDescription] = useState(
    initialWorkout?.description ?? "",
  );
  const [estimatedDuration, setEstimatedDuration] = useState(
    initialWorkout?.estimatedDuration
      ? String(initialWorkout.estimatedDuration)
      : "",
  );
  const [exercises, setExercises] = useState<
    Omit<TrackedExercise, "sets" | "completed">[]
  >(
    initialWorkout?.exercises?.map((ex) => ({
      id: ex.id,
      exerciseId:
        "exerciseId" in ex ? (ex as any).exerciseId : ex.exercise?.id || ex.id,
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
    })) ?? [],
  );
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showExerciseTypeSelector, setShowExerciseTypeSelector] =
    useState(false);
  const [selectedExerciseForType, setSelectedExerciseForType] =
    useState<SelectedExercise | null>(null);
  const [previewExercise, setPreviewExercise] =
    useState<TrackedExercise | null>(null);

  const addExercise = () => {
    setShowExerciseSelector(true);
  };

  const handleExerciseSelect = (selectedExercise: SelectedExercise) => {
    setSelectedExerciseForType(selectedExercise);
    setShowExerciseSelector(false);
    setShowExerciseTypeSelector(true);
  };

  const handleExerciseTypeSelected = (targetType: "reps" | "time") => {
    if (!selectedExerciseForType) return;

    const newExercise: Omit<TrackedExercise, "sets" | "completed"> = {
      id: Date.now().toString(),
      exerciseId: selectedExerciseForType.id,
      name: selectedExerciseForType.name,
      targetSets: 3,
      targetReps: targetType === "reps" ? "8-12" : "30",
      targetType,
      instructions: selectedExerciseForType.instructions || "",
      description: selectedExerciseForType.description,
      gifUrl: selectedExerciseForType.gifUrl,
      bodyParts: selectedExerciseForType.bodyParts,
      muscles: selectedExerciseForType.muscles,
      equipments: selectedExerciseForType.equipments,
    };
    setExercises((prev) => [...prev, newExercise]);
    setShowExerciseTypeSelector(false);
    setSelectedExerciseForType(null);
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleViewExercise = (exercise: TrackedExercise) => {
    setPreviewExercise(exercise);
  };

  const handleClosePreview = (open: boolean) => {
    if (!open) {
      setPreviewExercise(null);
    }
  };

  const handleSave = () => {
    if (!workoutName.trim() || exercises.length === 0) return;

    const hasCustomExercises = exercises.some(
      (ex) => !ex.exerciseId || ex.exerciseId === "",
    );
    const newWorkout: WorkoutTemplate = {
      id: (initialWorkout?.id as string) || Date.now().toString(),
      name: workoutName.trim(),
      description: workoutDescription.trim(),
      estimatedDuration: Number.parseInt(estimatedDuration) || 30,
      exercises: exercises.map((ex) => ({
        id: ex.id,
        exerciseId: ex.exerciseId || undefined,
        name: ex.name,
        targetSets:
          typeof ex.targetSets === "string"
            ? parseInt(ex.targetSets, 10) || 3
            : ex.targetSets || 3,
        targetReps: ex.targetReps || "8-12",
        targetType: ex.targetType || "reps",
        instructions: ex.instructions || "",
      })),
      isCustom: hasCustomExercises,
    };

    onSave(newWorkout);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {initialWorkout?.id ? "Edit Workout" : "Create Workout"}
          </h1>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Details Section */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <p className="text-sm text-muted-foreground">
                Name and describe your workout
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workout-name" className="text-sm font-medium">
                  Workout Name *
                </Label>
                <Input
                  id="workout-name"
                  placeholder="e.g., Upper Body Strength"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="estimated-duration"
                  className="text-sm font-medium"
                >
                  Duration (minutes)
                </Label>
                <Input
                  id="estimated-duration"
                  type="number"
                  placeholder="45"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label
                  htmlFor="workout-description"
                  className="text-sm font-medium"
                >
                  Description
                </Label>
                <Textarea
                  id="workout-description"
                  placeholder="What's this workout about?"
                  value={workoutDescription}
                  onChange={(e) => setWorkoutDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Exercises Section */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Exercises</h2>
                <p className="text-sm text-muted-foreground">
                  {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                onClick={addExercise}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            {exercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed rounded-lg p-8 sm:p-12 text-center">
                <Dumbbell className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium mb-1">No exercises added</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Add your first exercise to get started
                </p>
                <Button onClick={addExercise} variant="outline" size="sm">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Exercise
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="flex items-center gap-3 p-4 bg-muted/30 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 text-sm font-semibold text-muted-foreground w-6 text-center">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">
                            {exercise.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{exercise.targetSets} sets</span>
                            <span>•</span>
                            <span>
                              {exercise.targetType === "reps"
                                ? `${exercise.targetReps} reps`
                                : `${exercise.targetReps} time`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => handleViewExercise(exercise)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => removeExercise(index)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-40 bg-background/80 backdrop-blur-sm border-t px-4 sm:px-6 py-4 mt-6">
        <div className="max-w-4xl mx-auto flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            variant="outline"
            className="min-w-[120px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!workoutName.trim() || exercises.length === 0}
            className="min-w-[120px] bg-primary hover:bg-primary/90"
          >
            {initialWorkout?.id ? "Update" : "Create"}
          </Button>
        </div>
      </div>
      <Dialog
        open={showExerciseSelector}
        onOpenChange={setShowExerciseSelector}
      >
        <DialogContent className="w-[96vw] sm:w-[90vw] lg:w-[80vw] xl:w-[75vw] max-w-6xl sm:max-w-6xl p-0 gap-0 rounded-2xl h-[90vh] flex flex-col overflow-hidden">
          <DialogTitle className="sr-only">Select Exercise</DialogTitle>
          <ExerciseSelector
            onSelect={handleExerciseSelect}
            onClose={() => setShowExerciseSelector(false)}
          />
        </DialogContent>
      </Dialog>
      <ExerciseTypeSelector
        isOpen={showExerciseTypeSelector}
        onSelectType={handleExerciseTypeSelected}
        onClose={() => {
          setShowExerciseTypeSelector(false);
          setSelectedExerciseForType(null);
        }}
      />{" "}
      <Dialog open={Boolean(previewExercise)} onOpenChange={handleClosePreview}>
        <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Eye className="w-5 h-5 text-blue-600" />
              {previewExercise?.name}
            </DialogTitle>
            <DialogDescription>
              Review the details for this exercise before saving it to your
              workout template.
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
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground/90">
                  {previewExercise.description}
                </p>
              </div>
            )}

            {previewExercise?.instructions && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Instructions
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground/90 whitespace-pre-line">
                  {previewExercise.instructions}
                </p>
              </div>
            )}

            {(previewExercise?.bodyParts?.length ||
              previewExercise?.muscles?.length ||
              previewExercise?.equipments?.length) && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {previewExercise?.bodyParts?.map((bp) => (
                    <Badge
                      key={bp.bodyPart.id}
                      variant="outline"
                      className="border-blue-200 text-blue-700"
                    >
                      {bp.bodyPart.name}
                    </Badge>
                  ))}
                  {previewExercise?.muscles
                    ?.filter((m) => m.isPrimary)
                    .map((m) => (
                      <Badge
                        key={m.muscle.id}
                        variant="outline"
                        className="border-green-200 text-green-700"
                      >
                        {m.muscle.name}
                      </Badge>
                    ))}
                  {previewExercise?.equipments?.map((eq) => (
                    <Badge
                      key={eq.equipment.id}
                      variant="outline"
                      className="border-orange-200 text-orange-700"
                    >
                      {eq.equipment.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewExercise(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
