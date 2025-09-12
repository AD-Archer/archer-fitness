import { useState, useEffect } from 'react'
import { type WeightUnit } from '@/lib/weight-utils'

interface UserPreferences {
  app: {
    theme: string
    units: WeightUnit
    notifications: boolean
    weeklyReports: boolean
  }
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null
  units: WeightUnit
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/preferences')
      if (!response.ok) {
        throw new Error('Failed to fetch user preferences')
      }
      
      const data = await response.json()
      
      // Set default preferences if none exist
      const defaultPreferences: UserPreferences = {
        app: {
          theme: 'system',
          units: 'imperial',
          notifications: true,
          weeklyReports: true
        }
      }
      
      const userPrefs = {
        app: {
          ...defaultPreferences.app,
          ...data?.preferences?.appPrefs
        }
      }
      
      setPreferences(userPrefs)
    } catch (err) {
      console.error('Error loading user preferences:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Set fallback preferences
      setPreferences({
        app: {
          theme: 'system',
          units: 'imperial',
          notifications: true,
          weeklyReports: true
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPreferences()
  }, [])

  return {
    preferences,
    units: preferences?.app.units || 'imperial',
    loading,
    error,
    refetch: fetchPreferences
  }
}