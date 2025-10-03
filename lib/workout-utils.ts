// Workout types - matching those in workout-display.tsx
export interface Exercise {
  id?: string
  name: string
  sets: number
  reps: string
  rest: string
  instructions: string
  targetMuscles: string[]
  equipment?: string[]
  source?: string
  isTimeBased?: boolean
}

export interface WorkoutPlan {
  name: string
  duration: number
  difficulty: string
  exercises: Exercise[]
  warmup: string[]
  cooldown: string[]
}

export interface SaveWorkoutTemplateData {
  name: string
  description?: string
  estimatedDuration: number
  category?: string
  difficulty?: string
  exercises: ExerciseData[]
  isAiGenerated: boolean
}

export interface StartWorkoutSessionData {
  name: string
  description?: string
  exercises: ExerciseData[]
}

export interface ExerciseData {
  name: string
  targetSets: number
  targetReps: string
  targetType: string
  restTime?: number
  notes?: string
}

export function transformWorkoutPlanToTemplate(workout: WorkoutPlan): SaveWorkoutTemplateData {
  return {
    name: workout.name,
    description: `AI-generated ${workout.difficulty} workout`,
    estimatedDuration: workout.duration,
    category: "full-body", // Default category, could be inferred from exercises
    difficulty: workout.difficulty,
    isAiGenerated: true,
    exercises: workout.exercises.map((exercise: Exercise) => ({
      name: exercise.name,
      targetSets: exercise.sets,
      targetReps: exercise.reps,
      targetType: isTimeBasedExercise(exercise) ? "time" : "reps",
      restTime: parseRestTime(exercise.rest),
      notes: exercise.instructions,
    })),
  }
}

export function transformWorkoutPlanToSession(workout: WorkoutPlan): StartWorkoutSessionData {
  return {
    name: workout.name,
    description: `AI-generated ${workout.difficulty} workout session`,
    exercises: workout.exercises.map((exercise: Exercise) => ({
      name: exercise.name,
      targetSets: exercise.sets,
      targetReps: exercise.reps,
      targetType: isTimeBasedExercise(exercise) ? "time" : "reps",
      restTime: parseRestTime(exercise.rest),
      notes: exercise.instructions,
    })),
  }
}

function isTimeBasedExercise(exercise: Exercise): boolean {
  if (typeof exercise.isTimeBased === "boolean") {
    return exercise.isTimeBased
  }
  const repsLower = exercise.reps.toLowerCase()
  return repsLower.includes("sec") || repsLower.includes("min") || repsLower.includes("s")
}

function parseRestTime(restString: string): number {
  // Parse rest time from strings like "60 seconds", "1-2 minutes", etc.
  // Default to 90 seconds if parsing fails
  const match = restString.match(/(\d+)/)
  if (match) {
    const number = parseInt(match[1])
    if (restString.includes("min")) {
      return number * 60 // Convert minutes to seconds
    }
    return number // Assume seconds
  }
  return 90 // Default rest time
}

export async function saveWorkoutAsTemplate(data: SaveWorkoutTemplateData): Promise<unknown> {
  const response = await fetch("/api/workout-tracker/workout-templates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to save workout template")
  }

  return response.json()
}

export async function startWorkoutSession(data: StartWorkoutSessionData): Promise<unknown> {
  const response = await fetch("/api/workout-tracker/workout-sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to start workout session")
  }

  return response.json()
}