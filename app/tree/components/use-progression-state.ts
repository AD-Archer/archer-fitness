import { useMemo } from "react"
import type {
  BranchProgressSummary,
  NodeProgressState,
  NodeStatus,
  ProgressionBranch,
  ProgressionNode,
  ProgressionExperienceState,
  WorkoutSessionSummary,
} from "@/lib/progression/types"

const normalize = (value?: string | null) => value?.toLowerCase().trim() ?? ""

const doesExerciseMatchNode = (
  exerciseName: string,
  node: ProgressionNode,
) => {
  if (!exerciseName) return false
  const normalized = normalize(exerciseName)
  return node.exerciseKeywords.some((keyword) => normalized.includes(normalize(keyword)))
}

type ProgressOverride = Record<
  string,
  {
    status: NodeStatus
    completionCount: number
  }
>

const statusPriority: Record<NodeStatus, number> = {
  locked: 0,
  available: 1,
  completed: 2,
}

export function useProgressionState(
  branches: ProgressionBranch[],
  sessions: WorkoutSessionSummary[],
  overrides?: ProgressOverride,
): ProgressionExperienceState {
  return useMemo(() => {
    const nodeStates: Record<string, NodeProgressState> = {}
    const branchProgress: Record<string, BranchProgressSummary> = {}
    let xpEarned = 0
    let xpTotal = 0
    let nodesCleared = 0
    let readyToPlay = 0
    let totalNodes = 0

    const sessionMatches: Record<string, number> = {}

    const orderedNodes = branches
      .flatMap((branch) => branch.milestones.map((node) => ({ branchId: branch.id, node })))
      .sort((a, b) => a.node.tier - b.node.tier)

    // Precompute matches for each node
    orderedNodes.forEach(({ node }) => {
      const count = sessions.reduce((acc, session) => {
        if (!Array.isArray(session.exercises)) return acc
        const hasMatch = session.exercises.some((exercise) => {
          const exerciseName = exercise.exercise?.name || exercise.name || ""
          return doesExerciseMatchNode(exerciseName, node)
        })
        return hasMatch ? acc + 1 : acc
      }, 0)
      sessionMatches[node.id] = count
    })

    branches.forEach((branch) => {
      let completed = 0
      let available = 0
      let locked = 0
      let branchXp = 0
      let branchXpTotal = 0

      const branchNodes = branch.milestones.sort((a, b) => a.tier - b.tier)

      branchNodes.forEach((node) => {
        branchXpTotal += node.xp
        xpTotal += node.xp
        totalNodes += 1

        const completions = sessionMatches[node.id] ?? 0
        const progress = Math.min(completions / node.targetSessions, 1)
        const prerequisitesMet = node.prerequisites.every((id) => nodeStates[id]?.status === "completed")

        let status: NodeStatus = "locked"
        if (completions >= node.targetSessions) {
          status = "completed"
        } else if (prerequisitesMet) {
          status = "available"
        }

        let completionCount = completions
        let finalProgress = progress

        const override = overrides?.[node.id]
        if (override) {
          const overrideProgress = Math.min(override.completionCount / node.targetSessions, 1)
          const overridePriority = statusPriority[override.status]
          const currentPriority = statusPriority[status]
          if (overridePriority > currentPriority || override.completionCount > completionCount) {
            status = override.status
            completionCount = override.completionCount
            finalProgress = overrideProgress
          }
        }

        if (status === "completed") {
          completed += 1
          nodesCleared += 1
        } else if (status === "available") {
          available += 1
          readyToPlay += 1
        } else {
          locked += 1
        }

        branchXp += node.xp * finalProgress
        xpEarned += node.xp * finalProgress

        nodeStates[node.id] = {
          status,
          completionCount,
          targetSessions: node.targetSessions,
          progress: finalProgress,
        }
      })

      branchProgress[branch.id] = {
        completed,
        available,
        locked,
        total: branchNodes.length,
        xpEarned: branchXp,
        xpTotal: branchXpTotal,
      }
    })

    return {
      nodeStates,
      branchProgress,
      totals: {
        nodesCleared,
        nodesTotal: totalNodes,
        xpEarned,
        xpTotal,
        readyToPlay,
      },
    }
  }, [branches, sessions, overrides])
}
