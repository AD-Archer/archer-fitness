"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Users, Download, Save, Trash2, Clock, Calendar, RefreshCw, Wand2, Loader2, Sparkles } from "lucide-react"
import { ScheduleItem, ScheduleTemplate, WeeklySchedule, TemplateGenerationRequest } from "../types/schedule"
import { useScheduleApi } from "../hooks/use-schedule-api"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import { formatTimeForDisplay, type TimeFormatPreference } from "@/lib/time-utils"

interface ScheduleTemplatesProps {
  onApplyTemplate: (items: Omit<ScheduleItem, "id">[]) => void
  currentSchedule: WeeklySchedule
  timeFormat?: TimeFormatPreference
  availableEquipment?: string[]
}

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
]

const START_TIME_OPTIONS = ["06:00", "07:00", "12:00", "18:00", "20:00"]

const DIFFICULTY_OPTIONS = ["Mixed", "Beginner", "Intermediate", "Advanced"]

const DEFAULT_DAY_SEQUENCE = [1, 3, 5, 0, 2, 4, 6]

const clampNumber = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const ensurePreferredDays = (current: number[], target: number) => {
  const sanitized = Array.from(new Set(current.filter((day) => day >= 0 && day <= 6)))
  if (sanitized.length >= target) {
    return sanitized.slice(0, target)
  }
  const fallback = DEFAULT_DAY_SEQUENCE.filter((day) => !sanitized.includes(day))
  return [...sanitized, ...fallback].slice(0, target)
}

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

const sanitizeTemplateItemsForSave = (items: Omit<ScheduleItem, "id">[]) =>
  items.map((item) => ({
    type: item.type,
    title: item.title,
    description: item.description,
    day: item.day,
    startTime: item.startTime,
    endTime: item.endTime,
    category: item.category,
    calories: item.calories,
    difficulty: item.difficulty,
    duration: item.duration
  }))

const summarizeTemplateTags = (template: ScheduleTemplate) => {
  const tags = new Set<string>()
  template.items.forEach((item) => {
    if (item.category) tags.add(item.category)
    if (item.difficulty) tags.add(item.difficulty)
  })
  template.metadata?.tags?.forEach((tag) => tags.add(tag))
  return Array.from(tags)
}

const sourceBadgeLabel = {
  default: "Default",
  custom: "My Template",
  recommended: "Recommended",
  generated: "Generated"
} as const

export function ScheduleTemplates({
  onApplyTemplate,
  currentSchedule,
  timeFormat = "24h",
  availableEquipment = []
}: ScheduleTemplatesProps) {
  const [customTemplates, setCustomTemplates] = useState<ScheduleTemplate[]>([])
  const [recommendedTemplates, setRecommendedTemplates] = useState<ScheduleTemplate[]>([])
  const [generatedTemplates, setGeneratedTemplates] = useState<ScheduleTemplate[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([])
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRefreshingRecommended, setIsRefreshingRecommended] = useState(false)
  const [savingTemplateId, setSavingTemplateId] = useState<string | null>(null)
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get subtab from URL or default to 'generate'
  const activeSubTab = searchParams.get('subtab') || 'generate'

  // Handle subtab changes and update URL
  const handleSubTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('subtab', value)
    router.push(`?${params.toString()}`, { scroll: false })
  }
  const {
    loadTemplates,
    saveTemplate: saveTemplateAPI,
    deleteTemplate: deleteTemplateAPI,
    loadRecommendedTemplates,
    generateTemplates
  } = useScheduleApi()

  const activeScheduleDays = useMemo(() => {
    const daysWithItems = currentSchedule.days
      .filter((day) => day.items.length > 0)
      .map((day) => day.dayOfWeek)
    return daysWithItems.length > 0 ? daysWithItems : DEFAULT_DAY_SEQUENCE.slice(0, 3)
  }, [currentSchedule])

  const initialDaysPerWeek = clampNumber(activeScheduleDays.length || 3, 1, 6)

  const [generatorForm, setGeneratorForm] = useState(() => ({
    daysPerWeek: initialDaysPerWeek,
    preferredDays: ensurePreferredDays(activeScheduleDays, initialDaysPerWeek),
    difficulty: "Mixed",
    focus: [] as string[],
    preferredStartTime: "18:00",
    repeatIntervalWeeks: 1,
    allowBackToBack: false,
    includeRecovery: false,
    count: 2
  }))

  useEffect(() => {
    setGeneratorForm((prev) => {
      const preferredDays = ensurePreferredDays(activeScheduleDays, prev.daysPerWeek)
      return {
        ...prev,
        preferredDays
      }
    })
  }, [activeScheduleDays])

  const loadTemplatesFromAPI = useCallback(async () => {
    try {
      const templates = await loadTemplates()
      const customOnly = templates.filter((template) => !template.isDefault && template.metadata?.source !== "recommended")
      setCustomTemplates(customOnly)
    } catch (error) {
      logger.error("Failed to load templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      })
    }
  }, [loadTemplates, toast])

  const loadRecommended = useCallback(async () => {
    try {
      setIsRefreshingRecommended(true)
      const templates = await loadRecommendedTemplates(4)
      setRecommendedTemplates(templates)
      const derivedCategories = new Set<string>()
      const derivedDifficulties = new Set<string>()
      templates.forEach((template) => {
        template.items.forEach((item) => {
          if (item.category) derivedCategories.add(item.category)
          if (item.difficulty) derivedDifficulties.add(item.difficulty)
        })
        template.metadata?.tags?.forEach((tag) => derivedCategories.add(tag))
      })
      if (derivedCategories.size > 0) {
        setAvailableCategories(Array.from(derivedCategories))
      }
      if (derivedDifficulties.size > 0) {
        setAvailableDifficulties(Array.from(derivedDifficulties))
      }
    } catch (error) {
      logger.error("Failed to load recommended templates:", error)
      toast({
        title: "Error",
        description: "Unable to load recommended templates",
        variant: "destructive"
      })
    } finally {
      setIsRefreshingRecommended(false)
    }
  }, [loadRecommendedTemplates, toast])

  useEffect(() => {
    loadTemplatesFromAPI()
  }, [loadTemplatesFromAPI])

  useEffect(() => {
    loadRecommended()
  }, [loadRecommended])

  const handleGeneratorFieldChange = (field: keyof typeof generatorForm, value: unknown) => {
    setGeneratorForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDaysPerWeekChange = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    const clamped = clampNumber(parsed, 1, 6)
    setGeneratorForm((prev) => ({
      ...prev,
      daysPerWeek: clamped,
      preferredDays: ensurePreferredDays(prev.preferredDays, clamped)
    }))
  }

  const handleToggleDay = (day: number, checked: boolean) => {
    setGeneratorForm((prev) => {
      const current = new Set(prev.preferredDays)
      if (checked) {
        current.add(day)
      } else {
        current.delete(day)
      }
      // Allow any number of days to be selected
      const next = Array.from(current).sort((a, b) => a - b)
      return {
        ...prev,
        preferredDays: next
      }
    })
  }

  const handleFocusToggle = (category: string, checked: boolean) => {
    setGeneratorForm((prev) => {
      const set = new Set(prev.focus)
      if (checked) {
        set.add(category)
      } else {
        set.delete(category)
      }
      return {
        ...prev,
        focus: Array.from(set)
      }
    })
  }

  const handleGenerateTemplates = async () => {
    try {
      setIsGenerating(true)
      const payload: TemplateGenerationRequest = {
        daysPerWeek: generatorForm.daysPerWeek,
        preferredDays: generatorForm.preferredDays, // Use selected days directly without limiting
        difficulty: generatorForm.difficulty === "Mixed" ? null : generatorForm.difficulty,
        focus: generatorForm.focus,
        preferredStartTime: generatorForm.preferredStartTime,
        repeatIntervalWeeks: generatorForm.repeatIntervalWeeks,
        allowBackToBack: generatorForm.allowBackToBack,
        includeRecovery: generatorForm.includeRecovery,
        count: generatorForm.count
      }

      logger.info('Generating templates with payload:', payload)

      const result = await generateTemplates(payload)
      if (result && result.templates.length > 0) {
        setGeneratedTemplates(result.templates)
        if (result.availableCategories.length > 0) {
          setAvailableCategories(result.availableCategories)
        }
        if (result.availableDifficulties.length > 0) {
          setAvailableDifficulties(result.availableDifficulties)
        }
        toast({
          title: "Templates generated",
          description: `Created ${result.templates.length} plan${result.templates.length === 1 ? "" : "s"} tailored to your criteria`
        })
      } else {
        setGeneratedTemplates([])
        toast({
          title: "No templates generated",
          description: "Try relaxing your filters or adding more workout templates first.",
          variant: "destructive"
        })
      }
    } catch (error) {
      logger.error("Failed to generate templates:", error)
      toast({
        title: "Generation failed",
        description: "We couldn't create a plan using those criteria.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const createTemplateFromCurrent = async () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Name required",
        description: "Give your template a name before saving.",
        variant: "destructive"
      })
      return
    }

    const templateItems: Omit<ScheduleItem, "id">[] = []
    currentSchedule.days.forEach((day) => {
      day.items.forEach((item) => {
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
        title: "Nothing to save",
        description: "Add a few workouts to this week first.",
        variant: "destructive"
      })
      return
    }

    try {
      setSavingTemplateId("__current__")
      const payload = {
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || undefined,
        items: sanitizeTemplateItemsForSave(templateItems)
      }
      const savedTemplate = await saveTemplateAPI(payload)
      if (savedTemplate) {
        setCustomTemplates((prev) => [...prev, savedTemplate])
        setNewTemplateName("")
        setNewTemplateDescription("")
        setIsCreatingTemplate(false)
        toast({
          title: "Template saved",
          description: `"${savedTemplate.name}" is ready to reuse.`
        })
      }
    } catch (error) {
      logger.error("Failed to save template:", error)
      toast({
        title: "Save failed",
        description: "We couldn't save this template right now.",
        variant: "destructive"
      })
    } finally {
      setSavingTemplateId(null)
    }
  }

  const deleteCustomTemplate = async (templateId: string) => {
    try {
      setDeletingTemplateId(templateId)
      const success = await deleteTemplateAPI(templateId)
      if (success) {
        setCustomTemplates((prev) => prev.filter((template) => template.id !== templateId))
        toast({
          title: "Template removed",
          description: "It's been deleted from your library."
        })
      }
    } catch (error) {
      logger.error("Failed to delete template:", error)
      toast({
        title: "Delete failed",
        description: "We couldn't remove that template.",
        variant: "destructive"
      })
    } finally {
      setDeletingTemplateId(null)
    }
  }

  const applyTemplate = (template: ScheduleTemplate) => {
    onApplyTemplate(template.items)
    toast({
      title: "Template applied",
      description: `"${template.name}" is on your calendar.`
    })
  }

  const saveGeneratedAsTemplate = async (template: ScheduleTemplate) => {
    try {
      setSavingTemplateId(template.id)
      const payload = {
        name: template.name,
        description: template.description,
        items: sanitizeTemplateItemsForSave(template.items)
      }
      const saved = await saveTemplateAPI(payload)
      if (saved) {
        setCustomTemplates((prev) => [...prev, saved])
        toast({
          title: "Template saved",
          description: `"${saved.name}" is now in your library.`
        })
      }
    } catch (error) {
      logger.error("Failed to persist generated template:", error)
      toast({
        title: "Save failed",
        description: "That generated plan couldn't be saved.",
        variant: "destructive"
      })
    } finally {
      setSavingTemplateId(null)
    }
  }

  const generatorFocusOptions = availableCategories.length > 0 ? availableCategories : [
    "Strength Training",
    "Cardio",
    "HIIT",
    "Mobility",
    "Endurance"
  ]

  const generatorDifficultyOptions = availableDifficulties.length > 0
    ? ["Mixed", ...availableDifficulties.filter((difficulty) => difficulty && difficulty !== "Mixed")]
    : DIFFICULTY_OPTIONS

  const generatorDayBadges = generatorForm.preferredDays
    .slice(0, generatorForm.daysPerWeek)
    .map((day) => DAY_OPTIONS.find((option) => option.value === day)?.label ?? "")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Schedule templates
          </CardTitle>
          <CardDescription>
            Generate adaptive plans, grab quick recommendations, or save your favorite weekly layout for later.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {currentSchedule.days.reduce((total, day) => total + day.items.length, 0)} scheduled items this week
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Generator target days: {generatorForm.daysPerWeek} ({generatorDayBadges.join(", ")})
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="space-y-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="recommended" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Recommended
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            My templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-blue-600" />
                Build a new schedule
              </CardTitle>
              <CardDescription>
                Choose the cadence and focus areas you want. We'll mix in workouts from your library and the global catalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableEquipment.length > 0 && (
                <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-3 text-xs text-muted-foreground">
                  We'll prioritize workouts that match your equipment: <span className="font-medium text-foreground">{availableEquipment.join(", ")}</span>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Workouts per week</Label>
                  <Select value={String(generatorForm.daysPerWeek)} onValueChange={handleDaysPerWeekChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value} day{value === 1 ? "" : "s"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preferred start time</Label>
                  <Select value={generatorForm.preferredStartTime} onValueChange={(value) => handleGeneratorFieldChange("preferredStartTime", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={formatTimeForDisplay(generatorForm.preferredStartTime, timeFormat)} />
                    </SelectTrigger>
                    <SelectContent>
                      {START_TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTimeForDisplay(time, timeFormat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={generatorForm.difficulty} onValueChange={(value) => handleGeneratorFieldChange("difficulty", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generatorDifficultyOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Repeat cadence</Label>
                  <Select value={String(generatorForm.repeatIntervalWeeks)} onValueChange={(value) => handleGeneratorFieldChange("repeatIntervalWeeks", Number.parseInt(value, 10))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Every week</SelectItem>
                      <SelectItem value="2">Every other week</SelectItem>
                      <SelectItem value="3">Every 3 weeks</SelectItem>
                      <SelectItem value="4">Every 4 weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Training days</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DAY_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2 rounded border p-2">
                        <Checkbox
                          id={`generator-day-${option.value}`}
                          checked={generatorForm.preferredDays.includes(option.value)}
                          onCheckedChange={(checked) => handleToggleDay(option.value, Boolean(checked))}
                        />
                        <Label htmlFor={`generator-day-${option.value}`} className="text-sm font-medium">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select the days you want to train. You can choose any number of days regardless of the "workouts per week" setting.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Focus areas</Label>
                  <div className="flex flex-wrap gap-2">
                    {generatorFocusOptions.map((category) => {
                      const checked = generatorForm.focus.includes(category)
                      return (
                        <Button
                          key={category}
                          type="button"
                          size="sm"
                          variant={checked ? "secondary" : "outline"}
                          onClick={() => handleFocusToggle(category, !checked)}
                        >
                          {category}
                        </Button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave blank for a balanced mix. We use your selections to bias the generator.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <Label htmlFor="allowBackToBack" className="text-sm font-medium">Allow back-to-back repeats</Label>
                    <p className="text-xs text-muted-foreground">
                      Let the generator reuse the same workout on consecutive days if variety is limited.
                    </p>
                  </div>
                  <Switch
                    id="allowBackToBack"
                  
                    checked={generatorForm.allowBackToBack}
                    onCheckedChange={(checked) => handleGeneratorFieldChange("allowBackToBack", checked)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <Label htmlFor="includeRecovery" className="text-sm font-medium">Include recovery days</Label>
                    <p className="text-xs text-muted-foreground">
                      Adds active recovery or mobility sessions when we have spare days.
                    </p>
                  </div>
                  <Switch
                    id="includeRecovery"
                    checked={generatorForm.includeRecovery}
                    onCheckedChange={(checked) => handleGeneratorFieldChange("includeRecovery", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Plans to generate</Label>
                  <Select value={String(generatorForm.count)} onValueChange={(value) => handleGeneratorFieldChange("count", Number.parseInt(value, 10))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((count) => (
                        <SelectItem key={count} value={String(count)}>
                          {count}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleGenerateTemplates} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate schedule
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setGeneratorForm({
                      daysPerWeek: initialDaysPerWeek,
                      preferredDays: ensurePreferredDays(activeScheduleDays, initialDaysPerWeek),
                      difficulty: "Mixed",
                      focus: [],
                      preferredStartTime: "18:00",
                      repeatIntervalWeeks: 1,
                      allowBackToBack: false,
                      includeRecovery: false,
                      count: 2
                    })
                    setGeneratedTemplates([])
                  }}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {generatedTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onApply={applyTemplate}
                  onDelete={undefined}
                  onSaveAsTemplate={saveGeneratedAsTemplate}
                  isSaving={savingTemplateId === template.id}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-3 p-8 text-center text-muted-foreground">
                <Wand2 className="mx-auto h-10 w-10" />
                <p className="font-medium text-foreground">No generated plans yet</p>
                <p className="text-sm">Choose your cadence, hit Generate, and we'll craft a tailored split instantly.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Quick-start plans curated from popular templates and AI picks.
            </p>
            <Button size="sm" variant="outline" onClick={loadRecommended} disabled={isRefreshingRecommended}>
              {isRefreshingRecommended ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>

          {recommendedTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Sparkles className="mx-auto mb-3 h-10 w-10" />
                <p className="font-medium text-foreground">No recommendations yet</p>
                <p className="text-sm">Try refreshing or generate a custom plan to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onApply={applyTemplate}
                  onDelete={undefined}
                  onSaveAsTemplate={saveGeneratedAsTemplate}
                  isSaving={savingTemplateId === template.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-green-600" />
                Save this week as a template
              </CardTitle>
              <CardDescription>
                Capture your current schedule so you can reapply it anytime.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template name</Label>
                  <Input
                    id="templateName"
                    value={newTemplateName}
                    onChange={(event) => setNewTemplateName(event.target.value)}
                    placeholder="e.g., Push/Pull Beginner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateDescription">Description</Label>
                  <Textarea
                    id="templateDescription"
                    value={newTemplateDescription}
                    onChange={(event) => setNewTemplateDescription(event.target.value)}
                    placeholder="Optional notes about this routine"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createTemplateFromCurrent} disabled={savingTemplateId === "__current__"}>
                  {savingTemplateId === "__current__" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save template
                </Button>
                <Button variant="outline" onClick={() => setIsCreatingTemplate((value) => !value)}>
                  {isCreatingTemplate ? "Hide details" : "Toggle extra details"}
                </Button>
              </div>
              {isCreatingTemplate && (
                <p className="text-xs text-muted-foreground">
                  We'll capture every item on the calendar exactly as it appears right now.
                </p>
              )}
            </CardContent>
          </Card>

          {customTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-3 h-10 w-10" />
                <p className="font-medium text-foreground">No saved templates yet</p>
                <p className="text-sm">Generate a plan or save this week's schedule to build your personal library.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onApply={applyTemplate}
                  onDelete={(templateId) => deleteCustomTemplate(templateId)}
                  onSaveAsTemplate={undefined}
                  isDeleting={deletingTemplateId === template.id}
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
  onDelete?: (templateId: string) => void
  onSaveAsTemplate?: (template: ScheduleTemplate) => void
  isSaving?: boolean
  isDeleting?: boolean
}

function TemplateCard({ template, onApply, onDelete, onSaveAsTemplate, isSaving = false, isDeleting = false }: TemplateCardProps) {
  const workoutCount = template.items.filter((item) => item.type === "workout").length
  const totalDuration = template.items.reduce((sum, item) => sum + (item.duration || 0), 0)
  const previewItems = template.items.slice(0, 3)
  const additionalCount = Math.max(template.items.length - previewItems.length, 0)
  const tags = summarizeTemplateTags(template)
  const source = template.metadata?.source ?? (template.isDefault ? "default" : "custom")

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
            {template.description && (
              <CardDescription>{template.description}</CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {sourceBadgeLabel[source]}
          </Badge>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={`${template.id}-${tag}`} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-600">{workoutCount}</div>
            <div className="text-xs text-muted-foreground">Workouts</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-purple-600">{formatTotalDuration(totalDuration)}</div>
            <div className="text-xs text-muted-foreground">Scheduled time</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Preview</h4>
          <div className="space-y-2">
            {previewItems.map((item, index) => (
              <div key={`${template.id}-${index}`} className="flex items-center justify-between rounded border bg-muted/40 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">{item.title}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{DAY_OPTIONS[item.day]?.label ?? ""}</span>
                  <span>{item.startTime}</span>
                </div>
              </div>
            ))}
            {additionalCount > 0 && (
              <p className="text-center text-xs text-muted-foreground">+{additionalCount} more item{additionalCount === 1 ? "" : "s"}</p>
            )}
          </div>
        </div>

        {template.metadata?.insights && template.metadata.insights.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Highlights</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {template.metadata.insights.map((insight, index) => (
                <li key={`${template.id}-insight-${index}`}>• {insight}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onApply(template)} size="sm" className="flex-1" disabled={isSaving || isDeleting}>
            <Download className="mr-2 h-4 w-4" />
            Apply
          </Button>
          {onSaveAsTemplate && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onSaveAsTemplate(template)}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save copy
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onDelete(template.id)}
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}