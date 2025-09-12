import { useState } from "react"
import type { WorkoutSession, TrackedExercise } from "../types/workout"
import { logger } from "@/lib/logger"

export function useWorkoutActions(
  session: WorkoutSession | null,
  setSession: React.Dispatch<React.SetStateAction<WorkoutSession | null>>
) {
  const [isAddingExercise, setIsAddingExercise] = useState(false)

  const saveWorkout = async () => {
    if (!session) return

    try {
      // Save workout state to the server
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}/saved-state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentExerciseIndex: 0, // We'll get this from the timer hook
          timer: 0, // We'll get this from the timer hook
          exerciseTimer: 0, // We'll get this from the timer hook
          isTimerRunning: false, // We'll get this from the timer hook
          isResting: false, // We'll get this from the timer hook
          restTimer: 0, // We'll get this from the timer hook
          lastSetData: null
        }),
      })

      // Update session status to paused
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paused",
          duration: 0, // We'll get this from the timer hook
        }),
      })

      // Reset session and go back to selection
      setSession(null)
    } catch (e) {
      logger.error("Failed to save workout state", e)
    }
  }

  const finishWorkout = async () => {
    if (!session) return
    try {
      // Update session status to completed
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          endTime: new Date().toISOString(),
          duration: 0, // We'll get this from the timer hook
        }),
      })

      // Clear saved state since workout is complete
      try {
        await fetch(`/api/workout-tracker/workout-sessions/${session.id}/saved-state`, {
          method: "DELETE",
        })
      } catch {
        logger.info("No saved state to clear")
      }
    } catch (e) {
      logger.error("Failed to complete session", e)
    }
    setSession(null)
  }

  const stopWorkout = async () => {
    if (!session) return
    try {
      // Update session status to cancelled/stopped
      await fetch(`/api/workout-tracker/workout-sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          endTime: new Date().toISOString(),
          duration: 0, // We'll get this from the timer hook
        }),
      })

      // Clear saved state since workout is stopped
      try {
        await fetch(`/api/workout-tracker/workout-sessions/${session.id}/saved-state`, {
          method: "DELETE",
        })
      } catch {
        logger.info("No saved state to clear")
      }
    } catch (e) {
      logger.error("Failed to stop session", e)
    }
    setSession(null)
  }

  const addSet = async (exerciseId: string, reps: number, weight?: number) => {
    if (!session) return

    try {
      const res = await fetch(`/api/workout-tracker/workout-sessions/${session.id}/exercises/${exerciseId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reps, weight: weight ?? null }),
      })

      if (res.ok) {
        const data = await res.json()
        const updated = data.exercise
        setSession((prev) => {
          if (!prev) return prev
          const updatedExercises = prev.exercises.map((ex) =>
            ex.id === exerciseId
              ? {
                  ...ex,
                  sets: (updated.sets || []).map((s: { reps?: number; weight?: number | null; completed: boolean }) => ({
                    reps: s.reps ?? 0,
                    weight: s.weight === null ? undefined : s.weight,
                    completed: s.completed
                  })),
                  completed: false,
                }
              : ex
          )
          return { ...prev, exercises: updatedExercises }
        })
      }
    } catch (e) {
      logger.error("Failed to add set", e)
    }
  }

  const addExercise = async (name: string, targetType: "reps" | "time" = "reps", exerciseId?: string) => {
    if (!session) return
    setIsAddingExercise(true)

    try {
      let exerciseToUse = { id: exerciseId, name }

      // If no exerciseId provided, create a new custom exercise
      if (!exerciseId) {
        const createdRes = await fetch("/api/workout-tracker/exercises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })

        if (createdRes.status === 401) {
          const errorData = await createdRes.json()
          if (errorData.error?.includes("User session is invalid")) {
            alert("Your session has expired. Please refresh the page and sign in again.")
            window.location.reload()
            return
          }
        }

        if (!createdRes.ok) {
          const errorData = await createdRes.json()
          throw new Error(errorData.error || "Failed to create exercise")
        }

        const created = await createdRes.json()
        exerciseToUse = created
      }

      // Attach to session
      const attachRes = await fetch(`/api/workout-tracker/workout-sessions/${session.id}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: exerciseToUse.id,
          targetSets: 3,
          targetReps: targetType === "time" ? "30s" : "8-12",
          targetType
        }),
      })

      if (!attachRes.ok) throw new Error("Failed to add exercise to session")

      const attached = await attachRes.json()

      const newTracked: TrackedExercise = {
        id: attached.id,
        name: attached.exercise?.name || name,
        targetSets: 3,
        targetReps: attached.targetReps,
        targetType: targetType,
        instructions: attached.exercise?.instructions,
        sets: [],
        completed: false,
      }

      setSession((prev) => (prev ? { ...prev, exercises: [...prev.exercises, newTracked] } : prev))
    } catch (e) {
      logger.error(e)
      alert(`Failed to add exercise: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setIsAddingExercise(false)
    }
  }

  return {
    isAddingExercise,
    saveWorkout,
    finishWorkout,
    stopWorkout,
    addSet,
    addExercise,
  }
}
