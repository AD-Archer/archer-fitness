import type { LucideIcon } from "lucide-react"

export type NodeStatus = "locked" | "available" | "completed"

export interface TemplateExerciseDefinition {
  name: string
  targetSets: number
  targetReps: string
  targetType?: "reps" | "time"
  instructions?: string
}

export interface ProgressionTemplateDefinition {
  slug: string
  name: string
  description: string
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedDuration: number
  focus: string
  exercises: TemplateExerciseDefinition[]
}

export interface ProgressionNode {
  id: string
  name: string
  tier: number
  xp: number
  focus: string
  description: string
  reward: string
  targetSessions: number
  prerequisites: string[]
  exerciseKeywords: string[]
  badgeIcon?: LucideIcon
  template: ProgressionTemplateDefinition
}

export interface ProgressionBranch {
  id: string
  title: string
  subtitle: string
  icon: LucideIcon
  accent: string
  description: string
  milestones: ProgressionNode[]
}

export interface NodeProgressState {
  status: NodeStatus
  completionCount: number
  targetSessions: number
  progress: number
}

export interface BranchProgressSummary {
  completed: number
  total: number
  available: number
  locked: number
  xpEarned: number
  xpTotal: number
}

export interface WorkoutSessionExerciseSummary {
  id: string
  completed: boolean
  targetSets: number
  targetReps: string
  exercise?: {
    id?: string
    name?: string
  }
  name?: string
}

export interface WorkoutSessionSummary {
  id: string
  name: string
  status?: string
  startTime: string
  exercises: WorkoutSessionExerciseSummary[]
}

export interface ExercisePreview {
  id: string
  name: string
  instructions?: string | null
  description?: string | null
  gifUrl?: string | null
  primaryMuscles?: string[]
  equipment?: string[]
}

export interface ProgressionExperienceState {
  nodeStates: Record<string, NodeProgressState>
  branchProgress: Record<string, BranchProgressSummary>
  totals: {
    nodesCleared: number
    nodesTotal: number
    xpEarned: number
    xpTotal: number
    readyToPlay: number
  }
}
