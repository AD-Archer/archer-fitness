"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dumbbell, Zap, Plus, Search } from "lucide-react"
import { ScheduleItem } from "../types/schedule"
import { useToast } from "@/hooks/use-toast"

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


export function WorkoutTemplateSelector({ onSelectWorkout, currentWeek }: WorkoutTemplateSelectorProps) {
  const [userTemplates, setUserTemplates] = useState<WorkoutTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplates, setSelectedTemplates] = useState<{
    [templateId: string]: { 
      id: string
      days: number[]
      time: string
      week: 'current' | 'next'
    }
  }>({})
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const loadWorkoutTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/workout-tracker/workout-templates')
      if (!response.ok) {
        throw new Error('Failed to fetch workout templates')
      }
      const data = await response.json()
      setUserTemplates(data.userTemplates || [])
    } catch (error) {
      console.error('Failed to load workout templates:', error)
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

  const filteredUserTemplates = userTemplates.filter(template => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    // Search in name, description, category, difficulty
    if (template.name.toLowerCase().includes(searchLower)) return true
    if (template.description?.toLowerCase().includes(searchLower)) return true
    if (template.category?.toLowerCase().includes(searchLower)) return true
    if (template.difficulty?.toLowerCase().includes(searchLower)) return true
    
    // Search in exercise names and muscles
    return template.exercises.some(ex => {
      if (ex.exercise.name.toLowerCase().includes(searchLower)) return true
      return ex.exercise.muscles.some(m => m.muscle.name.toLowerCase().includes(searchLower))
    })
  })

  const handleTemplateSelection = (templateId: string, days: number[], time: string, week: 'current' | 'next') => {
    setSelectedTemplates(prev => ({
      ...prev,
      [templateId]: { id: templateId, days, time, week }
    }))
  }

  const removeTemplateSelection = (templateId: string) => {
    setSelectedTemplates(prev => {
      const newSelected = { ...prev }
      delete newSelected[templateId]
      return newSelected
    })
  }

  const generateScheduleItems = (): Omit<ScheduleItem, "id">[] => {
    const items: Omit<ScheduleItem, "id">[] = []

    Object.values(selectedTemplates).forEach(selection => {
      const template = userTemplates.find(t => t.id === selection.id)
      if (!template) return

      selection.days.forEach(day => {
        const adjustedDay = selection.week === 'next' ? (day + 7) % 7 : day
        const [hours, minutes] = selection.time.split(':')
        const startTime = selection.time
        const endTime = `${String(parseInt(hours) + Math.floor((parseInt(minutes) + template.estimatedDuration) / 60)).padStart(2, '0')}:${String((parseInt(minutes) + template.estimatedDuration) % 60).padStart(2, '0')}`

        // Create description with exercise count and muscles
        const exerciseCount = template.exercises.length
        const primaryMuscles = template.exercises
          .flatMap(ex => ex.exercise.muscles.filter(m => m.isPrimary).map(m => m.muscle.name))
          .filter((muscle, index, arr) => arr.indexOf(muscle) === index)
          .slice(0, 3)
        
        const muscleText = primaryMuscles.length > 0 ? ` • ${primaryMuscles.join(', ')}` : ''
        const description = `${exerciseCount} exercises${muscleText} • ${template.difficulty || 'Unknown difficulty'}`

        items.push({
          type: 'workout',
          title: template.name,
          description,
          day: adjustedDay,
          startTime,
          endTime,
          category: template.category || 'Custom Workout',
          difficulty: template.difficulty || undefined,
          duration: template.estimatedDuration,
          isFromGenerator: template.isAiGenerated,
          generatorData: {
            name: template.name,
            duration: template.estimatedDuration,
            difficulty: template.difficulty || 'Unknown',
            exercises: template.exercises.map(ex => ({
              name: ex.exercise.name,
              sets: ex.targetSets,
              reps: ex.targetReps,
              rest: `${ex.restTime}s`,
              instructions: ex.exercise.description || '',
              targetMuscles: ex.exercise.muscles.map(m => m.muscle.name)
            })),
            warmup: [],
            cooldown: []
          }
        })
      })
    })

    return items
  }

  const handleImport = () => {
    const items = generateScheduleItems()
    if (items.length === 0) {
      toast({
        title: "No Workouts Selected",
        description: "Please select at least one workout to add to your schedule",
        variant: "destructive"
      })
      return
    }

    onSelectWorkout(items)
    
    // Clear selections
    setSelectedTemplates({})
    
    toast({
      title: "Workouts Added",
      description: `Added ${items.length} workout sessions to your schedule`,
    })
  }



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

  const totalSelectedTemplates = Object.keys(selectedTemplates).length

  return (
    <div className="space-y-6">
      

      {/* Import Button */}
      {totalSelectedTemplates > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">
                {totalSelectedTemplates} workout{totalSelectedTemplates !== 1 ? 's' : ''} selected
              </p>
              <p className="text-sm text-blue-700">
                Ready to add to your schedule
              </p>
            </div>
            <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add to Schedule
            </Button>
          </div>
        </div>
      )}

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="h-5 w-5" />
            Workout Templates ({filteredUserTemplates.length})
          </CardTitle>
        </CardHeader>
{/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search workout templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

        <CardContent>
          {filteredUserTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>
                {userTemplates.length === 0 
                  ? "You haven't created any workout templates yet"
                  : searchTerm 
                    ? `No templates match "${searchTerm}"`
                    : "No templates found"
                }
              </p>
              <p className="text-sm mt-1">
                {userTemplates.length === 0 
                  ? "Create workouts in the Generate tab or Workout Tracker to see them here"
                  : searchTerm
                    ? "Try adjusting your search term"
                    : "Try a different search"
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredUserTemplates.map(template => (
                <WorkoutTemplateCard
                  key={template.id}
                  template={template}
                  isSelected={!!selectedTemplates[template.id]}
                  onSelect={handleTemplateSelection}
                  onRemove={removeTemplateSelection}
                  currentWeek={currentWeek}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Template Card Component
function WorkoutTemplateCard({
  template,
  isSelected,
  onSelect,
  onRemove,
  currentWeek
}: {
  template: WorkoutTemplate
  isSelected: boolean
  onSelect: (templateId: string, days: number[], time: string, week: 'current' | 'next') => void
  onRemove: (templateId: string) => void
  currentWeek: Date
}) {
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]) // Default: Mon, Wed, Fri
  const [selectedTime, setSelectedTime] = useState('18:00')
  const [selectedWeek, setSelectedWeek] = useState<'current' | 'next'>('current')

  const handleSelect = () => {
    if (isSelected) {
      onRemove(template.id)
    } else {
      onSelect(template.id, selectedDays, selectedTime, selectedWeek)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getCurrentWeekRange = () => {
    const end = new Date(currentWeek)
    end.setDate(currentWeek.getDate() + 6)
    return `${formatDate(currentWeek)} - ${formatDate(end)}`
  }

  const getNextWeekRange = () => {
    const start = new Date(currentWeek)
    start.setDate(currentWeek.getDate() + 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  // Get primary muscles for display
  const primaryMuscles = template.exercises
    .flatMap(ex => ex.exercise.muscles.filter(m => m.isPrimary).map(m => m.muscle.name))
    .filter((muscle, index, arr) => arr.indexOf(muscle) === index)
    .slice(0, 3)

  return (
    <Card className={`transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-border'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">{template.name}</h3>
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
            
            {isSelected && (
              <div className="space-y-4 mt-4 p-4 bg-white rounded-lg border">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Week</label>
                  <Select value={selectedWeek} onValueChange={(value: 'current' | 'next') => setSelectedWeek(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">This Week ({getCurrentWeekRange()})</SelectItem>
                      <SelectItem value="next">Next Week ({getNextWeekRange()})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Select Days</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS.map(day => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${template.id}-day-${day.value}`}
                          checked={selectedDays.includes(day.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDays(prev => [...prev, day.value].sort())
                            } else {
                              setSelectedDays(prev => prev.filter(d => d !== day.value))
                            }
                          }}
                        />
                        <label 
                          htmlFor={`${template.id}-day-${day.value}`}
                          className="text-xs"
                        >
                          {day.label.slice(0, 3)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Time</label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="07:00">7:00 AM (Morning)</SelectItem>
                      <SelectItem value="12:00">12:00 PM (Afternoon)</SelectItem>
                      <SelectItem value="18:00">6:00 PM (Evening)</SelectItem>
                      <SelectItem value="20:00">8:00 PM (Night)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
      </CardContent>
    </Card>
  )
}