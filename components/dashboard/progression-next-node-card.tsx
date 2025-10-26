"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Flame } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { progressionBranches } from "@/lib/progression/data"

interface ProgressRecord {
  nodeId: string
  status: "LOCKED" | "AVAILABLE" | "COMPLETED"
  completionCount: number
}

interface ProgressProfile {
  alias: string
  crowns: number
  totalXp: number
}

interface ProgressResponse {
  profile?: ProgressProfile
  records?: ProgressRecord[]
}

interface NextNodeCandidate {
  branchId: string
  branchTitle: string
  branchSubtitle: string
  icon: LucideIcon
  nodeId: string
  nodeName: string
  tier: number
  targetSessions: number
  completionCount: number
  status: "completed" | "available" | "locked"
}

const statusPriority = { completed: 2, available: 1, locked: 0 }

export function ProgressionNextNodeCard() {
  const [state, setState] = useState<{ loading: boolean; error?: string; profile?: ProgressProfile; records: ProgressRecord[] }>({
    loading: true,
    records: [],
  })

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch("/api/progression/progress")
        if (!res.ok) throw new Error("Failed to load progression")
        const data: ProgressResponse = await res.json()
        if (!active) return
        setState({ loading: false, profile: data.profile, records: data.records ?? [] })
      } catch (error) {
        if (!active) return
        setState({ loading: false, records: [], error: (error as Error).message })
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const recordMap = useMemo(() => {
    const map = new Map<string, ProgressRecord>()
    state.records.forEach((record) => map.set(record.nodeId, record))
    return map
  }, [state.records])

  const nextNode = useMemo<NextNodeCandidate | null>(() => {
    const candidates: NextNodeCandidate[] = []
    progressionBranches.forEach((branch) => {
      branch.milestones.forEach((node) => {
        const record = recordMap.get(node.id)
        const completed = record?.status === "COMPLETED"
        const prerequisitesMet = node.prerequisites.every((id) => recordMap.get(id)?.status === "COMPLETED")
        const status: "completed" | "available" | "locked" = completed ? "completed" : prerequisitesMet ? "available" : "locked"
        candidates.push({
          branchId: branch.id,
          branchTitle: branch.title,
          branchSubtitle: branch.subtitle,
          icon: branch.icon,
          nodeId: node.id,
          nodeName: node.name,
          tier: node.tier,
          targetSessions: node.targetSessions,
          completionCount: record?.completionCount ?? 0,
          status,
        })
      })
    })

    const sorted = candidates
      .filter((candidate) => candidate.status !== "completed")
      .sort((a, b) => {
        if (statusPriority[b.status] !== statusPriority[a.status]) {
          return statusPriority[b.status] - statusPriority[a.status]
        }
        return a.tier - b.tier
      })

    return sorted[0] ?? null
  }, [recordMap])

  if (state.loading) {
    return <Skeleton className="h-40 w-full rounded-3xl" />
  }

  if (state.error) {
    return (
      <Card className="rounded-3xl border bg-card/70 p-4 text-sm">
        <p className="font-semibold">Progression</p>
        <p className="text-muted-foreground">{state.error}</p>
        <Button asChild variant="link" className="px-0">
          <Link href="/progression">Open progression</Link>
        </Button>
      </Card>
    )
  }

  return (
    <Card className="rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Next mission</p>
          <h3 className="text-lg font-semibold">{state.profile?.alias ?? "Rogue Athlete"}</h3>
        </div>
        <Badge variant="outline">{state.profile?.crowns ?? 0} crowns</Badge>
      </div>

      {nextNode ? (
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <span className="rounded-2xl bg-primary/10 p-3 text-primary">
              <nextNode.icon className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{nextNode.branchTitle}</p>
              <p className="text-xl font-semibold leading-tight">{nextNode.nodeName}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Tier {nextNode.tier + 1} • {nextNode.completionCount}/{nextNode.targetSessions} runs
              </p>
            </div>
          </div>
          <Button asChild className="w-full md:w-auto md:shrink-0">
            <Link href="/progression">
              <ArrowRight className="mr-2 h-4 w-4" /> Continue run
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <p>Finish a tree to unlock more missions.</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/progression">
              <Flame className="mr-2 h-4 w-4" /> Start progression
            </Link>
          </Button>
        </div>
      )}
    </Card>
  )
}
