"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Zap, Clock, Users } from "lucide-react"
import { WeeklyCalendar } from "./weekly-calendar"
import { GeneratedScheduleImporter } from "./generated-schedule-importer"
import { ScheduleTemplates } from "./schedule-templates"
import { WeeklySchedule, ScheduleItem } from "../types/schedule"
import { useScheduleApi } from "../hooks/use-schedule-api"
import { useToast } from "@/hooks/use-toast"

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
    const diff = d.getDate() - day // Sunday = 0
    return new Date(d.setDate(diff))
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
      console.error('Failed to load completed sessions:', error)
    }
  }, [])

  // Initialize with current week
  const loadScheduleFromAPI = useCallback(async (weekStart: Date) => {
    try {
      const weekKey = weekStart.toISOString().split('T')[0]
      const schedule = await loadSchedule(weekKey)
      
      if (schedule && schedule.items) {
        setCurrentSchedule(prev => {
          if (!prev) return null
          
          // Group items by day
          const itemsByDay: { [key: number]: ScheduleItem[] } = {}
          schedule.items.forEach(item => {
            if (!itemsByDay[item.day]) {
              itemsByDay[item.day] = []
            }
            itemsByDay[item.day].push(item)
          })

          return {
            ...prev,
            days: prev.days.map(day => ({
              ...day,
              items: (itemsByDay[day.dayOfWeek] || []).sort((a, b) => a.startTime.localeCompare(b.startTime))
            }))
          }
        })
      }

      // Load completed sessions for the week
      await loadCompletedSessions(weekStart)
    } catch (error) {
      console.error('Failed to load schedule:', error)
      toast({
        title: "Error",
        description: "Failed to load schedule from server",
        variant: "destructive"
      })
    }
  }, [loadSchedule, toast, loadCompletedSessions])

  const initializeCurrentWeek = useCallback(() => {
    const today = new Date()
    const weekStart = getWeekStart(today)
    
    const schedule: WeeklySchedule = {
      weekStart,
      days: Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + index)
        return {
          date,
          dayOfWeek: index,
          items: []
        }
      })
    }
    
    setCurrentSchedule(schedule)
    loadScheduleFromAPI(weekStart)
  }, [loadScheduleFromAPI])

  useEffect(() => {
    initializeCurrentWeek()
  }, [initializeCurrentWeek])

  const saveScheduleToAPI = async (schedule: WeeklySchedule) => {
    try {
      const weekKey = schedule.weekStart.toISOString().split('T')[0]
      const allItems = schedule.days.flatMap(day => day.items)
      await saveSchedule(weekKey, allItems)
    } catch (error) {
      console.error('Failed to save schedule:', error)
      toast({
        title: "Error",
        description: "Failed to save schedule to server",
        variant: "destructive"
      })
    }
  }



  const deleteScheduleItem = async (itemId: string) => {
    if (!currentSchedule) return

    const updatedSchedule = {
      ...currentSchedule,
      days: currentSchedule.days.map(day => ({
        ...day,
        items: day.items.filter(item => item.id !== itemId)
      }))
    }

    setCurrentSchedule(updatedSchedule)
    await saveScheduleToAPI(updatedSchedule)
    
    toast({
      title: "Schedule Updated",
      description: "Schedule item removed",
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!currentSchedule) return

    const newWeekStart = new Date(currentSchedule.weekStart)
    newWeekStart.setDate(newWeekStart.getDate() + (direction === 'next' ? 7 : -7))
    
    const newSchedule: WeeklySchedule = {
      weekStart: newWeekStart,
      days: Array.from({ length: 7 }, (_, index) => {
        const date = new Date(newWeekStart)
        date.setDate(newWeekStart.getDate() + index)
        return {
          date,
          dayOfWeek: index,
          items: []
        }
      })
    }
    
    setCurrentSchedule(newSchedule)
    loadScheduleFromAPI(newWeekStart)
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

  const importGeneratedSchedule = async (items: Omit<ScheduleItem, "id">[]) => {
    if (!currentSchedule) return

    const newItems: ScheduleItem[] = items.map(item => ({
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isFromGenerator: true
    }))

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
          ...day.items,
          ...(itemsByDay[day.dayOfWeek] || [])
        ].sort((a, b) => a.startTime.localeCompare(b.startTime))
      }))
    }

    setCurrentSchedule(updatedSchedule)
    await saveScheduleToAPI(updatedSchedule)
    
    toast({
      title: "Schedule Imported",
      description: `Added ${newItems.length} items to your schedule`,
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
                <p className="font-semibold">
                  {currentSchedule.days.reduce((total, day) => total + day.items.length, 0)} Activities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Workouts</p>
                <p className="font-semibold">
                  {currentSchedule.days.reduce((total, day) => 
                    total + day.items.filter(item => item.type === 'workout').length, 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Meals</p>
                <p className="font-semibold">
                  {currentSchedule.days.reduce((total, day) => 
                    total + day.items.filter(item => item.type === 'meal').length, 0
                  )}
                </p>
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
            <Zap className="h-4 w-4" />
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
            onItemDelete={deleteScheduleItem}
            onClearWeek={clearWeekSchedule}
            isLoading={loading}
            completedSessions={completedSessions}
          />
        </TabsContent>

        <TabsContent value="generated" className="space-y-6">
          <GeneratedScheduleImporter
            onImportSchedule={importGeneratedSchedule}
            currentWeek={currentSchedule.weekStart}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <ScheduleTemplates
            onApplyTemplate={(items: Omit<ScheduleItem, "id">[]) => importGeneratedSchedule(items)}
            currentSchedule={currentSchedule}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}