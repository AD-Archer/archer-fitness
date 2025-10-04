import type { WorkoutPerformanceStatus } from "./workout-performance"

export const WORKOUT_COMPLETION_THRESHOLD = 50

export type MinimalWorkoutSet = {
  completed?: boolean | null
}

export type MinimalWorkoutExercise = {
  targetSets?: number | null
  sets?: MinimalWorkoutSet[]
}

export interface WorkoutVisibilityContext {
  rawStatus?: string | null
  completionRate: number
  performanceStatus?: string | null
  perfectionScore?: number | null
}

export type WorkoutDisplayStatus = "perfect" | "completed" | "in_progress" | "not_started"

export function calculateCompletionRate(exercises: MinimalWorkoutExercise[]): number {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return 0
  }

  let totalTargetSets = 0
  let totalCompletedSets = 0

  for (const exercise of exercises) {
    const sets = Array.isArray(exercise.sets) ? exercise.sets : []
    const targetSets = typeof exercise.targetSets === "number" && exercise.targetSets > 0
      ? exercise.targetSets
      : sets.length

    totalTargetSets += targetSets
    totalCompletedSets += sets.filter((set) => Boolean(set?.completed)).length
  }

  if (totalTargetSets === 0) {
    return 0
  }

  const completionRate = (totalCompletedSets / totalTargetSets) * 100
  return Math.min(Math.max(completionRate, 0), 100)
}

export function normalizePerformanceStatus(
  performanceStatus: string | null | undefined,
  completionRate: number,
  perfectionScore?: number | null
): WorkoutPerformanceStatus {
  const existing = performanceStatus?.toLowerCase()
  if (existing === "perfect" || existing === "completed") {
    return existing
  }

  if (completionRate >= 95 && (perfectionScore ?? 0) >= 85) {
    return "perfect"
  }

  return "completed"
}

export function deriveDisplayStatus(context: WorkoutVisibilityContext): WorkoutDisplayStatus {
  const { completionRate, performanceStatus, perfectionScore } = context
  const normalizedPerformance = normalizePerformanceStatus(performanceStatus, completionRate, perfectionScore)

  if (normalizedPerformance === "perfect") {
    return "perfect"
  }

  if (normalizedPerformance === "completed") {
    return "completed"
  }

  if (completionRate > 0) {
    return "in_progress"
  }

  return "not_started"
}

export function isSessionDiscarded(): boolean {
  // Sessions are only discarded if explicitly archived, not based on completion
  return false
}

export function isSessionDisplayable(): boolean {
  // All sessions are displayable unless explicitly archived
  return true
}

export function shouldAutoComplete(completionRate: number): boolean {
  return completionRate >= WORKOUT_COMPLETION_THRESHOLD
}
