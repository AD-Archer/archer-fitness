"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import type React from "react"

import { useState } from "react"
import { WorkoutSelection } from "./workout-selection"
import { WorkoutSession as WorkoutSessionView } from "./workout-session"
import { AddExerciseModal } from "./add-exercise-modal"
import { useWorkoutSession, useWorkoutTimer, useWorkoutActions } from "../hooks"
import { getWorkoutProgress } from "../utils"

// Import WorkoutTimerState type
import type { WorkoutTimerState } from "../hooks"

export function WorkoutTracker() {
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false)

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
    } catch (e) {
      console.error("Failed to save workout state", e)
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
    await addExercise(exercise.name, targetType)
    // Switch to the newly added exercise (it will be at the end)
    switchToExercise(session!.exercises.length)
  }

  // Debug logging (simplified to avoid runtime errors)
  const debugInfo = {
    availableWorkouts: availableWorkouts?.length || 0,
    showWorkoutSelection,
    isLoading,
    hasSession: !!session,
    timer,
    isTimerRunning
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log("WorkoutTracker:", debugInfo)
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
    </>
  )
}
