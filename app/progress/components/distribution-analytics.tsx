"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Target } from "lucide-react"
import { useEffect, useState } from "react"

interface MuscleGroupData {
  name: string
  value: number
  color: string
  totalSets: number
}

interface WorkoutSession {
  id: string
  startTime: string
  status: string
  exercises: Array<{
    exercise: {
      id: string
      name: string
      muscles: Array<{
        muscle: {
          name: string
        }
        isPrimary: boolean
      }>
    }
    sets: Array<{
      completed: boolean
    }>
  }>
}

interface DistributionAnalyticsProps {
  timeRange?: string
}

export function DistributionAnalytics({ timeRange = "3months" }: DistributionAnalyticsProps) {
  const [muscleGroupData, setMuscleGroupData] = useState<MuscleGroupData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSets, setTotalSets] = useState(0)

  useEffect(() => {
    const fetchMuscleGroupData = async () => {
      try {
        const response = await fetch(`/api/workout-tracker/workout-sessions?limit=50&timeRange=${timeRange}`)
        if (response.ok) {
          const sessions: WorkoutSession[] = await response.json()
          
          console.log('Fetched sessions:', sessions.length)
          console.log('Session statuses:', sessions.map(s => s.status))
          
          // Debug: Check if we have any sessions and their structure
          if (sessions.length === 0) {
            console.log('No workout sessions found')
            setLoading(false)
            return
          }
          
          // Map to track muscle group training volume
          const muscleGroupSets = new Map<string, number>()
          let totalCompletedSets = 0
          
          sessions.forEach(session => {
            // Process ALL sessions, not just completed ones
            let sessionHasCompletedSets = false
            
            session.exercises.forEach(sessionEx => {
              const completedSets = sessionEx.sets.filter(set => set.completed).length
              
              if (completedSets > 0) {
                sessionHasCompletedSets = true
                totalCompletedSets += completedSets
                
                console.log(`Exercise: ${sessionEx.exercise.name}, Completed Sets: ${completedSets}, Muscles:`, sessionEx.exercise.muscles)
                
                // Get primary and secondary muscles
                const primaryMuscles = sessionEx.exercise.muscles
                  .filter(m => m.isPrimary)
                  .map(m => m.muscle.name)
                
                const secondaryMuscles = sessionEx.exercise.muscles
                  .filter(m => !m.isPrimary)
                  .map(m => m.muscle.name)
                
                console.log(`Primary muscles: ${primaryMuscles}, Secondary muscles: ${secondaryMuscles}`)
                
                // Assign full weight to primary muscles, half weight to secondary
                primaryMuscles.forEach(muscle => {
                  muscleGroupSets.set(muscle, (muscleGroupSets.get(muscle) || 0) + completedSets)
                })
                
                secondaryMuscles.forEach(muscle => {
                  muscleGroupSets.set(muscle, (muscleGroupSets.get(muscle) || 0) + (completedSets * 0.5))
                })
              }
            })
            
            if (sessionHasCompletedSets) {
              // Session had some completed sets
            }
          })

          console.log('Total completed sets:', totalCompletedSets)
          console.log('Muscle group sets:', muscleGroupSets)

          // Convert to chart data and group similar muscle names
          const muscleGroupMap = new Map<string, number>()
          
          muscleGroupSets.forEach((sets, muscleName) => {
            // Group similar muscles into broader categories
            const normalizedName = normalizeMuscleGroup(muscleName)
            muscleGroupMap.set(normalizedName, (muscleGroupMap.get(normalizedName) || 0) + sets)
          })

          // Convert to percentage and create chart data
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']
          
          if (totalCompletedSets > 0) {
            const chartData: MuscleGroupData[] = Array.from(muscleGroupMap.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8) // Top 8 muscle groups
              .map(([name, sets], index) => ({
                name,
                value: Math.round((sets / totalCompletedSets) * 100),
                color: colors[index % colors.length],
                totalSets: Math.round(sets)
              }))

            setMuscleGroupData(chartData)
          }
          
          setTotalSets(totalCompletedSets)
        }
      } catch (error) {
        console.error('Failed to fetch muscle group data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMuscleGroupData()
  }, [timeRange])

  // Normalize muscle names into broader categories
  const normalizeMuscleGroup = (muscleName: string): string => {
    const normalized = muscleName.toLowerCase()
    
    if (normalized.includes('chest') || normalized.includes('pectoral')) return 'Chest'
    if (normalized.includes('back') || normalized.includes('lat') || normalized.includes('rhomboid') || normalized.includes('trapezius')) return 'Back'
    if (normalized.includes('shoulder') || normalized.includes('deltoid')) return 'Shoulders'
    if (normalized.includes('bicep') || normalized.includes('tricep') || normalized.includes('forearm')) return 'Arms'
    if (normalized.includes('quad') || normalized.includes('hamstring') || normalized.includes('glute') || normalized.includes('calf')) return 'Legs'
    if (normalized.includes('core') || normalized.includes('abs') || normalized.includes('oblique')) return 'Core'
    
    // Capitalize first letter for display
    return muscleName.charAt(0).toUpperCase() + muscleName.slice(1)
  }

  const generateRecommendations = () => {
    if (muscleGroupData.length === 0) return []
    
    const recommendations = []
    const sortedGroups = [...muscleGroupData].sort((a, b) => b.value - a.value)
    
    // Check for imbalances
    const highest = sortedGroups[0]
    const lowest = sortedGroups[sortedGroups.length - 1]
    
    // Rest recommendations for overworked muscle groups
    if (highest.value > 40) {
      recommendations.push({
        type: 'rest',
        message: `You need to rest your ${highest.name} (${highest.value}% of total volume). Consider taking 2-3 days off from ${highest.name.toLowerCase()} exercises to allow proper recovery.`
      })
    } else if (highest.value > 35) {
      recommendations.push({
        type: 'warning',
        message: `High focus on ${highest.name} (${highest.value}%). Consider balancing with other muscle groups and ensure adequate rest.`
      })
    }
    
    // Focus recommendations for underworked muscle groups
    if (lowest.value < 5 && lowest.name !== 'Core') {
      recommendations.push({
        type: 'focus',
        message: `You should focus on ${lowest.name} (only ${lowest.value}% of volume). Try adding 2-3 ${lowest.name.toLowerCase()} exercises to your next workout.`
      })
    } else if (lowest.value < 10 && lowest.name !== 'Core') {
      recommendations.push({
        type: 'suggestion',
        message: `${lowest.name} could use more attention (${lowest.value}%). Try adding more exercises targeting this area.`
      })
    }
    
    // Check for muscle group pairs that need balance
    const chestVolume = muscleGroupData.find(g => g.name === 'Chest')?.value || 0
    const backVolume = muscleGroupData.find(g => g.name === 'Back')?.value || 0
    
    if (chestVolume > 0 && backVolume > 0) {
      const chestBackRatio = chestVolume / backVolume
      if (chestBackRatio > 1.5) {
        recommendations.push({
          type: 'balance',
          message: `You should focus on Back exercises. Your chest-to-back ratio is ${chestBackRatio.toFixed(1)}:1, which could lead to posture issues.`
        })
      } else if (chestBackRatio < 0.67) {
        recommendations.push({
          type: 'balance',
          message: `You should focus on Chest exercises. Your back-to-chest ratio is ${(1/chestBackRatio).toFixed(1)}:1, consider adding more pressing movements.`
        })
      }
    }
    
    // Check for good balance
    const maxDifference = highest.value - lowest.value
    if (maxDifference < 20 && muscleGroupData.length >= 4) {
      recommendations.push({
        type: 'success',
        message: 'Great balance! Your training is well-distributed across muscle groups. Keep up the excellent work!'
      })
    }
    
    // Recovery recommendations based on total volume
    if (totalSets > 100) {
      recommendations.push({
        type: 'rest',
        message: `High training volume detected (${totalSets} total sets). Ensure you're getting adequate sleep (7-9 hours) and consider a deload week.`
      })
    }
    
    return recommendations
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Muscle Group Focus
              </CardTitle>
              <CardDescription>Loading your training distribution...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-muted-foreground">Loading chart...</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Muscle Group Breakdown</CardTitle>
              <CardDescription>Loading percentages...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-muted"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-8"></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  const recommendations = generateRecommendations()

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              Muscle Group Focus
            </CardTitle>
            <CardDescription>Distribution of training volume by muscle group ({totalSets} total sets)</CardDescription>
          </CardHeader>
          <CardContent>
            {muscleGroupData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={muscleGroupData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {muscleGroupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <div className="text-center">
                  {totalSets === 0 ? (
                    <>
                      <div>No completed sets found in your workout sessions.</div>
                      <div className="text-xs mt-2">Complete some sets in your workouts to see muscle group distribution!</div>
                    </>
                  ) : (
                    "No training data available. Complete some workouts to see your muscle group distribution!"
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Muscle Group Breakdown</CardTitle>
            <CardDescription>Percentage of total training volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {muscleGroupData.length > 0 ? (
              <>
                {muscleGroupData.map((group, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: group.color }} />
                      <span className="font-medium">{group.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{group.value}%</span>
                      <span className="text-sm text-muted-foreground ml-2">({group.totalSets} sets)</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No muscle group data available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Training Balance Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Training Balance Insights</CardTitle>
            <CardDescription>AI recommendations for optimal muscle group distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  rec.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    : rec.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
                    : rec.type === 'rest'
                    ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                    : rec.type === 'focus'
                    ? 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
                    : rec.type === 'balance'
                    ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
                    : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                }`}
              >
                <p className={`text-sm ${
                  rec.type === 'success'
                    ? 'text-green-800 dark:text-green-200'
                    : rec.type === 'warning'
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : rec.type === 'rest'
                    ? 'text-red-800 dark:text-red-200'
                    : rec.type === 'focus'
                    ? 'text-purple-800 dark:text-purple-200'
                    : rec.type === 'balance'
                    ? 'text-orange-800 dark:text-orange-200'
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  <strong>
                    {rec.type === 'success' ? '✅ Great balance!' 
                    : rec.type === 'warning' ? '⚠️ Consider balancing:' 
                    : rec.type === 'rest' ? '😴 Rest needed:' 
                    : rec.type === 'focus' ? '🎯 Focus on:' 
                    : rec.type === 'balance' ? '⚖️ Balance needed:' 
                    : '💡 Suggestion:'}
                  </strong> {rec.message}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
