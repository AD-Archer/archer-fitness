"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Check,
  Pause,
  Play,
  Square,
  Target,
  Save,
  X,
  Trash2,
  Pencil,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { AddSetForm } from "./add-set-form";
import { RestTimer } from "./rest-timer";
import { ExerciseTimer } from "./exercise-timer";
import {
  formatTime,
  getExerciseProgress,
  isExerciseCompleted,
  getCompletedExercisesCount,
} from "../utils";
import { formatWeight } from "@/lib/weight-utils";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { logger } from "@/lib/logger";
import type {
  WorkoutSession as WorkoutSessionType,
  ExerciseSet as TrackedExerciseSet,
} from "../types/workout";

interface WorkoutSessionProps {
  session: WorkoutSessionType;
  currentExerciseIndex: number;
  timer: number;
  isTimerRunning: boolean;
  isResting: boolean;
  restTimer: number;
  exerciseTimer: number;
  onPauseWorkout: () => void;
  onFinishWorkout: () => void;
  onStopWorkout: () => void;
  onBackToSelection: () => void;
  onAddSet: (exerciseId: string, reps: number, weight?: number) => void;
  onUpdateSet: (
    exerciseId: string,
    setId: string,
    payload: { reps?: number; weight?: number; duration?: number },
  ) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseId: string) => void;
  onNextExercise: () => void;
  onPreviousExercise: () => void;
  onSkipRest: () => void;
  onAddRestTime?: (seconds: number) => void;
  onRemoveRestTime?: (seconds: number) => void;
  onSwitchToExercise: (index: number) => void;
  onSaveWorkout?: () => void;
  getWorkoutProgress: () => number;
}

export function WorkoutSession({
  session,
  currentExerciseIndex,
  timer,
  isTimerRunning,
  isResting,
  restTimer,
  exerciseTimer,
  onPauseWorkout,
  onFinishWorkout,
  onStopWorkout,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onAddExercise,
  onRemoveExercise,
  onNextExercise,
  onPreviousExercise,
  onSkipRest,
  onAddRestTime,
  onRemoveRestTime,
  onSwitchToExercise,
  onSaveWorkout,
  getWorkoutProgress,
}: WorkoutSessionProps) {
  const currentExercise = session.exercises[currentExerciseIndex];
  const workoutHeaderRef = useRef<HTMLDivElement>(null);
  const { units } = useUserPreferences();
  const [editingSetContext, setEditingSetContext] = useState<{
    exerciseId: string;
    setId: string;
    setNumber: number;
    reps?: number;
    duration?: number;
    weight?: number;
    isBodyweight?: boolean;
  } | null>(null);
  const [deleteSetDialog, setDeleteSetDialog] = useState<{
    isOpen: boolean;
    setId: string;
  }>({
    isOpen: false,
    setId: "",
  });
  const [showExerciseDetails, setShowExerciseDetails] = useState(false);

  useEffect(() => {
    setEditingSetContext(null);
  }, [currentExerciseIndex, session.exercises]);

  // Handle add exercise with scroll to top
  const handleAddExercise = () => {
    if (workoutHeaderRef.current) {
      workoutHeaderRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    onAddExercise();
  };

  // Get last set data for pre-filling the form
  const getLastSetData = () => {
    if (currentExercise.sets.length === 0) return undefined;
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
    return {
      reps: typeof lastSet.reps === "number" ? lastSet.reps : undefined,
      weight: lastSet.weight,
      isBodyweight: lastSet.weight === undefined,
    };
  };

  const editingSetForForm =
    editingSetContext && editingSetContext.exerciseId === currentExercise.id
      ? {
          id: editingSetContext.setId,
          setNumber: editingSetContext.setNumber,
          reps: editingSetContext.reps,
          duration: editingSetContext.duration,
          weight: editingSetContext.weight,
          isBodyweight: editingSetContext.isBodyweight,
        }
      : null;

  const handleEditSet = (set: TrackedExerciseSet) => {
    setEditingSetContext({
      exerciseId: currentExercise.id,
      setId: set.id,
      setNumber: set.setNumber,
      reps: typeof set.reps === "number" ? set.reps : undefined,
      duration: typeof set.duration === "number" ? set.duration : undefined,
      weight: set.weight,
      isBodyweight: set.weight === undefined,
    });
  };

  const handleDeleteSet = (setId: string) => {
    setDeleteSetDialog({ isOpen: true, setId });
  };

  const confirmDeleteSet = (setId: string) => {
    onDeleteSet(currentExercise.id, setId);
    setEditingSetContext((prev) => (prev?.setId === setId ? null : prev));
    setDeleteSetDialog({ isOpen: false, setId: "" });
  };

  // Guard clause: if no exercises or invalid index, show message
  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div
          ref={workoutHeaderRef}
          className="bg-card border-b border-border sticky top-0 z-30"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {session.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Empty workout - add your first exercise
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary font-mono">
                  {formatTime(timer)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Time
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 flex flex-col items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="space-y-2">
              <div className="text-5xl">🏋️</div>
              <h2 className="text-2xl font-bold">No Exercises Yet</h2>
              <p className="text-muted-foreground">
                This is a blank workout. Add exercises to get started and track
                your progress.
              </p>
            </div>

            <Button
              onClick={onAddExercise}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
            >
              <Target className="w-5 h-5 mr-2" />
              Add First Exercise
            </Button>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="border-t border-border bg-card sticky bottom-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex gap-2">
              <Button
                onClick={onPauseWorkout}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isTimerRunning ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isTimerRunning ? "Pause" : "Resume"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Stop Workout</AlertDialogTitle>
                    <AlertDialogDescription>
                      What would you like to do with your progress?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col gap-2">
                    <AlertDialogAction
                      onClick={onSaveWorkout}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save & Exit
                    </AlertDialogAction>
                    <AlertDialogAction
                      onClick={onStopWorkout}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Discard
                    </AlertDialogAction>
                    <AlertDialogCancel>Continue</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log exercise data
  logger.info("Current exercise data:", {
    name: currentExercise.name,
    exercise: currentExercise.exercise,
    gifUrl: currentExercise.exercise?.gifUrl,
    hasGifUrl: !!currentExercise.exercise?.gifUrl,
    muscles: currentExercise.exercise?.muscles,
    hasMuscles: !!currentExercise.exercise?.muscles?.length,
    primaryMuscles: currentExercise.exercise?.muscles?.filter(
      (m) => m.isPrimary,
    ),
    secondaryMuscles: currentExercise.exercise?.muscles?.filter(
      (m) => !m.isPrimary,
    ),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div
        ref={workoutHeaderRef}
        className="sticky top-0 z-30 bg-card border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title & Progress */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                {session.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Exercise {currentExerciseIndex + 1} of{" "}
                {session.exercises.length}
              </p>
            </div>

            {/* Center: Timer */}
            <div className="flex items-center gap-4 mx-4 sm:mx-8">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary font-mono">
                  {formatTime(timer)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Time
                </div>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={onPauseWorkout}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isTimerRunning ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Workout Progress</span>
              <span>
                {Math.round(getWorkoutProgress())}% •{" "}
                {getCompletedExercisesCount(session)}/{session.exercises.length}
              </span>
            </div>
            <Progress value={getWorkoutProgress()} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Exercise Area - 2 columns on desktop */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Rest Timer */}
            {isResting && (
              <div>
                <RestTimer
                  restTimer={restTimer}
                  onSkipRest={onSkipRest}
                  onAddTime={onAddRestTime}
                  onRemoveTime={onRemoveRestTime}
                />
              </div>
            )}

            {/* Exercise Timer for Timed Exercises */}
            {currentExercise.targetType === "time" && !isResting && (
              <ExerciseTimer
                exerciseTimer={exerciseTimer}
                targetTime={currentExercise.targetReps}
              />
            )}

            {/* Current Exercise Card */}
            <Card className="overflow-visible border-2 border-primary/20">
              <CardHeader className="border-b border-border pb-6 bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-3xl sm:text-4xl font-bold mb-3">
                      {currentExercise.name}
                    </CardTitle>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Target
                        </p>
                        <p className="text-sm font-semibold">
                          {currentExercise.targetSets} ×{" "}
                          {currentExercise.targetReps}
                          {currentExercise.targetType === "time"
                            ? "s"
                            : " reps"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Progress
                        </p>
                        <p className="text-sm font-semibold">
                          {currentExercise.sets.length}/
                          {currentExercise.targetSets}
                        </p>
                      </div>
                      {currentExercise.exercise?.equipments &&
                        currentExercise.exercise.equipments.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Equipment
                            </p>
                            <p className="text-sm font-semibold">
                              {
                                currentExercise.exercise.equipments[0].equipment
                                  .name
                              }
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <Progress
                      value={getExerciseProgress(currentExercise)}
                      className="h-2"
                    />
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex flex-col gap-2">
                    {currentExercise.completed ||
                    isExerciseCompleted(currentExercise) ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Check className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    ) : null}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 h-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Exercise</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove &quot;
                            {currentExercise.name}&quot; from this workout? All
                            sets will be lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onRemoveExercise(currentExercise.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-8 space-y-8 overflow-visible">
                {/* Collapsible Exercise Details */}
                <div className="border border-border rounded-lg overflow-visible">
                  <button
                    onClick={() => setShowExerciseDetails(!showExerciseDetails)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition"
                  >
                    <h3 className="font-semibold">Exercise Details</h3>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        showExerciseDetails ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showExerciseDetails && (
                    <>
                      <div className="border-t border-border" />
                      <div className="p-6 space-y-6">
                        {/* Demo */}
                        {currentExercise.exercise?.gifUrl && (
                          <div className="w-full">
                            <h4 className="font-medium mb-3">Demonstration</h4>
                            <div
                              className="w-full bg-muted/20 rounded-lg border border-border flex items-center justify-center overflow-visible"
                              style={{ minHeight: "300px" }}
                            >
                              <Image
                                src={currentExercise.exercise.gifUrl}
                                alt={`${currentExercise.name} demonstration`}
                                width={400}
                                height={300}
                                className="h-auto w-auto max-w-full max-h-96"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Muscles */}
                        {currentExercise.exercise?.muscles &&
                          currentExercise.exercise.muscles.filter(
                            (m) => m.isPrimary,
                          ).length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3">
                                Primary Muscles
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {currentExercise.exercise.muscles
                                  .filter((m) => m.isPrimary)
                                  .map((muscle, idx) => (
                                    <Badge
                                      key={idx}
                                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    >
                                      {muscle.muscle.name}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                        {currentExercise.exercise?.muscles &&
                          currentExercise.exercise.muscles.filter(
                            (m) => !m.isPrimary,
                          ).length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3">
                                Secondary Muscles
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {currentExercise.exercise.muscles
                                  .filter((m) => !m.isPrimary)
                                  .map((muscle, idx) => (
                                    <Badge key={idx} variant="outline">
                                      {muscle.muscle.name}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                        {/* Instructions */}
                        {currentExercise.instructions && (
                          <div className="bg-muted/50 border border-border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Instructions</h4>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {currentExercise.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Sets Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Sets</h3>
                  {currentExercise.sets.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center bg-muted/30 rounded-lg">
                      No sets logged yet. Add your first set below!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {currentExercise.sets.map((set) => {
                        const isTimeBased =
                          currentExercise.targetType === "time";
                        const setDuration = set.duration ?? set.reps ?? 0;
                        const isEditingThisSet =
                          editingSetContext?.setId === set.id;

                        return (
                          <div
                            key={set.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition ${
                              isEditingThisSet
                                ? "border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40"
                                : "bg-muted/30 border-border hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={
                                  isEditingThisSet ? "default" : "secondary"
                                }
                                className="text-xs"
                              >
                                Set {set.setNumber}
                              </Badge>
                              <span className="text-sm font-medium">
                                {isTimeBased
                                  ? formatTime(setDuration)
                                  : `${set.reps ?? 0} reps`}
                              </span>
                              {set.weight !== null &&
                                set.weight !== undefined && (
                                  <span className="text-xs text-muted-foreground">
                                    @ {formatWeight(set.weight, units)}
                                  </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleEditSet(set)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => handleDeleteSet(set.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              <Check className="w-3.5 h-3.5 text-green-600 ml-2" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add New Set Form */}
                <div className="border-t border-border pt-4">
                  <h4 className="font-medium mb-4">Add New Set</h4>
                  <AddSetForm
                    exerciseId={currentExercise.id}
                    setNumber={currentExercise.sets.length + 1}
                    targetType={currentExercise.targetType}
                    currentExerciseTimer={exerciseTimer}
                    lastSetData={getLastSetData()}
                    editingSet={editingSetForForm}
                    isResting={isResting}
                    onAddSet={onAddSet}
                    onUpdateSet={onUpdateSet}
                    onCancelEdit={() => setEditingSetContext(null)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Exercise List & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="space-y-2">
              <Button
                onClick={onFinishWorkout}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={getCompletedExercisesCount(session) === 0}
              >
                <Check className="w-4 h-4 mr-2" />
                Finish Workout
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Square className="w-4 h-4 mr-2" />
                    Stop Workout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Stop Workout</AlertDialogTitle>
                    <AlertDialogDescription>
                      What would you like to do with your progress?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col gap-2">
                    <AlertDialogAction
                      onClick={onSaveWorkout}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save & Exit
                    </AlertDialogAction>
                    <AlertDialogAction
                      onClick={onStopWorkout}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Discard
                    </AlertDialogAction>
                    <AlertDialogCancel>Continue</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Exercise Navigation */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="font-medium text-sm">Exercises</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {session.exercises.map((ex, idx) => (
                  <button
                    key={ex.id}
                    onClick={() => onSwitchToExercise(idx)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition border ${
                      idx === currentExerciseIndex
                        ? "bg-primary/10 border-primary text-primary font-medium"
                        : isExerciseCompleted(ex)
                          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-foreground"
                          : "bg-muted/30 border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isExerciseCompleted(ex) && (
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{ex.name}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {ex.sets.length}/{ex.targetSets}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Add Exercise Button */}
              <button
                onClick={handleAddExercise}
                className="w-full p-3 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4" />
                Add Exercise
              </button>
            </div>

            {/* Navigation Controls */}
            <div className="flex gap-2">
              <Button
                onClick={onPreviousExercise}
                disabled={currentExerciseIndex === 0}
                variant="outline"
                className="flex-1"
              >
                ← Prev
              </Button>
              <Button
                onClick={onNextExercise}
                disabled={currentExerciseIndex === session.exercises.length - 1}
                variant="outline"
                className="flex-1"
              >
                Next →
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Set Confirmation Dialog */}
        <AlertDialog
          open={deleteSetDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) setDeleteSetDialog({ isOpen: false, setId: "" });
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Set?</AlertDialogTitle>
              <AlertDialogDescription>
                This set will be permanently removed from your workout. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => confirmDeleteSet(deleteSetDialog.setId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
