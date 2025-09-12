export interface ScheduleItem {
  id: string
  type: "workout" | "meal"
  title: string
  description?: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  day: number // 0 = Sunday, 1 = Monday, etc.
  category?: string
  calories?: number
  difficulty?: string
  duration?: number // in minutes
  isFromGenerator?: boolean
  generatorData?: WorkoutScheduleData | MealScheduleData // Original data from AI generator
}

export interface Schedule {
  id: string
  userId: string
  weekStart: Date
  items: ScheduleItem[]
  createdAt: Date
  updatedAt: Date
}

export interface ScheduleDay {
  date: Date
  dayOfWeek: number
  items: ScheduleItem[]
}

export interface WeeklySchedule {
  weekStart: Date
  days: ScheduleDay[]
}

interface Exercise {
  name: string
  sets: number
  reps: string
  rest: string
  instructions: string
  targetMuscles: string[]
}

export interface WorkoutScheduleData {
  name: string
  duration: number
  difficulty: string
  exercises: Exercise[]
  warmup: string[]
  cooldown: string[]
}

export interface MealScheduleData {
  name: string
  type: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  instructions: string[]
  prepTime: number
}

export interface ScheduleTemplate {
  id: string
  name: string
  description?: string
  items: Omit<ScheduleItem, "id">[]
  isDefault?: boolean
  usageCount?: number
  createdAt?: Date
  updatedAt?: Date
}