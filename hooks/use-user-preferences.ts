import { useState, useEffect } from 'react'
import { type WeightUnit } from '@/lib/weight-utils'
import { logger } from "@/lib/logger"

interface UserPreferences {
  app: {
    theme: string
    units: WeightUnit
    notifications: boolean
    weeklyReports: boolean
    timezone?: string
  }
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null
  units: WeightUnit
  timezone: string
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
          timezone: browserTimezone
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
          timezone: browserTimezone
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
    loading,
    error,
    refetch: fetchPreferences
  }
}