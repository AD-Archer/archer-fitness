"use client"

import { useEffect, useState } from "react"
import { logger } from "@/lib/logger"

interface Exercise {
  name: string
  sets: number
  reps: string
  rest: string
  instructions: string
  targetMuscles: string[]
}

interface MealData {
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

interface GeneratedWorkout {
  id: string
  name: string
  duration: number
  difficulty: string
  exercises: Exercise[]
  warmup: string[]
  cooldown: string[]
  generatedAt: Date
}

interface GeneratedMeal {
  id: string
  name: string
  days: number
  totalCalories: number
  meals: { [key: string]: MealData[] }
  shoppingList: string[]
  generatedAt: Date
}

export function useGeneratedContent() {
  const [workouts, setWorkouts] = useState<GeneratedWorkout[]>([])
  const [meals, setMeals] = useState<GeneratedMeal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = () => {
    setIsLoading(true)
    
    try {
      // Load workouts
      const workoutKeys = Object.keys(localStorage).filter(key => key.startsWith('generated-workout-'))
      const loadedWorkouts = workoutKeys.map(key => {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        return {
          id: key.replace('generated-workout-', ''),
          ...data,
          generatedAt: new Date(data.generatedAt || Date.now())
        }
      }).sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())

      // Load meals
      const mealKeys = Object.keys(localStorage).filter(key => key.startsWith('generated-meal-'))
      const loadedMeals = mealKeys.map(key => {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        return {
          id: key.replace('generated-meal-', ''),
          ...data,
          generatedAt: new Date(data.generatedAt || Date.now())
        }
      }).sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())

      setWorkouts(loadedWorkouts)
      setMeals(loadedMeals)
    } catch (error) {
      logger.error('Failed to load generated content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveWorkout = (workout: Omit<GeneratedWorkout, 'id' | 'generatedAt'>) => {
    const id = `workout-${Date.now()}`
    const fullWorkout: GeneratedWorkout = {
      ...workout,
      id,
      generatedAt: new Date()
    }
    
    try {
      localStorage.setItem(`generated-workout-${id}`, JSON.stringify(fullWorkout))
      setWorkouts(prev => [fullWorkout, ...prev])
      return id
    } catch (error) {
      logger.error('Failed to save workout:', error)
      return null
    }
  }

  const saveMeal = (meal: Omit<GeneratedMeal, 'id' | 'generatedAt'>) => {
    const id = `meal-${Date.now()}`
    const fullMeal: GeneratedMeal = {
      ...meal,
      id,
      generatedAt: new Date()
    }
    
    try {
      localStorage.setItem(`generated-meal-${id}`, JSON.stringify(fullMeal))
      setMeals(prev => [fullMeal, ...prev])
      return id
    } catch (error) {
      logger.error('Failed to save meal:', error)
      return null
    }
  }

  const deleteWorkout = (id: string) => {
    try {
      localStorage.removeItem(`generated-workout-${id}`)
      setWorkouts(prev => prev.filter(w => w.id !== id))
    } catch (error) {
      logger.error('Failed to delete workout:', error)
    }
  }

  const deleteMeal = (id: string) => {
    try {
      localStorage.removeItem(`generated-meal-${id}`)
      setMeals(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      logger.error('Failed to delete meal:', error)
    }
  }

  return {
    workouts,
    meals,
    isLoading,
    saveWorkout,
    saveMeal,
    deleteWorkout,
    deleteMeal,
    refetch: loadContent
  }
}