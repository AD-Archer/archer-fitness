"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Dumbbell } from "lucide-react"
import { useEffect, useState } from "react"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { getWeightUnitAbbr } from "@/lib/weight-utils"

interface VolumeData {
  week: string
  volume: number
  workouts: number
}

interface VolumeMetric {
  volume: number
  workouts: number
  sets: number
}

interface VolumeStats {
  averageVolume: number
  peakVolume: number
  volumeTrend: number
}

interface VolumeAnalyticsProps {
  timeRange?: string
}

export function VolumeAnalytics({ timeRange = "3months" }: VolumeAnalyticsProps) {
  const [volumeData, setVolumeData] = useState<VolumeData[]>([])
  const [volumeStats, setVolumeStats] = useState<VolumeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { units } = useUserPreferences()

  useEffect(() => {
    const fetchVolumeData = async () => {
      try {
        const response = await fetch(`/api/workout-tracker/analytics?type=volume&timeRange=${timeRange}`)
        if (response.ok) {
          const data = await response.json()
          
          // Convert volume metrics to chart data
          const chartData: VolumeData[] = Object.entries(data.volumeMetrics)
            .sort((a, b) => a[0].localeCompare(b[0])) // Sort by date
            .slice(-8) // Last 8 weeks
            .map(([, volumeData], index) => {
              const metric = volumeData as VolumeMetric
              return {
                week: `Week ${index + 1}`,
                volume: metric.volume,
                workouts: metric.workouts
              }
            })
          
          setVolumeData(chartData)
          
          // Calculate stats from general stats
          const stats = data.generalStats
          if (stats && chartData.length > 0) {
            const volumes = chartData.map(d => d.volume)
            const averageVolume = volumes.length > 0 ? volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length : 0
            const peakVolume = volumes.length > 0 ? Math.max(...volumes) : 0
            const firstWeekVolume = chartData[0]?.volume || 0
            const lastWeekVolume = chartData[chartData.length - 1]?.volume || 0
            const volumeTrend = firstWeekVolume > 0 
              ? Math.round(((lastWeekVolume - firstWeekVolume) / firstWeekVolume) * 100)
              : 0
            
            setVolumeStats({
              averageVolume,
              peakVolume,
              volumeTrend
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch volume data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVolumeData()
  }, [timeRange])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-green-600" />
              Training Volume Trends
            </CardTitle>
            <CardDescription>Loading your volume data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-green-600" />
            Training Volume Trends
          </CardTitle>
          <CardDescription>Weekly volume and workout frequency analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {volumeData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} ${getWeightUnitAbbr(units)}`, 'Volume']}
                  />
                  <Bar dataKey="volume" fill="#10b981" name={`Volume (${getWeightUnitAbbr(units)})`} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No volume data available. Complete workouts with tracked weights to see your training volume!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Volume Breakdown */}
      {volumeStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Average Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {volumeStats.averageVolume.toLocaleString()} {getWeightUnitAbbr(units)}
              </div>
              <p className="text-sm text-muted-foreground">{getWeightUnitAbbr(units)} per week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Peak Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {volumeStats.peakVolume.toLocaleString()} {getWeightUnitAbbr(units)}
              </div>
              <p className="text-sm text-muted-foreground">highest week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${volumeStats.volumeTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {volumeStats.volumeTrend > 0 ? '+' : ''}{volumeStats.volumeTrend}%
              </div>
              <p className="text-sm text-muted-foreground">vs first week</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
