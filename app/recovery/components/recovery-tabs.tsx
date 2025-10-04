"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BodyStatusCard } from "./body-status-card"
import { TrainingVolumeChart } from "./training-volume-chart"
import { RecommendedFocus } from "./recommended-focus"
import { RecentSessions } from "./recent-sessions"
import type { BodyPartInsight, RecoverySummary } from "@/types/recovery"

interface RecentSession {
  id: string
  name: string
  performedAt: string
  durationMinutes?: number
  bodyParts: string[]
}

interface RecoveryTabsProps {
  bodyParts: BodyPartInsight[]
  trendData: Array<{ iso: string; label: string; volume: number }>
  summary: RecoverySummary
  recentSessions: RecentSession[]
  value?: string
  onValueChange?: (value: string) => void
}

export function RecoveryTabs({ bodyParts, trendData, summary, recentSessions, value, onValueChange }: RecoveryTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} defaultValue={value ? undefined : "status"} className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="status">Body readiness</TabsTrigger>
        <TabsTrigger value="insights">Planning insights</TabsTrigger>
        <TabsTrigger value="history">Recent sessions</TabsTrigger>
      </TabsList>

      <TabsContent value="status" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bodyParts.map((part) => (
            <BodyStatusCard key={part.bodyPart} part={part} />
          ))}
          {bodyParts.length === 0 && (
            <div className="col-span-full">
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm font-medium">No workout history yet</p>
                <p className="text-xs text-muted-foreground">Complete a workout session to start tracking recovery insights.</p>
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="insights" className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <TrainingVolumeChart trendData={trendData} />
          <RecommendedFocus suggestedFocus={summary.suggestedFocus} nextEligibleInHours={summary.nextEligibleInHours} />
        </div>
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        <RecentSessions sessions={recentSessions} />
      </TabsContent>
    </Tabs>
  )
}