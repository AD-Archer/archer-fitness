"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, Clock, Zap, Trophy, Activity } from "lucide-react"
import { useEffect, useState } from "react"

interface WorkoutSession {
  id: string
  startTime: string
  endTime?: string | Date | null
  duration: number | null
  status: string
  exercises: Array<{
    exercise: {
      name: string
      muscles: Array<{
        muscle: {
          name: string
        }
      }>
    }
    sets: Array<{
      completed: boolean
      weight?: number
      reps?: number
    }>
  }>
}

interface FitnessOverview {
  totalWorkouts: number
  totalSets: number
  totalVolume: number
  averageWorkoutTime: number
  averageSetsPerWorkout: number
  averageVolumePerWorkout: number
  uniqueExercises: number
  workoutFrequency: number
}

interface PersonalRecord {
  maxWeight: number
  maxReps: number
  maxVolume: number
  averageReps: number
  averageVolume: number
  frequency: number
  lastWorkout: string
  muscleGroups: string[]
  endTime?: string | Date | null
}

interface TopPerformance {
  exercise: string
  metric: string
  value: number
  unit: string
  category: 'strength' | 'endurance' | 'volume'
}

interface FitnessOverviewProps {
  timeRange?: string
}

export function FitnessOverview({ timeRange = "3months" }: FitnessOverviewProps) {
  const [overview, setOverview] = useState<FitnessOverview | null>(null)
  const [topPerformances, setTopPerformances] = useState<TopPerformance[]>([])
  const [loading, setLoading] = useState(true)

  // Helper function to calculate effective duration with fallback
  const calculateEffectiveDuration = (session: WorkoutSession) => {
    let effectiveDuration = session.duration || 0
    
    // If duration is 0 but we have startTime and endTime, calculate it
    if (effectiveDuration === 0 && session.endTime) {
      const startTime = new Date(session.startTime)
      const endTime = new Date(session.endTime)
      effectiveDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000) // Convert to seconds
    }
    
    return effectiveDuration
  }

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const response = await fetch(`/api/workout-tracker/analytics?timeRange=${timeRange}`)
        if (response.ok) {
          const data = await response.json()
          
          // Calculate general stats with proper duration handling
          const workoutSessions = data.workoutSessions || []
          const workoutDates = new Set<string>()
          let totalCompletedSets = 0
          let totalWorkoutTime = 0
          let totalVolume = 0
          
          workoutSessions.forEach((session: WorkoutSession) => {
            const sessionDate = new Date(session.startTime).toISOString().split('T')[0]
            workoutDates.add(sessionDate)
            
            // Use effective duration calculation
            const effectiveDuration = calculateEffectiveDuration(session)
            console.log(`Fitness Overview - Session ${session.id}: duration=${session.duration}, endTime=${session.endTime}, effectiveDuration=${effectiveDuration}`)
            if (effectiveDuration > 0) {
              totalWorkoutTime += effectiveDuration
            }

            session.exercises.forEach(exercise => {
              const completedSets = exercise.sets.filter(set => set.completed)
              totalCompletedSets += completedSets.length
              
              completedSets.forEach(set => {
                if (set.weight && set.reps) {
                  totalVolume += set.weight * set.reps
                }
              })
            })
          })
          
          // Update general stats with calculated values
          const calculatedGeneralStats = {
            ...data.generalStats,
            totalWorkouts: workoutDates.size,
            totalSets: totalCompletedSets,
            totalVolume,
            averageWorkoutTime: workoutDates.size > 0 ? Math.round(totalWorkoutTime / workoutDates.size) : 0,
            averageSetsPerWorkout: workoutDates.size > 0 ? Math.round(totalCompletedSets / workoutDates.size) : 0,
            averageVolumePerWorkout: workoutDates.size > 0 ? Math.round(totalVolume / workoutDates.size) : 0,
          }
          
          setOverview(calculatedGeneralStats)
          
          // Extract top performances from personal records
          const performances: TopPerformance[] = []
          
          Object.entries(data.personalRecords).forEach(([exercise, record]) => {
            const recordData = record as PersonalRecord
            
            // Top strength (highest weight)
            if (recordData.maxWeight > 0) {
              performances.push({
                exercise,
                metric: 'Max Weight',
                value: recordData.maxWeight,
                unit: 'lbs',
                category: 'strength'
              })
            }
            
            // Top endurance (highest reps)
            if (recordData.maxReps > 0) {
              performances.push({
                exercise,
                metric: 'Max Reps',
                value: recordData.maxReps,
                unit: 'reps',
                category: 'endurance'
              })
            }
            
            // Top volume (highest single set volume)
            if (recordData.maxVolume > 0) {
              performances.push({
                exercise,
                metric: 'Max Volume',
                value: recordData.maxVolume,
                unit: 'lbs',
                category: 'volume'
              })
            }
          })
          
          // Get top 3 from each category
          const topStrength = performances
            .filter(p => p.category === 'strength')
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
          
          const topEndurance = performances
            .filter(p => p.category === 'endurance')
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
          
          const topVolume = performances
            .filter(p => p.category === 'volume')
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
          
          setTopPerformances([...topStrength, ...topEndurance, ...topVolume])
        }
      } catch (error) {
        console.error('Failed to fetch fitness overview:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOverviewData()
  }, [timeRange])

  const formatVolume = (volume: number) => {
    if (volume >= 10000) {
      return `${(volume / 1000).toFixed(1)}K`
    }
    return volume.toLocaleString()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const getTimeRangeLabel = (timeRange: string) => {
    switch (timeRange) {
      case "7days": return "Last 7 Days"
      case "4weeks": return "Last 4 Weeks"  
      case "3months": return "Last 3 Months"
      case "6months": return "Last 6 Months"
      case "1year": return "Last Year"
      default: return "Last 3 Months"
    }
  }

  if (loading || !overview) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                <div className="w-16 h-4 bg-muted rounded animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-20 h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="w-24 h-4 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with time range indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fitness Overview</h2>
        <span className="text-sm text-muted-foreground">
          {getTimeRangeLabel(timeRange)}
        </span>
      </div>
      
      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Activity className="w-4 h-4 text-blue-600" />
              <Badge variant="secondary">{overview.workoutFrequency}/week</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalWorkouts}</div>
            <p className="text-sm text-muted-foreground">Total Workouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Target className="w-4 h-4 text-green-600" />
              <Badge variant="secondary">{overview.averageSetsPerWorkout}/workout</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalSets}</div>
            <p className="text-sm text-muted-foreground">Total Sets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <Badge variant="secondary">{formatVolume(overview.averageVolumePerWorkout)}/workout</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatVolume(overview.totalVolume)}</div>
            <p className="text-sm text-muted-foreground">Total Volume (lbs)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Clock className="w-4 h-4 text-orange-600" />
              <Badge variant="secondary">{formatTime(overview.averageWorkoutTime)}/workout</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.uniqueExercises}</div>
            <p className="text-sm text-muted-foreground">Unique Exercises</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Top Performances
          </CardTitle>
          <CardDescription>Your best achievements across different metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {topPerformances.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {/* Strength Performances */}
              <div>
                <h4 className="font-semibold text-sm text-red-600 mb-3 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Strength (Max Weight)
                </h4>
                <div className="space-y-2">
                  {topPerformances
                    .filter(p => p.category === 'strength')
                    .map((perf, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                        <div>
                          <div className="font-medium text-sm">{perf.exercise}</div>
                          <div className="text-xs text-muted-foreground">{perf.metric}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-700 dark:text-red-300">{perf.value} {perf.unit}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Endurance Performances */}
              <div>
                <h4 className="font-semibold text-sm text-blue-600 mb-3 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Endurance (Max Reps)
                </h4>
                <div className="space-y-2">
                  {topPerformances
                    .filter(p => p.category === 'endurance')
                    .map((perf, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                        <div>
                          <div className="font-medium text-sm">{perf.exercise}</div>
                          <div className="text-xs text-muted-foreground">{perf.metric}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-700 dark:text-blue-300">{perf.value} {perf.unit}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Volume Performances */}
              <div>
                <h4 className="font-semibold text-sm text-green-600 mb-3 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Volume (Max Set)
                </h4>
                <div className="space-y-2">
                  {topPerformances
                    .filter(p => p.category === 'volume')
                    .map((perf, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                        <div>
                          <div className="font-medium text-sm">{perf.exercise}</div>
                          <div className="text-xs text-muted-foreground">{perf.metric}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-700 dark:text-green-300">{formatVolume(perf.value)} {perf.unit}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No performance data available. Complete workouts with tracked weights and reps to see your top achievements!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}