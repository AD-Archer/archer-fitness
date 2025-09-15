export interface ExerciseSet {
  id?: string
  reps: number
  weight?: number
  completed: boolean
}

export interface TrackedExercise {
  id: string
  name: string
  targetSets: number
  targetReps: string
  targetType?: "reps" | "time"
  instructions?: string
  sets: ExerciseSet[]
  completed: boolean
  exercise?: {
    id: string
    name: string
    description?: string
    instructions?: string
    gifUrl?: string
    muscles: Array<{
      muscle: {
        id: string
        name: string
      }
      isPrimary: boolean
    }>
    equipments: Array<{
      equipment: {
        id: string
        name: string
      }
    }>
  }
}

export interface WorkoutTemplateExercise {
  id: string
  name: string
  targetSets: number
  targetReps: string
  targetType?: "reps" | "time"
  instructions?: string
}

export interface WorkoutTemplate {
  id: string
  name: string
  description?: string
  estimatedDuration: number
  exercises: WorkoutTemplateExercise[]
  isCustom: boolean
  isAIGenerated?: boolean
}

export interface WorkoutSession {
  id: string
  name: string
  startTime: Date
  duration: number
  exercises: TrackedExercise[]
  isActive: boolean
}

export interface WorkoutState {
  currentExerciseIndex: number
  timer: number
  exerciseTimer: number
  isTimerRunning: boolean
  isResting: boolean
  restTimer: number
}
