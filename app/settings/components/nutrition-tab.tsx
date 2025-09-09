"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Info } from "lucide-react"
import { UserProfile, NutritionPrefs } from "./types"
import { getAIRecommendation } from "./utils"

interface NutritionTabProps {
  profile: UserProfile
  nutritionPrefs: NutritionPrefs
  setNutritionPrefs: (prefs: NutritionPrefs) => void
  units: string
}

export function NutritionTab({ profile, nutritionPrefs, setNutritionPrefs, units }: NutritionTabProps) {
  const dietaryOptions = ["vegetarian", "vegan", "gluten_free", "dairy_free", "keto", "paleo"]

  const toggleDietaryRestriction = (restriction: string) => {
    setNutritionPrefs({
      ...nutritionPrefs,
      dietaryRestrictions: nutritionPrefs.dietaryRestrictions.includes(restriction)
        ? nutritionPrefs.dietaryRestrictions.filter((r) => r !== restriction)
        : [...nutritionPrefs.dietaryRestrictions, restriction],
    })
  }

  return (
    <div className="space-y-4">
      {nutritionPrefs.useSmartCalculations && profile.weight && profile.heightFeet && profile.heightInches && profile.age && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <strong>AI Recommendation:</strong> {getAIRecommendation(profile, units)}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Nutrition Goals
            {nutritionPrefs.useSmartCalculations && <Badge variant="secondary">AI Optimized</Badge>}
          </CardTitle>
          <CardDescription>Set your daily nutrition targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Smart AI Calculations
              </Label>
              <p className="text-sm text-muted-foreground">Automatically calculate goals based on your profile</p>
            </div>
            <Switch
              checked={nutritionPrefs.useSmartCalculations}
              onCheckedChange={(checked) => setNutritionPrefs({ ...nutritionPrefs, useSmartCalculations: checked })}
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="calories">Daily Calories</Label>
              <Input
                id="calories"
                type="number"
                value={nutritionPrefs.dailyCalories}
                onChange={(e) => setNutritionPrefs({ ...nutritionPrefs, dailyCalories: e.target.value })}
                disabled={nutritionPrefs.useSmartCalculations}
              />
              {nutritionPrefs.useSmartCalculations && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Calculated based on your {profile.fitnessGoals.replace("_", " ")} goal
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="water">Water Target ({units === "imperial" ? "oz" : "ml"})</Label>
              <Input
                id="water"
                type="number"
                value={nutritionPrefs.waterTarget}
                onChange={(e) => setNutritionPrefs({ ...nutritionPrefs, waterTarget: e.target.value })}
                disabled={nutritionPrefs.useSmartCalculations}
              />
              {nutritionPrefs.useSmartCalculations && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Based on body weight and activity level
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein Target (g)</Label>
              <Input
                id="protein"
                type="number"
                value={nutritionPrefs.proteinTarget}
                onChange={(e) => setNutritionPrefs({ ...nutritionPrefs, proteinTarget: e.target.value })}
                disabled={nutritionPrefs.useSmartCalculations}
              />
              {nutritionPrefs.useSmartCalculations && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Optimized for {profile.fitnessGoals.replace("_", " ")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs Target (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={nutritionPrefs.carbTarget}
                onChange={(e) => setNutritionPrefs({ ...nutritionPrefs, carbTarget: e.target.value })}
                disabled={nutritionPrefs.useSmartCalculations}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Fat Target (g)</Label>
              <Input
                id="fat"
                type="number"
                value={nutritionPrefs.fatTarget}
                onChange={(e) => setNutritionPrefs({ ...nutritionPrefs, fatTarget: e.target.value })}
                disabled={nutritionPrefs.useSmartCalculations}
              />
            </div>
          </div>

          {nutritionPrefs.useSmartCalculations && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Macro Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Protein</p>
                    <p className="font-semibold">
                      {Math.round(
                        ((Number.parseFloat(nutritionPrefs.proteinTarget) * 4) /
                          Number.parseFloat(nutritionPrefs.dailyCalories)) *
                          100,
                      )}
                      %
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Carbs</p>
                    <p className="font-semibold">
                      {Math.round(
                        ((Number.parseFloat(nutritionPrefs.carbTarget) * 4) /
                          Number.parseFloat(nutritionPrefs.dailyCalories)) *
                          100,
                      )}
                      %
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Fat</p>
                    <p className="font-semibold">
                      {Math.round(
                        ((Number.parseFloat(nutritionPrefs.fatTarget) * 9) /
                          Number.parseFloat(nutritionPrefs.dailyCalories)) *
                          100,
                      )}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <Label>Dietary Restrictions</Label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((restriction) => (
                <Badge
                  key={restriction}
                  variant={nutritionPrefs.dietaryRestrictions.includes(restriction) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleDietaryRestriction(restriction)}
                >
                  {restriction.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Water Tracking</Label>
              <p className="text-sm text-muted-foreground">Track daily water intake</p>
            </div>
            <Switch
              checked={nutritionPrefs.trackWater}
              onCheckedChange={(checked) => setNutritionPrefs({ ...nutritionPrefs, trackWater: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
