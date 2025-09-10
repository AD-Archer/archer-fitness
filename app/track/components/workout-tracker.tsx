"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import type React from "react"

import { useState, useEffect } from "react"
import { WorkoutSelection } from "./workout-selection"
import { WorkoutSession as WorkoutSessionView } from "./workout-session"

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
  instructions?: string
  sets: ExerciseSet[]
  completed: boolean
}

interface WorkoutTemplateExercise {
  id: string // Exercise.id
  name: string
  targetSets: number
  targetReps: string
  instructions?: string
}

interface WorkoutTemplate {
  id: string
  name: string
  description?: string
  estimatedDuration: number
  exercises: WorkoutTemplateExercise[]
  isCustom: boolean
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
            instructions: ex.exercise?.instructions ?? undefined,
          })),
          isCustom: !t.isPredefined,
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

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, restTimer])

  const startWorkout = async (workoutTemplate: WorkoutTemplate) => {
    try {
      const res = await fetch("/api/workout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workoutTemplate.name,
          description: workoutTemplate.description,
            exercises: workoutTemplate.exercises.map((ex) => ({
              // send exerciseId if it's a real Exercise ID, otherwise send name so API can create it
              exerciseId: ex.id?.startsWith("c") ? undefined : ex.id,
              name: ex.name,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
              notes: ex.instructions,
            })),
        }),
      })
      if (!res.ok) throw new Error("Failed to create session")
      const created = await res.json()

      const mappedExercises: TrackedExercise[] = (created.exercises || []).map((ex: any) => ({
        id: ex.id, // session exercise id
        name: ex.exercise?.name || "Exercise",
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        instructions: ex.exercise?.instructions,
    sets: (ex.sets || []).map((s: any) => ({ reps: s.reps ?? 0, weight: s.weight == null ? undefined : s.weight, completed: s.completed })),
        completed: false,
      }))

      const newSession: WorkoutSession = {
        id: created.id,
        name: created.name,
        startTime: new Date(created.startTime),
        duration: created.duration || 0,
        exercises: mappedExercises,
        isActive: created.status !== "completed",
      }

      setSession(newSession)
      setIsTimerRunning(true)
      setCurrentExerciseIndex(0)
      setShowWorkoutSelection(false)
    } catch (e) {
      console.error(e)
    }
  }

  const pauseWorkout = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const finishWorkout = async () => {
    if (!session) return
    try {
      await fetch(`/api/workout-sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          endTime: new Date().toISOString(),
          duration: timer,
        }),
      })
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
                  completed: (updated.sets?.length || 0) >= ex.targetSets,
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
  }

  // Add exercise mid-workout: quick prompt
  const addExerciseMidWorkout = async () => {
    if (!session) return
    const name = typeof window !== "undefined" ? window.prompt("New exercise name?") : null
    if (!name) return
    try {
      // Create exercise
      const createdRes = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!createdRes.ok) throw new Error("Failed to create exercise")
      const created = await createdRes.json()

      // Attach to session
      const attachRes = await fetch(`/api/workout-sessions/${session.id}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: created.id, targetSets: 3, targetReps: "8-12" }),
      })
      if (!attachRes.ok) throw new Error("Failed to add exercise to session")
      const attached = await attachRes.json()

      const newTracked: TrackedExercise = {
        id: attached.id,
        name: attached.exercise?.name || name,
        targetSets: attached.targetSets,
        targetReps: attached.targetReps,
        instructions: attached.exercise?.instructions,
        sets: [],
        completed: false,
      }
  setSession((prev) => (prev ? { ...prev, exercises: [...prev.exercises, newTracked] } : prev))
  setCurrentExerciseIndex(session.exercises.length > 0 ? session.exercises.length : 0)
    } catch (e) {
      console.error(e)
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
    const completedExercises = session.exercises.filter((ex) => ex.completed).length
    return (completedExercises / session.exercises.length) * 100
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
                  notes: ex.instructions,
                })),
              }),
            })
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
                    instructions: ex.exercise?.instructions ?? undefined,
                  })),
                  isCustom: !t.isPredefined,
                }))
                setAvailableWorkouts(transformed)
              }
            } else {
              // Fallback: local add
              setAvailableWorkouts((prev) => [...prev, workout])
            }
          } catch (e) {
            console.warn("Create template fallback", e)
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
    <WorkoutSessionView
      session={session}
      currentExerciseIndex={currentExerciseIndex}
      timer={timer}
      isTimerRunning={isTimerRunning}
      isResting={isResting}
      restTimer={restTimer}
      onPauseWorkout={pauseWorkout}
      onFinishWorkout={finishWorkout}
      onBackToSelection={backToSelection}
      onAddSet={addSet}
      onAddExercise={addExerciseMidWorkout}
      onNextExercise={nextExercise}
      onPreviousExercise={previousExercise}
      onSkipRest={() => setIsResting(false)}
      onSwitchToExercise={switchToExercise}
      formatTime={formatTime}
      getWorkoutProgress={getWorkoutProgress}
    />
  )
}
