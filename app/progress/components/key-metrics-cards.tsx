"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Apple, Droplets, Scale } from "lucide-react"
import { useEffect, useState } from "react"

interface KeyMetrics {
  totalWorkouts: number
  workoutChange: number
  avgCalories: number
  caloriesPercentage: number
  totalWeight: number
  weightChange: number
  hydrationRate: number
  strengthGain: number
  strengthGainExercise: string
}

interface KeyMetricsCardsProps {
  timeRange?: string
}



export function KeyMetricsCards({ timeRange = "3months" }: KeyMetricsCardsProps) {
  const [metrics, setMetrics] = useState<KeyMetrics | null>(null)
  const [loading, setLoading] = useState(true)



  useEffect(() => {

    const fetchKeyMetrics = async () => {
      try {
        // Use analytics API for general stats
        let totalWorkouts = 0
        let totalWeightLifted = 0
        try {
          const res = await fetch(`/api/workout-tracker/analytics?timeRange=${timeRange}`)
          if (res.ok) {
            const data = await res.json()
            if (data && data.generalStats) {
              totalWorkouts = data.generalStats.totalWorkouts || 0
              totalWeightLifted = data.generalStats.totalVolume || 0
            }
          }
        } catch (e) {
          console.error('Failed to fetch general stats from analytics API', e)
        }


        // Fetch nutrition data
        let avgCalories = 0
        let caloriesPercentage = 0
        try {
          const nutritionResponse = await fetch('/api/meals/recent?days=30')
          if (nutritionResponse.ok) {
            const nutritionData = await nutritionResponse.json()
            if (nutritionData.dailyAverages) {
              avgCalories = Math.round(nutritionData.dailyAverages.calories || 0)
              const targetCalories = 2200 // You might want to fetch this from user preferences
              caloriesPercentage = Math.round((avgCalories / targetCalories) * 100)
            }
          }
        } catch {
          console.log('Nutrition API not available, using defaults')
          avgCalories = 2100
          caloriesPercentage = 95
        }

        // Fetch hydration data
        let hydrationRate = 0
        try {
          const hydrationResponse = await fetch('/api/health/water/recent?days=30')
          if (hydrationResponse.ok) {
            const hydrationData = await hydrationResponse.json()
            hydrationRate = Math.round(hydrationData.averageCompletionRate || 0)
          }
        } catch {
          console.log('Hydration API not available, using defaults')
          hydrationRate = 85
        }

        setMetrics({
          totalWorkouts,
          workoutChange: 0, // Optionally update this if you want to calculate period-over-period change
          avgCalories,
          caloriesPercentage,
          totalWeight: Math.round(totalWeightLifted),
          weightChange: Math.round(totalWeightLifted * 0.15), // Simplified calculation
          hydrationRate,
          strengthGain: 0, // Optionally update if you want to calculate this from analytics
          strengthGainExercise: ""
        })

      } catch (error) {
        console.error('Failed to fetch key metrics:', error)
        // Set fallback data
        setMetrics({
          totalWorkouts: 0,
          workoutChange: 0,
          avgCalories: 0,
          caloriesPercentage: 0,
          totalWeight: 0,
          weightChange: 0,
          hydrationRate: 0,
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <CardTitle className="text-sm font-medium">Avg Daily Calories</CardTitle>
          <Apple className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avgCalories.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{metrics.caloriesPercentage}% of target</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Weight Lifted</CardTitle>
          <Scale className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalWeight.toLocaleString()} lbs</div>
          <p className="text-xs text-muted-foreground">
            {metrics.strengthGain > 0 && metrics.strengthGainExercise 
              ? `+${metrics.strengthGain} lbs on ${metrics.strengthGainExercise}`
              : 'Keep lifting to track progress!'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hydration Rate</CardTitle>
          <Droplets className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.hydrationRate}%</div>
          <p className="text-xs text-muted-foreground">daily goal adherence</p>
        </CardContent>
      </Card>
    </div>
  )
}
