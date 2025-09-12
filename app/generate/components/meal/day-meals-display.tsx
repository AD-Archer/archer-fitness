"use client"

import { MealCard } from "./meal-card"

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

interface DayMealsDisplayProps {
  day: string
  meals: Meal[]
}

export function DayMealsDisplay({ day, meals }: DayMealsDisplayProps) {
  return (
    <div>
      <h3 className="font-semibold mb-4 text-emerald-600">{day}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {meals.map((meal, index) => (
          <MealCard key={index} meal={meal} />
        ))}
      </div>
    </div>
  )
}