import type { WorkoutTemplate, WorkoutSession, TrackedExercise, WorkoutTemplateExercise } from "../types/workout"

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export const getWorkoutProgress = (session: WorkoutSession): number => {
  if (session.exercises.length === 0) return 0
  
  const totalSets = session.exercises.reduce((total, ex) => total + ex.targetSets, 0)
  const completedSets = session.exercises.reduce((total, ex) => total + ex.sets.length, 0)
  
  return totalSets > 0 ? Math.min((completedSets / totalSets) * 100, 100) : 0
}

export const getExerciseProgress = (exercise: TrackedExercise): number => {
  if (exercise.targetSets === 0) return 0
  const completedSets = exercise.sets.filter(set => set.completed).length
  return Math.min((completedSets / exercise.targetSets) * 100, 100)
}

export const parseTimeToSeconds = (timeStr: string): number => {
  if (timeStr.includes(":")) {
    const [mins, secs] = timeStr.split(":").map(Number)
    return (mins || 0) * 60 + (secs || 0)
  } else if (timeStr.includes("s")) {
    return Number.parseInt(timeStr.replace("s", ""))
  } else {
    return Number.parseInt(timeStr) || 0
  }
}

export const isExerciseCompleted = (exercise: TrackedExercise): boolean => {
  return exercise.sets.length >= exercise.targetSets || exercise.completed
}

export const isWorkoutCompleted = (session: WorkoutSession): boolean => {
  return session.exercises.every(exercise => isExerciseCompleted(exercise))
}

export const getCompletedExercisesCount = (session: WorkoutSession): number => {
  return session.exercises.filter(exercise => isExerciseCompleted(exercise)).length
}

export const transformTemplateFromAPI = (data: unknown[]): WorkoutTemplate[] => {
  return data.map((t: unknown) => {
    const template = t as {
      id: string
      name: string
      description?: string
      estimatedDuration?: number
      exercises?: unknown[]
      isPredefined?: boolean
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description ?? undefined,
      estimatedDuration: template.estimatedDuration ?? 30,
      exercises: (template.exercises || []).map((ex: unknown) => {
        const exercise = ex as {
          exercise?: { id?: string; name?: string; instructions?: string }
          exerciseId?: string
          targetSets?: number
          targetReps?: string
          targetType?: string
        }

        return {
          id: exercise.exercise?.id || exercise.exerciseId || "",
          name: exercise.exercise?.name || "Exercise",
          targetSets: exercise.targetSets ?? 3,
          targetReps: exercise.targetReps ?? "8-12",
          targetType: (exercise.targetType as "reps" | "time") || "reps",
          instructions: exercise.exercise?.instructions ?? undefined,
        }
      }),
      isCustom: !template.isPredefined,
      isAIGenerated: template.name?.toLowerCase().includes('ai-generated') || false,
    }
  })
}

export const transformSessionFromAPI = (sessionData: unknown): WorkoutSession => {
  const session = sessionData as {
    id: string
    name: string
    startTime: string
    duration?: number
    exercises?: unknown[]
  }

  const mappedExercises: TrackedExercise[] = (session.exercises || []).map((ex: unknown) => {
    const exercise = ex as {
      id: string
      exercise?: { name?: string; instructions?: string }
      targetSets: number
      targetReps: string
      targetType?: string
      sets?: unknown[]
    }

    return {
      id: exercise.id,
      name: exercise.exercise?.name || "Exercise",
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      targetType: (exercise.targetType as "reps" | "time") || "reps",
      instructions: exercise.exercise?.instructions,
      sets: (exercise.sets || []).map((s: unknown) => {
        const set = s as { reps?: number; weight?: number | null; completed: boolean }
        return {
          reps: set.reps ?? 0,
          weight: set.weight == null ? undefined : set.weight,
          completed: set.completed
        }
      }),
      completed: false,
    }
  })

  return {
    id: session.id,
    name: session.name,
    startTime: new Date(session.startTime),
    duration: session.duration || 0,
    exercises: mappedExercises,
    isActive: true,
  }
}

export const createWorkoutPayload = (workoutTemplate: WorkoutTemplate) => {
  return {
    name: workoutTemplate.name,
    description: workoutTemplate.description,
    exercises: workoutTemplate.exercises.map((ex: WorkoutTemplateExercise) => ({
      exerciseId: ex.id?.startsWith("c") ? undefined : ex.id,
      name: ex.name,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetType: ex.targetType || "reps",
      notes: ex.instructions,
    })),
  }
}

export const createTemplatePayload = (workout: WorkoutTemplate) => {
  return {
    name: workout.name,
    description: workout.description,
    estimatedDuration: workout.estimatedDuration,
    exercises: workout.exercises.map((ex: WorkoutTemplateExercise) => ({
      exerciseId: ex.id?.startsWith("c") ? undefined : ex.id,
      name: ex.name,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetType: ex.targetType || "reps",
      notes: ex.instructions,
    })),
  }
}