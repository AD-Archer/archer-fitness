"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import type React from "react"

import { useState } from "react"
import { WorkoutSelection } from "./workout-selection"
import { WorkoutSession as WorkoutSessionView } from "./workout-session"
import { AddExerciseModal } from "./add-exercise-modal"
import { SaveWorkoutDialog } from "./save-workout-dialog"
import { useWorkoutSession, useWorkoutTimer, useWorkoutActions } from "../hooks"
import { getWorkoutProgress } from "../utils"

// Import WorkoutTimerState type
import type { WorkoutTimerState } from "../hooks"

export function WorkoutTracker() {
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSavingWorkout, setIsSavingWorkout] = useState(false)

  // Use the custom hooks
  const {
    session,
    setSession,
    availableWorkouts,
    showWorkoutSelection,
    isLoading,
    savedState,
    startWorkout,
    saveCustomWorkout,
    editCustomWorkout,
    deleteWorkout,
    backToSelection,
  } = useWorkoutSession()

  const {
    timer,
    exerciseTimer,
    isTimerRunning,
    restTimer,
    isResting,
    currentExerciseIndex,
    pauseWorkout,
    startRest,
    skipRest,
    nextExercise,
    previousExercise,
    switchToExercise,
    reset,
  } = useWorkoutTimer(session, savedState as Partial<WorkoutTimerState> | undefined)

  const {
    isAddingExercise,
    addSet,
    addExercise,
  } = useWorkoutActions(session, setSession)

  // Enhanced save workout that includes timer state
  const saveWorkout = async () => {
    if (!session) return
    setShowSaveDialog(true)
  }

  // Save only the session progress
  const saveSessionOnly = async () => {
    if (!session) return

    setIsSavingWorkout(true)
    try {
      // Save workout state to the server with current timer values
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}/saved-state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentExerciseIndex,
          timer,
          exerciseTimer,
          isTimerRunning,
          isResting,
          restTimer,
          lastSetData: session.exercises[currentExerciseIndex]?.sets.length > 0
            ? {
                reps: session.exercises[currentExerciseIndex].sets[session.exercises[currentExerciseIndex].sets.length - 1].reps,
                weight: session.exercises[currentExerciseIndex].sets[session.exercises[currentExerciseIndex].sets.length - 1].weight,
                isBodyweight: session.exercises[currentExerciseIndex].sets[session.exercises[currentExerciseIndex].sets.length - 1].weight === undefined
              }
            : null
        }),
      })

      // Update session status to paused
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paused",
          duration: timer,
        }),
      })

      // Reset everything and go back to selection
      reset()
      setSession(null)
      backToSelection()
      setShowSaveDialog(false)
    } catch (e) {
      console.error("Failed to save workout state", e)
      alert("Failed to save workout. Please try again.")
    } finally {
      setIsSavingWorkout(false)
    }
  }

  // Save as a new workout template
  const saveAsNewWorkout = async (name: string, description?: string) => {
    if (!session) return

    setIsSavingWorkout(true)
    try {
      // First save the session progress
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}/saved-state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentExerciseIndex,
          timer,
          exerciseTimer,
          isTimerRunning,
          isResting,
          restTimer,
        }),
      })

      // Create new workout template
      const exercisesForTemplate = session.exercises.map((ex, index) => ({
        name: ex.name,
        exerciseId: ex.id,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetType: ex.targetType || "reps",
        order: index,
      }))

      const response = await fetch("/api/workout-tracker/workout-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          estimatedDuration: Math.ceil(timer / 60), // Convert seconds to minutes
          exercises: exercisesForTemplate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create workout template")
      }

      // Update session status to paused
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paused",
          duration: timer,
        }),
      })

      // Reset everything and go back to selection
      reset()
      setSession(null)
      backToSelection()
      setShowSaveDialog(false)
      alert(`Workout "${name}" saved successfully!`)
    } catch (e) {
      console.error("Failed to save workout template", e)
      alert("Failed to save workout template. Please try again.")
    } finally {
      setIsSavingWorkout(false)
    }
  }

  // Update existing workout template
  const updateExistingWorkout = async () => {
    if (!session || !(session as any).workoutTemplateId) return

    setIsSavingWorkout(true)
    try {
      // First save the session progress
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}/saved-state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentExerciseIndex,
          timer,
          exerciseTimer,
          isTimerRunning,
          isResting,
          restTimer,
        }),
      })

      // Update existing workout template
      const exercisesForTemplate = session.exercises.map((ex, index) => ({
        name: ex.name,
        exerciseId: ex.id,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetType: ex.targetType || "reps",
        order: index,
      }))

      const response = await fetch(`/api/workout-tracker/workout-templates/${(session as any).workoutTemplateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session.name,
          exercises: exercisesForTemplate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update workout template")
      }

      // Update session status to paused
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paused",
          duration: timer,
        }),
      })

      // Reset everything and go back to selection
      reset()
      setSession(null)
      backToSelection()
      setShowSaveDialog(false)
      alert(`Workout "${session.name}" updated successfully!`)
    } catch (e) {
      console.error("Failed to update workout template", e)
      alert("Failed to update workout template. Please try again.")
    } finally {
      setIsSavingWorkout(false)
    }
  }

  // Enhanced finish workout that includes timer state
  const finishWorkoutWithTimer = async () => {
    if (!session) return
    try {
      // Update session status to completed
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          endTime: new Date().toISOString(),
          duration: timer,
        }),
      })

      // Clear saved state since workout is complete
      try {
        await fetch(`/api/workout-tracker/workout-sessions/${session.id}/saved-state`, {
          method: "DELETE",
        })
      } catch {
        // No saved state to clear
      }
    } catch (e) {
      console.error("Failed to complete session", e)
    }
    reset()
    setSession(null)
    backToSelection()
  }

  // Enhanced stop workout that includes timer state
  const stopWorkoutWithTimer = async () => {
    if (!session) return
    try {
      // Update session status to cancelled/stopped
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          endTime: new Date().toISOString(),
          duration: timer,
        }),
      })

      // Clear saved state since workout is stopped
      try {
        await fetch(`/api/workout-tracker/workout-sessions/${session.id}/saved-state`, {
          method: "DELETE",
        })
      } catch {
        // No saved state to clear
      }
    } catch (e) {
      console.error("Failed to stop session", e)
    }
    reset()
    setSession(null)
    backToSelection()
  }

  // Enhanced add set that starts rest timer
  const addSetWithRest = async (exerciseId: string, reps: number, weight?: number) => {
    await addSet(exerciseId, reps, weight)

    // Start rest timer after completing a set
    startRest(90) // 90 seconds rest

    // Reset exercise timer for next set (for timed exercises)
    if (session?.exercises.find((ex: any) => ex.id === exerciseId)?.targetType === "time") {
      // The exercise timer will be reset by the useEffect in the timer hook
    }
  }

  // Add exercise mid-workout: open modal
  const addExerciseMidWorkout = () => {
    setShowAddExerciseModal(true)
  }

  // Handle adding exercise from modal
  const handleAddExercise = async (exercise: { name: string; id?: string; instructions?: string }, targetType?: "reps" | "time") => {
    await addExercise(exercise.name, targetType, exercise.id)
    // Switch to the newly added exercise (it will be at the end)
    switchToExercise(session!.exercises.length)
  }

  // Handle removing exercise from workout
  const removeExercise = async (exerciseId: string) => {
    if (!session) return
    
    try {
      // Remove from server first
      const response = await fetch(`/api/workout-tracker/workout-sessions/${session.id}/exercises/${exerciseId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove exercise')
      }

      // Find the exercise in the session
      const exerciseIndex = session.exercises.findIndex(ex => ex.id === exerciseId)
      if (exerciseIndex === -1) return

      // If we're removing the current exercise and it's not the first one, switch to previous
      let newCurrentIndex = currentExerciseIndex
      if (exerciseIndex === currentExerciseIndex && currentExerciseIndex > 0) {
        newCurrentIndex = currentExerciseIndex - 1
        previousExercise()
      } else if (exerciseIndex < currentExerciseIndex) {
        // If we're removing an exercise before the current one, adjust the index
        newCurrentIndex = currentExerciseIndex - 1
      }

      // Remove from session state
      const updatedExercises = session.exercises.filter(ex => ex.id !== exerciseId)
      setSession({
        ...session,
        exercises: updatedExercises
      })

      // If no exercises left, go back to selection
      if (updatedExercises.length === 0) {
        stopWorkoutWithTimer()
        return
      }

      // If the current exercise index is now out of bounds, adjust it
      if (newCurrentIndex >= updatedExercises.length) {
        switchToExercise(updatedExercises.length - 1)
      }

    } catch (error) {
      console.error("Failed to remove exercise:", error)
      alert(`Failed to remove exercise: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workouts...</p>
        </div>
      </div>
    )
  }

  if (showWorkoutSelection) {
    return (
      <WorkoutSelection
        availableWorkouts={availableWorkouts}
        onStartWorkout={startWorkout}
        onDeleteWorkout={deleteWorkout}
        onSaveCustomWorkout={saveCustomWorkout}
        onEditCustomWorkout={editCustomWorkout}
      />
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      <WorkoutSessionView
        session={session}
        currentExerciseIndex={currentExerciseIndex}
        timer={timer}
        isTimerRunning={isTimerRunning}
        isResting={isResting}
        restTimer={restTimer}
        exerciseTimer={exerciseTimer}
        onPauseWorkout={pauseWorkout}
        onFinishWorkout={finishWorkoutWithTimer}
        onStopWorkout={stopWorkoutWithTimer}
        onBackToSelection={() => {
          reset()
          backToSelection()
        }}
        onAddSet={addSetWithRest}
        onAddExercise={addExerciseMidWorkout}
        onRemoveExercise={removeExercise}
        onNextExercise={nextExercise}
        onPreviousExercise={previousExercise}
        onSkipRest={skipRest}
        onSwitchToExercise={switchToExercise}
        onSaveWorkout={saveWorkout}
        getWorkoutProgress={() => getWorkoutProgress(session)}
      />
      <AddExerciseModal
        isOpen={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        onAddExercise={handleAddExercise}
        isLoading={isAddingExercise}
      />
      <SaveWorkoutDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSaveSessionOnly={saveSessionOnly}
        onSaveAsNew={saveAsNewWorkout}
        onUpdateExisting={updateExistingWorkout}
        session={session}
        isSaving={isSavingWorkout}
      />
    </>
  )
}
