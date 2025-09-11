"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Award } from "lucide-react"
import { useEffect, useState } from "react"

interface StrengthProgress {
  date: string
  [exerciseName: string]: number | string
}

interface PersonalRecord {
  exercise: string
  weight: number
  date: string
  improvement: string
  reps: number
}

interface StrengthProgressEntry {
  date: string
  weight: number
  reps: number
}

interface PersonalRecordData {
  maxWeight: number
  maxReps: number
  maxVolume: number
  averageReps: number
  averageVolume: number
  frequency: number
  lastWorkout: string
  muscleGroups: string[]
}

export function StrengthAnalytics() {
  const [strengthData, setStrengthData] = useState<StrengthProgress[]>([])
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStrengthData = async () => {
      try {
        const response = await fetch('/api/workout-tracker/analytics?type=strength')
        if (response.ok) {
          const data = await response.json()
          
          // Convert the strength progress data to chart format
          const exerciseNames = Object.keys(data.strengthProgress)
          const allDates = new Set<string>()
          
          // Collect all unique dates
          exerciseNames.forEach(exercise => {
            data.strengthProgress[exercise].forEach((entry: StrengthProgressEntry) => {
              allDates.add(entry.date.split('T')[0])
            })
          })
          
          const sortedDates = Array.from(allDates).sort()
          
          // Create chart data
          const chartData: StrengthProgress[] = sortedDates.map(date => {
            const dataPoint: StrengthProgress = { 
              date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
            }
            
            exerciseNames.forEach(exercise => {
              const exerciseData = data.strengthProgress[exercise]
              // Find the entry for this date or the most recent before it
              let mostRecentWeight = 0
              exerciseData.forEach((entry: StrengthProgressEntry) => {
                const entryDate = entry.date.split('T')[0]
                if (entryDate <= date && entry.weight > mostRecentWeight) {
                  mostRecentWeight = entry.weight
                }
              })
              if (mostRecentWeight > 0) {
                dataPoint[exercise] = mostRecentWeight
              }
            })
            
            return dataPoint
          }).filter(point => Object.keys(point).length > 1)

          // Get top 4 most frequently trained exercises
          const exerciseFrequency = Object.entries(data.personalRecords)
            .sort(([, a], [, b]) => (b as PersonalRecordData).frequency - (a as PersonalRecordData).frequency)
            .slice(0, 4)
            .map(([name]) => name)

          // Filter chart data for top exercises
          const filteredChartData = chartData.map(dataPoint => {
            const filtered: StrengthProgress = { date: dataPoint.date }
            exerciseFrequency.forEach(exercise => {
              if (dataPoint[exercise]) {
                filtered[exercise] = dataPoint[exercise]
              }
            })
            return filtered
          })

          setStrengthData(filteredChartData)

          // Create personal records array with more detailed info
          const records: PersonalRecord[] = Object.entries(data.personalRecords)
            .sort(([, a], [, b]) => (b as PersonalRecordData).maxWeight - (a as PersonalRecordData).maxWeight)
            .slice(0, 6)
            .map(([exerciseName, record]) => {
              const recordData = record as PersonalRecordData
              return {
                exercise: exerciseName,
                weight: recordData.maxWeight,
                reps: recordData.maxReps,
                date: new Date(recordData.lastWorkout).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                improvement: `Max: ${recordData.maxWeight}lbs × ${recordData.maxReps}`,
              }
            })

          setPersonalRecords(records)
        }
      } catch (error) {
        console.error('Failed to fetch strength data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStrengthData()
  }, [])

  const getExerciseColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
    return colors[index % colors.length]
  }

  const exerciseNames = strengthData.length > 0 
    ? Object.keys(strengthData[0]).filter(key => key !== 'date')
    : []

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Strength Progression
            </CardTitle>
            <CardDescription>Loading your strength data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Personal Records
            </CardTitle>
            <CardDescription>Loading your personal bests...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 animate-pulse">
                  <div>
                    <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-6 bg-muted rounded w-16 mb-1"></div>
                    <div className="h-4 bg-muted rounded w-12"></div>
                  </div>
                </div>
              ))}
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
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Strength Progression
          </CardTitle>
          <CardDescription>Track your major lift improvements over time</CardDescription>
        </CardHeader>
        <CardContent>
          {strengthData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strengthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  {exerciseNames.map((exerciseName, index) => (
                    <Line
                      key={exerciseName}
                      type="monotone"
                      dataKey={exerciseName}
                      stroke={getExerciseColor(index)}
                      strokeWidth={2}
                      name={exerciseName}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No strength progression data available. Complete some workouts to see your progress!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Personal Records
          </CardTitle>
          <CardDescription>Your current best lifts and recent achievements</CardDescription>
        </CardHeader>
        <CardContent>
          {personalRecords.length > 0 ? (
            <div className="space-y-4">
              {personalRecords.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                  <div>
                    <h3 className="font-medium">{record.exercise}</h3>
                    <p className="text-sm text-muted-foreground">{record.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{record.weight} lbs</div>
                    <div className="text-sm text-muted-foreground">{record.reps} reps</div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {record.improvement}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No personal records yet. Start tracking weights in your workouts to see your best lifts!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
