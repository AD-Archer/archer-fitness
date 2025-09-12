"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Trash2, Edit, Clock, Utensils, Dumbbell } from "lucide-react"
import { WeeklySchedule } from "../types/schedule"
import { cn } from "@/lib/utils"

interface WeeklyCalendarProps {
  schedule: WeeklySchedule
  onNavigateWeek: (direction: 'prev' | 'next') => void
  onItemDelete: (itemId: string) => void
  onClearWeek: () => void
  isLoading: boolean
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function WeeklyCalendar({
  schedule,
  onNavigateWeek,
  onItemDelete,
  onClearWeek,
  isLoading
}: WeeklyCalendarProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const formatTimeRange = (startTime: string, endTime: string) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minutes} ${ampm}`
    }
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'workout':
        return <Dumbbell className="h-3 w-3" />
      case 'meal':
        return <Utensils className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getItemColor = (type: string) => {
    switch (type) {
      case 'workout':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'meal':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const weekRangeText = () => {
    const endDate = new Date(schedule.weekStart)
    endDate.setDate(endDate.getDate() + 6)
    
    return `${formatDate(schedule.weekStart)} - ${formatDate(endDate)}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
              <p className="text-muted-foreground">Loading schedule...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Weekly Schedule</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{weekRangeText()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearWeek}
              className="ml-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Week
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {schedule.days.map((day, index) => (
            <div key={index} className="space-y-2">
              <div className="text-center p-2 bg-muted rounded-lg">
                <h3 className="font-medium text-sm">{DAYS[day.dayOfWeek]}</h3>
                <p className="text-xs text-muted-foreground">{formatDate(day.date)}</p>
              </div>
              
              <div className="space-y-2 min-h-[200px]">
                {day.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    No activities scheduled
                  </div>
                ) : (
                  day.items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                        getItemColor(item.type),
                        selectedItem === item.id && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          {getItemIcon(item.type)}
                          <span className="text-xs font-medium truncate">{item.title}</span>
                        </div>
                        {item.isFromGenerator && (
                          <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                            AI
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimeRange(item.startTime, item.endTime)}
                      </div>
                      
                      {item.duration && (
                        <div className="text-xs text-muted-foreground">
                          {item.duration} min
                        </div>
                      )}
                      
                      {selectedItem === item.id && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                // TODO: Implement edit functionality
                                console.log('Edit item:', item.id)
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                onItemDelete(item.id)
                                setSelectedItem(null)
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                          
                          {item.description && (
                            <p className="text-xs mt-1 text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}