import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProgressionBranch } from "@/lib/progression/types"

interface GoalSelectorProps {
  branch: ProgressionBranch
  selectedNodeId?: string
  onSelectGoal: (nodeId: string) => void
}

export function GoalSelector({ branch, selectedNodeId, onSelectGoal }: GoalSelectorProps) {
  const BranchIcon = branch.icon
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 2</p>
          <h2 className="text-lg font-semibold">Choose your boss move</h2>
        </div>
        <Badge variant="secondary">{branch.title}</Badge>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {branch.milestones.map((node) => {
          const isActive = selectedNodeId === node.id
          const IconComponent = node.badgeIcon ?? BranchIcon
          return (
            <button
              key={node.id}
              onClick={() => onSelectGoal(node.id)}
              className={cn(
                "flex min-w-[140px] flex-col items-center rounded-3xl border px-4 py-3 text-center",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                isActive ? "border-primary bg-primary/10" : "border-border bg-card",
              )}
            >
              <span className="rounded-full bg-muted p-3" aria-hidden="true">
                <IconComponent className="h-6 w-6" />
              </span>
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Tier {node.tier + 1}</p>
              <p className="text-sm font-semibold text-foreground">{node.name}</p>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
