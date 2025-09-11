interface WorkoutSessionExercise {
  id: string
  targetSets: number
  targetReps: string
  targetType: string
  completed: boolean
  completedSets?: number
  sets: Array<{
    reps: number | null
    weight?: number | null
    completed: boolean
  }>
}

interface WorkoutSession {
  id: string
  exercises: WorkoutSessionExercise[]
}

export type WorkoutPerformanceStatus = "completed" | "unfinished" | "perfect"

export interface WorkoutPerformanceAnalysis {
  performanceStatus: WorkoutPerformanceStatus
  completionRate: number // 0-100
  perfectionScore: number // 0-100
  exerciseScores: Array<{
    exerciseId: string
    score: number
    completedSets: number
    targetSets: number
  }>
}

/**
 * Parse target reps string to get the minimum expected reps
 * Examples: "8-12" -> 8, "15" -> 15, "30s" -> 30 (for time-based)
 */
function parseTargetReps(targetReps: string, targetType: string): { min: number; max: number } {
  if (targetType === "time") {
    // For time-based exercises, extract seconds
    const match = targetReps.match(/(\d+)/)
    const value = match ? parseInt(match[1]) : 30
    return { min: value, max: value }
  }
  
  // For rep-based exercises, handle ranges like "8-12" or single values like "15"
  const rangeMatch = targetReps.match(/(\d+)-(\d+)/)
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2])
    }
  }
  
  // Single value
  const singleMatch = targetReps.match(/(\d+)/)
  const value = singleMatch ? parseInt(singleMatch[1]) : 8
  return { min: value, max: value }
}

/**
 * Calculate performance score for a single exercise
 */
function calculateExerciseScore(exercise: WorkoutSessionExercise): number {
  const { targetSets, targetReps, targetType, sets } = exercise
  const completedSets = sets.filter(set => set.completed)
  
  if (completedSets.length === 0) return 0
  
  const targetRange = parseTargetReps(targetReps, targetType)
  
  // Base score for completing sets
  const setCompletionRatio = completedSets.length / targetSets
  const baseScore = Math.min(setCompletionRatio * 70, 70) // Max 70 points for completing target sets
  
  // Bonus points for exceeding expectations
  let bonusScore = 0
  
  // Calculate average performance across completed sets
  const performanceRatios = completedSets.map(set => {
    const reps = set.reps || 0
    if (targetType === "time") {
      // For time-based exercises, longer duration = better
      return reps / targetRange.min
    } else {
      // For rep-based exercises, more reps = better
      // Use minimum target as baseline, award extra points for reaching/exceeding max
      return reps / targetRange.min
    }
  })
  
  const avgPerformanceRatio = performanceRatios.reduce((sum, ratio) => sum + ratio, 0) / performanceRatios.length
  
  // Award bonus points for exceeding minimum targets
  if (avgPerformanceRatio > 1.0) {
    bonusScore = Math.min((avgPerformanceRatio - 1.0) * 30, 30) // Max 30 bonus points
  }
  
  // Extra bonus for completing more sets than required
  if (completedSets.length > targetSets) {
    bonusScore += Math.min((completedSets.length - targetSets) * 10, 20) // Max 20 extra points
  }
  
  // Special bonus for hitting the upper range of target reps
  if (targetRange.max > targetRange.min) {
    const avgReps = completedSets.reduce((sum, set) => sum + (set.reps || 0), 0) / completedSets.length
    if (avgReps >= targetRange.max) {
      bonusScore += 10 // Bonus for consistently hitting max target
    }
  }
  
  return Math.min(baseScore + bonusScore, 100)
}

/**
 * Calculate overall workout performance
 */
export function calculateWorkoutPerformance(session: WorkoutSession): WorkoutPerformanceAnalysis {
  const { exercises } = session
  
  if (exercises.length === 0) {
    return {
      performanceStatus: "unfinished",
      completionRate: 0,
      perfectionScore: 0,
      exerciseScores: []
    }
  }
  
  // Calculate individual exercise scores
  const exerciseScores = exercises.map(exercise => {
    const score = calculateExerciseScore(exercise)
    const completedSets = exercise.sets.filter(set => set.completed).length
    
    return {
      exerciseId: exercise.id,
      score,
      completedSets,
      targetSets: exercise.targetSets
    }
  })
  
  // Calculate completion rate (percentage of exercises that have at least one completed set)
  const exercisesWithProgress = exercises.filter(ex => 
    ex.sets.some(set => set.completed)
  ).length
  const completionRate = (exercisesWithProgress / exercises.length) * 100
  
  // Calculate overall perfection score (average of exercise scores)
  const perfectionScore = exerciseScores.reduce((sum, ex) => sum + ex.score, 0) / exerciseScores.length
  
  // Determine performance status
  let performanceStatus: WorkoutPerformanceStatus
  
  // Base status determination on actual performance, not just workout status
  if (perfectionScore >= 85 && completionRate >= 90) {
    // Perfect: High performance score and near-complete workout
    performanceStatus = "perfect"
  } else if (completionRate >= 70) {
    // Completed: Finished most of the workout
    performanceStatus = "completed"
  } else {
    // Unfinished: Didn't complete enough of the workout
    performanceStatus = "unfinished"
  }
  
  return {
    performanceStatus,
    completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
    perfectionScore: Math.round(perfectionScore * 10) / 10, // Round to 1 decimal
    exerciseScores
  }
}

/**
 * Get badge properties for workout performance status
 */
export function getPerformanceBadgeProps(status: WorkoutPerformanceStatus) {
  switch (status) {
    case "perfect":
      return {
        text: "Perfect",
        className: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 border-yellow-300 shadow-lg",
        icon: "🏆"
      }
    case "completed":
      return {
        text: "Completed",
        className: "bg-gradient-to-r from-green-400 to-green-500 text-green-900 border-green-300",
        icon: "✅"
      }
    case "unfinished":
      return {
        text: "Unfinished",
        className: "bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900 border-orange-300",
        icon: "⏸️"
      }
  }
}
