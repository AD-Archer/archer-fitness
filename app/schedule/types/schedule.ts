export type RepeatPattern = "daily" | "weekly" | "yearly"

export interface RecurrenceRule {
  frequency: RepeatPattern
  interval?: number | null
  endsOn?: string | Date | null
  daysOfWeek?: number[] | null
  meta?: Record<string, unknown>
}

export interface ScheduleItem {
  id: string
  type: "workout"
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
  generatorData?: WorkoutScheduleData
  isRecurring?: boolean
  repeatPattern?: RepeatPattern | null
  repeatInterval?: number | null
  repeatEndsOn?: string | Date | null
  repeatDaysOfWeek?: number[] | null
  recurrenceRule?: RecurrenceRule | null
  isVirtual?: boolean
  originId?: string
}

export interface Schedule {
  id: string
  userId: string
  weekStart: Date
  timezone?: string | null
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
  timezone?: string | null
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

export interface ScheduleTemplate {
  id: string
  name: string
  description?: string
  items: Omit<ScheduleItem, "id">[]
  isDefault?: boolean
  usageCount?: number
  createdAt?: Date
  updatedAt?: Date
  metadata?: ScheduleTemplateMetadata
}

export type ScheduleTemplateSource = "default" | "custom" | "recommended" | "generated"

export interface ScheduleTemplateMetadata {
  source?: ScheduleTemplateSource
  generatedAt?: string
  criteria?: TemplateGenerationCriteria
  tags?: string[]
  insights?: string[]
  allowedEquipment?: string[]
}

export interface TemplateGenerationCriteria {
  daysPerWeek: number
  preferredDays?: number[]
  difficulty?: string | null
  focus?: string[]
  preferredStartTime?: string
  repeatIntervalWeeks?: number
  timezone?: string | null
  allowBackToBack?: boolean
  includeRecovery?: boolean
  includeCardio?: boolean
  allowedEquipment?: string[]
}

export interface TemplateGenerationRequest extends Partial<TemplateGenerationCriteria> {
  count?: number
  seed?: string
}

export interface TemplateGenerationResponse {
  templates: ScheduleTemplate[]
  criteria: TemplateGenerationCriteria
  availableCategories: string[]
  availableDifficulties: string[]
  availableEquipment?: string[]
}

export interface ApplyTemplateOptions {
  mode?: "replace" | "append"
  repeatIntervalWeeks?: number | null
  enableRepeat?: boolean
}