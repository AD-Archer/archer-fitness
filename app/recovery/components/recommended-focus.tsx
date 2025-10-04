"use client"

import { Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface RecommendedFocusProps {
  suggestedFocus: string[]
  nextEligibleInHours: Array<{ bodyPart: string; remainingHours: number }>
}

export function RecommendedFocus({ suggestedFocus, nextEligibleInHours }: RecommendedFocusProps) {
  return (
    <Card className="border-muted">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-5 text-emerald-500" /> Recommended focus
        </CardTitle>
        <CardDescription>
          Plan your next workout around areas with the highest readiness score.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {suggestedFocus.length ? (
            suggestedFocus.map((part) => (
              <Badge
                key={part}
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
              >
                {part}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No areas ready yet—check again soon.</span>
          )}
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          <p className="font-medium text-muted-foreground">Next up after rest:</p>
          {nextEligibleInHours.length ? (
            <div className="space-y-2">
              {nextEligibleInHours.slice(0, 4).map((entry) => (
                <div key={entry.bodyPart} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                  <span className="font-medium">{entry.bodyPart}</span>
                  <span className="text-muted-foreground text-xs">{entry.remainingHours.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing in the queue—everything is ready.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}