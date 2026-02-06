export type RecoveryFeeling = "GOOD" | "TIGHT" | "SORE" | "INJURED"

export type BodyPartStatus = "ready" | "caution" | "rest" | "pain"

export interface RecoveryFeedbackEntry {
  bodyPart: string
  feeling: RecoveryFeeling
  intensity?: number | null
  note?: string | null
  createdAt: string
}

export interface BodyPartTrendPoint {
  date: string
  volume: number
}

export interface BodyPartInsight {
  bodyPart: string
  lastWorkout: string | null
  hoursSinceLast: number | null
  recommendedRestHours: number
  status: BodyPartStatus
  recentSessionIds: string[]
  sevenDayCount: number
  averageSets: number
  feedback: RecoveryFeedbackEntry | null
  trend: BodyPartTrendPoint[]
}

export interface RecoverySummary {
  readyCount: number
  cautionCount: number
  restCount: number
  painCount: number
  suggestedFocus: string[]
  nextEligibleInHours: Array<{ bodyPart: string; remainingHours: number }>
  painAlerts: string[]
  lastUpdated: string
}

export interface RecoverySessionSummary {
  id: string
  name: string
  performedAt: string
  bodyParts: string[]
  durationMinutes: number | null
}

export interface RecoveryApiResponse {
  summary: RecoverySummary
  bodyParts: BodyPartInsight[]
  recentSessions: RecoverySessionSummary[]
}

export interface SubmitRecoveryFeedbackPayload {
  bodyPart: string
  feeling: RecoveryFeeling
  intensity?: number
  note?: string
}

export type BodyPartEventType = "worked" | "sore" | "resolved" | "safe"

export interface BodyPartEvent {
  bodyPart: string
  date: string
  type: BodyPartEventType // worked = body part exercised, sore = feeling sore, resolved = no longer sore, safe = ready to work again
  intensity?: number // 1-5 for soreness intensity
  note?: string
}

export interface RecoveryCalendarData {
  events: BodyPartEvent[]
  workoutHistory: Array<{ date: string; bodyParts: string[] }>
}
