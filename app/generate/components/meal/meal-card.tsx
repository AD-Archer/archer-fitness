"use client"

import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

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

interface MealCardProps {
  meal: Meal
}

export function MealCard({ meal }: MealCardProps) {
  return (
    <div className="p-4 rounded-lg border bg-card/50">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium">{meal.name}</h4>
          <Badge variant="secondary" className="text-xs mt-1 capitalize">
            {meal.type}
          </Badge>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold">{meal.calories} cal</div>
          <div className="text-xs text-muted-foreground">
            P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fat}g
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <p className="font-medium text-muted-foreground mb-1">Ingredients:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {meal.ingredients.map((ingredient, i) => (
              <li key={i}>• {ingredient}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {meal.prepTime} min prep
          </span>
        </div>
      </div>
    </div>
  )
}