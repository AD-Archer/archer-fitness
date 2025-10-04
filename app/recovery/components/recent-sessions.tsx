"use client"

import { ArrowRight } from "lucide-react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RecentSession {
  id: string
  name: string
  performedAt: string
  durationMinutes?: number
  bodyParts: string[]
}

interface RecentSessionsProps {
  sessions: RecentSession[]
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="size-4" /> Recent sessions
        </CardTitle>
        <CardDescription>Most recent workouts and the areas they targeted.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length ? (
          sessions.map((session) => (
            <div key={session.id} className="rounded-xl border border-border/70 bg-card/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-medium">{session.name}</p>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(parseISO(session.performedAt), { addSuffix: true })}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">
                  {session.durationMinutes ? `${session.durationMinutes} min` : "Duration unknown"}
                </span>
                {session.bodyParts.map((bodyPart) => (
                  <Badge key={bodyPart} variant="outline" className="rounded-full border-dashed px-2 py-0.5 text-[11px]">
                    {bodyPart}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm font-medium">No completed sessions in the last month.</p>
            <p className="text-xs text-muted-foreground">Log a workout to unlock tailored recovery insights.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}