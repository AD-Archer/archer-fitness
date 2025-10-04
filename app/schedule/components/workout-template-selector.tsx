"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dumbbell, Zap, Plus, Search, Repeat } from "lucide-react"
import { ScheduleItem } from "../types/schedule"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import { formatTimeForDisplay, type TimeFormatPreference } from "@/lib/time-utils"

interface WorkoutTemplate {
  id: string
  name: string
  description: string | null
  estimatedDuration: number
  category: string | null
  difficulty: string | null
  isAiGenerated: boolean
  isPredefined: boolean
  usageCount: number
  exercises: {
    id: string
    order: number
    targetSets: number
    targetReps: string
    targetType: string
    targetWeight: number | null
    restTime: number
    notes: string | null
    exercise: {
      id: string
      name: string
      description: string | null
      muscles: Array<{
        muscle: {
          name: string
        }
        isPrimary: boolean
      }>
    }
  }[]
  createdAt: string
  updatedAt: string
}

interface WorkoutTemplateSelectorProps {
  onSelectWorkout: (items: Omit<ScheduleItem, "id">[]) => void
  currentWeek: Date
  timeFormat?: TimeFormatPreference
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

const SPLIT_PRESETS: Array<{ label: string; days: number[] }> = [
  { label: "Push/Pull/Legs", days: [1, 3, 5] },
  { label: "Upper/Lower", days: [1, 4] },
  { label: "Full Week", days: [1, 2, 3, 4, 5] },
  { label: "Weekend Warrior", days: [5, 6] }
]

const TIME_OPTIONS = ["06:00", "07:00", "12:00", "18:00", "20:00"] as const

type RepeatWeekOption = "none" | "1" | "2" | "3" | "4" | "6" | "8"

const WEEKLY_REPEAT_OPTIONS: Array<{ value: RepeatWeekOption; label: string }> = [
  { value: "none", label: "Do not repeat" },
  { value: "1", label: "Every week" },
  { value: "2", label: "Every other week" },
  { value: "3", label: "Every 3 weeks" },
  { value: "4", label: "Every 4 weeks" },
  { value: "6", label: "Every 6 weeks" },
  { value: "8", label: "Every 8 weeks" }
]

const calculateEndTime = (startTime: string, durationMinutes: number) => {
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const totalMinutes = startHour * 60 + startMinute + durationMinutes
  const endHour = Math.floor(totalMinutes / 60) % 24
  const endMinute = totalMinutes % 60
  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`
}

const formatWeekRange = (start: Date) => {
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const formatOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  return `${start.toLocaleDateString(undefined, formatOptions)} - ${end.toLocaleDateString(undefined, formatOptions)}`
}

const isPromise = <T = unknown>(value: unknown): value is Promise<T> => {
  return typeof value === "object" && value !== null && typeof (value as Promise<T>).then === "function"
}


export function WorkoutTemplateSelector({ onSelectWorkout, currentWeek, timeFormat = "24h" }: WorkoutTemplateSelectorProps) {
  const [userTemplates, setUserTemplates] = useState<WorkoutTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const loadWorkoutTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/workout-tracker/workout-templates")
      if (!response.ok) {
        throw new Error("Failed to fetch workout templates")
      }
      const data = await response.json()
      setUserTemplates(data.userTemplates || [])
    } catch (error) {
      logger.error("Failed to load workout templates:", error)
      toast({
        title: "Error",
        description: "Failed to load workout templates",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadWorkoutTemplates()
  }, [loadWorkoutTemplates])

  const filteredUserTemplates = useMemo(() => {
    if (!searchTerm) return userTemplates

    const searchLower = searchTerm.toLowerCase()

    return userTemplates.filter(template => {
      if (template.name.toLowerCase().includes(searchLower)) return true
      if (template.description?.toLowerCase().includes(searchLower)) return true
      if (template.category?.toLowerCase().includes(searchLower)) return true
      if (template.difficulty?.toLowerCase().includes(searchLower)) return true

      return template.exercises.some(ex => {
        if (ex.exercise.name.toLowerCase().includes(searchLower)) return true
        return ex.exercise.muscles.some(m => m.muscle.name.toLowerCase().includes(searchLower))
      })
    })
  }, [searchTerm, userTemplates])

  const handleAddToSchedule = useCallback(async (items: Omit<ScheduleItem, "id">[], templateName: string) => {
    if (items.length === 0) {
      toast({
        title: "No workouts added",
        description: "Select at least one day before adding to your schedule.",
        variant: "destructive"
      })
      return
    }

    try {
      const result = onSelectWorkout(items)
      if (isPromise(result)) {
        await result
      }

      toast({
        title: "Workouts Added",
        description: `Added ${items.length} session${items.length === 1 ? "" : "s"} from ${templateName}`
      })
    } catch (error) {
      logger.error("Failed to add workouts to schedule:", error)
      toast({
        title: "Error",
        description: "Could not add workouts to your schedule",
        variant: "destructive"
      })
    }
  }, [onSelectWorkout, toast])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Dumbbell className="h-6 w-6 mx-auto mb-2 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">Loading workout templates...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Dumbbell className="h-5 w-5" />
          Workout Templates ({filteredUserTemplates.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Adding to the week of <span className="font-medium text-foreground">{formatWeekRange(currentWeek)}</span>
            </p>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search workout templates..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredUserTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Dumbbell className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="font-medium">
                {userTemplates.length === 0
                  ? "You haven't created any workout templates yet"
                  : searchTerm
                    ? `No templates match "${searchTerm}"`
                    : "No templates found"}
              </p>
              <p className="text-sm mt-1">
                {userTemplates.length === 0
                  ? "Create workouts in the Generate tab or Workout Tracker to see them here"
                  : searchTerm
                    ? "Try adjusting your search term"
                    : "Try a different search"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredUserTemplates.map((template) => (
                <WorkoutTemplateCard
                  key={template.id}
                  template={template}
                  onAdd={(items) => handleAddToSchedule(items, template.name)}
                  timeFormat={timeFormat}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface WorkoutTemplateCardProps {
  template: WorkoutTemplate
  onAdd: (items: Omit<ScheduleItem, "id">[]) => Promise<void> | void
  timeFormat: TimeFormatPreference
}

function WorkoutTemplateCard({ template, onAdd, timeFormat }: WorkoutTemplateCardProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [selectedTime, setSelectedTime] = useState<string>("18:00")
  const [repeatEveryWeeks, setRepeatEveryWeeks] = useState<RepeatWeekOption>("none")
  const [repeatForever, setRepeatForever] = useState<boolean>(true)
  const [repeatEndDate, setRepeatEndDate] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const primaryMuscles = useMemo(() => (
    template.exercises
      .flatMap(ex => ex.exercise.muscles.filter(m => m.isPrimary).map(m => m.muscle.name))
      .filter((muscle, index, arr) => arr.indexOf(muscle) === index)
      .slice(0, 3)
  ), [template.exercises])

  const handleToggleDay = (day: number, checked: boolean) => {
    setSelectedDays(prev => {
      if (checked) {
        return [...prev, day].sort((a, b) => a - b)
      }
      return prev.filter(existing => existing !== day)
    })
  }

  const handleApplyPreset = (days: number[]) => {
    setSelectedDays(days)
  }

  const repeatIntervalValue = repeatEveryWeeks === "none" ? null : Number.parseInt(repeatEveryWeeks, 10)

  const handleRepeatSelectionChange = (value: RepeatWeekOption) => {
    setRepeatEveryWeeks(value)
    if (value === "none") {
      setRepeatForever(true)
      setRepeatEndDate("")
    }
  }

  const resetFormState = () => {
    setSelectedDays([])
    setRepeatEveryWeeks("none")
    setRepeatForever(true)
    setRepeatEndDate("")
  }

  const handleAdd = async () => {
    if (selectedDays.length === 0) {
      await onAdd([])
      return
    }

    setIsSubmitting(true)
    try {
      const sortedDays = [...selectedDays].sort((a, b) => a - b)
      const items: Omit<ScheduleItem, "id">[] = sortedDays.map((day) => {
        const duration = template.estimatedDuration || 60
        const endTime = calculateEndTime(selectedTime, duration)
        const exerciseCount = template.exercises.length
        const muscleText = primaryMuscles.length > 0 ? ` • ${primaryMuscles.join(", ")}` : ""
        const description = `${exerciseCount} exercises${muscleText} • ${template.difficulty || "Unknown difficulty"}`

        const isRecurring = repeatIntervalValue !== null
        const repeatEndsOnIso = repeatForever || !repeatEndDate ? null : new Date(repeatEndDate).toISOString()

        return {
          type: "workout" as const,
          title: template.name,
          description,
          day,
          startTime: selectedTime,
          endTime,
          category: template.category || "Custom Workout",
          difficulty: template.difficulty || undefined,
          duration,
          isFromGenerator: template.isAiGenerated,
          generatorData: {
            name: template.name,
            duration: template.estimatedDuration,
            difficulty: template.difficulty || "Unknown",
            exercises: template.exercises.map(ex => ({
              name: ex.exercise.name,
              sets: ex.targetSets,
              reps: ex.targetReps,
              rest: `${ex.restTime}s`,
              instructions: ex.exercise.description || "",
              targetMuscles: ex.exercise.muscles.map(m => m.muscle.name)
            })),
            warmup: [],
            cooldown: []
          },
          isRecurring,
          repeatPattern: isRecurring ? "weekly" : null,
          repeatInterval: isRecurring ? repeatIntervalValue : null,
          repeatEndsOn: isRecurring ? repeatEndsOnIso : null,
          repeatDaysOfWeek: isRecurring ? sortedDays : null,
          recurrenceRule: isRecurring ? {
            frequency: "weekly",
            interval: repeatIntervalValue,
            endsOn: repeatEndsOnIso,
            daysOfWeek: sortedDays
          } : null
        }
      })

      await onAdd(items)
      resetFormState()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Dumbbell className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-base sm:text-lg">{template.name}</h3>
              {template.isAiGenerated && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <Zap className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
              )}
              {template.category && (
                <Badge variant="outline">{template.category}</Badge>
              )}
              {template.difficulty && (
                <Badge variant="outline">{template.difficulty}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {template.exercises.length} exercises • {template.estimatedDuration} min
              {primaryMuscles.length > 0 && ` • ${primaryMuscles.join(', ')}`}
            </p>
            {template.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {template.description}
              </p>
            )}
          </div>
          <Button onClick={handleAdd} disabled={isSubmitting || selectedDays.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? "Adding..." : "Add to Schedule"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Quick splits</p>
            <div className="flex flex-wrap gap-2">
              {SPLIT_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset(preset.days)}
                >
                  <Repeat className="h-3 w-3 mr-1" />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Select days</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DAYS.map(day => (
                <label key={day.value} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <Checkbox
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={(checked) => handleToggleDay(day.value, Boolean(checked))}
                    id={`${template.id}-day-${day.value}`}
                  />
                  <span className="text-sm">{day.label.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Time of day</p>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder={formatTimeForDisplay(selectedTime, timeFormat)} />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {formatTimeForDisplay(option, timeFormat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Repeat</p>
              <Select value={repeatEveryWeeks} onValueChange={handleRepeatSelectionChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKLY_REPEAT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {repeatIntervalValue !== null && (
                <p className="text-xs text-muted-foreground">
                  Repeats every {repeatIntervalValue === 1 ? "week" : `${repeatIntervalValue} weeks`} on selected days.
                </p>
              )}
            </div>
          </div>

          {repeatIntervalValue !== null && (
            <div className="space-y-3 rounded-lg border border-dashed p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Repeat duration</p>
                  <p className="text-xs text-muted-foreground">Keep repeating forever or choose an end date</p>
                </div>
                <Switch checked={repeatForever} onCheckedChange={(checked) => setRepeatForever(Boolean(checked))} />
              </div>
              {!repeatForever && (
                <Input
                  type="date"
                  value={repeatEndDate}
                  onChange={(event) => setRepeatEndDate(event.target.value)}
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}