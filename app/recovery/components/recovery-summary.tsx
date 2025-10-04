"use client"

import { RefreshCcw, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HeartPulse, TimerReset, AlertOctagon } from "lucide-react"

interface RecoverySummaryProps {
  summary: {
    readyCount: number
    restCount: number
    painCount: number
    suggestedFocus: string[]
    nextEligibleInHours: Array<{ bodyPart: string; remainingHours: number }>
  }
  refreshing: boolean
  onRefresh: () => void
  onOpenDialog: () => void
}

export function RecoverySummary({ summary, refreshing, onRefresh, onOpenDialog }: RecoverySummaryProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Recovery Overview</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={refreshing} className="h-9 px-3 text-sm">
            <RefreshCcw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={onOpenDialog} className="h-9 bg-gradient-to-r from-blue-600 to-purple-600 px-4 text-sm font-semibold shadow-sm">
            <Plus className="mr-2 size-4" /> Mark soreness
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-muted">
          <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Ready to train</span>
              <HeartPulse className="size-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-semibold">{summary.readyCount}</p>
            <p className="text-xs text-muted-foreground">
              Focus areas: {summary.suggestedFocus.length ? summary.suggestedFocus.slice(0, 2).join(", ") : "Pick freely"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Needs rest</span>
              <TimerReset className="size-4 text-blue-500" />
            </div>
            <p className="text-3xl font-semibold">{summary.restCount}</p>
            <p className="text-xs text-muted-foreground">
              Soonest ready in {summary.nextEligibleInHours[0]?.remainingHours?.toFixed(1) ?? "--"}h
            </p>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Manual flags</span>
              <AlertOctagon className="size-4 text-rose-500" />
            </div>
            <p className="text-3xl font-semibold">{summary.painCount}</p>
            <p className="text-xs text-muted-foreground">
              Tap "Mark soreness" to update body feedback
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}