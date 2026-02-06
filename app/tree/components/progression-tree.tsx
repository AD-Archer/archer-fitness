import { useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { NodeProgressState, ProgressionBranch, ProgressionNode } from "@/lib/progression/types"

interface ProgressionTreeProps {
  branch: ProgressionBranch
  nodeStates: Record<string, NodeProgressState>
  selectedNodeId?: string
  onSelectNode: (node: ProgressionNode) => void
}

const nodeGradients: Record<NodeProgressState["status"], string> = {
  completed: "from-emerald-400 to-emerald-500",
  available: "from-sky-400 to-indigo-500",
  locked: "from-slate-500 to-slate-600",
}

export function ProgressionTree({ branch, nodeStates, selectedNodeId, onSelectNode }: ProgressionTreeProps) {
  const tiers = useMemo(() => {
    const tierMap = new Map<number, ProgressionNode[]>()
    branch.milestones.forEach((node) => {
      tierMap.set(node.tier, [...(tierMap.get(node.tier) ?? []), node])
    })
    return Array.from(tierMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([tier, nodes]) => ({ tier, nodes }))
  }, [branch])

  const BranchIcon = branch.icon

  return (
    <ScrollArea className="rounded-3xl border border-border bg-card/80 text-foreground shadow-inner">
      <div className="relative px-4 py-8">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(0,0,0,0.05), transparent 60%)" }} />
        <div className="relative space-y-10">
          {tiers.map((tier, tierIndex) => (
            <div key={`tier-${tier.tier}`} className="flex flex-col items-center gap-4">
              <div className="flex flex-wrap justify-center gap-6">
                {tier.nodes.map((node) => {
                  const state = nodeStates[node.id]
                  if (!state) return null
                  const isSelected = selectedNodeId === node.id
                  const IconComponent = node.badgeIcon ?? BranchIcon
                  return (
                    <button
                      key={node.id}
                      onClick={() => onSelectNode(node)}
                      className={cn(
                        "flex flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                        isSelected ? "scale-105" : "opacity-90",
                      )}
                    >
                      <div
                        className={cn(
                          "relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-md transition-transform",
                          nodeGradients[state.status],
                          state.status === "locked" ? "opacity-60" : "",
                        )}
                      >
                        <IconComponent className="h-8 w-8" aria-hidden="true" />
                        {state.status === "completed" && (
                          <span className="absolute -bottom-1 right-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-900">XP</span>
                        )}
                        {state.status === "locked" && (
                          <span className="absolute inset-0 rounded-full border-4 border-white/10" />
                        )}
                      </div>
                      <div className="text-center text-sm">
                        <p className="font-semibold text-white">{node.name}</p>
                        <p className="text-[11px] uppercase tracking-wide text-white/60">Tier {node.tier + 1}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              {tierIndex < tiers.length - 1 && <div className="h-8 w-1 rounded-full bg-border" />}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}
