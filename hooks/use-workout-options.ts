import { useState, useEffect } from 'react'

export interface WorkoutOption {
  id: string
  name: string
  value: string
}

export interface WorkoutOptions {
  equipment: WorkoutOption[]
  muscles: WorkoutOption[]
  bodyParts: WorkoutOption[]
}

export function useWorkoutOptions() {
  const [options, setOptions] = useState<WorkoutOptions>({
    equipment: [],
    muscles: [],
    bodyParts: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/workout-tracker/options')
        
        if (!response.ok) {
          throw new Error('Failed to fetch workout options')
        }
        
        const data = await response.json()
        setOptions(data)
      } catch (err) {
        console.error('Error fetching workout options:', err)
        setError(err instanceof Error ? err.message : 'Failed to load options')
        
        // Fallback to hardcoded options if API fails
        setOptions({
          equipment: [
            { id: 'bodyweight', name: 'Bodyweight Only', value: 'bodyweight' },
            { id: 'dumbbells', name: 'Dumbbells', value: 'dumbbells' },
            { id: 'barbell', name: 'Barbell', value: 'barbell' },
            { id: 'kettlebells', name: 'Kettlebells', value: 'kettlebells' },
            { id: 'resistance-bands', name: 'Resistance Bands', value: 'resistance-bands' },
            { id: 'pull-up-bar', name: 'Pull-up Bar', value: 'pull-up-bar' },
            { id: 'bench', name: 'Weight Bench', value: 'bench' },
            { id: 'cable-machine', name: 'Cable Machine', value: 'cable-machine' },
          ],
          muscles: [
            { id: 'chest', name: 'Chest', value: 'chest' },
            { id: 'back', name: 'Back', value: 'back' },
            { id: 'shoulders', name: 'Shoulders', value: 'shoulders' },
            { id: 'arms', name: 'Arms', value: 'arms' },
            { id: 'legs', name: 'Legs', value: 'legs' },
            { id: 'glutes', name: 'Glutes', value: 'glutes' },
            { id: 'core', name: 'Core', value: 'core' },
          ],
          bodyParts: [
            { id: 'upper-body', name: 'Upper Body', value: 'upper-body' },
            { id: 'lower-body', name: 'Lower Body', value: 'lower-body' },
            { id: 'full-body', name: 'Full Body', value: 'full-body' },
          ]
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOptions()
  }, [])

  return { options, isLoading, error }
}