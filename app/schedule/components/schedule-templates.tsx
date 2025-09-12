"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Plus, Download, Save, Trash2, Clock, Calendar } from "lucide-react"
import { ScheduleItem, ScheduleTemplate, WeeklySchedule } from "../types/schedule"
import { useScheduleApi } from "../hooks/use-schedule-api"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"

interface ScheduleTemplatesProps {
  onApplyTemplate: (items: Omit<ScheduleItem, "id">[]) => void
  currentSchedule: WeeklySchedule
}

const DEFAULT_TEMPLATES: ScheduleTemplate[] = [
  {
    id: 'beginner-full-body',
    name: 'Beginner Full Body',
    description: 'A simple 3-day full-body workout routine perfect for beginners',
    isDefault: true,
    items: [
      {
        type: 'workout',
        title: 'Full Body Workout A',
        description: 'Upper body focus with compound movements',
        day: 1, // Monday
        startTime: '18:00',
        endTime: '19:00',
        category: 'Strength Training',
        difficulty: 'Beginner',
        duration: 60
      },
      {
        type: 'workout',
        title: 'Full Body Workout B',
        description: 'Lower body focus with functional movements',
        day: 3, // Wednesday
        startTime: '18:00',
        endTime: '19:00',
        category: 'Strength Training',
        difficulty: 'Beginner',
        duration: 60
      },
      {
        type: 'workout',
        title: 'Full Body Workout C',
        description: 'Total body conditioning and flexibility',
        day: 5, // Friday
        startTime: '18:00',
        endTime: '19:00',
        category: 'Strength Training',
        difficulty: 'Beginner',
        duration: 60
      }
    ]
  },
  {
    id: 'meal-prep-5-day',
    name: '5-Day Meal Prep',
    description: 'Structured meal times for Monday through Friday',
    isDefault: true,
    items: [
      // Breakfast - Weekdays
      ...Array.from({ length: 5 }, (_, i) => ({
        type: 'meal' as const,
        title: 'Healthy Breakfast',
        description: 'High-protein breakfast to start the day',
        day: i + 1, // Monday to Friday
        startTime: '08:00',
        endTime: '08:30',
        category: 'Breakfast',
        calories: 400,
        duration: 30
      })),
      // Lunch - Weekdays
      ...Array.from({ length: 5 }, (_, i) => ({
        type: 'meal' as const,
        title: 'Balanced Lunch',
        description: 'Nutritious midday meal',
        day: i + 1, // Monday to Friday
        startTime: '12:30',
        endTime: '13:00',
        category: 'Lunch',
        calories: 500,
        duration: 30
      })),
      // Dinner - Weekdays
      ...Array.from({ length: 5 }, (_, i) => ({
        type: 'meal' as const,
        title: 'Evening Dinner',
        description: 'Light yet satisfying dinner',
        day: i + 1, // Monday to Friday
        startTime: '18:30',
        endTime: '19:00',
        category: 'Dinner',
        calories: 600,
        duration: 30
      }))
    ]
  },
  {
    id: 'push-pull-legs',
    name: 'Push/Pull/Legs Split',
    description: 'Advanced 6-day training split focusing on movement patterns',
    isDefault: true,
    items: [
      {
        type: 'workout',
        title: 'Push Day (Chest, Shoulders, Triceps)',
        description: 'Pushing movements and tricep work',
        day: 1, // Monday
        startTime: '07:00',
        endTime: '08:30',
        category: 'Strength Training',
        difficulty: 'Advanced',
        duration: 90
      },
      {
        type: 'workout',
        title: 'Pull Day (Back, Biceps)',
        description: 'Pulling movements and bicep work',
        day: 2, // Tuesday
        startTime: '07:00',
        endTime: '08:30',
        category: 'Strength Training',
        difficulty: 'Advanced',
        duration: 90
      },
      {
        type: 'workout',
        title: 'Legs Day (Quads, Hamstrings, Glutes)',
        description: 'Complete lower body training',
        day: 3, // Wednesday
        startTime: '07:00',
        endTime: '08:30',
        category: 'Strength Training',
        difficulty: 'Advanced',
        duration: 90
      },
      {
        type: 'workout',
        title: 'Push Day (Repeat)',
        description: 'Second push session of the week',
        day: 4, // Thursday
        startTime: '07:00',
        endTime: '08:30',
        category: 'Strength Training',
        difficulty: 'Advanced',
        duration: 90
      },
      {
        type: 'workout',
        title: 'Pull Day (Repeat)',
        description: 'Second pull session of the week',
        day: 5, // Friday
        startTime: '07:00',
        endTime: '08:30',
        category: 'Strength Training',
        difficulty: 'Advanced',
        duration: 90
      },
      {
        type: 'workout',
        title: 'Legs Day (Repeat)',
        description: 'Second leg session of the week',
        day: 6, // Saturday
        startTime: '09:00',
        endTime: '10:30',
        category: 'Strength Training',
        difficulty: 'Advanced',
        duration: 90
      }
    ]
  },
  {
    id: 'cardio-hiit-week',
    name: 'Cardio & HIIT Week',
    description: 'High-intensity cardio schedule for fat loss and conditioning',
    isDefault: true,
    items: [
      {
        type: 'workout',
        title: 'HIIT Morning Session',
        description: '20-minute high-intensity interval training',
        day: 1, // Monday
        startTime: '06:30',
        endTime: '07:00',
        category: 'HIIT',
        difficulty: 'Intermediate',
        duration: 30
      },
      {
        type: 'workout',
        title: 'Steady State Cardio',
        description: '45-minute moderate intensity cardio',
        day: 2, // Tuesday
        startTime: '18:00',
        endTime: '18:45',
        category: 'Cardio',
        difficulty: 'Beginner',
        duration: 45
      },
      {
        type: 'workout',
        title: 'HIIT Evening Session',
        description: '25-minute interval training',
        day: 3, // Wednesday
        startTime: '19:00',
        endTime: '19:30',
        category: 'HIIT',
        difficulty: 'Intermediate',
        duration: 30
      },
      {
        type: 'workout',
        title: 'Active Recovery Walk',
        description: 'Light walking or yoga session',
        day: 4, // Thursday
        startTime: '17:00',
        endTime: '17:30',
        category: 'Walking/Running',
        difficulty: 'Beginner',
        duration: 30
      },
      {
        type: 'workout',
        title: 'HIIT Circuit Training',
        description: '30-minute full-body HIIT workout',
        day: 5, // Friday
        startTime: '06:30',
        endTime: '07:00',
        category: 'HIIT',
        difficulty: 'Advanced',
        duration: 30
      },
      {
        type: 'workout',
        title: 'Weekend Long Cardio',
        description: '60-minute steady cardio session',
        day: 6, // Saturday
        startTime: '09:00',
        endTime: '10:00',
        category: 'Cardio',
        difficulty: 'Intermediate',
        duration: 60
      }
    ]
  }
]

export function ScheduleTemplates({ onApplyTemplate, currentSchedule }: ScheduleTemplatesProps) {
  const [customTemplates, setCustomTemplates] = useState<ScheduleTemplate[]>([])
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const { toast } = useToast()
  const { 
    loadTemplates, 
    saveTemplate: saveTemplateAPI, 
    deleteTemplate: deleteTemplateAPI
  } = useScheduleApi()

  // Load templates from API on component mount
  const loadTemplatesFromAPI = useCallback(async () => {
    try {
      const templates = await loadTemplates()
      setCustomTemplates(templates.filter(t => !t.isDefault))
    } catch (error) {
      logger.error('Failed to load templates:', error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      })
    }
  }, [loadTemplates, toast])

  useEffect(() => {
    loadTemplatesFromAPI()
  }, [loadTemplatesFromAPI])

  const createTemplateFromCurrent = async () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive"
      })
      return
    }

    // Convert current schedule to template items
    const templateItems: Omit<ScheduleItem, "id">[] = []
    currentSchedule.days.forEach(day => {
      day.items.forEach(item => {
        templateItems.push({
          type: item.type,
          title: item.title,
          description: item.description,
          day: item.day,
          startTime: item.startTime,
          endTime: item.endTime,
          category: item.category,
          difficulty: item.difficulty,
          calories: item.calories,
          duration: item.duration
        })
      })
    })

    if (templateItems.length === 0) {
      toast({
        title: "Error",
        description: "Current schedule is empty. Add some items first.",
        variant: "destructive"
      })
      return
    }

    const newTemplate = {
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim() || undefined,
      items: templateItems,
      isDefault: false
    }

    try {
      const savedTemplate = await saveTemplateAPI(newTemplate)
      if (savedTemplate) {
        setCustomTemplates(prev => [...prev, savedTemplate])
        
        // Reset form
        setNewTemplateName('')
        setNewTemplateDescription('')
        setIsCreatingTemplate(false)

        toast({
          title: "Template Created",
          description: `"${savedTemplate.name}" has been saved as a template`,
        })
      }
    } catch (error) {
      logger.error('Failed to save template:', error)
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      })
    }
  }

  const deleteCustomTemplate = async (templateId: string) => {
    try {
      const success = await deleteTemplateAPI(templateId)
      if (success) {
        setCustomTemplates(prev => prev.filter(t => t.id !== templateId))
        toast({
          title: "Template Deleted",
          description: "Template has been removed",
        })
      }
    } catch (error) {
      logger.error('Failed to delete template:', error)
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      })
    }
  }

  const applyTemplate = (template: ScheduleTemplate) => {
    onApplyTemplate(template.items)
    toast({
      title: "Template Applied",
      description: `"${template.name}" has been added to your schedule`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Schedule Templates
          </CardTitle>
          <CardDescription>
            Apply pre-made templates or create your own from your current schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                Current schedule has {currentSchedule.days.reduce((total, day) => total + day.items.length, 0)} items
              </span>
            </div>
            <Button
              onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Template
            </Button>
          </div>

          {isCreatingTemplate && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., My Custom Routine"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description</Label>
                <Textarea
                  id="templateDescription"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Describe your template..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createTemplateFromCurrent} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
                <Button
                  onClick={() => setIsCreatingTemplate(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates */}
      <Tabs defaultValue="default" className="space-y-4">
        <TabsList>
          <TabsTrigger value="default">Default Templates</TabsTrigger>
          <TabsTrigger value="custom">
            My Templates ({customTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="default" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onApply={applyTemplate}
                onDelete={null}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          {customTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No Custom Templates</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create templates from your current schedule to reuse them later
                </p>
                <Button
                  onClick={() => setIsCreatingTemplate(true)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onApply={applyTemplate}
                  onDelete={deleteCustomTemplate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface TemplateCardProps {
  template: ScheduleTemplate
  onApply: (template: ScheduleTemplate) => void
  onDelete: ((templateId: string) => void) | null
}

function TemplateCard({ template, onApply, onDelete }: TemplateCardProps) {
  const workoutCount = template.items.filter(item => item.type === 'workout').length
  const mealCount = template.items.filter(item => item.type === 'meal').length
  const totalDuration = template.items.reduce((sum, item) => sum + (item.duration || 0), 0)
  
  const stats = { workoutCount, mealCount, totalDuration }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {template.description && (
              <CardDescription className="mt-1">
                {template.description}
              </CardDescription>
            )}
          </div>
          {template.isDefault && (
            <Badge variant="secondary" className="text-xs">
              Default
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600">{stats.workoutCount}</div>
              <div className="text-xs text-muted-foreground">Workouts</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">{stats.mealCount}</div>
              <div className="text-xs text-muted-foreground">Meals</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">{Math.round(stats.totalDuration / 60)}h</div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Preview:</h4>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {template.items.slice(0, 3).map((item, index) => (
                <div key={index} className="text-xs p-2 bg-muted/50 rounded flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">{item.title}</span>
                  <Badge variant="outline" className="text-xs py-0 px-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][item.day]}
                  </Badge>
                </div>
              ))}
              {template.items.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{template.items.length - 3} more items
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => onApply(template)}
              className="flex-1"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Apply Template
            </Button>
            {onDelete && (
              <Button
                onClick={() => onDelete(template.id)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}