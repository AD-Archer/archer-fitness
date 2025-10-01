"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Scale } from "lucide-react"
import { useEffect, useState } from "react"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { formatWeight, formatWeightChange } from "@/lib/weight-utils"
import { logger } from "@/lib/logger"

interface KeyMetrics {
  totalWorkouts: number
  workoutChange: number
  totalWeight: number
  weightChange: number
  strengthGain: number
  strengthGainExercise: string
}

interface KeyMetricsCardsProps {
  timeRange?: string
}



export function KeyMetricsCards({ timeRange = "3months" }: KeyMetricsCardsProps) {
  const [metrics, setMetrics] = useState<KeyMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const { units } = useUserPreferences()



  useEffect(() => {

    const fetchKeyMetrics = async () => {
      try {
        // Use analytics API for general stats
        let totalWorkouts = 0
        try {
          const res = await fetch(`/api/workout-tracker/analytics?timeRange=${timeRange}`)
          if (res.ok) {
            const data = await res.json()
            if (data && data.generalStats) {
              totalWorkouts = data.generalStats.totalWorkouts || 0
            }
          }
        } catch (e) {
          logger.error('Failed to fetch general stats from analytics API', e)
        }


        // Fetch weight data
        let currentWeight = 0
        let weightChange = 0
        try {
          const weightResponse = await fetch('/api/user/weight?days=90')
          if (weightResponse.ok) {
            const weightData = await weightResponse.json()
            if (weightData.stats) {
              currentWeight = Math.round(weightData.stats.current * 10) / 10
              weightChange = Math.round(weightData.stats.monthChange * 10) / 10
            }
          }
        } catch {
          logger.info('Weight API not available, using defaults')
          currentWeight = 165
          weightChange = -2.5
        }

        setMetrics({
          totalWorkouts,
          workoutChange: 0, // Optionally update this if you want to calculate period-over-period change
          totalWeight: currentWeight,
          weightChange,
          strengthGain: 0, // Optionally update if you want to calculate this from analytics
          strengthGainExercise: ""
        })

      } catch (error) {
        logger.error('Failed to fetch key metrics:', error)
        // Set fallback data
        setMetrics({
          totalWorkouts: 0,
          workoutChange: 0,
          totalWeight: 0,
          weightChange: 0,
          strengthGain: 0,
          strengthGainExercise: ""
        })
      } finally {
        setLoading(false)
      }
    }

    fetchKeyMetrics()
  }, [timeRange])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
              <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse w-16 mb-1"></div>
              <div className="h-3 bg-muted rounded animate-pulse w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Failed to load metrics.<br />
              <span style={{fontSize: '0.8em'}}>Check API or data format. See console for debug info.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalWorkouts}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.workoutChange > 0 ? `+${metrics.workoutChange}` : metrics.workoutChange} from last period
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
          <Scale className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatWeight(metrics.totalWeight, units)}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.weightChange !== 0 
              ? `${formatWeightChange(metrics.weightChange, units)} this month`
              : 'Weight stable this month'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
