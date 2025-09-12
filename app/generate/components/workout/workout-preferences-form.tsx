"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Settings } from "lucide-react"

interface WorkoutPreferences {
  fitnessLevel: string
  workoutType: string
  duration: string
  targetMuscles: string[]
  equipment: string[]
  notes: string
}

interface WorkoutPreferencesFormProps {
  preferences: WorkoutPreferences
  onPreferencesChange: (preferences: WorkoutPreferences) => void
}

export function WorkoutPreferencesForm({ preferences, onPreferencesChange }: WorkoutPreferencesFormProps) {
  const handleMuscleToggle = (muscle: string) => {
    const updatedMuscles = preferences.targetMuscles.includes(muscle)
      ? preferences.targetMuscles.filter((m) => m !== muscle)
      : [...preferences.targetMuscles, muscle]

    onPreferencesChange({
      ...preferences,
      targetMuscles: updatedMuscles,
    })
  }

  const handleEquipmentToggle = (equipment: string) => {
    const updatedEquipment = preferences.equipment.includes(equipment)
      ? preferences.equipment.filter((e) => e !== equipment)
      : [...preferences.equipment, equipment]

    onPreferencesChange({
      ...preferences,
      equipment: updatedEquipment,
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
        <Label>Target Muscle Groups (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {["chest", "back", "shoulders", "arms", "legs", "glutes", "core"].map((muscle) => (
            <div key={muscle} className="flex items-center space-x-2">
              <Checkbox
                id={muscle}
                checked={preferences.targetMuscles.includes(muscle)}
                onCheckedChange={() => handleMuscleToggle(muscle)}
              />
              <Label htmlFor={muscle} className="text-sm capitalize cursor-pointer">
                {muscle}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Available Equipment
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: "bodyweight", label: "Bodyweight Only" },
            { id: "dumbbells", label: "Dumbbells" },
            { id: "barbell", label: "Barbell" },
            { id: "kettlebells", label: "Kettlebells" },
            { id: "resistance-bands", label: "Resistance Bands" },
            { id: "pull-up-bar", label: "Pull-up Bar" },
            { id: "bench", label: "Weight Bench" },
            { id: "cable-machine", label: "Cable Machine" },
            { id: "treadmill", label: "Treadmill" },
            { id: "stationary-bike", label: "Stationary Bike" },
            { id: "rowing-machine", label: "Rowing Machine" },
            { id: "yoga-mat", label: "Yoga Mat" },
          ].map((equipment) => (
            <div key={equipment.id} className="flex items-center space-x-2">
              <Checkbox
                id={equipment.id}
                checked={preferences.equipment.includes(equipment.id)}
                onCheckedChange={() => handleEquipmentToggle(equipment.id)}
              />
              <Label htmlFor={equipment.id} className="text-sm cursor-pointer">
                {equipment.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="ai-notes">Additional Notes & Preferences</Label>
        <Textarea
          id="ai-notes"
          placeholder="Tell the AI about any specific preferences, injuries to avoid, favorite exercises, time constraints, or other details that would help create the perfect workout for you..."
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