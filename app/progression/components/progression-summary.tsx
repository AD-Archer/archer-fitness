import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Crown, Flame, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BranchProgressSummary, ProgressionBranch } from "@/lib/progression/types"

interface ProgressionSummaryProps {
  branches: ProgressionBranch[]
  branchProgress: Record<string, BranchProgressSummary>
  selectedBranchId: string
  onSelectBranch: (branchId: string) => void
  totals: {
    nodesCleared: number
    nodesTotal: number
    xpEarned: number
    xpTotal: number
    readyToPlay: number
  }
  syncedTemplates: number
  workoutSessionsTracked: number
  playerAlias?: string
  playerRank?: number
  playerCrowns?: number
  playerXp?: number
}

export function ProgressionSummary({
  branches,
  branchProgress,
  selectedBranchId,
  onSelectBranch,
  totals,
  syncedTemplates,
  workoutSessionsTracked,
  playerAlias,
  playerRank,
  playerCrowns,
  playerXp,
}: ProgressionSummaryProps) {
  const statChips = [
    {
      label: "Crowns",
      value: playerCrowns ?? totals.nodesCleared,
      helper: `${totals.nodesTotal} nodes`,
      icon: Crown,
      accent: "from-amber-400 to-amber-500",
    },
    {
      label: "Ready",
      value: totals.readyToPlay,
      helper: "nodes unlocked",
      icon: Sparkles,
      accent: "from-sky-400 to-indigo-500",
    },
    {
      label: "XP",
      value: playerXp ?? Math.round(totals.xpEarned),
      helper: "lifetime",
      icon: Flame,
      accent: "from-rose-500 to-orange-500",
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
        <div className="flex items-baseline gap-2">
          <p className="text-xs uppercase tracking-wide text-white/70">You are</p>
          <span className="text-lg font-semibold">{playerAlias ?? "Rogue Athlete"}</span>
        </div>
        <p className="text-xs text-white/60">Your anonymous leaderboard tag</p>
        <p className="text-sm text-white/70">{playerRank ? `Rank #${playerRank}` : "New challenger"}</p>
        <p className="text-xs text-white/60">{playerCrowns ?? 0} crowns • {playerXp ?? Math.round(totals.xpEarned)} XP</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {statChips.map((chip) => {
            const Icon = chip.icon
            return (
              <div key={chip.label} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <span className="rounded-2xl bg-white/20 p-2">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/70">{chip.label}</p>
                  <p className="text-xl font-semibold">{chip.value}</p>
                  <p className="text-[11px] text-white/60">{chip.helper}</p>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-white/50">
          {syncedTemplates} templates saved • {workoutSessionsTracked} sessions scanned
        </p>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {branches.map((branch) => {
          const Icon = branch.icon
          const progress = branchProgress[branch.id]
          const completion =
            progress && progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0

          return (
            <button
              key={branch.id}
              onClick={() => onSelectBranch(branch.id)}
              className="text-left"
            >
              <Card
                className={cn(
                  "h-full border-2 transition-all",
                  selectedBranchId === branch.id ? "border-primary shadow-lg" : "border-border hover:border-primary/40",
                )}
              >
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className={cn("rounded-2xl bg-gradient-to-br p-2 text-white", branch.accent)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <Badge variant={selectedBranchId === branch.id ? "default" : "outline"}>
                      {progress?.completed ?? 0}/{progress?.total ?? branch.milestones.length}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{branch.title}</h3>
                    <p className="text-xs text-muted-foreground">{branch.subtitle}</p>
                  </div>
                  <Progress value={completion} className="h-1.5" />
                </div>
              </Card>
            </button>
          )
        })}
      </div>
    </div>
  )
}
