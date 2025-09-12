import { useState, useEffect } from "react"
import type { WorkoutTemplate, WorkoutSession } from "../types/workout"
import { transformTemplateFromAPI, transformSessionFromAPI, createWorkoutPayload, createTemplatePayload } from "../utils/workoutUtils"
import { logger } from "@/lib/logger"

const fallbackWorkouts: WorkoutTemplate[] = []

export function useWorkoutSession() {
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [availableWorkouts, setAvailableWorkouts] = useState<WorkoutTemplate[]>(fallbackWorkouts)
  const [showWorkoutSelection, setShowWorkoutSelection] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [savedState, setSavedState] = useState<Record<string, unknown> | null>(null)

  // Fetch templates and check for active sessions on load
  useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        setIsLoading(true)

        // First check for active or paused workout sessions
        const activeSessionsRes = await fetch("/api/workout-tracker/workout-sessions?status=active&limit=1")
        const pausedSessionsRes = await fetch("/api/workout-tracker/workout-sessions?status=paused&limit=1")

        let activeSession = null

        // Check for active sessions first
        if (activeSessionsRes.ok) {
          const activeSessions = await activeSessionsRes.json()
          if (activeSessions.length > 0) {
            activeSession = activeSessions[0]
          }
        }

        // If no active session, check for paused sessions
        if (!activeSession && pausedSessionsRes.ok) {
          const pausedSessions = await pausedSessionsRes.json()
          if (pausedSessions.length > 0) {
            activeSession = pausedSessions[0]
          }
        }

        if (activeSession && active) {
          const workoutSession = transformSessionFromAPI(activeSession)

          // Try to restore saved state
          try {
            const savedStateRes = await fetch(`/api/workout-tracker/workout-sessions/${activeSession.id}/saved-state`)
            if (savedStateRes.ok) {
              const state = await savedStateRes.json()
              setSavedState(state)
            }
          } catch {
            // No saved state found for active session
          }

          setSession(workoutSession)
          setShowWorkoutSelection(false)
          // Don't return here - still load templates in background
        }

        // Always load templates (whether there's an active session or not)
        const res = await fetch("/api/workout-tracker/workout-templates?limit=20")
        if (!res.ok) throw new Error("Failed to load templates")
        const data = await res.json()

        const all = [...(data.userTemplates || []), ...(data.predefinedTemplates || [])]
        const transformed = transformTemplateFromAPI(all)

        if (active) {
          setAvailableWorkouts(transformed)
          setIsLoading(false)
        }
      } catch (e) {
        logger.warn("Using fallback workouts", e)
        if (active) {
          setAvailableWorkouts(fallbackWorkouts)
          setIsLoading(false)
        }
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [])

  const startWorkout = async (workoutTemplate: WorkoutTemplate) => {
    try {
      const payload = createWorkoutPayload(workoutTemplate)

      const res = await fetch("/api/workout-tracker/workout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorText = await res.text()
  logger.error("Failed to create session:", { status: res.status, errorText })
        throw new Error("Failed to create session")
      }

      const created = await res.json()

      const workoutSession = transformSessionFromAPI(created)

      // Check for saved state
      try {
        const savedStateRes = await fetch(`/api/workout-tracker/workout-sessions/${created.id}/saved-state`)
        if (savedStateRes.ok) {
          const state = await savedStateRes.json()
          setSavedState(state)
        }
      } catch {
        // No saved state found, starting fresh
      }

      setSession(workoutSession)

      setShowWorkoutSelection(false)
    } catch (e) {
      logger.error("Error in startWorkout:", e)
      throw e
    }
  }

  const saveCustomWorkout = async (workout: WorkoutTemplate) => {
    try {
      const payload = createTemplatePayload(workout)

      const res = await fetch("/api/workout-tracker/workout-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.status === 401) {
        const errorData = await res.json()
        if (errorData.error?.includes("User session is invalid")) {
          alert("Your session has expired. Please refresh the page and sign in again.")
          window.location.reload()
          return
        }
      }

      if (res.ok) {
        // Reload templates to get server IDs
        const reload = await fetch("/api/workout-tracker/workout-templates?limit=20")
        if (reload.ok) {
          const data = await reload.json()
          const all = [...(data.userTemplates || []), ...(data.predefinedTemplates || [])]
          const transformed = transformTemplateFromAPI(all)
          setAvailableWorkouts(transformed)
        }
      } else {
        const errorData = await res.json()
        alert(`Failed to save workout: ${errorData.error || 'Unknown error'}`)
        // Fallback: local add
        setAvailableWorkouts((prev) => [...prev, workout])
      }
    } catch (e) {
      logger.warn("Create template fallback", e)
      alert("Failed to save workout. It will be available locally only.")
      setAvailableWorkouts((prev) => [...prev, workout])
    }
  }

  const editCustomWorkout = async (workout: WorkoutTemplate) => {
    try {
      const payload = createTemplatePayload(workout)

      const res = await fetch(`/api/workout-tracker/workout-templates/${workout.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to update template")

      // Reflect update locally
      setAvailableWorkouts((prev) => prev.map((w) => (w.id === workout.id ? workout : w)))
    } catch (e) {
      logger.error("Failed to edit template", e)
      throw e
    }
  }

  const deleteWorkout = (workoutId: string) => {
    // Attempt to delete from server (only applies to user templates)
    ;(async () => {
      try {
        const res = await fetch(`/api/workout-tracker/workout-templates/${workoutId}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Failed to delete template")
      } catch (e) {
        logger.warn("Delete template fallback", e)
      } finally {
        setAvailableWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
      }
    })()
  }

  const backToSelection = () => {
    setSession(null)
    setShowWorkoutSelection(true)
  }

  return {
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
  }
}
