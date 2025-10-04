"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Sparkles } from "lucide-react"
import { ScheduleItem } from "../types/schedule"
import { type TimeFormatPreference } from "@/lib/time-utils"
import { WorkoutTemplateSelector } from "./workout-template-selector"

interface GeneratedScheduleImporterProps {
  onImportSchedule: (items: Omit<ScheduleItem, "id">[]) => Promise<void> | void
  currentWeek: Date
  timeFormat?: TimeFormatPreference
}

export function GeneratedScheduleImporter({ onImportSchedule, currentWeek, timeFormat = '24h' }: GeneratedScheduleImporterProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleImport = useCallback(async (items: Omit<ScheduleItem, "id">[]) => {
    if (items.length === 0) {
      return
    }

    try {
      setIsSaving(true)
      await onImportSchedule(items)
    } finally {
      setIsSaving(false)
    }
  }, [onImportSchedule])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Workout Library
          </CardTitle>
          <CardDescription>
            Drop your AI-generated workouts straight onto the calendar, or save favorites as templates for quick reuse each week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/40 p-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Calendar className="h-4 w-4" />
              Working with the week of <span className="font-semibold">{currentWeek.toLocaleDateString()}</span>
            </div>
            <p>
              Use the <span className="font-semibold">Generate</span> tab to craft new AI workouts, save the ones you like as templates, then add them to multiple days here without rebuilding them from scratch.
            </p>
            {isSaving && (
              <p className="text-xs text-blue-600">Adding workouts to your schedule...</p>
            )}
          </div>
        </CardContent>
      </Card>

  <WorkoutTemplateSelector onSelectWorkout={handleImport} currentWeek={currentWeek} timeFormat={timeFormat} />

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            Need a new idea? Head to the Generate page, run the AI workout builder, and save the session as a template. It will show up here instantly so you can schedule it on any combination of days.
          </p>
          <Button asChild variant="outline" className="self-start">
            <a href="/generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Open AI Workout Generator
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}