"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, CheckCircle2, Sparkles } from "lucide-react"
import { WeeklyCalendar } from "./weekly-calendar"
import { GeneratedScheduleImporter } from "./generated-schedule-importer"
import { ScheduleTemplates } from "./schedule-templates"
import { WeeklySchedule, ScheduleItem, ApplyTemplateOptions } from "../types/schedule"
import { useScheduleApi } from "../hooks/use-schedule-api"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import { useUserPreferences } from "@/hooks/use-user-preferences"

export function ScheduleManager() {
  const [currentSchedule, setCurrentSchedule] = useState<WeeklySchedule | null>(null)
  const [completedSessions, setCompletedSessions] = useState<Array<{
    id: string
    name: string
    startTime: string
    status: string
  }>>([])
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { preferences, timeFormat } = useUserPreferences()
  const hasInitialized = useRef(false)

  const preferredTimezone = useMemo(() => {
    if (preferences?.app?.timezone) {
      return preferences.app.timezone
    }
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (error) {
      logger.warn('Unable to resolve timezone from Intl API, defaulting to UTC', error)
      return 'UTC'
    }
  }, [preferences])

  const availableEquipment = preferences?.workout?.availableEquipment ?? []

  const [activeTimezone, setActiveTimezone] = useState<string>(preferredTimezone)

  useEffect(() => {
    if (preferredTimezone && preferredTimezone !== activeTimezone) {
      setActiveTimezone(preferredTimezone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredTimezone]) // Only re-run when preferredTimezone changes, not activeTimezone

  const buildWeeklySchedule = useCallback((weekStart: Date, items: ScheduleItem[] = [], timezone?: string | null): WeeklySchedule => {
    const resolvedTimezone = timezone ?? activeTimezone ?? preferredTimezone ?? 'UTC'

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + index)
      date.setHours(0, 0, 0, 0)

      const dayItems = items
        .filter((item) => Number(item.day) === index)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))

      return {
        date,
        dayOfWeek: index,
        items: dayItems
      }
    })

    return {
      weekStart,
      timezone: resolvedTimezone,
      days
    }
  }, [activeTimezone, preferredTimezone])
  
  // Get tab from URL or default to 'calendar'
  const activeTab = searchParams.get('tab') || 'calendar'
  
  const { 
    loading, 
    loadSchedule, 
    saveSchedule, 
    clearSchedule 
  } = useScheduleApi()

  // Handle tab changes and update URL
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - day) // Sunday = 0
    return d
  }

  const loadCompletedSessions = useCallback(async (weekStart: Date) => {
    try {
      // Get sessions for the entire week
      const startDate = weekStart.toISOString().split('T')[0]
      const endDate = new Date(weekStart)
      endDate.setDate(endDate.getDate() + 6)
      const endDateStr = endDate.toISOString().split('T')[0]

      const response = await fetch(`/api/workout-tracker/workout-sessions?timeRange=custom&startDate=${startDate}&endDate=${endDateStr}`)
      if (response.ok) {
        const sessions: Array<{
          id: string
          status: string
          startTime: string
          workoutTemplateId?: string
          name: string
        }> = await response.json()
        setCompletedSessions(sessions.filter(session => session.status === 'completed'))
      }
    } catch (error) {
      logger.error('Failed to load completed sessions:', error)
    }
  }, [])

  // Initialize with current week
  const loadScheduleFromAPI = useCallback(async (weekStart: Date) => {
    try {
      const weekKey = weekStart.toISOString().split('T')[0]
      const scheduleResponse = await loadSchedule(weekKey)

      const timezoneFromSchedule = (scheduleResponse as any)?.timezone ?? null
      if (timezoneFromSchedule && timezoneFromSchedule !== activeTimezone) {
        setActiveTimezone(timezoneFromSchedule)
      }

      const scheduleItems = (scheduleResponse?.items as ScheduleItem[] | undefined) || []
      setCurrentSchedule(buildWeeklySchedule(weekStart, scheduleItems, timezoneFromSchedule))

      await loadCompletedSessions(weekStart)
    } catch (error) {
      logger.error('Failed to load schedule:', error)
      toast({
        title: "Error",
        description: "Failed to load schedule from server",
        variant: "destructive"
      })
    }
  }, [loadSchedule, toast, loadCompletedSessions, buildWeeklySchedule, activeTimezone])

  const initializeCurrentWeek = useCallback(() => {
    const today = new Date()
    const weekStart = getWeekStart(today)

    setCurrentSchedule(buildWeeklySchedule(weekStart, [], activeTimezone))
    loadScheduleFromAPI(weekStart)
  }, [buildWeeklySchedule, loadScheduleFromAPI, activeTimezone])

  useEffect(() => {
    // Only initialize once on mount
    if (!hasInitialized.current) {
      hasInitialized.current = true
      initializeCurrentWeek()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount

  const saveScheduleToAPI = async (schedule: WeeklySchedule): Promise<WeeklySchedule | null> => {
    try {
      const weekKey = schedule.weekStart.toISOString().split('T')[0]
      const allItems = schedule.days.flatMap(day => day.items)
      
      logger.info('Saving schedule:', { weekKey, itemCount: allItems.length, items: allItems })
      
      const result = await saveSchedule(weekKey, allItems, { timezone: schedule.timezone ?? activeTimezone })
      
      if (result) {
        logger.info('Schedule saved successfully:', result)

        const normalizedWeekStart = new Date(schedule.weekStart)
        const timezoneFromServer = (result as unknown as { timezone?: string })?.timezone ?? schedule.timezone ?? activeTimezone
        const serverItems = ((result as unknown as { items?: ScheduleItem[] }).items ?? []) as ScheduleItem[]
        const normalizedSchedule = buildWeeklySchedule(normalizedWeekStart, serverItems, timezoneFromServer)
        setCurrentSchedule(normalizedSchedule)
        await loadCompletedSessions(normalizedWeekStart)
        return normalizedSchedule
      } else {
        logger.error('Failed to save schedule - no result returned')
      }
    } catch (error) {
      logger.error('Failed to save schedule:', error)
      toast({
        title: "Error",
        description: "Failed to save schedule to server",
        variant: "destructive"
      })
    }

    return null
  }



  const deleteScheduleItem = async (itemId: string, deleteOption: "this" | "future" | "all" = "this") => {
    if (!currentSchedule) return

    const itemToDelete = currentSchedule.days.flatMap(day => day.items).find(item => item.id === itemId)
    if (!itemToDelete) return

    const isRecurring = itemToDelete.isRecurring || itemToDelete.repeatPattern === "weekly"
    const isVirtual = (itemToDelete as any).isVirtual || itemId.includes('-')

    let updatedSchedule = { ...currentSchedule }

    if (isRecurring && deleteOption !== "this") {
      // For "future" or "all", we need to delete from the origin schedule
      // This requires a more sophisticated approach - we'll mark it by setting an end date
      if (deleteOption === "future") {
        // Set the repeat end date to before this occurrence
        const currentWeekStart = currentSchedule.weekStart
        const endDate = new Date(currentWeekStart)
        endDate.setDate(endDate.getDate() + itemToDelete.day - 1) // Day before this occurrence

        updatedSchedule = {
          ...currentSchedule,
          days: currentSchedule.days.map(day => ({
            ...day,
            items: day.items.map(item => {
              if (item.id === itemId || (isVirtual && (item as any).originId === (itemToDelete as any).originId)) {
                return {
                  ...item,
                  repeatEndsOn: endDate.toISOString(),
                  recurrenceRule: item.recurrenceRule ? {
                    ...item.recurrenceRule,
                    endsOn: endDate.toISOString()
                  } : null
                }
              }
              return item
            }).filter(item => {
              // Remove future virtual occurrences immediately
              if ((item as any).isVirtual) {
                const itemDate = new Date(currentWeekStart)
                itemDate.setDate(itemDate.getDate() + item.day)
                return itemDate <= endDate
              }
              return true
            })
          }))
        }
      } else if (deleteOption === "all") {
        // Delete all occurrences - remove the item entirely
        const originId = isVirtual ? (itemToDelete as any).originId : itemId
        updatedSchedule = {
          ...currentSchedule,
          days: currentSchedule.days.map(day => ({
            ...day,
            items: day.items.filter(item => {
              const itemOriginId = (item as any).originId || item.id
              return itemOriginId !== originId
            })
          }))
        }
      }
    } else {
      // Delete only this occurrence
      updatedSchedule = {
        ...currentSchedule,
        days: currentSchedule.days.map(day => ({
          ...day,
          items: day.items.filter(item => item.id !== itemId)
        }))
      }
    }

    setCurrentSchedule(updatedSchedule)
    await saveScheduleToAPI(updatedSchedule)
    
    const deleteMessage = deleteOption === "all" 
      ? "All occurrences deleted"
      : deleteOption === "future"
      ? "This and future occurrences deleted"
      : "Schedule item removed"

    toast({
      title: "Schedule Updated",
      description: deleteMessage,
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!currentSchedule) return

    const newWeekStart = new Date(currentSchedule.weekStart)
    newWeekStart.setDate(newWeekStart.getDate() + (direction === 'next' ? 7 : -7))

    setCurrentSchedule(buildWeeklySchedule(newWeekStart, [], currentSchedule.timezone ?? activeTimezone))
    loadScheduleFromAPI(newWeekStart)
  }

  const goToCurrentWeek = () => {
    initializeCurrentWeek()
  }

  const clearWeekSchedule = async () => {
    if (!currentSchedule) return

    const weekKey = currentSchedule.weekStart.toISOString().split('T')[0]
    await clearSchedule(weekKey)

    const clearedSchedule = {
      ...currentSchedule,
      days: currentSchedule.days.map(day => ({ ...day, items: [] }))
    }

    setCurrentSchedule(clearedSchedule)
    
    toast({
      title: "Schedule Cleared",
      description: "All items removed from this week",
    })
  }

  const importGeneratedSchedule = async (
    items: Omit<ScheduleItem, "id">[],
    options?: ApplyTemplateOptions
  ) => {
    if (!currentSchedule) return

    const generateId = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
      }
      return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    }

    const mode: ApplyTemplateOptions["mode"] = options?.mode ?? "append"

    const newItems: ScheduleItem[] = items.map(item => {
      const repeatEnabled = options?.enableRepeat ?? Boolean(item.repeatPattern === 'weekly' || item.isRecurring)
      const repeatInterval = repeatEnabled
        ? (options?.repeatIntervalWeeks ?? item.repeatInterval ?? 1)
        : null
      const repeatDays = repeatEnabled
        ? (item.repeatDaysOfWeek && item.repeatDaysOfWeek.length > 0 ? item.repeatDaysOfWeek : [item.day])
        : null

      const recurrenceRule = repeatEnabled
        ? {
            frequency: 'weekly' as const,
            interval: repeatInterval ?? 1,
            endsOn: item.repeatEndsOn ?? null,
            daysOfWeek: repeatDays ?? [item.day],
            meta: {
              ...(item.recurrenceRule?.meta ?? {}),
              source: item.recurrenceRule?.meta?.source ?? 'schedule-generator',
              appliedInterval: repeatInterval ?? 1
            }
          }
        : null

      return {
        ...item,
        id: generateId(),
        isFromGenerator: item.isFromGenerator ?? true,
        isRecurring: repeatEnabled,
        repeatPattern: repeatEnabled ? 'weekly' : null,
        repeatInterval: repeatEnabled ? (repeatInterval ?? 1) : null,
        repeatEndsOn: repeatEnabled ? item.repeatEndsOn ?? null : null,
        repeatDaysOfWeek: repeatEnabled ? repeatDays ?? [item.day] : undefined,
        recurrenceRule
      }
    })

    // Group items by day
    const itemsByDay: { [key: number]: ScheduleItem[] } = {}
    newItems.forEach(item => {
      if (!itemsByDay[item.day]) {
        itemsByDay[item.day] = []
      }
      itemsByDay[item.day].push(item)
    })

    const updatedSchedule = {
      ...currentSchedule,
      days: currentSchedule.days.map(day => ({
        ...day,
        items: [
          ...(mode === 'replace' ? [] : day.items),
          ...(itemsByDay[day.dayOfWeek] || [])
        ].sort((a, b) => a.startTime.localeCompare(b.startTime))
      }))
    }

    setCurrentSchedule(updatedSchedule)
    await saveScheduleToAPI(updatedSchedule)
    
    toast({
      title: mode === 'replace' ? "Template Applied" : "Schedule Updated",
      description: mode === 'replace'
        ? `Replaced this week's plan with ${newItems.length} item${newItems.length === 1 ? '' : 's'}.`
        : `Added ${newItems.length} item${newItems.length === 1 ? '' : 's'} to your schedule.`,
    })
  }

  if (!currentSchedule) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    )
  }

  const totalActivities = currentSchedule.days.reduce((total, day) => total + day.items.length, 0)
  const totalWorkouts = currentSchedule.days.reduce((total, day) =>
    total + day.items.filter(item => item.type === 'workout').length,
  0)
  const totalMinutes = currentSchedule.days.reduce((total, day) =>
    total + day.items.reduce((acc, item) => acc + (item.duration || 0), 0),
  0)
  const completedCount = completedSessions.length

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="font-semibold">{totalActivities} Activities</p>
                <p className="text-xs text-muted-foreground">{totalMinutes} min scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Workouts Scheduled</p>
                <p className="font-semibold">{totalWorkouts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Completed Workouts</p>
                <p className="font-semibold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar View</span>
            <span className="sm:hidden">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="generated" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Use Generated</span>
            <span className="sm:hidden">Generated</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
            <span className="sm:hidden">Templates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <WeeklyCalendar
            schedule={currentSchedule}
            onNavigateWeek={navigateWeek}
            onGoToCurrentWeek={goToCurrentWeek}
            onItemDelete={deleteScheduleItem}
            onClearWeek={clearWeekSchedule}
            isLoading={loading}
            completedSessions={completedSessions}
            timeFormat={timeFormat}
          />
        </TabsContent>

        <TabsContent value="generated" className="space-y-6">
          <GeneratedScheduleImporter
            onImportSchedule={importGeneratedSchedule}
            currentWeek={currentSchedule.weekStart}
            timeFormat={timeFormat}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <ScheduleTemplates
            onApplyTemplate={(items: Omit<ScheduleItem, "id">[], options?: ApplyTemplateOptions) => importGeneratedSchedule(items, options)}
            currentSchedule={currentSchedule}
            timeFormat={timeFormat}
            availableEquipment={availableEquipment}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}