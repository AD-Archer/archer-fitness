"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Target, Apple, Utensils, Play, RefreshCw } from "lucide-react"
import { DayMealsDisplay } from "./day-meals-display"
import { ShoppingList } from "./shopping-list"

interface Meal {
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

interface MealPlan {
  name: string
  days: number
  totalCalories: number
  meals: { [key: string]: Meal[] }
  shoppingList: string[]
}

interface MealPlanDisplayProps {
  mealPlan: MealPlan
  onRegenerate: () => void
}

export function MealPlanDisplay({ mealPlan, onRegenerate }: MealPlanDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              {mealPlan.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <Badge variant="outline">{mealPlan.days} days</Badge>
              <div className="flex items-center gap-1">
                <Apple className="w-3 h-3" />
                {mealPlan.totalCalories} cal/day target
              </div>
              <div className="flex items-center gap-1">
                <Utensils className="w-3 h-3" />
                {Object.keys(mealPlan.meals).length} days planned
              </div>
            </CardDescription>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Play className="w-4 h-4 mr-2" />
            Start Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Meal Plans */}
        <div className="space-y-6">
          {Object.entries(mealPlan.meals).map(([day, dayMeals]) => (
            <DayMealsDisplay key={day} day={day} meals={dayMeals} />
          ))}
        </div>

        <Separator />

        {/* Shopping List */}
        <ShoppingList items={mealPlan.shoppingList} />

        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1 bg-transparent">
            Save Plan
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            Export Shopping List
          </Button>
          <Button onClick={onRegenerate} variant="outline">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}