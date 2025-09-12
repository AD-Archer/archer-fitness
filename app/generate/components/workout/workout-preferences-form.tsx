"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Loader2, Target, Dumbbell, User } from "lucide-react"
import { useWorkoutOptions } from "../../hooks/use-workout-options"
import { SearchableMultiSelect } from "../searchable-multi-select"

interface WorkoutPreferences {
  fitnessLevel: string
  workoutType: string
  duration: string
  targetMuscles: string[]
  targetBodyParts: string[]
  equipment: string[]
  notes: string
}

interface WorkoutPreferencesFormProps {
  preferences: WorkoutPreferences
  onPreferencesChange: (preferences: WorkoutPreferences) => void
}

export function WorkoutPreferencesForm({ preferences, onPreferencesChange }: WorkoutPreferencesFormProps) {
  const { options, isLoading, error } = useWorkoutOptions()

  const handleMuscleSelectionChange = (selected: string[]) => {
    onPreferencesChange({
      ...preferences,
      targetMuscles: selected,
    })
  }

  const handleBodyPartSelectionChange = (selected: string[]) => {
    onPreferencesChange({
      ...preferences,
      targetBodyParts: selected,
    })
  }

  const handleEquipmentSelectionChange = (selected: string[]) => {
    onPreferencesChange({
      ...preferences,
      equipment: selected,
    })
  }

  const updatePreference = (key: keyof WorkoutPreferences, value: string | string[]) => {
    onPreferencesChange({
      ...preferences,
      [key]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Fitness Level</Label>
          <Select
            value={preferences.fitnessLevel}
            onValueChange={(value) => updatePreference("fitnessLevel", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Workout Type</Label>
          <Select
            value={preferences.workoutType}
            onValueChange={(value) => updatePreference("workoutType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose workout type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strength">Strength Training</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="hiit">HIIT</SelectItem>
              <SelectItem value="flexibility">Flexibility</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Select
            value={preferences.duration}
            onValueChange={(value) => updatePreference("duration", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="How long?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Target Body Parts (optional)
        </Label>
        {error && (
          <div className="text-sm text-red-500 py-2">
            Error loading body parts. Using default options.
          </div>
        )}
        <SearchableMultiSelect
          options={options.bodyParts}
          selected={preferences.targetBodyParts || []}
          onSelectionChange={handleBodyPartSelectionChange}
          placeholder="Search body parts..."
          maxDisplayed={8}
          isLoading={isLoading}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          Target Muscle Groups (optional)
        </Label>
        {error && (
          <div className="text-sm text-red-500 py-2">
            Error loading muscle groups. Using default options.
          </div>
        )}
        <SearchableMultiSelect
          options={options.muscles}
          selected={preferences.targetMuscles}
          onSelectionChange={handleMuscleSelectionChange}
          placeholder="Search muscle groups..."
          maxDisplayed={10}
          isLoading={isLoading}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4" />
          Available Equipment
        </Label>
        {error && (
          <div className="text-sm text-red-500 py-2">
            Error loading equipment options. Using default options.
          </div>
        )}
        <SearchableMultiSelect
          options={options.equipment}
          selected={preferences.equipment}
          onSelectionChange={handleEquipmentSelectionChange}
          placeholder="Search equipment..."
          maxDisplayed={12}
          isLoading={isLoading}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="ai-notes">Additional Notes & Preferences</Label>
        <Textarea
          id="ai-notes"
          placeholder="Tell us about any specific preferences, injuries to avoid, favorite exercises, time constraints, or other details that would help create the perfect workout for you..."
          value={preferences.notes}
          onChange={(e) => updatePreference("notes", e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {`Examples: "I have a bad knee, avoid lunges", "I love compound movements", "Focus on upper body today", "I only have 20 minutes between meetings"`}
        </p>
      </div>
    </div>
  )
}