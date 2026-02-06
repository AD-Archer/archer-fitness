"use client"

import { useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format, parseISO, isValid } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { ChevronLeft, ChevronRight, CalendarIcon, Activity, AlertCircle, CheckCircle2, Clock, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BodyPartEvent } from "@/types/recovery"

interface RecoveryCalendarProps {
  bodyParts?: string[]
  workoutHistory?: Array<{ date: string; bodyParts: string[] }>
  selectedDate?: Date
  onDateChange?: (date: Date) => void
}

export function RecoveryCalendar({ bodyParts = [], workoutHistory = [], selectedDate: externalSelectedDate, onDateChange }: RecoveryCalendarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Use external selectedDate if provided, otherwise manage local state
  const [localSelectedDate, setLocalSelectedDate] = useState<Date>(() => {
    if (externalSelectedDate) {
      return externalSelectedDate
    }
    const dateParam = searchParams.get("date")
    if (dateParam && isValid(parseISO(dateParam))) {
      return parseISO(dateParam)
    }
    return new Date()
  })

  const selectedDate = externalSelectedDate || localSelectedDate
  
  const updateSelectedDate = (date: Date) => {
    if (!externalSelectedDate) {
      setLocalSelectedDate(date)
    }
    onDateChange?.(date)
    // Update URL for local state management
    if (!externalSelectedDate) {
      const params = new URLSearchParams(searchParams)
      params.set("date", format(date, "yyyy-MM-dd"))
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }

  // Get events from URL
  const eventsParam = searchParams.get("events")
  const [events, setEvents] = useState<BodyPartEvent[]>(() => {
    if (eventsParam) {
      try {
        return JSON.parse(decodeURIComponent(eventsParam))
      } catch {
        return []
      }
    }
    return []
  })

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [newEventBodyPart, setNewEventBodyPart] = useState<string>("")
  const [newEventType, setNewEventType] = useState<BodyPartEvent["type"]>("sore")
  const [newEventIntensity, setNewEventIntensity] = useState<number[]>([3])
  const [newEventNote, setNewEventNote] = useState("")

  // Update URL when date or events change
  const updateURL = (date: Date, newEvents: BodyPartEvent[]) => {
    if (externalSelectedDate) {
      // If using external date management, don't update URL
      return
    }
    const params = new URLSearchParams(searchParams)
    params.set("date", format(date, "yyyy-MM-dd"))
    if (newEvents.length > 0) {
      params.set("events", encodeURIComponent(JSON.stringify(newEvents)))
    } else {
      params.delete("events")
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      updateSelectedDate(date)
      updateURL(date, events)
      setCalendarOpen(false)
    }
  }

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    updateSelectedDate(newDate)
    updateURL(newDate, events)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    updateSelectedDate(newDate)
    updateURL(newDate, events)
  }

  const goToToday = () => {
    const today = new Date()
    updateSelectedDate(today)
    updateURL(today, events)
    setCalendarOpen(false)
  }

  const addEvent = (bodyPart: string, type: BodyPartEvent["type"], intensity?: number, note?: string) => {
    const newEvent: BodyPartEvent = {
      bodyPart,
      date: format(selectedDate, "yyyy-MM-dd"),
      type,
      intensity,
      note,
    }
    const newEvents = [...events, newEvent]
    setEvents(newEvents)
    updateURL(selectedDate, newEvents)
  }

  const handleAddEvent = () => {
    if (newEventBodyPart) {
      addEvent(
        newEventBodyPart,
        newEventType,
        newEventType === "sore" ? newEventIntensity[0] : undefined,
        newEventNote || undefined
      )
      // Reset form
      setNewEventBodyPart("")
      setNewEventType("sore")
      setNewEventIntensity([3])
      setNewEventNote("")
      setAddEventOpen(false)
    }
  }

  const removeEvent = (index: number) => {
    const newEvents = events.filter((_, i) => i !== index)
    setEvents(newEvents)
    updateURL(selectedDate, newEvents)
  }

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    const dateString = format(selectedDate, "yyyy-MM-dd")
    return events.filter((e) => e.date === dateString)
  }, [events, selectedDate])

  // Get workout data for selected date from workout history
  const workoutData = useMemo(() => {
    const dateString = format(selectedDate, "yyyy-MM-dd")
    return workoutHistory.find((w) => w.date === dateString)
  }, [workoutHistory, selectedDate])

  // Dates with events for calendar highlighting
  const datesWithEvents = useMemo(() => {
    return events.map((e) => parseISO(e.date))
  }, [events])

  // Get event summary by type for selected date
  const eventSummary = useMemo(() => {
    const summary = {
      worked: 0,
      sore: 0,
      resolved: 0,
      safe: 0,
    }
    selectedDateEvents.forEach((event) => {
      summary[event.type]++
    })
    return summary
  }, [selectedDateEvents])

  const getEventIcon = (type: BodyPartEvent["type"]) => {
    switch (type) {
      case "worked":
        return <Activity className="h-3 w-3" />
      case "sore":
        return <AlertCircle className="h-3 w-3" />
      case "resolved":
        return <CheckCircle2 className="h-3 w-3" />
      case "safe":
        return <Clock className="h-3 w-3" />
    }
  }

  const getEventColor = (type: BodyPartEvent["type"]) => {
    switch (type) {
      case "worked":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
      case "sore":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
      case "resolved":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
      case "safe":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
    }
  }

  const getEventLabel = (type: BodyPartEvent["type"]) => {
    switch (type) {
      case "worked":
        return "Worked"
      case "sore":
        return "Sore"
      case "resolved":
        return "Resolved"
      case "safe":
        return "Safe to work"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Recovery Calendar
          </span>
        </CardTitle>
        <CardDescription>
          Track when body parts were worked, felt sore, resolved, or became safe to work again
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-xs">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>Worked</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-3 w-3 rounded-full bg-rose-500" />
            <span>Sore</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>Resolved</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span>Safe to work</span>
          </div>
        </div>

        {/* Compact Date Navigator */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousDay}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-center text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                initialFocus
                modifiers={{
                  hasEvent: datesWithEvents,
                }}
                modifiersStyles={{
                  hasEvent: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                  },
                }}
              />
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="w-full"
                >
                  Today
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Action Buttons */}
        <Dialog open={addEventOpen} onOpenChange={setAddEventOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Recovery Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Recovery Event</DialogTitle>
              <DialogDescription>
                Track soreness, recovery status, or when a body part is safe to work for {format(selectedDate, "MMMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bodyPart">Body Part</Label>
                <Select value={newEventBodyPart} onValueChange={setNewEventBodyPart}>
                  <SelectTrigger id="bodyPart">
                    <SelectValue placeholder="Select body part" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodyParts.map((bp) => (
                      <SelectItem key={bp} value={bp}>
                        {bp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select value={newEventType} onValueChange={(v) => setNewEventType(v as BodyPartEvent["type"])}>
                  <SelectTrigger id="eventType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sore">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-500" />
                        <div>
                          <div className="font-medium">Sore</div>
                          <div className="text-xs text-muted-foreground">Body part feels sore</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="resolved">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="font-medium">Resolved</div>
                          <div className="text-xs text-muted-foreground">Soreness has resolved</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="safe">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-500" />
                        <div>
                          <div className="font-medium">Safe to Work</div>
                          <div className="text-xs text-muted-foreground">Ready to train this body part</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="worked">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="font-medium">Worked</div>
                          <div className="text-xs text-muted-foreground">Trained this body part</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newEventType === "sore" && (
                <div className="space-y-2">
                  <Label htmlFor="intensity">Soreness Intensity: {newEventIntensity[0]}/5</Label>
                  <Slider
                    id="intensity"
                    min={1}
                    max={5}
                    step={1}
                    value={newEventIntensity}
                    onValueChange={setNewEventIntensity}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mild</span>
                    <span>Severe</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Add any additional notes..."
                  value={newEventNote}
                  onChange={(e) => setNewEventNote(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddEvent} disabled={!newEventBodyPart} className="flex-1">
                  Add Event
                </Button>
                <Button variant="outline" onClick={() => setAddEventOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Workout Data from History */}
        {workoutData && (
          <div className="rounded-lg border bg-blue-500/5 border-blue-200 dark:border-blue-800 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
              <Activity className="h-4 w-4" />
              Workout Completed
            </div>
            <div className="flex flex-wrap gap-1">
              {workoutData.bodyParts.map((bp) => (
                <Badge
                  key={bp}
                  variant="outline"
                  className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                >
                  {bp}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats for Selected Date */}
        {(eventSummary.worked > 0 || eventSummary.sore > 0 || eventSummary.resolved > 0 || eventSummary.safe > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {eventSummary.worked > 0 && (
              <div className="rounded-lg border bg-blue-500/5 border-blue-200 dark:border-blue-800 p-2 text-center">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{eventSummary.worked}</div>
                <div className="text-xs text-muted-foreground">Worked</div>
              </div>
            )}
            {eventSummary.sore > 0 && (
              <div className="rounded-lg border bg-rose-500/5 border-rose-200 dark:border-rose-800 p-2 text-center">
                <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">{eventSummary.sore}</div>
                <div className="text-xs text-muted-foreground">Sore</div>
              </div>
            )}
            {eventSummary.resolved > 0 && (
              <div className="rounded-lg border bg-green-500/5 border-green-200 dark:border-green-800 p-2 text-center">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{eventSummary.resolved}</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
            )}
            {eventSummary.safe > 0 && (
              <div className="rounded-lg border bg-emerald-500/5 border-emerald-200 dark:border-emerald-800 p-2 text-center">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{eventSummary.safe}</div>
                <div className="text-xs text-muted-foreground">Safe</div>
              </div>
            )}
          </div>
        )}

        {/* Events for Selected Date */}
        {selectedDateEvents.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Events for this day:</div>
            <div className="space-y-2">
              {selectedDateEvents.map((event, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-lg border p-3 flex items-start justify-between gap-2",
                    getEventColor(event.type)
                  )}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      {getEventIcon(event.type)}
                      <span>{event.bodyPart}</span>
                      <Badge variant="outline" className="text-xs">
                        {getEventLabel(event.type)}
                      </Badge>
                    </div>
                    {event.intensity && (
                      <div className="text-xs">Intensity: {event.intensity}/5</div>
                    )}
                    {event.note && (
                      <div className="text-xs text-muted-foreground">{event.note}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEvent(events.indexOf(event))}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDateEvents.length === 0 && !workoutData && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No events recorded for this day
          </div>
        )}
      </CardContent>
    </Card>
  )
}
