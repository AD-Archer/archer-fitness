"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Zap, Download, Utensils, Calendar, RefreshCw } from "lucide-react"
import { ScheduleItem, MealScheduleData } from "../types/schedule"
import { WorkoutTemplateSelector } from "./workout-template-selector"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"

interface GeneratedScheduleImporterProps {
  onImportSchedule: (items: Omit<ScheduleItem, "id">[]) => void
  currentWeek: Date
}


interface MealData {
  name: string
  type: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  instructions: string[]
  prepTime: number
}

interface GeneratedMeal {
  id: string
  name: string
  days: number
  totalCalories: number
  meals: { [key: string]: MealData[] }
  shoppingList: string[]
  generatedAt: Date
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

const DEFAULT_SCHEDULE_TIMES = {
  workout: {
    morning: '07:00',
    afternoon: '12:00',
    evening: '18:00'
  },
  meal: {
    breakfast: '08:00',
    lunch: '12:30',
    dinner: '18:30',
    snack: '15:00'
  }
}

const formatGeneratedDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function GeneratedScheduleImporter({ onImportSchedule, currentWeek }: GeneratedScheduleImporterProps) {
  const [generatedMeals, setGeneratedMeals] = useState<GeneratedMeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<{
    meals: { [key: string]: { id: string; days: { [key: string]: number[] }; times: { [key: string]: string } } }
  }>({
    meals: {}
  })

  useEffect(() => {
    loadGeneratedContent()
  }, [])

  const loadGeneratedContent = () => {
    setIsLoading(true)
    
    // Load from localStorage (simulating generated content storage)
    try {
      // Load meals
      const mealKeys = Object.keys(localStorage).filter(key => key.startsWith('generated-meal-'))
      const meals = mealKeys.map(key => {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        return {
          id: key.replace('generated-meal-', ''),
          ...data,
          generatedAt: new Date(data.generatedAt || Date.now())
        }
      }).sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())

      setGeneratedMeals(meals)
    } catch (error) {
      logger.error('Failed to load generated content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMealSelection = (mealId: string, dayMeals: { [key: string]: number[] }, times: { [key: string]: string }) => {
    setSelectedItems(prev => ({
      ...prev,
      meals: {
        ...prev.meals,
        [mealId]: { id: mealId, days: dayMeals, times }
      }
    }))
  }

  const removeMealSelection = (mealId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      meals: Object.fromEntries(
        Object.entries(prev.meals).filter(([id]) => id !== mealId)
      )
    }))
  }

  const generateScheduleItems = (): Omit<ScheduleItem, "id">[] => {
    const items: Omit<ScheduleItem, "id">[] = []

    // Add selected meals
    Object.values(selectedItems.meals).forEach(selection => {
      const mealPlan = generatedMeals.find(m => m.id === selection.id)
      if (!mealPlan) return

      Object.entries(selection.days).forEach(([mealType, days]) => {
        days.forEach(day => {
          const mealData = Object.values(mealPlan.meals)[0]?.find((meal: MealData) => 
            meal.type.toLowerCase() === mealType.toLowerCase()
          )
          
          if (!mealData) return

          const startTime = selection.times[mealType] || DEFAULT_SCHEDULE_TIMES.meal[mealType as keyof typeof DEFAULT_SCHEDULE_TIMES.meal]
          const [hours, minutes] = startTime.split(':')
          const endTime = `${String(parseInt(hours) + Math.floor((parseInt(minutes) + (mealData.prepTime || 30)) / 60)).padStart(2, '0')}:${String((parseInt(minutes) + (mealData.prepTime || 30)) % 60).padStart(2, '0')}`

          items.push({
            type: 'meal',
            title: mealData.name || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
            description: `${mealData.calories || 0} cal • ${mealData.prepTime || 30} min prep`,
            day,
            startTime,
            endTime,
            category: mealType.charAt(0).toUpperCase() + mealType.slice(1),
            calories: mealData.calories,
            duration: mealData.prepTime || 30,
            isFromGenerator: true,
            generatorData: mealData as MealScheduleData
          })
        })
      })
    })

    return items
  }

  const handleImport = () => {
    const items = generateScheduleItems()
    if (items.length === 0) return

    onImportSchedule(items)
    
    // Clear selections
    setSelectedItems({ meals: {} })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <RefreshCw className="h-6 w-6 mx-auto mb-2 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Loading generated content...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalSelectedItems = Object.keys(selectedItems.meals).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Import Generated Content
          </CardTitle>
          <CardDescription>
            Add your AI-generated workouts and meal plans to your weekly schedule
          </CardDescription>
        </CardHeader>
        {totalSelectedItems > 0 && (
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-medium">
                  {generateScheduleItems().length} schedule items ready to import
                </span>
              </div>
              <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Import to Schedule
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Custom Workout Templates */}
      <WorkoutTemplateSelector
        onSelectWorkout={onImportSchedule}
        currentWeek={currentWeek}
      />

      {/* Generated Meals */}

      {/* Generated Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Utensils className="h-5 w-5" />
            Generated Meal Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generatedMeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No generated meal plans found</p>
              <p className="text-sm">Create some meal plans in the Generate tab first</p>
            </div>
          ) : (
            <div className="space-y-4">
              {generatedMeals.map((mealPlan) => (
                <MealImportCard
                  key={mealPlan.id}
                  mealPlan={mealPlan}
                  isSelected={!!selectedItems.meals[mealPlan.id]}
                  onSelect={handleMealSelection}
                  onRemove={removeMealSelection}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}


// Meal Import Card Component  
function MealImportCard({
  mealPlan,
  isSelected,
  onSelect,
  onRemove
}: {
  mealPlan: GeneratedMeal
  isSelected: boolean
  onSelect: (mealId: string, days: { [key: string]: number[] }, times: { [key: string]: string }) => void
  onRemove: (mealId: string) => void
}) {
  const [selectedMeals, setSelectedMeals] = useState<{ [key: string]: number[] }>({
    breakfast: [1, 2, 3, 4, 5], // Weekdays
    lunch: [1, 2, 3, 4, 5],
    dinner: [1, 2, 3, 4, 5]
  })
  const [mealTimes, setMealTimes] = useState<{ [key: string]: string }>({
    breakfast: '08:00',
    lunch: '12:30',
    dinner: '18:30'
  })

  // Get available meal types from the meal plan
  const availableMealTypes = new Set<string>()
  Object.values(mealPlan.meals).forEach(dayMeals => {
    dayMeals.forEach((meal: MealData) => {
      if (meal.type) {
        availableMealTypes.add(meal.type.toLowerCase())
      }
    })
  })

  const handleSelect = () => {
    if (isSelected) {
      onRemove(mealPlan.id)
    } else {
      onSelect(mealPlan.id, selectedMeals, mealTimes)
    }
  }

  return (
    <div className={cn(
      "p-4 border rounded-lg transition-all",
      isSelected ? "border-green-500 bg-green-50" : "border-border"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Utensils className="h-4 w-4 text-green-600" />
            <h3 className="font-medium">{mealPlan.name}</h3>
            <Badge variant="outline" className="text-xs">
              {mealPlan.days} days
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {mealPlan.totalCalories} cal/day
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Generated {formatGeneratedDate(mealPlan.generatedAt)}
          </p>
          
          {isSelected && (
            <div className="space-y-4 mt-4 pt-3 border-t">
              {Array.from(availableMealTypes).map((mealType) => (
                <div key={mealType} className="space-y-2">
                  <div className="flex items-center gap-4">
                    <h4 className="font-medium text-sm capitalize">{mealType}</h4>
                    <Select 
                      value={mealTimes[mealType] || DEFAULT_SCHEDULE_TIMES.meal[mealType as keyof typeof DEFAULT_SCHEDULE_TIMES.meal]} 
                      onValueChange={(value) => setMealTimes(prev => ({ ...prev, [mealType]: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="07:00">7:00 AM</SelectItem>
                        <SelectItem value="08:00">8:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="12:30">12:30 PM</SelectItem>
                        <SelectItem value="13:00">1:00 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="18:00">6:00 PM</SelectItem>
                        <SelectItem value="18:30">6:30 PM</SelectItem>
                        <SelectItem value="19:00">7:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-4">
                    {DAYS.map((day) => (
                      <label key={day.value} className="flex items-center gap-1 text-xs">
                        <Checkbox
                          checked={selectedMeals[mealType]?.includes(day.value) || false}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMeals(prev => ({
                                ...prev,
                                [mealType]: [...(prev[mealType] || []), day.value].sort()
                              }))
                            } else {
                              setSelectedMeals(prev => ({
                                ...prev,
                                [mealType]: (prev[mealType] || []).filter(d => d !== day.value)
                              }))
                            }
                          }}
                        />
                        {day.label.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Button
          onClick={handleSelect}
          variant={isSelected ? "secondary" : "outline"}
          size="sm"
        >
          {isSelected ? "Remove" : "Select"}
        </Button>
      </div>
    </div>
  )
}