"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Activity, ChevronRight, Pill } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { BodyPartStatus } from "@/types/recovery"

interface QuickSummary {
  ready: number
  caution: string[]
  rest: string[]
  pain: string[]
  headline: string
}

const STATUS_ORDER: BodyPartStatus[] = ["pain", "rest", "caution", "ready"]

export function RecoveryQuickLink() {
  const [summary, setSummary] = useState<QuickSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/recovery", { cache: "no-store" })
        if (!response.ok) {
          return
        }
        const payload = await response.json()

        const byStatus = new Map<BodyPartStatus, string[]>(STATUS_ORDER.map((status) => [status, []]))

        for (const part of payload.bodyParts as Array<{ bodyPart: string; status: BodyPartStatus }>) {
          const list = byStatus.get(part.status)
          if (list && list.length < 4) {
            list.push(part.bodyPart)
          }
        }

        const ready = byStatus.get("ready") ?? []
        const rest = byStatus.get("rest") ?? []
        const caution = byStatus.get("caution") ?? []
        const painAlerts: string[] = Array.isArray(payload.summary?.painAlerts) && payload.summary.painAlerts.length
          ? payload.summary.painAlerts
          : byStatus.get("pain") ?? []

        setSummary({
          ready: payload.summary?.readyCount ?? ready.length,
          rest,
          caution,
          pain: painAlerts.slice(0, 4),
          headline: payload.summary?.suggestedFocus?.[0] ?? (ready[0] ?? "All clear"),
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const labels = useMemo(() => {
    if (!summary) {
      return { primary: "No data yet", secondary: "Log a workout to see recovery intel" }
    }

    if (summary.pain.length) {
      return {
        primary: `${summary.pain.length} area${summary.pain.length > 1 ? "s" : ""} need attention`,
        secondary: summary.pain.join(", "),
      }
    }

    if (summary.rest.length) {
      return {
        primary: `${summary.rest.length} resting`,
        secondary: `Next up: ${summary.headline}`,
      }
    }

    return {
      primary: `${summary.ready} ready to train`,
      secondary: summary.headline ? `Start with ${summary.headline}` : "Balanced load",
    }
  }, [summary])

  const badges = useMemo<Array<{ label: string; tone: "amber" | "rose" }>>(() => {
    if (!summary) return []
    if (summary.pain.length) {
      return summary.pain.map((label) => ({ label, tone: "rose" as const }))
    }
    if (summary.rest.length || summary.caution.length) {
      return [...summary.rest, ...summary.caution].slice(0, 3).map((label) => ({ label, tone: "amber" as const }))
    }
    return []
  }, [summary])

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start gap-2 p-2.5">
        <div className="mt-0.5 text-muted-foreground">
          <Pill className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <p className="flex items-center gap-1 text-xs font-semibold">
              Recovery <Activity className="h-3 w-3 text-muted-foreground" />
            </p>
            <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-[10px]">
              <Link href="/recovery" aria-label="Go to Recovery">
                View <ChevronRight className="ml-0.5 h-3 w-3" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <p className="text-[10px] text-muted-foreground">Loading recovery…</p>
          ) : summary ? (
            <div className="space-y-1">
              <p className="truncate text-[11px] font-medium">{labels.primary}</p>
              <p className="truncate text-[10px] text-muted-foreground">{labels.secondary}</p>
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {badges.map(({ label, tone }) => (
                    <span
                      key={label}
                      className={`rounded-full border px-2 py-0.5 text-[10px] ${
                        tone === "rose"
                          ? "border-rose-300/60 bg-rose-100 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200"
                          : "border-amber-300/60 bg-amber-100 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/40 dark:text-amber-200"
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">No data yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
