import { useState, useEffect } from 'react'
import { type WeightUnit } from '@/lib/weight-utils'
import { type TimeFormatPreference } from '@/lib/time-utils'
import { logger } from "@/lib/logger"

interface UserPreferences {
  app: {
    theme: string
    units: WeightUnit
    notifications: boolean
    weeklyReports: boolean
    timezone?: string
    timeFormat: TimeFormatPreference
  }
  workout: {
    availableEquipment: string[]
  }
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null
  units: WeightUnit
  timezone: string
  timeFormat: TimeFormatPreference
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
      
      // Get browser timezone as fallback
      let browserTimezone = 'UTC'
      try {
        browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch (err) {
        logger.warn('Unable to resolve browser timezone, using UTC', err)
      }
      
      // Set default preferences if none exist
      const defaultPreferences: UserPreferences = {
        app: {
          theme: 'system',
          units: 'imperial',
          notifications: true,
          weeklyReports: true,
          timezone: browserTimezone,
          timeFormat: '24h'
        },
        workout: {
          availableEquipment: ['bodyweight', 'dumbbells', 'resistance bands']
        }
      }
      
      const userPrefs = {
        app: {
          ...defaultPreferences.app,
          ...data?.preferences?.appPrefs,
          timeFormat: (() => {
            const preference = data?.preferences?.appPrefs?.timeFormat
            return preference === '12h' || preference === '24h' ? preference : defaultPreferences.app.timeFormat
          })()
        },
        workout: {
          ...defaultPreferences.workout,
          availableEquipment: Array.isArray(data?.preferences?.workoutPrefs?.availableEquipment)
            ? data.preferences.workoutPrefs.availableEquipment
            : defaultPreferences.workout.availableEquipment
        }
      }
      
      setPreferences(userPrefs)
    } catch (err) {
      logger.error('Error loading user preferences:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Get browser timezone for fallback
      let browserTimezone = 'UTC'
      try {
        browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch (tzErr) {
        logger.warn('Unable to resolve browser timezone for fallback, using UTC', tzErr)
      }
      
      // Set fallback preferences
      setPreferences({
        app: {
          theme: 'system',
          units: 'imperial',
          notifications: true,
          weeklyReports: true,
          timezone: browserTimezone,
          timeFormat: '24h'
        },
        workout: {
          availableEquipment: ['bodyweight', 'dumbbells', 'resistance bands']
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
    timezone: preferences?.app.timezone || 'UTC',
    timeFormat: preferences?.app.timeFormat || '24h',
    loading,
    error,
    refetch: fetchPreferences
  }
}