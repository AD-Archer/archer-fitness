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

type GeneratorExercise = {
  name: string
  sets: number
  reps: string
  rest: string
  instructions: string
  targetMuscles: string[]
}

const BASE_WARMUP = [
  "5 minutes light cardio (marching, bike, or jump rope)",
  "Dynamic mobility (arm circles, hip openers, leg swings)",
  "Activation set with light resistance"
]

const BASE_COOLDOWN = [
  "Slow walk and breathing reset (3 minutes)",
  "Static stretches for tight areas (hold 30 seconds each)",
  "Foam roll or gentle mobility as needed"
]

const addMinutesToTime = (startTime: string, durationMinutes: number) => {
  const [hour, minute] = startTime.split(":").map(Number)
  const total = hour * 60 + minute + durationMinutes
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const endHour = Math.floor(wrapped / 60)
  const endMinute = wrapped % 60
  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`
}

const createGeneratorData = (config: {
  name: string
  duration: number
  difficulty: string
  exercises: GeneratorExercise[]
  warmup?: string[]
  cooldown?: string[]
}) => ({
  name: config.name,
  duration: config.duration,
  difficulty: config.difficulty,
  exercises: config.exercises,
  warmup: config.warmup ?? BASE_WARMUP,
  cooldown: config.cooldown ?? BASE_COOLDOWN
})

const createWorkoutTemplateItem = (config: {
  day: number
  startTime: string
  duration: number
  category: string
  difficulty: string
  title: string
  description: string
  exercises: GeneratorExercise[]
  warmup?: string[]
  cooldown?: string[]
}): Omit<ScheduleItem, "id"> => ({
  type: 'workout',
  title: config.title,
  description: config.description,
  day: config.day,
  startTime: config.startTime,
  endTime: addMinutesToTime(config.startTime, config.duration),
  category: config.category,
  difficulty: config.difficulty,
  duration: config.duration,
  isFromGenerator: true,
  isRecurring: true,
  repeatPattern: 'weekly',
  repeatInterval: 1,
  repeatDaysOfWeek: [config.day],
  repeatEndsOn: null,
  generatorData: createGeneratorData({
    name: config.title,
    duration: config.duration,
    difficulty: config.difficulty,
    exercises: config.exercises,
    warmup: config.warmup,
    cooldown: config.cooldown
  })
})

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
        duration: 60,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [1],
        repeatEndsOn: null
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
        duration: 60,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [3],
        repeatEndsOn: null
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
        duration: 60,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [5],
        repeatEndsOn: null
      }
    ]
  },
  {
    id: 'arms-legs-cardio',
    name: 'Arms, Legs & Cardio Split',
    description: 'Arms on Tuesday & Thursday, lower-body power midweek, and cardio to bookend the week.',
    isDefault: true,
    items: [
      createWorkoutTemplateItem({
        title: 'Sunday Endurance Cardio',
        description: 'Steady-state conditioning to build your aerobic base.',
        day: 0,
        startTime: '09:00',
        duration: 45,
        category: 'Cardio',
        difficulty: 'Intermediate',
        exercises: [
          {
            name: 'Interval Bike Ride',
            sets: 1,
            reps: '45 min',
            rest: '—',
            instructions: 'Alternate 5 minutes easy with 5 minutes moderate while keeping cadence above 80 RPM.',
            targetMuscles: ['Heart', 'Legs', 'Lungs']
          },
          {
            name: 'Bodyweight Step-Ups',
            sets: 3,
            reps: '12/leg',
            rest: '45s',
            instructions: 'Drive through the heel, keep torso tall, and control the lowering phase.',
            targetMuscles: ['Glutes', 'Quads', 'Core']
          },
          {
            name: 'Core Stability Plank',
            sets: 3,
            reps: '45s hold',
            rest: '30s',
            instructions: 'Maintain neutral spine and keep ribs tucked while breathing through the belly.',
            targetMuscles: ['Core', 'Shoulders']
          }
        ]
      }),
      createWorkoutTemplateItem({
        title: 'Tuesday Arms & Shoulders',
        description: 'Supersets and isolation work to build definition through the upper body.',
        day: 2,
        startTime: '18:00',
        duration: 60,
        category: 'Strength Training',
        difficulty: 'Intermediate',
        exercises: [
          {
            name: 'Dumbbell Shoulder Press',
            sets: 4,
            reps: '8-10',
            rest: '75s',
            instructions: 'Press with a controlled tempo and avoid locking elbows at the top.',
            targetMuscles: ['Shoulders', 'Triceps']
          },
          {
            name: 'Alternating Hammer Curl',
            sets: 3,
            reps: '12/side',
            rest: '45s',
            instructions: 'Keep elbows close to your ribs and squeeze at the peak of each rep.',
            targetMuscles: ['Biceps', 'Forearms']
          },
          {
            name: 'Cable Tricep Pushdown',
            sets: 3,
            reps: '12-15',
            rest: '45s',
            instructions: 'Pin elbows to your sides and focus on full extension with neutral wrists.',
            targetMuscles: ['Triceps']
          }
        ]
      }),
      createWorkoutTemplateItem({
        title: 'Wednesday Leg Power',
        description: 'Compound work for strength plus posterior chain accessories.',
        day: 3,
        startTime: '18:00',
        duration: 65,
        category: 'Strength Training',
        difficulty: 'Intermediate',
        exercises: [
          {
            name: 'Barbell Back Squat',
            sets: 4,
            reps: '6-8',
            rest: '120s',
            instructions: 'Brace your core, drive knees over toes, and stand tall between reps.',
            targetMuscles: ['Quads', 'Glutes', 'Core']
          },
          {
            name: 'Romanian Deadlift',
            sets: 3,
            reps: '10-12',
            rest: '90s',
            instructions: 'Hinge from the hips, keep spine neutral, and feel the stretch through hamstrings.',
            targetMuscles: ['Hamstrings', 'Glutes', 'Lower Back']
          },
          {
            name: 'Walking Lunges',
            sets: 2,
            reps: '16 steps',
            rest: '60s',
            instructions: 'Stay tall, step softly, and drive through your front heel on each stride.',
            targetMuscles: ['Glutes', 'Quads', 'Core']
          }
        ]
      }),
      createWorkoutTemplateItem({
        title: 'Thursday Arms Finisher',
        description: 'Volume-focused upper-body session to round out the week.',
        day: 4,
        startTime: '18:00',
        duration: 55,
        category: 'Strength Training',
        difficulty: 'Intermediate',
        exercises: [
          {
            name: 'Incline Dumbbell Press',
            sets: 3,
            reps: '10-12',
            rest: '75s',
            instructions: 'Control the lowering phase and keep shoulder blades set on the bench.',
            targetMuscles: ['Chest', 'Shoulders', 'Triceps']
          },
          {
            name: 'EZ-Bar Curl',
            sets: 3,
            reps: '10-12',
            rest: '60s',
            instructions: 'Use a shoulder-width grip, keep elbows planted, and squeeze at the top.',
            targetMuscles: ['Biceps']
          },
          {
            name: 'Cable Face Pull',
            sets: 3,
            reps: '15',
            rest: '45s',
            instructions: 'Pull the rope toward your forehead while rotating thumbs back to hit rear delts.',
            targetMuscles: ['Rear Delts', 'Upper Back']
          }
        ]
      }),
      createWorkoutTemplateItem({
        title: 'Saturday HIIT Conditioning',
        description: 'Explosive intervals to sharpen power and stamina.',
        day: 6,
        startTime: '09:30',
        duration: 40,
        category: 'HIIT',
        difficulty: 'Intermediate',
        exercises: [
          {
            name: 'Rowing Machine Sprints',
            sets: 8,
            reps: '30s on / 30s off',
            rest: '30s',
            instructions: 'Drive through legs explosively on the work interval and recover with easy strokes.',
            targetMuscles: ['Back', 'Legs', 'Cardio']
          },
          {
            name: 'Battle Rope Waves',
            sets: 3,
            reps: '40s',
            rest: '30s',
            instructions: 'Maintain an athletic stance and generate powerful alternating waves.',
            targetMuscles: ['Shoulders', 'Core', 'Cardio']
          },
          {
            name: 'Box Jump to Step Down',
            sets: 3,
            reps: '8',
            rest: '45s',
            instructions: 'Explode onto the box, land softly, then step down under control to reset.',
            targetMuscles: ['Glutes', 'Quads', 'Calves']
          }
        ],
        warmup: [
          '5 min easy row or bike',
          'Dynamic leg swings and arm circles',
          'Two rounds of 30s jump rope'
        ],
        cooldown: [
          'Slow walk for 3 minutes',
          'Calf & quad stretch (45s each side)',
          'Diaphragmatic breathing (2 minutes)'
        ]
      })
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
        duration: 90,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [1],
        repeatEndsOn: null
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
        duration: 90,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [2],
        repeatEndsOn: null
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
        duration: 90,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [3],
        repeatEndsOn: null
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
        duration: 90,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [4],
        repeatEndsOn: null
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
        duration: 90,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [5],
        repeatEndsOn: null
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
        duration: 90,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [6],
        repeatEndsOn: null
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
        duration: 30,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [1],
        repeatEndsOn: null
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
        duration: 45,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [2],
        repeatEndsOn: null
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
        duration: 30,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [3],
        repeatEndsOn: null
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
        duration: 30,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [4],
        repeatEndsOn: null
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
        duration: 30,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [5],
        repeatEndsOn: null
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
        duration: 60,
        isRecurring: true,
        repeatPattern: 'weekly',
        repeatInterval: 1,
        repeatDaysOfWeek: [6],
        repeatEndsOn: null
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
  const totalDuration = template.items.reduce((sum, item) => sum + (item.duration || 0), 0)

  const formatTotalDuration = (minutes: number) => {
    if (!minutes) return "0m"
    const hours = Math.floor(minutes / 60)
    const remaining = minutes % 60
    if (hours && remaining) {
      return `${hours}h ${remaining}m`
    }
    if (hours) {
      return `${hours}h`
    }
    return `${remaining}m`
  }

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
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600">{workoutCount}</div>
              <div className="text-xs text-muted-foreground">Workouts</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">{formatTotalDuration(totalDuration)}</div>
              <div className="text-xs text-muted-foreground">Scheduled Time</div>
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