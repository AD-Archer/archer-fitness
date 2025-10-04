"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Dumbbell, Clock, ArrowRight, Sparkles } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { logger } from "@/lib/logger"
import Link from "next/link"
import { formatTimeForDisplay, type TimeFormatPreference } from "@/lib/time-utils"
import { useUserPreferences } from "@/hooks/use-user-preferences"

interface ScheduleItem {
  id: string
  type: string
  title: string
  description?: string
  day: number
  startTime: string
  endTime: string
  duration?: number
  category?: string
  difficulty?: string
  isFromGenerator?: boolean
  isRecurring?: boolean
  repeatPattern?: string | null
  repeatInterval?: number | null
}

interface DaySchedule {
  date: Date
  dayOfWeek: number
  items: ScheduleItem[]
}

interface WeeklySchedule {
  weekStart: Date
  timezone?: string | null
  days: DaySchedule[]
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ScheduleOverview() {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null)
  const [nextWeekDays, setNextWeekDays] = useState<DaySchedule[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDay())
  const { timeFormat } = useUserPreferences()

  const getWeekStart = useCallback(() => {
    const today = new Date()
    const day = today.getDay()
    today.setHours(0, 0, 0, 0)
    today.setDate(today.getDate() - day) // Sunday = 0
    return today
  }, [])

  const getCurrentDay = () => {
    return new Date().getDay()
  }

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true)
        setError(null)

        const weekStart = getWeekStart()
        const weekKey = weekStart.toISOString().split('T')[0]
        const nextWeekStart = new Date(weekStart)
        nextWeekStart.setDate(weekStart.getDate() + 7)
        const nextWeekKey = nextWeekStart.toISOString().split('T')[0]

        logger.info('Fetching schedule for weeks:', { weekKey, nextWeekKey })

        const [thisRes, nextRes] = await Promise.all([
          fetch(`/api/schedule?weekStart=${weekKey}`),
          fetch(`/api/schedule?weekStart=${nextWeekKey}`)
        ])

        const handleWeek = (res: Response, baseDate: Date) => {
          if (!res.ok) return null
          return res.json()
            .then((data) => {
              if (data.schedule && data.schedule.items) {
                const days = Array.from({ length: 7 }, (_, index) => {
                  const date = new Date(baseDate)
                  date.setDate(baseDate.getDate() + index)
                  date.setHours(0, 0, 0, 0)
                  const dayItems = data.schedule.items
                    .filter((item: ScheduleItem) => Number(item.day) === index)
                    .sort((a: ScheduleItem, b: ScheduleItem) => a.startTime.localeCompare(b.startTime))
                  return { date, dayOfWeek: index, items: dayItems }
                })
                return { timezone: data.schedule.timezone, days }
              }
              return { timezone: 'UTC', days: Array.from({ length: 7 }, (_, index) => {
                const date = new Date(baseDate)
                date.setDate(baseDate.getDate() + index)
                return { date, dayOfWeek: index, items: [] as ScheduleItem[] }
              }) }
            })
        }

        const [thisWeekData, nextWeekData] = await Promise.all([
          handleWeek(thisRes, weekStart),
          handleWeek(nextRes, nextWeekStart)
        ])

        if (thisWeekData) {
          setSchedule({ weekStart, timezone: thisWeekData.timezone, days: thisWeekData.days as DaySchedule[] })
        }
        if (nextWeekData) {
          setNextWeekDays(nextWeekData.days as DaySchedule[])
        }
        if (!thisWeekData) {
          setError('Failed to load schedule')
        }
      } catch (error) {
        logger.error('Error fetching schedule:', error)
        setError('Failed to load schedule data')
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [getWeekStart])

  const calculateStats = () => {
    if (!schedule) {
      return {
        totalWorkouts: 0,
        completedToday: 0,
        upcoming7Days: 0,
        totalDuration: 0,
        todayWorkouts: []
      }
    }

    const currentDay = getCurrentDay()
    const todayWorkouts = schedule.days[currentDay]?.items || []
    const totalWorkouts = schedule.days.reduce((sum, day) => sum + day.items.length, 0)
    // Remaining in current week including today
    const remainingThisWeek = schedule.days
      .filter((day) => day.dayOfWeek >= currentDay)
      .reduce((sum, day) => sum + day.items.length, 0)

    // Add early next week to complete next 7 days window
    let upcoming7Days = remainingThisWeek
    if (nextWeekDays) {
      const daysRemainingCount = 7 - currentDay // including today index -> days left in calendar week
      const neededFromNext = Math.max(0, 7 - daysRemainingCount)
      if (neededFromNext > 0) {
        const slice = nextWeekDays.slice(0, neededFromNext)
        upcoming7Days += slice.reduce((sum, day) => sum + day.items.length, 0)
      }
    }

    // Calculate total duration for the week
    const totalDuration = schedule.days.reduce((sum, day) => {
      return sum + day.items.reduce((daySum, item) => daySum + (item.duration || 0), 0)
    }, 0)

    return {
      totalWorkouts,
      completedToday: 0, // Would need to cross-reference with workout sessions
      upcoming7Days,
      totalDuration,
      todayWorkouts
    }
  }

  const stats = calculateStats()
  const currentDay = getCurrentDay()

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse w-48"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>{error}</p>
            <Button asChild variant="outline" className="mt-4" size="sm">
              <Link href="/schedule">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Weekly Stats Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base">This Week's Schedule</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/schedule">
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
            <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalWorkouts}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Planned</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.upcoming7Days}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Upcoming 7d</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{Math.round(stats.totalDuration / 60)}h</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Duration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week at a Glance Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Week at a Glance</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-7 gap-1">
            {schedule?.days.map((day, index) => {
              const isToday = index === currentDay
              const isSelected = index === selectedDay
              const hasWorkouts = day.items.length > 0
              return (
                <button
                  type="button"
                  key={index}
                  onClick={() => setSelectedDay(index)}
                  className={`group relative flex flex-col items-center justify-center rounded-md border p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    ${isSelected ? 'bg-primary/10 border-primary' : isToday ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700' : 'bg-card border-muted'}
                  `}
                  aria-label={`${SHORT_DAYS[index]}: ${day.items.length} workout${day.items.length !== 1 ? 's' : ''}`}
                >
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-primary' : isToday ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>{SHORT_DAYS[index]}</span>
                  <span className={`text-sm font-semibold leading-none mt-0.5 ${hasWorkouts ? (isSelected ? 'text-primary' : '') : 'text-muted-foreground/40'}`}>{day.items.length}</span>
                  {hasWorkouts && (
                    <span className={`mt-0.5 h-0.5 w-4 rounded-full ${isSelected ? 'bg-primary' : isToday ? 'bg-blue-600' : 'bg-primary/60'}`}></span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Tap a day to view details below.</p>
        </CardContent>
      </Card>

      {/* Selected Day Details Card */}
      {schedule && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              {selectedDay === currentDay ? "Today's Workouts" : `${SHORT_DAYS[selectedDay]} Workouts`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            {schedule.days[selectedDay].items.length > 0 ? (
              schedule.days[selectedDay].items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Dumbbell className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-medium text-xs truncate">{item.title}</p>
                      {item.isFromGenerator && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-3.5">
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                          AI
                        </Badge>
                      )}
                      {item.difficulty && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5">
                          {item.difficulty}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTimeForDisplay(item.startTime, timeFormat as TimeFormatPreference)}
                      </span>
                      {item.duration && (
                        <span>{item.duration} min</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-2">
                <p className="text-xs mb-2">Rest day. Nothing planned.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link href="/schedule">
                      Add Workout
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary" className="h-7 text-xs">
                    <Link href="/schedule">
                      Generate Plan
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
