import { memo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { NodeProgressState, ProgressionNode } from "@/lib/progression/types"

interface NodeCardProps {
  node: ProgressionNode
  state: NodeProgressState
  isSelected?: boolean
  onSelect: (node: ProgressionNode) => void
}

const statusStyles: Record<NodeProgressState["status"], { label: string; bg: string; border: string; text: string }> = {
  completed: {
    label: "Mastered",
    bg: "bg-emerald-500/15",
    border: "border-emerald-400/40",
    text: "text-emerald-500",
  },
  available: {
    label: "Ready",
    bg: "bg-sky-500/15",
    border: "border-sky-400/40",
    text: "text-sky-500",
  },
  locked: {
    label: "Locked",
    bg: "bg-slate-500/10",
    border: "border-slate-500/40",
    text: "text-slate-500",
  },
}

export const NodeCard = memo(function NodeCard({ node, state, isSelected, onSelect }: NodeCardProps) {
  const config = statusStyles[state.status]

  return (
    <Card
      tabIndex={0}
      onClick={() => onSelect(node)}
      className={cn(
        "cursor-pointer border-2 transition-all duration-200 w-56 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        config.border,
        isSelected ? "scale-105 shadow-lg ring-2 ring-offset-2 ring-slate-200 dark:ring-slate-800" : "hover:scale-[1.02]",
      )}
    >
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge className={cn("text-xs", config.bg, config.text, "border-0")}>{config.label}</Badge>
          <span className="text-xs font-semibold text-muted-foreground">{node.focus}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Tier {node.tier + 1}</p>
          <h3 className="text-lg font-semibold leading-snug">{node.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{node.description}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">XP {Math.round(node.xp * state.progress)} / {node.xp}</p>
          <Progress value={state.progress * 100} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Sessions</span>
          <span>
            {state.completionCount}/{node.targetSessions}
          </span>
        </div>
      </div>
    </Card>
  )
})
