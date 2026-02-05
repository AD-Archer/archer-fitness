export interface ExerciseSet {
  id: string;
  setNumber: number;
  reps: number | null;
  duration?: number | null;
  weight?: number;
  notes?: string;
  completed: boolean;
}

export interface ExerciseAssociation {
  id: string;
  name: string;
}

export interface ExerciseMetadata {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  gifUrl?: string;
  bodyParts?: Array<{
    bodyPart: ExerciseAssociation;
  }>;
  muscles?: Array<{
    muscle: ExerciseAssociation;
    isPrimary: boolean;
  }>;
  equipments?: Array<{
    equipment: ExerciseAssociation;
  }>;
}

export interface TrackedExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  targetType?: "reps" | "time";
  instructions?: string;
  sets: ExerciseSet[];
  completed: boolean;
  exercise?: ExerciseMetadata;
}

export interface WorkoutTemplateExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
  targetType?: "reps" | "time";
  instructions?: string;
  exercise?: ExerciseMetadata;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  estimatedDuration: number;
  exercises: WorkoutTemplateExercise[];
  isCustom: boolean;
  isAIGenerated?: boolean;
  category?: string;
  difficulty?: string;
  isPredefined?: boolean;
}

export interface WorkoutSession {
  id: string;
  name: string;
  startTime: Date;
  duration: number;
  exercises: TrackedExercise[];
  isActive: boolean;
}

export interface WorkoutState {
  currentExerciseIndex: number;
  timer: number;
  exerciseTimer: number;
  isTimerRunning: boolean;
  isResting: boolean;
  restTimer: number;
}
