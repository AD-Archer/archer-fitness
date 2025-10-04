import { useState, useCallback } from 'react'
import type {
  Schedule,
  ScheduleItem,
  ScheduleTemplate,
  TemplateGenerationRequest,
  TemplateGenerationResponse
} from '../types/schedule'
import { logger } from "@/lib/logger"

interface SaveScheduleOptions {
  timezone?: string | null
}

interface UseScheduleApiReturn {
  loading: boolean
  error: string | null
  loadSchedule: (weekStart: string) => Promise<Schedule | null>
  saveSchedule: (weekStart: string, items: ScheduleItem[], options?: SaveScheduleOptions) => Promise<Schedule | null>
  clearSchedule: (weekStart: string) => Promise<boolean>
  loadTemplates: () => Promise<ScheduleTemplate[]>
  saveTemplate: (template: Omit<ScheduleTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<ScheduleTemplate | null>
  applyTemplate: (templateId: string, weekStart: string) => Promise<Schedule | null>
  deleteTemplate: (templateId: string) => Promise<boolean>
  loadRecommendedTemplates: (count?: number) => Promise<ScheduleTemplate[]>
  generateTemplates: (request: TemplateGenerationRequest) => Promise<TemplateGenerationResponse | null>
}

export function useScheduleApi(): UseScheduleApiReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<Response>,
    successHandler: (data: unknown) => T
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiCall()
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return successHandler(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      logger.error('API call failed:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSchedule = useCallback(async (weekStart: string): Promise<Schedule | null> => {
    return handleApiCall(
      () => fetch(`/api/schedule?weekStart=${encodeURIComponent(weekStart)}`),
      (data) => (data as { schedule: Schedule }).schedule
    )
  }, [handleApiCall])

  const saveSchedule = useCallback(async (weekStart: string, items: ScheduleItem[], options?: SaveScheduleOptions): Promise<Schedule | null> => {
    return handleApiCall(
      () => fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, items, timezone: options?.timezone })
      }),
      (data) => (data as { schedule: Schedule }).schedule
    )
  }, [handleApiCall])

  const clearSchedule = useCallback(async (weekStart: string): Promise<boolean> => {
    return handleApiCall(
      () => fetch(`/api/schedule?weekStart=${encodeURIComponent(weekStart)}`, {
        method: 'DELETE'
      }),
      () => true
    ) !== null
  }, [handleApiCall])

  const loadTemplates = useCallback(async (): Promise<ScheduleTemplate[]> => {
    const result = await handleApiCall(
      () => fetch('/api/schedule/templates'),
      (data) => (data as { templates: ScheduleTemplate[] }).templates
    )
    return result || []
  }, [handleApiCall])

  const loadRecommendedTemplates = useCallback(async (count = 3): Promise<ScheduleTemplate[]> => {
    const result = await handleApiCall(
      () => fetch(`/api/schedule/templates/recommended?count=${encodeURIComponent(String(count))}`),
      (data) => (data as { templates: ScheduleTemplate[] }).templates
    )
    return result || []
  }, [handleApiCall])

  const generateTemplates = useCallback(async (requestPayload: TemplateGenerationRequest): Promise<TemplateGenerationResponse | null> => {
    return handleApiCall(
      () => fetch('/api/schedule/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      }),
      (data) => data as TemplateGenerationResponse
    )
  }, [handleApiCall])

  const saveTemplate = useCallback(async (
    template: Omit<ScheduleTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
  ): Promise<ScheduleTemplate | null> => {
    return handleApiCall(
      () => fetch('/api/schedule/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      }),
      (data) => (data as { template: ScheduleTemplate }).template
    )
  }, [handleApiCall])

  const applyTemplate = useCallback(async (templateId: string, weekStart: string): Promise<Schedule | null> => {
    return handleApiCall(
      () => fetch(`/api/schedule/templates/${templateId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart })
      }),
      (data) => (data as { schedule: Schedule }).schedule
    )
  }, [handleApiCall])

  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    return handleApiCall(
      () => fetch(`/api/schedule/templates/${templateId}`, {
        method: 'DELETE'
      }),
      () => true
    ) !== null
  }, [handleApiCall])

  return {
    loading,
    error,
    loadSchedule,
    saveSchedule,
    clearSchedule,
    loadTemplates,
    saveTemplate,
    applyTemplate,
    deleteTemplate,
    loadRecommendedTemplates,
    generateTemplates
  }
}