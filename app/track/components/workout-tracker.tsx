"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import type React from "react"

import { useState, useEffect } from "react"
import { WorkoutSelection } from "./workout-selection"
import { WorkoutSession as WorkoutSessionView } from "./workout-session"
import { AddExerciseModal } from "./add-exercise-modal"

interface ExerciseSet {
  reps: number
  weight?: number
  completed: boolean
}

interface TrackedExercise {
  // This is the WorkoutSessionExercise.id in DB
  id: string
  name: string
  targetSets: number
  targetReps: string
  targetType?: "reps" | "time"
  instructions?: string
  sets: ExerciseSet[]
  completed: boolean
}

interface WorkoutTemplateExercise {
  id: string // Exercise.id
  name: string
  targetSets: number
  targetReps: string
  targetType?: "reps" | "time"
  instructions?: string
}

interface WorkoutTemplate {
  id: string
  name: string
  description?: string
  estimatedDuration: number
  exercises: WorkoutTemplateExercise[]
  isCustom: boolean
  isAIGenerated?: boolean
}

interface WorkoutSession {
  id: string // WorkoutSession.id (DB)
  name: string
  startTime: Date
  duration: number
  exercises: TrackedExercise[]
  isActive: boolean
}

const fallbackWorkouts: WorkoutTemplate[] = []

export function WorkoutTracker() {
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [availableWorkouts, setAvailableWorkouts] = useState<WorkoutTemplate[]>(fallbackWorkouts)
  const [showWorkoutSelection, setShowWorkoutSelection] = useState(true)
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [exerciseTimer, setExerciseTimer] = useState(0)

  // Fetch templates on load
  useEffect(() => {
    let active = true
    const loadTemplates = async () => {
      try {
        const res = await fetch("/api/workout-templates?limit=20")
        if (!res.ok) throw new Error("Failed to load templates")
        const data = await res.json()


        const all = [...(data.userTemplates || []), ...(data.predefinedTemplates || [])]


        const transformed: WorkoutTemplate[] = all.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? undefined,
          estimatedDuration: t.estimatedDuration ?? 30,
          exercises: (t.exercises || []).map((ex: any) => ({
            id: ex.exercise?.id || ex.exerciseId,
            name: ex.exercise?.name || "Exercise",
            targetSets: ex.targetSets ?? 3,
            targetReps: ex.targetReps ?? "8-12",
            targetType: ex.targetType || "reps",
            instructions: ex.exercise?.instructions ?? undefined,
          })),
          isCustom: !t.isPredefined,
          isAIGenerated: t.name?.toLowerCase().includes('ai-generated') || false,
        }))


        if (active) setAvailableWorkouts(transformed)
      } catch (e) {
        console.warn("Using fallback workouts", e)
        if (active) setAvailableWorkouts(fallbackWorkouts)
      }
    }
    loadTemplates()
    return () => {
      active = false
    }
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && session) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, session])

  // Exercise timer effect - runs for timed exercises
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && session && !isResting) {
      const currentExercise = session.exercises[currentExerciseIndex]
      if (currentExercise?.targetType === "time") {
        interval = setInterval(() => {
          setExerciseTimer((prev) => prev + 1)
        }, 1000)
      }
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, session, currentExerciseIndex, isResting])

    // Reset exercise timer when switching exercises
  useEffect(() => {
    setExerciseTimer(0)
  }, [currentExerciseIndex])

  const startWorkout = async (workoutTemplate: WorkoutTemplate) => {
    try {
      console.log("Starting workout with template:", workoutTemplate)
      console.log("Template exercises:", workoutTemplate.exercises)

      const exercisesPayload = workoutTemplate.exercises.map((ex) => ({
        // send exerciseId if it's a real Exercise ID, otherwise send name so API can create it
        exerciseId: ex.id?.startsWith("c") ? undefined : ex.id,
        name: ex.name,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetType: ex.targetType || "reps",
        notes: ex.instructions,
      }))

      console.log("Exercises payload:", exercisesPayload)

      const res = await fetch("/api/workout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workoutTemplate.name,
          description: workoutTemplate.description,
          exercises: exercisesPayload,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error("Failed to create session:", res.status, errorText)
        throw new Error("Failed to create session")
      }

      const created = await res.json()
      console.log("Created session:", created)
      console.log("Created exercises:", created.exercises)

      const mappedExercises: TrackedExercise[] = (created.exercises || []).map((ex: any) => ({
        id: ex.id, // session exercise id
        name: ex.exercise?.name || "Exercise",
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetType: ex.targetType || "reps",
        instructions: ex.exercise?.instructions,
        sets: (ex.sets || []).map((s: any) => ({ reps: s.reps ?? 0, weight: s.weight == null ? undefined : s.weight, completed: s.completed })),
        completed: false,
      }))

      console.log("Mapped exercises:", mappedExercises)

      const newSession: WorkoutSession = {
        id: created.id,
        name: created.name,
        startTime: new Date(created.startTime),
        duration: created.duration || 0,
        exercises: mappedExercises,
        isActive: created.status !== "completed",
      }

      // Check for saved state
      try {
        const savedStateRes = await fetch(`/api/workout-sessions/${created.id}/saved-state`)
        if (savedStateRes.ok) {
          const savedState = await savedStateRes.json()
          setCurrentExerciseIndex(savedState.currentExerciseIndex || 0)
          setTimer(savedState.timer || 0)
          setExerciseTimer(savedState.exerciseTimer || 0)
          setIsTimerRunning(savedState.isTimerRunning || false)
          setIsResting(savedState.isResting || false)
          setRestTimer(savedState.restTimer || 0)
          console.log("Restored saved workout state:", savedState)
        }
      } catch {
        console.log("No saved state found, starting fresh")
      }

      console.log("New session:", newSession)

      setSession(newSession)
      setIsTimerRunning(true)
      setShowWorkoutSelection(false)
    } catch (e) {
      console.error("Error in startWorkout:", e)
    }
  }

  const pauseWorkout = () => {
    const newTimerRunning = !isTimerRunning
    setIsTimerRunning(newTimerRunning)
    // Also pause/resume rest timer when workout is paused/resumed
    if (!newTimerRunning && isResting) {
      setIsResting(false)
    }
  }

  const saveWorkout = async () => {
    if (!session) return
    
    try {
      // Save workout state to the server
      await fetch(`/api/workout-sessions/${session.id}/saved-state`, {
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
      await fetch(`/api/workout-sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paused",
          duration: timer,
        }),
      })

      // Navigate back to selection
      setSession(null)
      setTimer(0)
      setIsTimerRunning(false)
      setCurrentExerciseIndex(0)
      setShowWorkoutSelection(true)
      
    } catch (e) {
      console.error("Failed to save workout state", e)
    }
  }

  const finishWorkout = async () => {
    if (!session) return
    try {
      // Update session status to completed, which will trigger performance calculation in the API
      await fetch(`/api/workout-sessions/${session.id}`, {
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
        await fetch(`/api/workout-sessions/${session.id}/saved-state`, {
          method: "DELETE",
        })
      } catch {
        console.log("No saved state to clear")
      }
    } catch (e) {
      console.error("Failed to complete session", e)
    }
    setSession(null)
    setTimer(0)
    setIsTimerRunning(false)
    setCurrentExerciseIndex(0)
    setShowWorkoutSelection(true)
  }

  const backToSelection = () => {
    setSession(null)
    setTimer(0)
    setIsTimerRunning(false)
    setCurrentExerciseIndex(0)
    setShowWorkoutSelection(true)
  }

  const addSet = async (exerciseId: string, reps: number, weight?: number) => {
    if (!session) return

    try {
      const res = await fetch(`/api/workout-sessions/${session.id}/exercises/${exerciseId}/sets`, {
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
                    sets: (updated.sets || []).map((s: any) => ({ reps: s.reps ?? 0, weight: s.weight == null ? undefined : s.weight, completed: s.completed })),
                  // Don't mark as completed based on targetSets anymore
                  completed: false,
                }
              : ex
          )
          return { ...prev, exercises: updatedExercises }
        })
      }
    } catch (e) {
      console.error("Failed to add set", e)
    }

    // Start rest timer after completing a set
    setRestTimer(90) // 90 seconds rest
    setIsResting(true)

    // Reset exercise timer for next set (for timed exercises)
    if (session.exercises.find(ex => ex.id === exerciseId)?.targetType === "time") {
      setExerciseTimer(0)
    }
  }

  // Add exercise mid-workout: open modal
  const addExerciseMidWorkout = () => {
    setShowAddExerciseModal(true)
  }

  // Handle adding exercise from modal
  const handleAddExercise = async (name: string, targetType: "reps" | "time" = "reps") => {
    if (!session) return
    setIsAddingExercise(true)
    try {
      // Create exercise
      const createdRes = await fetch("/api/exercises", {
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

      // Attach to session
      const attachRes = await fetch(`/api/workout-sessions/${session.id}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: created.id, targetSets: 999, targetReps: targetType === "time" ? "30s" : "8-12", targetType }),
      })
      if (!attachRes.ok) throw new Error("Failed to add exercise to session")
      const attached = await attachRes.json()

      const newTracked: TrackedExercise = {
        id: attached.id,
        name: attached.exercise?.name || name,
        targetSets: 999,
        targetReps: attached.targetReps,
        targetType: targetType,
        instructions: attached.exercise?.instructions,
        sets: [],
        completed: false,
      }
      setSession((prev) => (prev ? { ...prev, exercises: [...prev.exercises, newTracked] } : prev))
      setCurrentExerciseIndex(session.exercises.length)
    } catch (e) {
      console.error(e)
      alert(`Failed to add exercise: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setIsAddingExercise(false)
    }
  }

  const switchToExercise = (index: number) => {
    setCurrentExerciseIndex(index)
  }

  const nextExercise = () => {
    if (currentExerciseIndex < (session?.exercises.length || 0) - 1) {
      setCurrentExerciseIndex((prev) => prev + 1)
    }
  }

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getWorkoutProgress = () => {
    if (!session) return 0

    const exercisesWithSets = session.exercises.filter(ex => ex.sets.length > 0).length
    return session.exercises.length > 0 ? (exercisesWithSets / session.exercises.length) * 100 : 0
  }

  const deleteWorkout = (workoutId: string) => {
    // Attempt to delete from server (only applies to user templates)
    ;(async () => {
      try {
        const res = await fetch(`/api/workout-templates/${workoutId}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Failed to delete template")
      } catch (e) {
        console.warn("Delete template fallback", e)
      } finally {
        setAvailableWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
      }
    })()
  }

  if (showWorkoutSelection) {
    return (
      <WorkoutSelection
        availableWorkouts={availableWorkouts}
        onStartWorkout={startWorkout}
        onDeleteWorkout={deleteWorkout}
        onSaveCustomWorkout={async (workout) => {
          // Persist template to server
          try {
            const res = await fetch("/api/workout-templates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: workout.name,
                description: workout.description,
                estimatedDuration: workout.estimatedDuration,
                exercises: workout.exercises.map((ex) => ({
                  exerciseId: ex.id?.startsWith("c") ? undefined : ex.id,
                  name: ex.name,
                  targetSets: ex.targetSets,
                  targetReps: ex.targetReps,
                  targetType: (ex as any).targetType || "reps",
                  notes: ex.instructions,
                })),
              }),
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
              // Reload templates to get server IDs and ensure user-specific list
              const reload = await fetch("/api/workout-templates?limit=20")
              if (reload.ok) {
                const data = await reload.json()
                const all = [...(data.userTemplates || []), ...(data.predefinedTemplates || [])]
                const transformed: WorkoutTemplate[] = all.map((t: any) => ({
                  id: t.id,
                  name: t.name,
                  description: t.description ?? undefined,
                  estimatedDuration: t.estimatedDuration ?? 30,
                  exercises: (t.exercises || []).map((ex: any) => ({
                    id: ex.exercise?.id || ex.exerciseId,
                    name: ex.exercise?.name || "Exercise",
                    targetSets: ex.targetSets ?? 3,
                    targetReps: ex.targetReps ?? "8-12",
                    targetType: ex.targetType || "reps",
                    instructions: ex.exercise?.instructions ?? undefined,
                  })),
                  isCustom: !t.isPredefined,
                  isAIGenerated: t.name?.toLowerCase().includes('ai-generated') || false,
                }))
                setAvailableWorkouts(transformed)
              }
            } else {
              const errorData = await res.json()
              alert(`Failed to save workout: ${errorData.error || 'Unknown error'}`)
              // Fallback: local add
              setAvailableWorkouts((prev) => [...prev, workout])
            }
          } catch (e) {
            console.warn("Create template fallback", e)
            alert("Failed to save workout. It will be available locally only.")
            setAvailableWorkouts((prev) => [...prev, workout])
          }
        }}
        onEditCustomWorkout={async (workout) => {
          try {
            const res = await fetch(`/api/workout-templates/${workout.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: workout.name,
                description: workout.description,
                estimatedDuration: workout.estimatedDuration,
                exercises: workout.exercises.map((ex) => ({
                  exerciseId: ex.id?.startsWith("c") ? undefined : ex.id,
                  name: ex.name,
                  targetSets: ex.targetSets,
                  targetReps: ex.targetReps,
                  targetType: (ex as any).targetType || "reps",
                  notes: ex.instructions,
                })),
              }),
            })
            if (!res.ok) throw new Error("Failed to update template")
            // Reflect update locally
            setAvailableWorkouts((prev) => prev.map((w) => (w.id === workout.id ? workout : w)))
          } catch (e) {
            console.error("Failed to edit template", e)
          }
        }}
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
        onFinishWorkout={finishWorkout}
        onBackToSelection={backToSelection}
        onAddSet={addSet}
        onAddExercise={addExerciseMidWorkout}
        onNextExercise={nextExercise}
        onPreviousExercise={previousExercise}
        onSkipRest={() => setIsResting(false)}
        onSwitchToExercise={switchToExercise}
        onSaveWorkout={saveWorkout}
        formatTime={formatTime}
        getWorkoutProgress={getWorkoutProgress}
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
