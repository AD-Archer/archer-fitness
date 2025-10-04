"use client"

import { useMemo, useState } from "react"
import { AlertOctagon, RefreshCcw } from "lucide-react"
import { parseISO } from "date-fns"

import { useRecoveryData } from "@/hooks/use-recovery-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useSearchParams, useRouter } from 'next/navigation'
import { RecoverySummary } from "./recovery-summary"
import { SorenessDialog } from "./soreness-dialog"
import { RecoveryTabs } from "./recovery-tabs"

function getTrendData(parts: any[]) {
  const map = new Map<string, number>()
  for (const part of parts) {
    for (const point of part.trend) {
      const date = point.date.includes("T") ? point.date : `${point.date}T00:00:00`
      const key = parseISO(date).toISOString()
      map.set(key, (map.get(key) ?? 0) + point.volume)
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-10)
    .map(([iso, volume]) => ({
      iso,
      label: new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume,
    }))
}

export function RecoveryMonitor() {
  const { data, loading, error, refreshing, refresh, submitFeedback, submitting } = useRecoveryData()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'status'

  const trendData = useMemo(() => (data ? getTrendData(data.bodyParts) : []), [data])

  const bodyPartOptions = useMemo(() => {
    if (!data?.bodyParts?.length) return []
    return Array.from(new Set(data.bodyParts.map((part) => part.bodyPart))).sort((a, b) => a.localeCompare(b))
  }, [data?.bodyParts])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertOctagon className="size-5" /> Unable to load recovery insights
          </CardTitle>
          <CardDescription>{error ?? "Please try again"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refresh} variant="outline" className="mt-2">
            <RefreshCcw className="mr-2 size-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {data.summary.painAlerts.length > 0 && (
        <Card className="border-rose-200 dark:border-rose-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-2 text-rose-600 dark:text-rose-300">
              <AlertOctagon className="size-5" /> Pain alerts
            </CardTitle>
            <CardDescription>
              You flagged {data.summary.painAlerts.length} area{data.summary.painAlerts.length > 1 ? "s" : ""}. Consider active
              recovery or consulting a coach.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.summary.painAlerts.map((alert) => (
              <Badge key={alert} className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">
                {alert}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <RecoverySummary
        summary={data.summary}
        refreshing={refreshing}
        onRefresh={refresh}
        onOpenDialog={() => setIsDialogOpen(true)}
      />

      <SorenessDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        bodyPartOptions={bodyPartOptions}
        onSubmit={submitFeedback}
        submitting={submitting}
      />

      <RecoveryTabs
        bodyParts={data.bodyParts}
        trendData={trendData}
        summary={data.summary}
        recentSessions={data.recentSessions.map(session => ({ ...session, durationMinutes: session.durationMinutes ?? undefined }))}
        value={activeTab}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams)
          params.set('tab', value)
          router.replace(`?${params.toString()}`, { scroll: false })
        }}
      />
    </div>
  )
}

