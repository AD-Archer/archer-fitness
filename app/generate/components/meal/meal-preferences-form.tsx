"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

interface MealPreferences {
  goal: string
  calorieTarget: string
  days: string
  mealsPerDay: string
  dietaryRestrictions: string[]
  cookingTime: string
}

interface MealPreferencesFormProps {
  preferences: MealPreferences
  onPreferencesChange: (preferences: MealPreferences) => void
}

export function MealPreferencesForm({ preferences, onPreferencesChange }: MealPreferencesFormProps) {
  const handleRestrictionToggle = (restriction: string) => {
    const updatedRestrictions = preferences.dietaryRestrictions.includes(restriction)
      ? preferences.dietaryRestrictions.filter((r) => r !== restriction)
      : [...preferences.dietaryRestrictions, restriction]

    onPreferencesChange({
      ...preferences,
      dietaryRestrictions: updatedRestrictions,
    })
  }

  const updatePreference = (key: keyof MealPreferences, value: string | string[]) => {
    onPreferencesChange({
      ...preferences,
      [key]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Nutrition Goal */}
        <div className="space-y-2">
          <Label>Nutrition Goal</Label>
          <Select
            value={preferences.goal}
            onValueChange={(value) => updatePreference("goal", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weight_loss">Weight Loss</SelectItem>
              <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="performance">Athletic Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calorie Target */}
        <div className="space-y-2">
          <Label>Daily Calorie Target</Label>
          <Input
            type="number"
            placeholder="e.g., 2200"
            value={preferences.calorieTarget}
            onChange={(e) => updatePreference("calorieTarget", e.target.value)}
          />
        </div>

        {/* Number of Days */}
        <div className="space-y-2">
          <Label>Plan Duration</Label>
          <Select
            value={preferences.days}
            onValueChange={(value) => updatePreference("days", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="How many days?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 days</SelectItem>
              <SelectItem value="5">5 days</SelectItem>
              <SelectItem value="7">7 days (1 week)</SelectItem>
              <SelectItem value="14">14 days (2 weeks)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Meals Per Day */}
        <div className="space-y-2">
          <Label>Meals Per Day</Label>
          <Select
            value={preferences.mealsPerDay}
            onValueChange={(value) => updatePreference("mealsPerDay", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="How many meals?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meals</SelectItem>
              <SelectItem value="4">3 meals + 1 snack</SelectItem>
              <SelectItem value="5">3 meals + 2 snacks</SelectItem>
              <SelectItem value="6">6 small meals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cooking Time */}
        <div className="space-y-2">
          <Label>Max Cooking Time</Label>
          <Select
            value={preferences.cookingTime}
            onValueChange={(value) => updatePreference("cookingTime", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Time available?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quick">Quick (under 15 min)</SelectItem>
              <SelectItem value="moderate">Moderate (15-30 min)</SelectItem>
              <SelectItem value="extended">Extended (30+ min)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div className="space-y-3">
        <Label>Dietary Restrictions (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {["vegetarian", "vegan", "gluten_free", "dairy_free", "keto", "paleo", "low_carb", "high_protein"].map(
            (restriction) => (
              <div key={restriction} className="flex items-center space-x-2">
                <Checkbox
                  id={restriction}
                  checked={preferences.dietaryRestrictions.includes(restriction)}
                  onCheckedChange={() => handleRestrictionToggle(restriction)}
                />
                <Label htmlFor={restriction} className="text-sm capitalize cursor-pointer">
                  {restriction.replace("_", " ")}
                </Label>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}