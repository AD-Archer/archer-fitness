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

export function useGeneratedContent() {
  const [workouts, setWorkouts] = useState<GeneratedWorkout[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = () => {
    setIsLoading(true)

    try {
      const workoutKeys = Object.keys(localStorage).filter((key) => key.startsWith("generated-workout-"))
      const loadedWorkouts = workoutKeys
        .map((key) => {
          const data = JSON.parse(localStorage.getItem(key) || "{}")
          return {
            id: key.replace("generated-workout-", ""),
            ...data,
            generatedAt: new Date(data.generatedAt || Date.now()),
          }
        })
        .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())

      setWorkouts(loadedWorkouts)
    } catch (error) {
      logger.error("Failed to load generated content:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveWorkout = (workout: Omit<GeneratedWorkout, "id" | "generatedAt">) => {
    const id = `workout-${Date.now()}`
    const fullWorkout: GeneratedWorkout = {
      ...workout,
      id,
      generatedAt: new Date(),
    }

    try {
      localStorage.setItem(`generated-workout-${id}`, JSON.stringify(fullWorkout))
      setWorkouts((prev) => [fullWorkout, ...prev])
      return id
    } catch (error) {
      logger.error("Failed to save workout:", error)
      return null
    }
  }

  const deleteWorkout = (id: string) => {
    try {
      localStorage.removeItem(`generated-workout-${id}`)
      setWorkouts((prev) => prev.filter((w) => w.id !== id))
    } catch (error) {
      logger.error("Failed to delete workout:", error)
    }
  }

  return {
    workouts,
    isLoading,
    saveWorkout,
    deleteWorkout,
    refetch: loadContent,
  }
}