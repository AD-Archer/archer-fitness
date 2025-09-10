'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

interface WorkoutSession {
  id: string
  name: string
  date: string
  duration: number
  exercises: Array<{
    exerciseId: string
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
  status: "completed" | "in_progress" | "skipped"
  notes?: string
}

interface ApiWorkoutSession {
  id: string
  name: string
  startTime: string
  duration: number | null
  exercises: Array<{
    exerciseId: string
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
  status: string
  notes?: string
}

export function WorkoutHistory() {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      try {
        const response = await fetch('/api/workout-sessions?limit=10')
        if (response.ok) {
          const data = await response.json()
          // Transform API data to match component expectations
          const transformedData = data.map((session: ApiWorkoutSession) => ({
            id: session.id,
            name: session.name,
            date: session.startTime,
            duration: session.duration || 0,
            exercises: session.exercises || [],
            status: session.status,
            notes: session.notes,
          }))
          setWorkoutHistory(transformedData)
        }
      } catch (error) {
        console.error('Failed to fetch workout history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkoutHistory()
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const calculateWorkoutStats = (workout: WorkoutSession) => {
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    const totalReps = workout.exercises.reduce((sum, ex) =>
      sum + ex.sets.reduce((setSum, set) => setSum + (set.completed ? set.reps : 0), 0), 0)
    const avgWeight = workout.exercises.length > 0 ?
      workout.exercises.reduce((sum, ex) =>
        sum + ex.sets.reduce((setSum, set) => setSum + (set.weight || 0), 0), 0) / totalSets : 0

    return {
      exercises: workout.exercises.length,
      totalSets,
      totalReps,
      avgWeight: avgWeight > 0 ? avgWeight : undefined,
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Workout History
          </CardTitle>
          <CardDescription>Your recent training sessions and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading workout history...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Workout History
        </CardTitle>
        <CardDescription>Your recent training sessions and performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workoutHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No workout history found. Start your first workout!</p>
            </div>
          ) : (
            workoutHistory.map((workout) => {
              const stats = calculateWorkoutStats(workout)
              return (
                <div key={workout.id} className="p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium mb-1">{workout.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(workout.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(workout.duration)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {workout.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-blue-600">{stats.exercises}</div>
                      <div className="text-xs text-muted-foreground">Exercises</div>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-green-600">{stats.totalSets}</div>
                      <div className="text-xs text-muted-foreground">Sets</div>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-purple-600">{stats.totalReps}</div>
                      <div className="text-xs text-muted-foreground">Reps</div>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-orange-600">
                        {stats.avgWeight ? `${stats.avgWeight.toFixed(1)}` : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Weight</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      Repeat Workout
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {workoutHistory.length > 0 && (
          <div className="mt-6 text-center">
            <Button variant="outline" className="bg-transparent">
              <TrendingUp className="w-4 h-4 mr-2" />
              View All History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
