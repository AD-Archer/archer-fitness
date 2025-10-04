"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  RecoveryApiResponse,
  SubmitRecoveryFeedbackPayload,
} from "@/types/recovery"
import { useToast } from "@/hooks/use-toast"

interface UseRecoveryDataResult {
  data: RecoveryApiResponse | null
  loading: boolean
  error: string | null
  refreshing: boolean
  submitting: boolean
  refresh: () => Promise<void>
  submitFeedback: (payload: SubmitRecoveryFeedbackPayload) => Promise<boolean>
}

const FETCH_URL = "/api/recovery"

export function useRecoveryData(): UseRecoveryDataResult {
  const [data, setData] = useState<RecoveryApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch(FETCH_URL, {
        method: "GET",
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error("Failed to load recovery insights")
      }

      const json: RecoveryApiResponse = await response.json()
      setData(json)
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        return
      }
      const message = (err as Error)?.message || "Unable to load recovery data"
      setError(message)
      toast({
        title: "Recovery data",
        description: message,
        variant: "destructive",
      })
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [toast])

  useEffect(() => {
    fetchData(false)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  const refresh = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  const submitFeedback = useCallback(
    async (payload: SubmitRecoveryFeedbackPayload) => {
      setSubmitting(true)
      try {
        const response = await fetch(FETCH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error("Failed to save body feedback")
        }

        toast({
          title: "Body status saved",
          description: `${payload.bodyPart} marked as ${payload.feeling.toLowerCase()}`,
        })

        await fetchData(true)
        return true
      } catch (err) {
        const message = (err as Error)?.message || "Unable to save feedback"
        toast({
          title: "Recovery",
          description: message,
          variant: "destructive",
        })
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [fetchData, toast]
  )

  return useMemo(
    () => ({
      data,
      loading,
      error,
      refreshing,
      submitting,
      refresh,
      submitFeedback,
    }),
    [data, loading, error, refreshing, submitting, refresh, submitFeedback]
  )
}
